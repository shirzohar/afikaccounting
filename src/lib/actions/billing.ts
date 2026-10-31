"use server";

import { refresh } from "next/cache";
import { billingProvider, priceOf } from "@/lib/billing";
import { SandboxProvider } from "@/lib/billing/providers/sandbox";
import type { Interval, PaidTier } from "@/lib/billing/types";
import { getCurrentUser, getProfile, safeNext } from "@/lib/auth/dal";
import { getMySubscription } from "@/lib/data/billing";
import { SITE_URL } from "@/lib/env";
import { planOf } from "@/lib/pricing";

type Result = { ok: true; url?: string } | { ok: false; error: string };

const OFF: Result = { ok: false, error: "התשלומים אינם פעילים באתר הזה." };
const paid = (v: unknown): v is PaidTier => v === "courses" || v === "exams";
const intervalOf = (v: unknown): Interval => (v === "year" ? "year" : "month");

/**
 * Start a checkout: the provider's hosted payment page for this reader and
 * plan. Payment details never touch this site. `from` (a lesson, an exam) is
 * where the thank-you page sends them back.
 */
export async function startCheckout(input: { tier: string; interval: string; from?: string }): Promise<Result> {
  const provider = billingProvider();
  if (!provider) return OFF;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "צריך להתחבר כדי לשלם." };
  if (!paid(input.tier)) return { ok: false, error: "מסלול לא מוכר." };
  const tier = input.tier;
  const interval = intervalOf(input.interval);
  const from = safeNext(input.from, "");
  const profile = await getProfile();
  const back = new URLSearchParams({ plan: tier, ...(from ? { from } : {}) });
  try {
    const { url } = await provider.createCheckout({
      userId: user.id,
      email: user.email,
      name: profile?.fullName || user.email,
      tier,
      interval,
      amount: priceOf(tier, interval),
      description: `AfikAccounting — מסלול ${planOf(tier).name}, מנוי ${interval === "year" ? "שנתי" : "חודשי"}`,
      successUrl: `${SITE_URL}/checkout/thanks?${back}`,
      cancelUrl: `${SITE_URL}/pricing?${back}&canceled=1`,
    });
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: `לא הצלחנו לפתוח את דף התשלום: ${e instanceof Error ? e.message : "שגיאה"}` };
  }
}

/** The reader's own paid subscription, if it's with the provider that runs now (not a manual grant). */
async function mine() {
  const provider = billingProvider();
  const user = await getCurrentUser();
  const sub = await getMySubscription();
  if (!provider || !user || !sub?.providerRef || sub.provider !== provider.name) return null;
  return { provider, user, sub, ref: sub.providerRef };
}

/** Stop renewing. The subscription stays open until the end of the period paid for. */
export async function cancelSubscription(): Promise<Result> {
  const m = await mine();
  if (!m) return { ok: false, error: "לא נמצא מנוי בתשלום לביטול." };
  try {
    await m.provider.cancelAtPeriodEnd(m.ref, m.user.id);
  } catch (e) {
    return { ok: false, error: `הביטול לא עבר אצל ספק הסליקה: ${e instanceof Error ? e.message : "שגיאה"}` };
  }
  refresh();
  return { ok: true };
}

export async function changePlan(input: { tier: string; interval: string }): Promise<Result> {
  const m = await mine();
  if (!m) return { ok: false, error: "לא נמצא מנוי בתשלום לשינוי." };
  if (!paid(input.tier)) return { ok: false, error: "מסלול לא מוכר." };
  const interval = intervalOf(input.interval);
  if (input.tier === m.sub.tier && interval === m.sub.interval) return { ok: false, error: "זה כבר המסלול שלכם." };
  try {
    await m.provider.changePlan(m.ref, m.user.id, { tier: input.tier, interval, amount: priceOf(input.tier, interval) });
  } catch (e) {
    return { ok: false, error: `השינוי לא עבר אצל ספק הסליקה: ${e instanceof Error ? e.message : "שגיאה"}` };
  }
  refresh();
  return { ok: true };
}

// ---- the sandbox provider's own controls (development only) -----------------

function sandbox() {
  const p = billingProvider();
  return p instanceof SandboxProvider ? p : null;
}

/** Pay on the sandbox's payment page. Sends the signed webhook, then returns where the provider would redirect. */
export async function sandboxPay(token: string, card: string): Promise<Result> {
  const p = sandbox();
  if (!p) return OFF;
  const c = p.readCheckout(token);
  if (!c) return { ok: false, error: "דף התשלום פג תוקף. חזרו לדף המחירים ונסו שוב." };
  const user = await getCurrentUser();
  if (user?.id !== c.userId) return { ok: false, error: "דף התשלום הזה נפתח לחשבון אחר." };
  try {
    const res = await p.pay(c, card);
    return res.ok ? { ok: true, url: c.successUrl } : res;
  } catch (e) {
    return { ok: false, error: `ה-webhook נכשל: ${e instanceof Error ? e.message : "שגיאה"}` };
  }
}

/** Stand in for time passing at the provider: a renewal, a failed charge, a refund, or the end of a cancelled period. */
export async function sandboxSimulate(kind: "renewed" | "payment_failed" | "refunded" | "canceled"): Promise<Result> {
  const p = sandbox();
  const m = await mine();
  if (!p || !m) return OFF;
  const interval = m.sub.interval ?? "month";
  try {
    await p.simulate(kind, { userId: m.user.id, subscriptionRef: m.ref, tier: m.sub.tier, interval, amount: priceOf(m.sub.tier, interval), periodEnd: m.sub.periodEnd });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "שגיאה" };
  }
  refresh();
  return { ok: true };
}
