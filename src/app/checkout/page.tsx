import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutStart } from "@/components/billing/checkout-start";
import { TrackEvent } from "@/components/layout/track-event";
import { TierBadge } from "@/components/pricing/tier-badge";
import { Container, Skeleton } from "@/components/ui/primitives";
import { getAccess } from "@/lib/auth/access";
import { getCurrentUser, safeNext } from "@/lib/auth/dal";
import { billingEnabled, priceOf } from "@/lib/billing";
import { getMySubscription } from "@/lib/data/billing";
import { planOf, signupHref, tierAllows } from "@/lib/pricing";

export const metadata: Metadata = { title: "תשלום", robots: { index: false } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The way from "choose a plan" to the provider's payment page: payments off —
 * sign up with the plan noted, as before; a guest — sign up (or in) first, and
 * come back here; a reader who already has the plan — their profile; anyone
 * else — straight on to pay.
 */
export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <Container className="max-w-xl pt-16 pb-24">
      <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
        <Checkout searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Checkout({ searchParams }: Pick<PageProps<"/checkout">, "searchParams">) {
  const sp = await searchParams;
  const tier = one(sp.plan) === "exams" ? "exams" : "courses";
  const interval = one(sp.interval) === "year" ? "year" : "month";
  const from = safeNext(one(sp.from), "") || undefined;
  if (!billingEnabled()) redirect(signupHref(tier));

  const here = `/checkout?plan=${tier}&interval=${interval}${from ? `&from=${encodeURIComponent(from)}` : ""}`;
  const user = await getCurrentUser();
  if (!user) redirect(`/register?plan=${tier}&next=${encodeURIComponent(here)}`);

  const [access, sub] = await Promise.all([getAccess(), getMySubscription()]);
  // Already on this plan, or paying for one: change it from the profile, not with a second subscription.
  if (tierAllows(access.tier, tier) || (sub?.providerRef && sub.status !== "canceled")) redirect("/profile#subscription");

  const plan = planOf(tier);
  return (
    <div className="card p-6 sm:p-8">
      {one(sp.welcome) === "1" && <TrackEvent event={{ kind: "signup", meta: { plan: tier } }} once="signup" />}
      <p className="text-xs font-semibold text-accent">תשלום</p>
      <h1 className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
        מסלול {plan.name} <TierBadge tier={tier} />
      </h1>
      <p className="num mt-1 text-sm text-muted">
        ₪{priceOf(tier, interval)} {interval === "year" ? "לשנה" : "לחודש"} · חשבונית לכל חיוב · ביטול בכל רגע
      </p>
      <div className="mt-6">
        <CheckoutStart tier={tier} interval={interval} from={from} />
      </div>
    </div>
  );
}
