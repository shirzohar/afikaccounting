import { ArrowLeft, Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackEvent } from "@/components/layout/track-event";
import { Faq } from "@/components/pricing/faq";
import { PlanCards } from "@/components/pricing/plan-cards";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { FIRST_LESSON } from "@/lib/catalog";
import { safeNext } from "@/lib/auth/dal";
import { isTier, PLANS, type Tier } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "מחירים",
  description: "חשבונאות מאפס בחינם, לתמיד. הקורסים המתקדמים — מלאי, רכוש קבוע ודוחות כספיים — ומתחם המבחנים במנוי. בלי כרטיס אשראי כדי להתחיל.",
};

/** What each plan opens, row by row: true, false, or a few words. */
const COMPARE: { label: string; plans: Record<Tier, boolean | string> }[] = [
  { label: "חשבונאות מאפס — 6 שיעורים", plans: { free: true, courses: true, exams: true } },
  { label: "תרגול עם משוב מיידי ומלכודות", plans: { free: true, courses: true, exams: true } },
  { label: "סרטונים, סיכומים וטיפים למבחן", plans: { free: true, courses: true, exams: true } },
  { label: "מלאי (IAS 2)", plans: { free: "שיעור 1", courses: "כל 6 השיעורים", exams: "כל 6 השיעורים" } },
  { label: "רכוש קבוע (IAS 16)", plans: { free: "פרק 1", courses: "כל הפרקים", exams: "כל הפרקים" } },
  { label: "הצגת דוחות כספיים", plans: { free: "פרק 1", courses: "כל הפרקים", exams: "כל הפרקים" } },
  { label: "פתרונות מלאים לתרגילים ברמת מבחן", plans: { free: "מבחן לדוגמה", courses: "מבחן לדוגמה", exams: true } },
  { label: "ארכיון מבחנים עם פתרונות", plans: { free: false, courses: false, exams: "בקרוב" } },
];

const FAQ = [
  { q: "מתי אפשר לשלם?", a: "התשלום ייפתח בקרוב. עד אז, בחירה במסלול פותחת חשבון חינמי ושומרת את הבחירה — ונעדכן אתכם ברגע שהמסלול נפתח." },
  { q: "צריך כרטיס אשראי כדי להתחיל?", a: "לא. הקורס ״חשבונאות מאפס״ פתוח בלי כרטיס אשראי ובלי הרשמה, וכך גם השיעור הראשון בכל קורס מתקדם." },
  { q: "אפשר לבטל?", a: "כן. מנוי מתבטל בכל רגע ונשאר פעיל עד סוף התקופה ששילמתם עליה. הקורס החינמי נשאר פתוח לכם תמיד." },
  { q: "מה ההבדל בין קורסים לקורסים + מבחנים?", a: "״קורסים״ פותח את כל הקורסים המתקדמים במלואם. ״קורסים + מבחנים״ מוסיף את מתחם המבחנים: פתרונות מלאים מאפס לתרגילים ברמת מבחן וארכיון מבחנים עם פתרונות." },
  { q: "מה קורה להתקדמות שלי כשאני משדרג?", a: "שום דבר לא מתאפס: השיעורים שכבר עשיתם נשארים מסומנים, והשיעורים הנעולים פשוט נפתחים במקומם במסלול." },
];

export default function PricingPage({ searchParams }: PageProps<"/pricing">) {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold text-accent">מחירים</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            מתחילים <span className="text-gradient">בחינם</span>, ממשיכים עד המבחן
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            חשבונאות מאפס פתוחה לגמרי, לתמיד. כשתרצו להמשיך לנושאים שחוזרים בכל מבחן — הקורסים המתקדמים מחכים, והשיעור הראשון בכל אחד מהם עלינו.
          </p>
        </div>

        <div className="mt-12">
          <Suspense fallback={<PlanCards from="pricing" />}>
            <Chosen searchParams={searchParams} />
          </Suspense>
        </div>

        <section aria-labelledby="compare-title" className="mt-20">
          <SectionHeading title={<span id="compare-title">מה בכל מסלול</span>} />
          <div className="card mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="px-4 py-3 text-start font-medium text-muted">
                    <span className="sr-only">מה כלול</span>
                  </th>
                  {PLANS.map((p) => (
                    <th key={p.tier} scope="col" className={p.featured ? "bg-accent-soft/60 px-3 py-3" : "px-3 py-3"}>
                      <TierBadge tier={p.tier} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-0">
                    <th scope="row" className="px-4 py-3 text-start font-medium text-fg">
                      {row.label}
                    </th>
                    {PLANS.map((p) => {
                      const v = row.plans[p.tier];
                      return (
                        <td key={p.tier} className={p.featured ? "bg-accent-soft/60 px-3 py-3 text-center" : "px-3 py-3 text-center"}>
                          {v === true ? (
                            <Check className="mx-auto h-4 w-4 text-success" aria-label="כלול" />
                          ) : v === false ? (
                            <Minus className="mx-auto h-4 w-4 text-subtle" aria-label="לא כלול" />
                          ) : (
                            <span className="text-[13px] text-fg/90">{v}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="pricing-faq" className="mx-auto mt-20 max-w-3xl">
          <h2 id="pricing-faq" className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            שאלות על תשלום
          </h2>
          <Faq items={FAQ} className="mt-6" />
        </section>

        <div className="glass mt-20 flex flex-col items-start gap-5 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-fg">עוד מתלבטים? תתחילו מהשיעור הראשון.</p>
            <p className="mt-1 text-sm text-muted">בלי הרשמה ובלי כרטיס אשראי — רק לראות כמה זה פשוט.</p>
          </div>
          <ButtonLink href={FIRST_LESSON} size="lg">
            התחילו את שיעור 1 <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}

/**
 * ?plan= (from a paywall) raises that plan, and is recorded with the view;
 * ?from= is the page the reader came from, to return to after paying;
 * ?canceled=1 means they came back from the payment page without paying.
 */
async function Chosen({ searchParams }: Pick<PageProps<"/pricing">, "searchParams">) {
  const sp = await searchParams;
  const chosen = isTier(sp.plan) ? sp.plan : undefined;
  const from = typeof sp.from === "string" ? safeNext(sp.from, "") || undefined : undefined;
  return (
    <>
      <TrackEvent event={{ kind: "pricing_view", target: chosen }} />
      {sp.canceled === "1" && (
        <p role="status" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-center text-sm text-fg">
          התשלום לא הושלם, ולא חויבתם. אפשר לבחור מסלול ולנסות שוב.
        </p>
      )}
      <PlanCards from="pricing" chosen={chosen} returnTo={from} />
    </>
  );
}
