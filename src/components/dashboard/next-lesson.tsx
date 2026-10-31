"use client";

import { ArrowLeft, CircleCheck, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { TierBadge } from "@/components/pricing/tier-badge";
import { useTopics } from "@/components/study-mode/progress-store";
import { ButtonLink } from "@/components/ui/button";
import { planHref } from "@/lib/pricing";
import { studyHref } from "@/lib/study";
import { pathStatus } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";

/**
 * The lesson to do next, from the progress kept in this browser: the free
 * course first, then the next course. A reader without a plan who reaches a
 * locked lesson — or finishes the free course — is offered the upgrade.
 */
export function NextLesson({ courses, locked, upgrade }: { courses: { title: string; href: string; lessons: StudyModule[] }[]; locked: string[]; upgrade: boolean }) {
  const all = courses.flatMap((c) => c.lessons);
  const topics = useTopics(all.map((m) => m.slug));
  const status = (m: StudyModule) => pathStatus(m, topics[m.slug]);
  const free = courses[0];
  const freeDone = free.lessons.filter((m) => status(m) === "done").length;
  const next = all.find((m) => status(m) === "new" || status(m) === "started") ?? all.find((m) => status(m) === "skipped");
  const course = courses.find((c) => next && c.lessons.includes(next));
  const isLocked = !!next && locked.includes(next.slug);

  return (
    <section aria-labelledby="next-lesson" className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 p-5 sm:p-6">
        <div className="min-w-0 flex-[1_1_18rem]">
          <p id="next-lesson" className="text-xs font-semibold text-accent">
            השיעור הבא שלך
          </p>
          {next && course ? (
            <>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold text-fg">
                {isLocked && <Lock className="h-4 w-4 text-muted" aria-label="נעול" />}
                {next.title}
              </p>
              <p className="num mt-0.5 text-sm text-muted">
                {course.title} · שיעור {next.n} מתוך {course.lessons.length}
              </p>
            </>
          ) : (
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-success">
              <CircleCheck className="h-5 w-5" aria-hidden /> סיימתם את כל השיעורים!
            </p>
          )}
          <p className="num mt-2 text-sm text-muted">
            {free.title}: <strong className="text-fg">{freeDone}</strong> מתוך {free.lessons.length} שיעורים הושלמו
          </p>
        </div>
        {next &&
          (isLocked ? (
            <ButtonLink href={planHref("courses")} size="lg">
              לפתוח את הקורס המלא <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
          ) : (
            <ButtonLink href={studyHref(next.slug)} size="lg">
              {status(next) === "started" ? "להמשיך מאיפה שעצרתי" : "להתחיל את השיעור"} <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
          ))}
      </div>
      {upgrade && (freeDone === free.lessons.length || isLocked) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-accent-soft/60 px-5 py-4 sm:px-6">
          <Sparkles className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <p className="min-w-0 flex-1 text-sm text-fg">
            {freeDone === free.lessons.length ? "סיימתם את הקורס החינמי — כל הכבוד! " : ""}
            הקורסים המתקדמים ממשיכים בדיוק מכאן, עד רמת מבחן.
          </p>
          <TierBadge tier="courses" />
          <Link href={planHref("courses")} className="text-sm font-semibold text-accent hover:underline">
            למסלולים
          </Link>
        </div>
      )}
    </section>
  );
}
