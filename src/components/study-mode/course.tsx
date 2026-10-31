"use client";

import { ArrowLeft, Calculator, Check, ChevronsLeft, ChevronsRight, CircleCheck, PlayCircle, RotateCcw, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { maxXp, pathStatus, type TopicProgress, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { studyHref } from "@/lib/study";
import { lessonHref } from "@/lib/study/paths";
import { cn } from "@/lib/utils";
import { clock } from "./lesson-opening";
import { updateTopic, useTopics } from "./progress-store";

/**
 * The course as a path: progress on top, then one step per lesson down a line.
 * The lesson to do next opens as a spotlight panel with its concepts; the rest
 * are one row each, done lessons quieter than the ones ahead. A lesson can be
 * skipped: the spotlight moves on, and the lesson waits on the path — and the
 * spotlight can go back to the lesson before it. A lesson's tools (a
 * calculator) open straight from its place on the path.
 */
export function CoursePath({ lessons }: { lessons: StudyModule[] }) {
  const topics = useTopics(lessons.map((m) => m.slug));
  const rows = lessons.map((m) => ({ m, p: topics[m.slug], status: pathStatus(m, topics[m.slug]) }));
  const done = rows.filter((r) => r.status === "done").length;
  const xp = rows.reduce((s, r) => s + xpOf(r.m, r.p), 0);
  const max = rows.reduce((s, r) => s + maxXp(r.m), 0);
  const next = rows.find((r) => r.status === "new" || r.status === "started");
  return (
    <>
      <div className="card flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4 sm:px-5">
        <div>
          <p className="font-semibold text-fg">המסלול שלך</p>
          <p className="num flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span>
              <strong className="text-fg">{done}</strong> מתוך {rows.length} שיעורים הושלמו
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-[#eda100] text-[#eda100]" aria-hidden /> {xp} מתוך {max} XP
            </span>
          </p>
        </div>
        {next ? (
          <div className="flex min-w-[12rem] flex-[0_1_20rem] gap-1.5" role="progressbar" aria-label="התקדמות בקורס" aria-valuemin={0} aria-valuemax={max} aria-valuenow={xp}>
            {rows.map(({ m, p, status }) => (
              <span key={m.slug} className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className={cn("block h-full rounded-full transition-[width] duration-500", status === "done" ? "bg-success" : "bg-accent")} style={{ width: `${(xpOf(m, p) / maxXp(m)) * 100}%` }} />
              </span>
            ))}
          </div>
        ) : done === rows.length ? (
          <p className="flex items-center gap-2 font-semibold text-success">
            <CircleCheck className="h-5 w-5" aria-hidden /> סיימתם את כל הקורס!
          </p>
        ) : (
          <p className="text-sm text-muted">דילגתם על השיעורים שנותרו — אפשר לחזור לכל אחד מהם מתי שתרצו.</p>
        )}
      </div>

      <ol className="mt-8" aria-label="שיעורי הקורס">
        {rows.map((r, i) => {
          const spotlight = r === next;
          const isDone = r.status === "done";
          const skipped = r.status === "skipped";
          return (
            <li key={r.m.slug} className="flex gap-3 sm:gap-5">
              <div className="flex w-10 shrink-0 flex-col items-center sm:w-12" aria-hidden>
                <span className={cn("w-[3px] rounded-full", i === 0 ? "h-0" : spotlight ? "h-6 sm:h-7" : "h-2", rows[i - 1]?.status === "done" ? "bg-success" : "bg-line-strong")} />
                <span
                  className={cn(
                    "num grid h-10 w-10 shrink-0 place-items-center rounded-full text-base font-bold sm:h-12 sm:w-12 sm:text-lg",
                    isDone
                      ? "bg-success text-canvas"
                      : spotlight
                        ? "bg-accent text-accent-fg ring-[6px] ring-accent/20"
                        : cn("border-2 border-line-strong bg-surface text-muted", skipped && "border-dashed text-subtle"),
                  )}
                >
                  {isDone ? <Check className="h-5 w-5" strokeWidth={3} /> : r.m.n}
                </span>
                {i < rows.length - 1 && <span className={cn("min-h-3 w-[3px] flex-1 rounded-full", isDone ? "bg-success" : "bg-line-strong")} />}
              </div>
              <div className="min-w-0 flex-1 pb-5">
                {spotlight ? (
                  <Spotlight module={r.m} progress={r.p} started={r.status === "started"} total={rows.length} prev={rows[i - 1]} />
                ) : (
                  <>
                    <LessonRow module={r.m} progress={r.p} status={r.status} />
                    <Tools module={r.m} className="mt-1.5 ps-4 sm:ps-5" />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** The lesson to do next, open: what it says, the concepts in it (the ones read ticked), and the way in. */
function Spotlight({
  module: m,
  progress: p,
  started,
  total,
  prev,
}: {
  module: StudyModule;
  progress: TopicProgress;
  started: boolean;
  total: number;
  /** The lesson before this one: skipped, it comes back into the spotlight; done, it opens. */
  prev?: { m: StudyModule; status: ReturnType<typeof pathStatus> };
}) {
  const firstUnseen = m.screens.findIndex((_, i) => !p.seen.includes(i));
  const back = "inline-flex h-12 items-center gap-2 rounded-xl border-2 border-[#93b4ff]/60 bg-white/[0.06] px-5 text-[15px] font-bold text-[#e8eef8] transition hover:border-[#93b4ff] hover:bg-white/[0.12]";
  return (
    <section
      aria-labelledby={`lesson-${m.slug}`}
      className="flex flex-wrap gap-6 rounded-3xl bg-[#0b1a3a] p-5 text-[#e8eef8] shadow-[0_20px_40px_-24px_rgb(11_26_58/0.7)] sm:p-7 dark:bg-surface-2 dark:ring-1 dark:ring-accent/40"
    >
      <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-3">
        <p className="num text-sm font-semibold text-[#93b4ff]">
          {started ? "אתם כאן" : "השיעור הבא"} · שיעור {m.n} מתוך {total}
        </p>
        <h2 id={`lesson-${m.slug}`} className="text-2xl leading-tight font-bold sm:text-3xl">
          {m.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-[#c4cfe4]">{m.description}</p>
        {m.videos?.length ? (
          <p className="num flex items-center gap-1.5 text-[14px] font-semibold text-[#ffc93c]">
            <PlayCircle className="h-4 w-4" aria-hidden /> {videoLine(m)} — בפתיחת השיעור
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link href={studyHref(m.slug)} prefetch className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#4f8bff] px-6 text-[15px] font-bold text-[#04112b] transition hover:brightness-110">
            {started ? "להמשיך מאיפה שעצרתי" : "להתחיל את השיעור"} <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          {prev &&
            (prev.status === "skipped" ? (
              <button type="button" onClick={() => updateTopic(prev.m.slug, (q) => ({ ...q, skipped: false }))} className={back}>
                <ChevronsRight className="h-4 w-4" aria-hidden /> חזור לשיעור הקודם
              </button>
            ) : (
              <Link href={studyHref(prev.m.slug)} prefetch className={back}>
                <ChevronsRight className="h-4 w-4" aria-hidden /> חזור לשיעור הקודם
              </Link>
            ))}
          <button
            type="button"
            onClick={() => updateTopic(m.slug, (q) => ({ ...q, skipped: true }))}
            className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-[#93b4ff]/60 bg-white/[0.06] px-5 text-[15px] font-bold text-[#e8eef8] transition hover:border-[#93b4ff] hover:bg-white/[0.12]"
          >
            דלג על השיעור <ChevronsLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="num text-sm text-[#a9b7d1]">
            {xpOf(m, p)}/{maxXp(m)} XP
          </span>
        </div>
        <Tools module={m} spotlight />
      </div>
      <div className="flex min-w-0 flex-[1_1_15rem] flex-col gap-2.5 rounded-2xl bg-white/[0.06] p-4 sm:p-5">
        <p className="text-[13px] font-semibold text-[#a9b7d1]">מה יש בשיעור</p>
        <ul className="flex flex-col gap-2.5" aria-label="המושגים בשיעור">
          {m.screens.map((s, i) => {
            const seen = p.seen.includes(i);
            return (
              <li key={s.id} className="flex items-center gap-3 text-[15px]">
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", seen ? "bg-[#22c55e] text-[#052e14]" : "border-2 border-[#4f8bff]")}>
                  {seen && <Check className="h-3.5 w-3.5" strokeWidth={3.2} aria-label="נקרא" />}
                </span>
                <span className={cn(started && i === firstUnseen && "font-bold")}>{s.title}</span>
              </li>
            );
          })}
          <li className="num flex items-center gap-3 text-[15px] text-[#a9b7d1]">
            <span className="h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-[#5b6a88]" aria-hidden />
            {m.exercises.length + m.traps.length} שאלות תרגול · סיכום
          </li>
        </ul>
      </div>
    </section>
  );
}

/** "Includes a video of 4:23", or of its parts. */
function videoLine(m: StudyModule) {
  const v = m.videos!;
  if (v.length === 1) return `כולל סרטון${v[0].part ? ` (${v[0].part})` : ""} של ${clock(v[0].duration)} דק׳`;
  return `כולל ${v.length} סרטונים, ${clock(v.reduce((a, x) => a + x.duration, 0))} דק׳ בסך הכול`;
}

/** A lesson's tools, each a link straight to its screen — no need to go through the lesson first. */
function Tools({ module: m, spotlight, className }: { module: StudyModule; spotlight?: boolean; className?: string }) {
  if (!m.tools?.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {m.tools.map((t) => (
        <Link
          key={t.screen}
          href={lessonHref(m.slug, t.screen)}
          prefetch
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 font-semibold transition",
            spotlight ? "h-10 bg-[#fbbf24] text-[14px] text-[#3b2600] hover:brightness-105" : "h-8 bg-amber-400 text-[13px] text-amber-950 hover:bg-amber-300",
          )}
        >
          <Calculator className="h-4 w-4" aria-hidden /> ישר ל{t.label}
        </Link>
      ))}
    </div>
  );
}

/** Any other lesson: one row, the whole of it a link in. A skipped lesson waits here, dashed; opening it takes it back. */
function LessonRow({ module: m, progress: p, status }: { module: StudyModule; progress: TopicProgress; status: "new" | "started" | "done" | "skipped" }) {
  const done = status === "done";
  return (
    <Link
      href={studyHref(m.slug)}
      prefetch
      className={cn(
        "group flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl px-4 py-3.5 transition sm:px-5",
        done ? "hover:bg-surface" : status === "skipped" ? "border border-dashed border-line-strong hover:border-accent/40 hover:bg-surface" : "border border-line bg-surface shadow-card hover:border-accent/40",
      )}
    >
      <div className="min-w-0 flex-[1_1_18rem]">
        <h2 id={`lesson-${m.slug}`} className={cn("text-lg font-semibold", done ? "text-muted" : "text-fg")}>
          {m.title}
        </h2>
        <p className="num mt-0.5 text-sm text-muted">
          {m.screens.length} מושגים · {m.exercises.length + m.traps.length} שאלות תרגול
          {m.videos?.length ? (
            <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[12px] font-semibold text-amber-700 dark:text-amber-300">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden /> {m.videos.length > 1 ? `${m.videos.length} סרטונים` : "סרטון"} {clock(m.videos.reduce((a, v) => a + v.duration, 0))}
            </span>
          ) : null}
        </p>
      </div>
      <span
        className={cn(
          "num flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold",
          done ? "bg-success/10 text-success" : status === "skipped" ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent",
        )}
      >
        {status === "skipped" ? (
          <>
            דילגתם · לחזור לשיעור <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </>
        ) : done ? (
          <>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> הושלם · חזרה
          </>
        ) : status === "started" ? (
          `בתהליך · ${Math.round((xpOf(m, p) / maxXp(m)) * 100)}%`
        ) : (
          <>
            להתחיל <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          </>
        )}
      </span>
    </Link>
  );
}

/** The former long page's chapter links (/basics#trial) still land: on the lesson screen that holds that chapter now. `redirects` maps each old anchor to its new address. */
export function LegacyHashRedirect({ redirects }: { redirects: Record<string, string> }) {
  const router = useRouter();
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    // An anchor that is still on this page is the browser's to scroll to.
    if (!id || document.getElementById(id)) return;
    const to = redirects[id];
    if (to && !to.startsWith("#")) router.replace(to);
  }, [router, redirects]);
  return null;
}
