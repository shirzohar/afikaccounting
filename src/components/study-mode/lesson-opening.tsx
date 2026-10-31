"use client";

import { ArrowLeft, BookOpenText, Calculator, CircleCheck, ClipboardPen, RotateCcw, Star } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { maxXp, PRACTICE_GROUPS, practiceOf, statusOf, type TopicProgress, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";

/**
 * The gate into a lesson, on every arrival: what it is about, the concepts it
 * goes through, the practice after them, and the way in — or, in a lesson
 * already under way, the way back to where the reader stopped. A lesson's tools (a calculator) open straight from here.
 */
export function LessonOpening({
  module: m,
  progress: p,
  onStart,
  onRestart,
  onTool,
}: {
  module: StudyModule;
  progress: TopicProgress;
  onStart: () => void;
  onRestart: () => void;
  onTool: (screen: string) => void;
}) {
  const items = practiceOf(m);
  const groups = PRACTICE_GROUPS.map((g) => ({ ...g, n: items.filter((it) => it.group === g).length })).filter((g) => g.n > 0);
  const started = statusOf(m, p) !== "new";
  const xp = xpOf(m, p);
  const max = maxXp(m);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-4 rounded-2xl border-2 border-accent bg-surface px-4 py-5 shadow-[0_10px_30px_-18px_var(--accent)] sm:px-5">
        <motion.span
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          className="num grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-2xl font-bold text-accent-fg"
          aria-hidden
        >
          {m.n}
        </motion.span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[13px] font-semibold text-accent">
            {m.course} · שיעור {m.n}
          </p>
          <p className="text-[22px] leading-tight font-bold text-fg">{m.title}</p>
          <p className="text-[15.5px] leading-relaxed text-fg/85">{m.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="opening-learn">
          <p id="opening-learn" className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <BookOpenText className="h-4 w-4" aria-hidden /> מה נלמד
          </p>
          <ol className="space-y-1.5">
            {m.screens.map((s, i) => {
              const seen = p.seen.includes(i);
              return (
                <li key={s.id} className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2 text-[14.5px] text-fg">
                  <span
                    className={cn("num grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold", seen ? "bg-success text-canvas" : "bg-surface text-muted ring-1 ring-line-strong")}
                  >
                    {seen ? <CircleCheck className="h-3.5 w-3.5" aria-label="נקרא" /> : i + 1}
                  </span>
                  {s.title}
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="opening-practice" className="space-y-3">
          <p id="opening-practice" className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <ClipboardPen className="h-4 w-4" aria-hidden /> ואחר כך מתרגלים
          </p>
          <ul className="space-y-1.5">
            {groups.map((g) => (
              <li key={g.id} className="num flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[14.5px] text-fg">
                {g.label} <span className="text-muted">{g.n} שאלות</span>
              </li>
            ))}
          </ul>
          <p className="num flex items-center gap-1.5 text-[13.5px] text-muted">
            <Star className="h-3.5 w-3.5 fill-[#eda100] text-[#eda100]" aria-hidden /> עד {max} XP בשיעור · בסוף — סיכום וטיפים זהב
          </p>
        </section>
      </div>

      {started && (
        <div className="space-y-1.5">
          <p className="num text-[13.5px] text-muted">
            כבר התחלתם: {xp} מתוך {max} XP
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="ההתקדמות בשיעור" aria-valuemin={0} aria-valuemax={max} aria-valuenow={xp}>
            <div className="h-full rounded-full bg-accent" style={{ width: `${(xp / max) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={onStart}>
          {started ? "להמשיך מאיפה שעצרתי" : "להתחיל את השיעור"} <ArrowLeft className="h-4 w-4" aria-hidden />
        </Button>
        {started && (
          <Button size="lg" variant="secondary" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" aria-hidden /> להתחיל מההתחלה
          </Button>
        )}
        {m.tools?.map((t) => (
          <Button key={t.screen} size="lg" variant="secondary" onClick={() => onTool(t.screen)}>
            <Calculator className="h-4 w-4" aria-hidden /> ישר ל{t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
