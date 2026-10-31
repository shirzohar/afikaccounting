import { EVENT_TYPES, type BillingEvent, type BillingEventType, type Interval, type Invoice, type PaidTier } from "./types";

/**
 * An untrusted event (already signature-checked) to a BillingEvent, or a
 * message saying what's missing. Each type carries what it needs to be applied.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const iso = (v: unknown) => {
  const s = str(v, 40);
  return s && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : undefined;
};
const tierOf = (v: unknown): PaidTier | undefined => (v === "courses" || v === "exams" ? v : undefined);
const intervalOf = (v: unknown): Interval | undefined => (v === "month" || v === "year" ? v : undefined);

function invoiceOf(v: unknown): Invoice | undefined {
  if (!v || typeof v !== "object") return undefined;
  const x = v as Record<string, unknown>;
  const ref = str(x.ref);
  const url = str(x.url, 1000);
  const amount = Number(x.amount);
  if (!ref || !url || !/^(https?:\/\/|\/)/.test(url) || !Number.isFinite(amount) || amount < 0) return undefined;
  return { ref, number: str(x.number, 60) ?? "", amount: Math.round(amount * 100) / 100, currency: str(x.currency, 3) ?? "ILS", url, issuedAt: iso(x.issuedAt) ?? new Date().toISOString() };
}

/** What each type must carry, besides id, user and time. */
const NEEDS: Record<BillingEventType, ("subscriptionRef" | "tier" | "periodEnd")[]> = {
  activated: ["subscriptionRef", "tier", "periodEnd"],
  renewed: ["subscriptionRef", "periodEnd"],
  plan_changed: ["subscriptionRef", "tier"],
  cancel_scheduled: ["subscriptionRef"],
  cancel_revoked: ["subscriptionRef"],
  canceled: ["subscriptionRef"],
  payment_failed: ["subscriptionRef"],
  refunded: ["subscriptionRef"],
};

export function parseEvent(v: unknown): { event: BillingEvent } | { error: string } {
  if (!v || typeof v !== "object") return { error: "not an object" };
  const x = v as Record<string, unknown>;
  const type = x.type as BillingEventType;
  if (!EVENT_TYPES.includes(type)) return { error: `unknown type ${String(x.type)}` };
  const id = str(x.id);
  const userId = str(x.userId, 36);
  const occurredAt = iso(x.occurredAt);
  if (!id) return { error: "missing id" };
  if (!userId || !UUID.test(userId)) return { error: "missing or bad userId" };
  if (!occurredAt) return { error: "missing occurredAt" };
  const event: BillingEvent = {
    id,
    type,
    userId,
    occurredAt,
    subscriptionRef: str(x.subscriptionRef),
    tier: tierOf(x.tier),
    interval: intervalOf(x.interval),
    periodEnd: iso(x.periodEnd),
    invoice: invoiceOf(x.invoice),
  };
  for (const k of NEEDS[type]) if (!event[k]) return { error: `${type} needs ${k}` };
  return { event };
}
