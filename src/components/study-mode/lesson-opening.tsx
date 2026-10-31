"use client";

import { ArrowLeft, BookOpenText, Calculator, CircleCheck, ClipboardPen, Play, RotateCcw, Star } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { maxXp, PRACTICE_GROUPS, practiceOf, statusOf, type TopicProgress, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";

/** Seconds as m:ss. */
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * The gate into a lesson, on every arrival: what it is about, the concepts it
 * goes through, the practice after them, and the way in — or, in a lesson
 * already under way, the way back to where the reader stopped. A lesson's tools (a calculator) open straight from here,
 * and so does its video, if it has one: as a whole, or at the part of any concept.
 */
export function LessonOpening({
  module: m,
  progress: p,
  onStart,
  onRestart,
  onTool,
  onVideo,
}: {
  module: StudyModule;
  progress: TopicProgress;
  onStart: () => void;
  onRestart: () => void;
  onTool: (screen: string) => void;
  /** Opens the lesson's video at a second. */
  onVideo?: (at: number) => void;
}) {
  const video = onVideo && m.video;
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

      {video && (
        <section aria-labelledby="opening-video" className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#1b2541] p-4 text-[#fdf6e7] sm:p-5">
          <button
            type="button"
            onClick={() => onVideo(0)}
            aria-label={`צפייה בסרטון: ${video.title}`}
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#ffc93c] text-[#1b2541] shadow-[0_10px_28px_-10px_#ffc93c] transition hover:scale-105 active:scale-95"
          >
            <Play className="h-7 w-7 translate-x-[-2px] fill-current" aria-hidden />
          </button>
          <div className="min-w-0 flex-[1_1_16rem] space-y-1">
            <p className="num text-[13px] font-semibold text-[#ffc93c]">
              סרטון השיעור · {clock(video.duration)} דק׳ · {video.chapters.length} פרקים
            </p>
            <p id="opening-video" className="text-[18px] font-bold leading-snug">
              {video.title}
            </p>
            <p className="text-[14px] text-[#c9cfdf]">צפו קודם בסרטון ואז תרגלו במסכים — או דלגו ישר לשיעור. אפשר לחזור לכל קטע בו מכל מסך.</p>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="opening-learn">
          <p id="opening-learn" className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <BookOpenText className="h-4 w-4" aria-hidden /> מה נלמד
          </p>
          <ol className="space-y-1.5">
            {m.screens.map((s, i) => {
              const seen = p.seen.includes(i);
              const clip = video ? video.chapters.find((c) => c.screen === s.id)?.at : undefined;
              return (
                <li key={s.id} className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2 text-[14.5px] text-fg">
                  <span
                    className={cn("num grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold", seen ? "bg-success text-canvas" : "bg-surface text-muted ring-1 ring-line-strong")}
                  >
                    {seen ? <CircleCheck className="h-3.5 w-3.5" aria-label="נקרא" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">{s.title}</span>
                  {clip !== undefined && (
                    <button
                      type="button"
                      onClick={() => onVideo!(clip)}
                      aria-label={`${s.title} בסרטון, מ-${clock(clip)}`}
                      className="num inline-flex shrink-0 items-center gap-1 rounded-md bg-[#fbbf24]/20 px-2 py-0.5 text-[12px] font-bold text-amber-800 transition hover:bg-[#fbbf24]/40 dark:text-amber-300"
                    >
                      <Play className="h-3 w-3 fill-current" aria-hidden /> {clock(clip)}
                    </button>
                  )}
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
