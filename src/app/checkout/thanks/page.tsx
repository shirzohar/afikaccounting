import { ArrowLeft, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { WaitForAccess } from "@/components/billing/wait-for-access";
import { TrackEvent } from "@/components/layout/track-event";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Container, Skeleton } from "@/components/ui/primitives";
import { getAccess } from "@/lib/auth/access";
import { requireUser, safeNext } from "@/lib/auth/dal";
import { EXAMS_HUB, LEARN_HUB } from "@/lib/catalog";
import { planOf, tierAllows } from "@/lib/pricing";

export const metadata: Metadata = { title: "תודה", robots: { index: false } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Where "continue" goes, in words: back to the lesson, the exam or the course they came from. */
function back(from: string | undefined, tier: "courses" | "exams") {
  if (from?.startsWith("/study/")) return { href: from, label: "חזרה לשיעור — הוא פתוח עכשיו" };
  if (from?.startsWith("/exams")) return { href: from, label: "חזרה למבחן — הפתרון פתוח עכשיו" };
  if (from) return { href: from, label: "להמשיך מאיפה שהייתם" };
  return tier === "exams" ? { href: EXAMS_HUB.href, label: "למתחם המבחנים" } : { href: LEARN_HUB.href, label: "לקורסים" };
}

/**
 * Back from the provider's payment page. The plan opens when the provider's
 * webhook arrives — usually before the reader does; until then, this page
 * waits for it. Then it sends them back where they came from.
 */
export default function ThanksPage({ searchParams }: PageProps<"/checkout/thanks">) {
  return (
    <Container className="max-w-xl pt-16 pb-24">
      <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
        <Thanks searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Thanks({ searchParams }: Pick<PageProps<"/checkout/thanks">, "searchParams">) {
  const user = await requireUser("/checkout/thanks");
  const sp = await searchParams;
  const tier = one(sp.plan) === "exams" ? "exams" : "courses";
  const from = safeNext(one(sp.from), "") || undefined;
  const access = await getAccess();
  const open = tierAllows(access.tier, tier);
  const next = back(from, tier);
  return (
    <div className="card p-6 sm:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success/10 text-success" aria-hidden>
        <PartyPopper className="h-6 w-6" />
      </span>
      <h1 className="mt-4 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
        תודה! מסלול {planOf(tier).name} <TierBadge tier={tier} />
      </h1>
      {open ? (
        <>
          <TrackEvent event={{ kind: "payment_success", target: tier }} once={`payment-${user.id}-${tier}`} />
          <p className="mt-2 text-[15px] leading-relaxed text-muted">המנוי פעיל. החשבונית נשלחה לאימייל שלכם, והיא זמינה גם בפרופיל.</p>
          <ButtonLink href={next.href} size="lg" className="mt-6">
            {next.label} <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </>
      ) : (
        <div className="mt-4">
          <WaitForAccess />
        </div>
      )}
    </div>
  );
}
