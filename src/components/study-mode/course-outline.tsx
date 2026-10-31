"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { studyHref } from "@/lib/study";
import { percentOf, practiceGroups } from "@/lib/study/outline";
import { type Place, pathStatus, STEPS, type TopicProgress } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { useTopics } from "./progress-store";

/** The course a lesson belongs to: its page, and every lesson in order (the current one whole, the rest as outlines). */
export type CourseInfo = { title: string; href: string; lessons: StudyModule[] };

/**
 * The course beside the lesson: the course and how far through it, every
 * lesson in order, and the lesson open now expanded into its concepts, its
 * practice by kind of question, and its summary — each a way straight there.
 * The same list sits in the side bar on a wide screen and in a sheet on a phone.
 */
export function CourseOutline({
  course,
  current: m,
  progress: p,
  place,
  opening,
  onGo,
}: {
  course: CourseInfo;
  current: StudyModule;
  progress: TopicProgress;
  place: Place;
  opening: boolean;
  /** Go to a place in the lesson open now; null is its opening. */
  onGo: (place: Place | null) => void;
}) {
  const topics = useTopics(course.lessons.map((l) => l.slug));
  const status = (l: StudyModule) => (l.slug === m.slug ? pathStatus(m, p) : pathStatus(l, topics[l.slug]));
  const done = course.lessons.filter((l) => status(l) === "done").length;
  const learn = STEPS.findIndex((s) => s.id === "learn");
  const practice = STEPS.findIndex((s) => s.id === "practice");
  const summary = STEPS.findIndex((s) => s.id === "summary");
  const groups = practiceGroups(m, p);
  // The kind of question the reader is on (the move into practice counts as the first kind).
  const onGroup = !opening && place.step === practice ? ([...groups].reverse().find((g) => g.place.sub <= Math.max(place.sub, 1))?.id ?? groups[0]?.id) : undefined;

  const item = (on: boolean, mark: "done" | "on" | "todo") =>
    cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-[13.5px] transition-colors", on ? "bg-accent-soft font-bold text-fg" : "text-fg/85 hover:bg-surface-2", mark === "done" && !on && "text-muted");
  const dot = (mark: "done" | "on" | "todo") =>
    mark === "done" ? (
      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success text-canvas" aria-hidden>
        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
      </span>
    ) : (
      <span className={cn("h-4 w-4 shrink-0 rounded-full border-2", mark === "on" ? "border-[5px] border-accent" : "border-line-strong")} aria-hidden />
    );

  return (
    <div className="space-y-3">
      <Link href={course.href} className="block rounded-2xl bg-surface-2/70 px-3.5 py-3 transition-colors hover:bg-surface-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-accent">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden /> לדף הקורס
          <span className="num ms-auto font-medium text-muted">
            {done} מתוך {course.lessons.length} הושלמו
          </span>
        </span>
        <span className="mt-0.5 block text-[16px] font-bold text-fg">{course.title}</span>
        <span className="mt-2 flex gap-[3px]" aria-hidden>
          {course.lessons.map((l) => (
            <span key={l.slug} className={cn("h-1.5 flex-1 rounded-full", status(l) === "done" ? "bg-success" : l.slug === m.slug ? "bg-accent" : "bg-line-strong")} />
          ))}
        </span>
      </Link>

      <nav aria-label="שיעורי הקורס">
        <ol className="space-y-0.5">
          {course.lessons.map((l) => {
            const s = status(l);
            if (l.slug !== m.slug)
              return (
                <li key={l.slug}>
                  <Link href={studyHref(l.slug)} className={cn("flex items-center gap-2.5 rounded-xl px-2 py-2 text-[14px] transition-colors hover:bg-surface-2", s === "done" ? "text-muted" : "text-fg")}>
                    {s === "done" ? (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-canvas" aria-label="הושלם">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-line-strong text-[11px] font-bold text-muted">{l.n}</span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                    {s === "started" && <span className="num text-[11px] text-muted">{percentOf(l, topics[l.slug])}%</span>}
                  </Link>
                </li>
              );
            return (
              <li key={l.slug} aria-current="page" className="rounded-2xl border border-accent/30 bg-accent-soft/30 p-1.5">
                <button type="button" onClick={() => onGo(null)} className={cn("flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-start text-[14px] font-bold text-fg", opening && "bg-accent-soft")}>
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">{m.n}</span>
                  <span className="min-w-0 flex-1">{m.title}</span>
                  <span className="num text-[11px] font-medium text-muted">{percentOf(m, p)}%</span>
                </button>
                <p className="mt-1.5 px-2 text-[11px] font-semibold text-muted">מושגים</p>
                <ol>
                  {m.screens.map((sc, i) => {
                    const on = !opening && place.step === learn && place.sub === i;
                    const mark = p.seen.includes(i) ? "done" : on ? "on" : "todo";
                    return (
                      <li key={sc.id}>
                        <button type="button" onClick={() => onGo({ step: learn, sub: i })} aria-current={on ? "step" : undefined} className={item(on, mark)}>
                          {dot(on ? "on" : mark)}
                          <span className="min-w-0 flex-1">{sc.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-1.5 px-2 text-[11px] font-semibold text-muted">תרגול ובסוף</p>
                <ol>
                  {groups.map((g) => {
                    const on = onGroup === g.id;
                    const mark = g.answered === g.n ? "done" : on ? "on" : "todo";
                    return (
                      <li key={g.id}>
                        <button type="button" onClick={() => onGo(g.place)} aria-current={on ? "step" : undefined} className={item(on, mark)}>
                          {dot(on ? "on" : mark)}
                          <span className="min-w-0 flex-1">{g.label}</span>
                          <span className="num text-[11px] font-medium text-muted">
                            {g.answered}/{g.n}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button type="button" onClick={() => onGo({ step: summary, sub: 0 })} aria-current={!opening && place.step === summary ? "step" : undefined} className={item(!opening && place.step === summary, "todo")}>
                      {dot(!opening && place.step === summary ? "on" : s === "done" ? "done" : "todo")}
                      <span className="min-w-0 flex-1">סיכום וטיפים זהב</span>
                    </button>
                  </li>
                </ol>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
