import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { parseEvent } from "../events";
import { signPayload, verifySignature } from "../signature";
import type { BillingEvent, CheckoutRequest, Interval, PaidTier, PaymentProvider, WebhookResult } from "../types";

/**
 * A stand-in payment provider for development and tests — never for real
 * money. Its "hosted payment page" is /billing/sandbox on this site; paying
 * there sends a signed webhook to /api/billing/webhook exactly as a real
 * provider would, so the whole path (checkout → webhook → subscription →
 * access) runs without one. Its "invoices" are test documents, marked as such.
 *
 * Card numbers on its payment page: any card succeeds, except one ending in
 * 0002, which is declined.
 */

export const SIGNATURE_HEADER = "x-sandbox-signature";
const TOKEN_TTL_MS = 60 * 60 * 1000;

/** A checkout or invoice, carried in a signed token (the sandbox keeps no state). */
export type SandboxCheckout = Omit<CheckoutRequest, "successUrl" | "cancelUrl"> & { successUrl: string; cancelUrl: string; iat: number };
export type SandboxInvoice = { number: string; name: string; email: string; description: string; amount: number; issuedAt: string };

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();

export function addPeriod(from: Date, interval: Interval) {
  const d = new Date(from);
  if (interval === "year") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

export class SandboxProvider implements PaymentProvider {
  name = "sandbox";
  constructor(
    private opts: {
      /** The site's own origin: the payment page lives here, and webhooks go here. */
      baseUrl: string;
      secret: string;
      /** How a webhook is delivered; by default, POSTed to the site's own webhook route. */
      send?: (body: string, signature: string) => Promise<void>;
      now?: () => Date;
    },
  ) {}

  private now() {
    return this.opts.now?.() ?? new Date();
  }

  /** A signed token: base64url(json).hmac — what the payment page and the invoice read back. */
  sign(data: object) {
    const body = b64(JSON.stringify(data));
    return `${body}.${createHmac("sha256", this.opts.secret).update(`token.${body}`).digest("base64url")}`;
  }
  read<T>(token: string | null | undefined): T | null {
    const [body, mac] = String(token ?? "").split(".");
    if (!body || !mac) return null;
    const expected = Buffer.from(createHmac("sha256", this.opts.secret).update(`token.${body}`).digest("base64url"));
    const given = Buffer.from(mac);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    try {
      return JSON.parse(unb64(body)) as T;
    } catch {
      return null;
    }
  }

  async createCheckout(req: CheckoutRequest) {
    const token = this.sign({ ...req, iat: this.now().getTime() } satisfies SandboxCheckout);
    return { url: `${this.opts.baseUrl}/billing/sandbox?token=${encodeURIComponent(token)}` };
  }

  /** The checkout a payment page token stands for, while it's fresh. */
  readCheckout(token: string | null | undefined) {
    const c = this.read<SandboxCheckout>(token);
    return c && this.now().getTime() - c.iat < TOKEN_TTL_MS ? c : null;
  }

  /** An invoice for a charge, issued with it: a link to the sandbox's (test) invoice page. */
  private invoice(name: string, email: string, description: string, amount: number) {
    const ref = `sbx_ch_${randomUUID()}`;
    const issuedAt = this.now().toISOString();
    const number = `TEST-${ref.slice(-8).toUpperCase()}`;
    const doc = this.sign({ number, name, email, description, amount, issuedAt } satisfies SandboxInvoice);
    return { ref, number, amount, currency: "ILS", url: `${this.opts.baseUrl}/billing/sandbox/invoice?d=${encodeURIComponent(doc)}`, issuedAt };
  }

  /** Pay on the payment page: a declined card charges nothing; any other starts the subscription. */
  async pay(c: SandboxCheckout, card: string): Promise<{ ok: true; subscriptionRef: string } | { ok: false; error: string }> {
    const digits = card.replace(/\D/g, "");
    if (digits.length < 12) return { ok: false, error: "מספר כרטיס לא תקין." };
    if (digits.endsWith("0002")) return { ok: false, error: "הכרטיס סורב (כרטיס בדיקה לסירוב)." };
    const subscriptionRef = `sbx_sub_${randomUUID()}`;
    const now = this.now();
    await this.emit({
      type: "activated",
      userId: c.userId,
      subscriptionRef,
      tier: c.tier,
      interval: c.interval,
      periodEnd: addPeriod(now, c.interval).toISOString(),
      invoice: this.invoice(c.name, c.email, c.description, c.amount),
    });
    return { ok: true, subscriptionRef };
  }

  async cancelAtPeriodEnd(subscriptionRef: string, userId: string) {
    await this.emit({ type: "cancel_scheduled", userId, subscriptionRef });
  }

  async changePlan(subscriptionRef: string, userId: string, to: { tier: PaidTier; interval: Interval; amount: number }) {
    // The sandbox charges the new plan at once and starts a new period; a real provider may prorate.
    await this.emit({
      type: "plan_changed",
      userId,
      subscriptionRef,
      tier: to.tier,
      interval: to.interval,
      periodEnd: addPeriod(this.now(), to.interval).toISOString(),
      invoice: this.invoice("", "", `מעבר למסלול ${to.tier}`, to.amount),
    });
  }

  /** The sandbox's controls, standing in for time passing at the provider: a renewal, a failed charge, a refund, the period's end. */
  async simulate(kind: "renewed" | "payment_failed" | "refunded" | "canceled", s: { userId: string; subscriptionRef: string; tier: PaidTier; interval: Interval; amount: number; periodEnd: string | null }) {
    if (kind === "renewed") {
      const from = s.periodEnd ? new Date(s.periodEnd) : this.now();
      return this.emit({ type: "renewed", userId: s.userId, subscriptionRef: s.subscriptionRef, tier: s.tier, interval: s.interval, periodEnd: addPeriod(from, s.interval).toISOString(), invoice: this.invoice("", "", "חידוש מנוי", s.amount) });
    }
    return this.emit({ type: kind, userId: s.userId, subscriptionRef: s.subscriptionRef });
  }

  /** Send one event as a signed webhook. Returns the event, as sent. */
  async emit(e: Omit<BillingEvent, "id" | "occurredAt">) {
    const event: BillingEvent = { ...e, id: `evt_${randomUUID()}`, occurredAt: this.now().toISOString() };
    const body = JSON.stringify(event);
    await this.deliver(body);
    return event;
  }

  /** Deliver a body as the provider would: signed. Exposed so a test can deliver the same event twice. */
  async deliver(body: string) {
    const signature = signPayload(body, this.opts.secret, this.now().getTime());
    if (this.opts.send) return this.opts.send(body, signature);
    const res = await fetch(`${this.opts.baseUrl}/api/billing/webhook`, { method: "POST", body, headers: { "content-type": "application/json", [SIGNATURE_HEADER]: signature } });
    if (!res.ok) throw new Error(`webhook answered ${res.status}: ${await res.text()}`);
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookResult> {
    const check = verifySignature(rawBody, headers.get(SIGNATURE_HEADER), this.opts.secret, this.now().getTime());
    if (!check.ok) return { ok: false, error: `signature ${check.error}` };
    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return { ok: false, error: "body is not JSON" };
    }
    const parsed = parseEvent(json);
    return "error" in parsed ? { ok: false, error: parsed.error } : { ok: true, event: parsed.event };
  }
}
