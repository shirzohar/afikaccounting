import type { BillingEvent, PaymentProvider } from "./types";

/** public.apply_billing_event's arguments for an event, in order — the webhook's and the tests' one mapping. */
export function applyArgs(provider: string, e: BillingEvent, raw: unknown) {
  return {
    p_id: `${provider}:${e.id}`,
    p_provider: provider,
    p_type: e.type,
    p_user: e.userId,
    p_occurred_at: e.occurredAt,
    p_provider_ref: e.subscriptionRef ?? null,
    p_tier: e.tier ?? null,
    p_interval: e.interval ?? null,
    p_period_end: e.periodEnd ?? null,
    p_invoice: e.invoice ? { ref: e.invoice.ref, number: e.invoice.number, amount: e.invoice.amount, currency: e.invoice.currency, url: e.invoice.url, issued_at: e.invoice.issuedAt } : null,
    p_payload: raw && typeof raw === "object" ? raw : {},
  };
}

/** What the database said about an event: see public.apply_billing_event. */
export type ApplyOutcome = "applied" | "duplicate" | "stale" | "ignored";
export type ApplyEvent = (provider: string, event: BillingEvent, raw: unknown) => Promise<ApplyOutcome>;

/**
 * One webhook delivery, from raw body to response. The signature is checked
 * on the raw body before anything is parsed or stored; a bad one is a 400 and
 * changes nothing. A good one is applied once: a repeat delivery answers 200
 * ("duplicate") so the provider stops retrying. A failure to store answers 500,
 * so the provider retries later. Dependencies are passed in, to test it whole.
 */
export async function handleWebhook(rawBody: string, headers: Headers, deps: { provider: PaymentProvider; apply: ApplyEvent }): Promise<{ status: number; body: { ok: boolean; outcome?: ApplyOutcome | "not-a-subscription-event"; error?: string } }> {
  if (rawBody.length > 64_000) return { status: 413, body: { ok: false, error: "too large" } };
  const verified = await deps.provider.verifyWebhook(rawBody, headers);
  if (!verified.ok) return { status: 400, body: { ok: false, error: verified.error } };
  if (!verified.event) return { status: 200, body: { ok: true, outcome: "not-a-subscription-event" } };
  let raw: unknown = {};
  try {
    raw = JSON.parse(rawBody);
  } catch {
    // A provider that doesn't send JSON: the normalized event is kept instead.
    raw = verified.event;
  }
  try {
    const outcome = await deps.apply(deps.provider.name, verified.event, raw);
    return { status: 200, body: { ok: true, outcome } };
  } catch (e) {
    return { status: 500, body: { ok: false, error: e instanceof Error ? e.message : "apply failed" } };
  }
}
