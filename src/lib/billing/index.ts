import "server-only";
import { isSupabaseConfigured, SITE_URL } from "@/lib/env";
import { planOf } from "@/lib/pricing";
import { createServiceClient } from "@/lib/supabase/service";
import { SandboxProvider } from "./providers/sandbox";
import type { Interval, PaidTier, PaymentProvider } from "./types";
import { type ApplyEvent, type ApplyOutcome, applyArgs } from "./webhook";

/**
 * Which payment provider runs, from the environment — no secret lives in the
 * code. BILLING_PROVIDER names it; unset, payments are off and every "choose a
 * plan" button keeps signing up with the plan noted, as before.
 *
 * To add a real provider: write providers/<name>.ts implementing
 * PaymentProvider (its checkout API, its webhook signature, cancel and change
 * plan), add it to the switch below, and document its variables in .env.example.
 */
export function billingProvider(): PaymentProvider | null {
  const name = process.env.BILLING_PROVIDER ?? "";
  const secret = process.env.BILLING_WEBHOOK_SECRET ?? "";
  if (!name || !secret || !isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  switch (name) {
    case "sandbox":
      return sandboxAllowed() ? new SandboxProvider({ baseUrl: SITE_URL, secret }) : null;
    default:
      return null;
  }
}

/** The sandbox takes no money and issues test invoices: only on a local site, unless explicitly allowed (a staging site). */
export function sandboxAllowed() {
  const host = (() => {
    try {
      return new URL(SITE_URL).hostname;
    } catch {
      return "";
    }
  })();
  return ["localhost", "127.0.0.1"].includes(host) || process.env.BILLING_SANDBOX_ALLOW_REMOTE === "1";
}

export const billingEnabled = () => billingProvider() !== null;

/** The price of a plan for an interval, from pricing.ts. */
export function priceOf(tier: PaidTier, interval: Interval) {
  const plan = planOf(tier);
  return interval === "year" && plan.yearly ? plan.yearly : plan.monthly;
}

/** Apply a verified event in the database, atomically and once (public.apply_billing_event). */
export const applyEvent: ApplyEvent = async (provider, e, raw) => {
  const { data, error } = await createServiceClient().rpc("apply_billing_event", applyArgs(provider, e, raw));
  if (error) throw new Error(error.message);
  return data as ApplyOutcome;
};
