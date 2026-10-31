import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { FIRST_LESSON } from "@/lib/catalog";
import type { Trap } from "@/lib/study/types";
import { HeroExercise } from "./hero-exercise";

/**
 * The home page's opening: the free course, and the way straight into lesson 1
 * (no account) — above the fold on a phone. Beside it, one live question
 * from the course, in the course's own components.
 */
export function Hero({ trap, lessons, exercises }: { trap: Trap; lessons: number; exercises: number }) {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[min(920px,100vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(79_139_255_/_0.28),transparent)] blur-2xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:px-8 lg:pb-24">
        <div>
          <TierBadge tier="free" label="קורס מלא · חינם · בלי הרשמה" />
          <h1 className="mt-4 text-[2.15rem] leading-[1.1] font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">
            חשבונאות <span className="text-gradient">מאפס</span>
            <br />
            קורס מלא, בחינם
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted sm:mt-6 sm:text-[17px]">
            <span className="num">{lessons}</span> שיעורים קצרים, מ״מה זה חובה וזכות״ ועד דוחות כספיים. בכל שיעור: מושג עם דוגמה חיה, תרגול עם משוב מיידי, וטיפים למבחן.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
            <ButtonLink href={FIRST_LESSON} size="lg">
              התחילו את שיעור 1 <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="#free-course" variant="secondary" size="lg" className="max-sm:hidden">
              <PlayCircle className="h-4 w-4" aria-hidden /> מה יש בקורס
            </ButtonLink>
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted sm:mt-7">
            {[`${exercises} שאלות תרגול עם משוב`, "בלי כרטיס אשראי", "ההתקדמות נשמרת בדפדפן"].map((t) => (
              <li key={t} className="num flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-xl text-sm text-muted">
            ומשם ממשיכים: <strong className="font-semibold text-fg">מלאי, רכוש קבוע ודוחות כספיים</strong> — עד רמת מבחן.
          </p>
        </div>

        <HeroExercise trap={trap} />
      </div>
    </section>
  );
}
