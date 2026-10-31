import { ArrowLeft, Check, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { TrackEvent } from "@/components/layout/track-event";
import { ButtonLink } from "@/components/ui/button";
import { PRICES_ARE_FINAL, planHref, planOf, priceLabel, type Tier } from "@/lib/pricing";
import { TierBadge } from "./tier-badge";

/**
 * In place of a locked lesson or chapter: what the plan that opens it
 * includes, its price, the way to it, and the free taste of the same course.
 * The locked content itself is never rendered, so it never reaches the browser.
 */
export function Paywall({
  tier = "courses",
  title,
  course,
  taste,
  where,
  heading: H = "h2",
  lead,
}: {
  tier?: Exclude<Tier, "free">;
  /** What is locked: the lesson's or chapter's name. */
  title: string;
  /** The course it belongs to. */
  course: string;
  /** The free part of the same course. */
  taste?: { href: string; label: string };
  /** For the paywall_view event: where the reader met it. */
  where: string;
  /** h1 when the paywall is the page. */
  heading?: "h1" | "h2";
  /** What the plan opens here, in place of the lessons' wording. */
  lead?: string;
}) {
  const plan = planOf(tier);
  const id = `paywall-${where.replace(/[^a-z0-9]+/gi, "-")}`;
  return (
    <section aria-labelledby={id} className="card relative overflow-hidden p-5 sm:p-7">
      <TrackEvent event={{ kind: "paywall_view", target: where, label: title, meta: { tier } }} />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent" aria-hidden>
            <Lock className="h-5 w-5" />
          </span>
          <TierBadge tier={tier} />
          <span className="text-sm text-muted">{course}</span>
        </div>
        <H id={id} className="mt-4 text-2xl font-semibold tracking-tight text-fg">
          {title} — {tier === "exams" ? "במתחם המבחנים" : "בקורס המלא"}
        </H>
        <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-muted">
          זה פתוח במסלול <strong className="text-fg">{plan.name}</strong>.{" "}
          {lead ?? "אותו מבנה שכבר הכרתם — מושגים עם דוגמה חיה, תרגול עם משוב ומלכודות, וסיכום עם טיפים — עד רמת מבחן."}
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {plan.includes.map((x) => (
            <li key={x} className="flex items-start gap-2 text-[14.5px] text-fg/90">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden /> {x}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink href={planHref(tier)} size="lg">
            למסלול {plan.name} · <span className="num">{priceLabel(plan)}</span> <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
          {taste && (
            <ButtonLink href={taste.href} variant="secondary" size="lg">
              <PlayCircle className="h-4 w-4" aria-hidden /> {taste.label}
            </ButtonLink>
          )}
        </div>
        {!PRICES_ARE_FINAL && <p className="mt-3 text-xs text-subtle">המחירים עדיין לא סופיים, והתשלום ייפתח בקרוב.</p>}
        <p className="mt-3 text-sm text-muted">
          עוד לא סיימתם את הבסיס?{" "}
          <Link href="/basics" className="font-medium text-accent hover:underline">
            חשבונאות מאפס — בחינם, כל 6 השיעורים
          </Link>
        </p>
      </div>
    </section>
  );
}
