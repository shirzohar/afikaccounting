import type { Tier } from "@/lib/pricing";

/**
 * Payments, independent of the provider. A provider adapter (providers/*)
 * turns its own checkout, webhooks and API into these shapes; everything else —
 * the webhook route, the checkout and profile pages — speaks only this.
 */

export type PaidTier = Exclude<Tier, "free">;
export type Interval = "month" | "year";

/** What a webhook can mean for a subscription. The database applies each (public.apply_billing_event). */
export const EVENT_TYPES = ["activated", "renewed", "plan_changed", "cancel_scheduled", "cancel_revoked", "canceled", "payment_failed", "refunded"] as const;
export type BillingEventType = (typeof EVENT_TYPES)[number];

/** An invoice the provider issued for a charge — one per charge, as Israeli law requires. */
export type Invoice = { ref: string; number: string; amount: number; currency: string; url: string; issuedAt: string };

/** One provider event, normalized. */
export type BillingEvent = {
  /** The provider's own id for the event: the idempotency key. */
  id: string;
  type: BillingEventType;
  /** Our user, as we passed it to the checkout. */
  userId: string;
  /** When it happened at the provider (ISO), to ignore late deliveries of older events. */
  occurredAt: string;
  /** The provider's id for the subscription. */
  subscriptionRef?: string;
  tier?: PaidTier;
  interval?: Interval;
  /** End of the period paid for (ISO). */
  periodEnd?: string;
  invoice?: Invoice;
};

export type CheckoutRequest = {
  userId: string;
  email: string;
  name: string;
  tier: PaidTier;
  interval: Interval;
  /** Price in shekels, from pricing.ts. */
  amount: number;
  /** Description on the payment page and on the invoice. */
  description: string;
  /** Where the provider sends the reader back after paying, and after giving up. */
  successUrl: string;
  cancelUrl: string;
};

export type WebhookResult = { ok: true; event: BillingEvent | null } | { ok: false; error: string };

/**
 * A payment provider. Each adapter implements this for one provider; the
 * provider must be set up to issue an invoice/receipt on every charge.
 */
export interface PaymentProvider {
  /** Its name, as stored in subscriptions.provider and billing_events.provider. */
  name: string;
  /** A hosted payment page for this reader and plan; returns its address. */
  createCheckout(req: CheckoutRequest): Promise<{ url: string }>;
  /**
   * Check a webhook's signature on the raw body, and normalize it. `event: null`
   * means a genuine event that doesn't concern subscriptions (acknowledged, ignored).
   */
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>;
  /** Stop renewing; access stays until the end of the period paid for. The provider confirms with a webhook. */
  cancelAtPeriodEnd(subscriptionRef: string, userId: string): Promise<void>;
  /** Move to another plan or interval. The provider confirms with a webhook. */
  changePlan(subscriptionRef: string, userId: string, to: { tier: PaidTier; interval: Interval; amount: number }): Promise<void>;
}
