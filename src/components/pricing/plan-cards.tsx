import { ArrowLeft, Check } from "lucide-react";
import { FIRST_LESSON } from "@/lib/catalog";
import { PLANS, PRICES_ARE_FINAL, signupHref } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { PlanCta } from "./plan-cta";
import { TierBadge } from "./tier-badge";

/**
 * The three plans side by side, the featured one raised: name, price, what's
 * included, and the way in — free starts lesson 1, a paid plan signs up with
 * the plan noted (payment isn't open yet). `from` names the page, for plan_click.
 */
export function PlanCards({ from, chosen }: { from: string; chosen?: string }) {
  return (
    <div>
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const featured = chosen ? chosen === p.tier : p.featured;
          return (
            <article
              key={p.tier}
              aria-labelledby={`plan-${p.tier}`}
              className={cn("card relative flex flex-col p-5 sm:p-6", featured && "border-2 border-accent shadow-[0_18px_40px_-22px_var(--accent)] lg:-my-2 lg:py-8")}
            >
              {p.featured && (
                <span className="absolute -top-3 start-5 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-fg">הכי משתלם להכנה למבחן</span>
              )}
              <div className="flex items-center justify-between gap-2">
                <h3 id={`plan-${p.tier}`} className="text-lg font-semibold text-fg">
                  {p.name}
                </h3>
                <TierBadge tier={p.tier} />
              </div>
              <p className="mt-1 text-sm text-muted">{p.description}</p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="num text-4xl font-semibold tracking-tight text-fg">{p.monthly === 0 ? "₪0" : `₪${p.monthly}`}</span>
                <span className="text-sm text-muted">{p.monthly === 0 ? "לתמיד" : "לחודש"}</span>
              </p>
              {p.yearly ? (
                <p className="num text-xs text-muted">או ₪{p.yearly} לשנה</p>
              ) : (
                <p className="text-xs text-muted">בלי כרטיס אשראי, בלי הרשמה</p>
              )}
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.includes.map((x) => (
                  <li key={x} className="flex items-start gap-2 text-[14.5px] text-fg/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
              <PlanCta
                tier={p.tier}
                from={from}
                href={p.tier === "free" ? FIRST_LESSON : signupHref(p.tier)}
                variant={featured ? "primary" : "secondary"}
                className="mt-6 w-full"
              >
                {p.tier === "free" ? "התחילו את שיעור 1" : `בחרו ב${p.name}`} <ArrowLeft className="h-4 w-4" aria-hidden />
              </PlanCta>
            </article>
          );
        })}
      </div>
      {!PRICES_ARE_FINAL && <p className="mt-4 text-center text-xs text-subtle">המחירים עדיין לא סופיים, והתשלום ייפתח בקרוב. בחירה במסלול היום פותחת חשבון חינמי ושומרת את הבחירה שלכם.</p>}
    </div>
  );
}
