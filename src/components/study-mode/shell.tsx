"use client";

import { BookOpenText, ChevronDown, ClipboardPen, Flag, PlayCircle, Sparkles } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { VideoDrawer } from "@/components/video/video-drawer";
import {
  clampPlace,
  markSeen,
  missedOf,
  move,
  type Place,
  position,
  practiceAt,
  practiceId,
  practiceOf,
  recordExercise,
  recordTrap,
  retryMissed,
  STEPS,
  subCount,
  xpOf,
} from "@/lib/study/score";
import { neighbours, percentOf } from "@/lib/study/outline";
import { videoAt } from "@/lib/study/paths";
import type { LessonVideo, StudyModule } from "@/lib/study/types";
import { type CourseInfo, CourseOutline } from "./course-outline";
import { JournalSimulator } from "./journal-simulator";
import { clock, LessonOpening } from "./lesson-opening";
import { LessonNav } from "./lesson-nav";
import { LessonStats } from "./lesson-stats";
import { PracticeIntro } from "./practice-intro";
import { resetTopic, setLast, updateTopic, useTopic } from "./progress-store";
import { QuestionExercise } from "./question-exercise";
import { LessonContext } from "./screen-link";
import { Sheet } from "./sheet";
import { cue } from "./sound";
import { SummaryCard } from "./summary-card";
import { TrapQuiz } from "./trap-quiz";

/**
 * On arrival, the address wins over the stored place, once: ?screen=<id> opens
 * a concept screen, ?step=<n> a step. Read from the router, which already holds
 * the new address during a client navigation (the window may not yet).
 */
function AddressPlace({ module: m, onApply }: { module: StudyModule; onApply: () => void }) {
  const params = useSearchParams();
  const applied = useRef(false);
  const screenId = params.get("screen");
  const stepParam = params.get("step");
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const screen = m.screens.findIndex((s) => s.id === screenId);
    const n = Number(stepParam);
    if (screen >= 0) updateTopic(m.slug, (q) => ({ ...q, step: 0, sub: screen }));
    else if (Number.isInteger(n) && n >= 1 && n <= STEPS.length) updateTopic(m.slug, (q) => (q.step === n - 1 ? q : { ...q, step: n - 1, sub: 0 }));
    else return;
    // The reader asked for this place: no "continuing where you left off".
    onApply();
  }, [m, screenId, stepParam, onApply]);
  return null;
}

const noSubscribe = () => () => {};

/** The lesson's video, as the site's player takes it. */
const playable = (slug: string, v: LessonVideo) => ({
  slug,
  title: v.title,
  videoUrl: v.src,
  durationSeconds: v.duration,
  chapters: v.chapters.map(({ at, title }) => ({ at, title })),
});

/** A concept screen's content, rendered on the server: the one principle it teaches, and the rest. */
export type ScreenContent = { lead?: ReactNode; body: ReactNode };

/**
 * The lesson, as a page of the site: the course beside it (every lesson, and
 * this one's concepts, practice and summary — each a way straight there; a
 * sheet on a phone), the screen in the page's own flow, and "previous" and
 * "next" at its foot, each naming where it goes. The place in the lesson lives
 * in the progress store, so a return or a refresh resumes it; the address
 * follows with ?step=, and ?screen=<id> or ?step=<n> on arrival opens that
 * place. Keys: ← next, → previous (right to left) — unless a control inside
 * the screen already used the key.
 */
export function StudyShell({ module: m, screens, next, course }: { module: StudyModule; screens: ScreenContent[]; next?: { href: string; label: string }; course: CourseInfo }) {
  const slug = m.slug;
  const p = useTopic(slug);
  const router = useRouter();
  const pathname = usePathname();
  const place = clampPlace(m, p);
  const step = place.step;
  const { at, total } = position(m, place);
  const last = at === total;
  const [dir, setDir] = useState<1 | -1>(1);
  const [moved, setMoved] = useState(false);
  // The opening gate shows on every arrival, unless the address asked for a place in the lesson.
  const [opening, setOpening] = useState(true);
  const arrived = useCallback(() => {
    setMoved(true);
    setOpening(false);
  }, []);
  const enter = () => {
    setDir(1);
    setMoved(true);
    setOpening(false);
  };
  const openTool = (screen: string) => {
    const sub = m.screens.findIndex((s) => s.id === screen);
    if (sub < 0) return;
    enter();
    updateTopic(slug, (q) => ({ ...q, step: 0, sub }));
    window.history.replaceState(window.history.state, "", `${pathname}?screen=${screen}`);
  };
  // The lesson's video, in a panel over the lesson: closed, or open at a second.
  const [video, setVideo] = useState<{ open: boolean; part: number; at: number }>({ open: false, part: 0, at: 0 });
  const watch = (part = 0, at = 0) => setVideo({ open: true, part, at });
  // In the browser only: the panel goes to the page's body.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const [sheet, setSheet] = useState(false);

  const go = (to: Place, d: 1 | -1) => {
    setDir(d);
    setMoved(true);
    // Leaving a concept screen forward counts as having read it.
    updateTopic(slug, (q) => {
      const from = clampPlace(m, q);
      const read = from.step === 0 && (to.step > 0 || to.sub > from.sub) ? markSeen(q, from.sub) : q;
      return { ...read, ...to };
    });
    // The address follows the reader's moves (never on arrival, while a navigation may still be under way).
    window.history.replaceState(window.history.state, "", `${pathname}?step=${to.step + 1}`);
  };
  // Trying the missed questions again: "next" goes from one to the next of them, then back to the summary.
  const retry = STEPS[step].id === "practice" ? p.retry : undefined;
  const nextScreen = () => {
    if (opening) return enter();
    if (!retry?.length) return go(move(m, place, 1), 1);
    const upcoming = Array.from({ length: subCount(m, step) - 1 }, (_, i) => i + 1).find((sub) => sub > place.sub && retry.includes(practiceId(practiceAt(m, sub)!)));
    if (upcoming) return go({ step, sub: upcoming }, 1);
    updateTopic(slug, (q) => ({ ...q, retry: undefined }));
    go({ step: STEPS.length - 1, sub: 0 }, 1);
  };
  const prevScreen = () => {
    // Back from the lesson's first screen is back to its opening.
    if (at === 1) {
      setDir(-1);
      return setOpening(true);
    }
    go(move(m, place, -1), -1);
  };
  const tryMissedAgain = () => {
    const first = missedOf(m, p)[0];
    if (!first) return;
    updateTopic(slug, (q) => retryMissed(m, q));
    go({ step: STEPS.findIndex((s) => s.id === "practice"), sub: first.sub }, -1);
  };
  const restart = () => {
    resetTopic(slug);
    setDir(-1);
    setMoved(true);
    window.history.replaceState(window.history.state, "", pathname);
  };
  const jump = (screen: string) => {
    const i = m.screens.findIndex((s) => s.id === screen);
    if (i >= 0) go({ step: 0, sub: i }, step > 0 || i > place.sub ? 1 : -1);
  };

  // A lesson skipped on the course path is taken back once it is opened.
  useEffect(() => {
    if (p.skipped) updateTopic(slug, (q) => ({ ...q, skipped: false }));
  }, [slug, p.skipped]);

  // On every new screen: the page back to the lesson's top, and focus to its heading for screen readers (not on arrival).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if ((top.current?.getBoundingClientRect().top ?? 0) < 0) top.current?.scrollIntoView({ block: "start" });
    heading.current?.focus({ preventScroll: true });
  }, [place.step, place.sub, opening]);

  // "Continue where you left off", across the site: this lesson, and how far through it.
  const percent = percentOf(m, p);
  useEffect(() => {
    setLast({ slug, title: m.title, course: m.course, n: m.n, percent });
  }, [slug, m.title, m.course, m.n, percent]);

  /** From the course list: a place in this lesson, or (null) its opening. */
  const goTo = (to: Place | null) => {
    setSheet(false);
    if (to === null) {
      setDir(-1);
      setMoved(true);
      return setOpening(true);
    }
    const ahead = opening || position(m, to).at > at;
    setOpening(false);
    go(to, ahead ? 1 : -1);
  };

  const keys = useRef<(e: KeyboardEvent) => void>(undefined);
  const forwarding = useRef(false);
  useEffect(() => {
    keys.current = (e) => {
      if (forwarding.current || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || document.querySelector("dialog[open], [aria-modal=true]")) return;
      if (e.key === "Escape") return router.push(m.backHref);
      if ((e.target as HTMLElement).closest("input, select, textarea, [contenteditable], [role=tablist], [role=radiogroup]")) return;
      // A step-by-step walkthrough on the screen takes the arrows first, wherever the focus is; past its ends they move the lesson.
      const walkthrough = body.current?.querySelector<HTMLElement>('[aria-roledescription="צעד אחר צעד"]');
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && walkthrough && !walkthrough.contains(e.target as Node)) {
        forwarding.current = true;
        const taken = !walkthrough.dispatchEvent(new KeyboardEvent("keydown", { key: e.key, bubbles: true, cancelable: true }));
        forwarding.current = false;
        if (taken) return e.preventDefault();
      }
      if (e.key === "ArrowLeft" && (opening || !last)) nextScreen();
      else if (e.key === "ArrowRight" && !opening) prevScreen();
      else return;
      e.preventDefault();
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current?.(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const id = STEPS[step].id;
  let card: { icon: ReactNode; title: string; count?: string; content: ReactNode; clip?: { part: number; at: number } };
  if (opening) {
    card = {
      icon: <Sparkles className="h-5 w-5" />,
      title: "על השיעור",
      content: (
        <LessonOpening
          module={m}
          progress={p}
          onStart={enter}
          onTool={openTool}
          onVideo={m.videos?.length ? watch : undefined}
          onRestart={() => {
            restart();
            setOpening(false);
          }}
        />
      ),
    };
  } else if (id === "learn") {
    const s = screens[place.sub];
    card = {
      icon: <BookOpenText className="h-5 w-5" />,
      title: m.screens[place.sub].title,
      count: m.screens.length > 1 ? `מושג ${place.sub + 1} מתוך ${m.screens.length}` : undefined,
      clip: videoAt(m.videos, m.screens[place.sub].id),
      content: (
        <div className="space-y-4">
          {s.lead && <div className="rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3.5 text-[16px] font-semibold leading-relaxed text-fg sm:px-5">{s.lead}</div>}
          {/* On a wide screen the screen's blocks flow into two columns, each block whole, so the width fills instead of stretching the lines;
              a wide widget (a walkthrough, the entry-to-cards arrows) spans both. */}
          <div className="space-y-4 text-[15.5px] leading-relaxed text-fg/90 xl:columns-2 xl:gap-x-6 xl:space-y-0 xl:[&>*]:mb-4 xl:[&>*]:break-inside-avoid">{s.body}</div>
        </div>
      ),
    };
  } else if (id === "practice" && !practiceAt(m, place.sub)) {
    card = {
      icon: <ClipboardPen className="h-5 w-5" />,
      title: "עוברים לתרגול",
      content: <PracticeIntro module={m} onStart={nextScreen} />,
    };
  } else if (id === "practice") {
    const it = practiceAt(m, place.sub)!;
    const again = retry?.indexOf(practiceId(it)) ?? -1;
    const count = again >= 0 ? `חזרה · ${again + 1} מתוך ${retry!.length}` : `שאלה ${place.sub} מתוך ${subCount(m, step) - 1}`;
    if (it.kind === "exercise") {
      const ex = it.ex;
      const onCheck = (ok: boolean) => {
        updateTopic(slug, (q) => recordExercise(q, ex, ok));
        cue(ok ? "ok" : "bad");
      };
      card = {
        icon: <ClipboardPen className="h-5 w-5" />,
        title: `${it.group.label} · ${ex.skill}`,
        count,
        content:
          ex.kind === "journal" ? (
            <JournalSimulator key={ex.id} ex={ex} result={p.exercises[ex.id]} onCheck={onCheck} />
          ) : (
            <QuestionExercise key={ex.id} q={ex} result={p.exercises[ex.id]} onCheck={onCheck} />
          ),
      };
    } else {
      const t = it.trap;
      card = {
        icon: <ClipboardPen className="h-5 w-5" />,
        title: it.group.label,
        count,
        content: (
          <TrapQuiz
            key={t.id}
            trap={t}
            answered={p.traps[t.id]}
            onAnswer={(choice) => {
              updateTopic(slug, (q) => recordTrap(q, t.id, choice, choice === t.answer));
              cue(choice === t.answer ? "ok" : "bad");
            }}
          />
        ),
      };
    }
  } else {
    card = {
      icon: <Flag className="h-5 w-5" />,
      title: "סיכום",
      content: (
        <SummaryCard
          module={m}
          progress={p}
          next={next}
          onRestart={restart}
          onRetry={tryMissedAgain}
        />
      ),
    };
  }

  const clip = card.clip;

  // The opening already offers to resume or restart; the reminder is for an arrival that skipped it.
  const resumable = !opening && !moved && (p.step > 0 || p.sub > 0);

  // "Previous" and "next", named. Trying missed questions again, "next" goes to the next of them.
  const around = neighbours(m, place, opening);
  const nextLabel = retry?.length ? (retry.some((id) => practiceOf(m).findIndex((it) => practiceId(it) === id) + 1 > place.sub) ? "השאלה הבאה לחזרה" : "לסיכום") : around.next?.label;
  const where = opening ? "על השיעור" : id === "learn" ? `מושג ${place.sub + 1} מתוך ${m.screens.length}` : id === "practice" ? (card.count ?? "תרגול") : "סיכום";
  const outline = <CourseOutline course={course} current={m} progress={p} place={place} opening={opening} onGo={goTo} />;

  return (
    <MotionConfig reducedMotion="user">
      {/* Its own boundary: reading the address must not keep the lesson itself from prerendering. */}
      <Suspense fallback={null}>
        <AddressPlace module={m} onApply={arrived} />
      </Suspense>
      <LessonContext value={{ slug, jump }}>
        {/* On a phone: where you are in the course, and the way to all of it. */}
        <div className="no-print sticky top-16 z-30 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" className="flex w-full flex-col gap-1.5 px-4 py-2 text-start">
            <span className="flex w-full items-center gap-1.5 text-[13px]">
              <span className="num font-bold text-fg">
                שיעור {m.n} מתוך {course.lessons.length}
              </span>
              <span className="num min-w-0 truncate text-muted">· {where}</span>
              <span className="ms-auto inline-flex shrink-0 items-center gap-0.5 font-semibold text-accent">
                הקורס <ChevronDown className="h-4 w-4" aria-hidden />
              </span>
            </span>
            <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="התקדמות בשיעור" aria-valuemin={0} aria-valuemax={total} aria-valuenow={opening ? 0 : at}>
              <motion.span className="block h-full rounded-full bg-accent" initial={false} animate={{ width: `${((opening ? 0 : at) / total) * 100}%` }} />
            </span>
          </button>
        </div>

        {/* The whole width of the screen: the course at its right edge, the lesson spread across the rest. */}
        <div className="w-full px-4 pt-5 sm:px-6 lg:ps-4 lg:pe-8 lg:pt-6 2xl:pe-12">
          <div className="grid gap-6 lg:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-10">
            <aside className="no-print hidden lg:block" aria-label="הקורס">
              <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain pb-6 [scrollbar-width:thin]">{outline}</div>
            </aside>

            <div ref={top} className="min-w-0 scroll-mt-32 lg:scroll-mt-24" role="region" aria-label={`שיעור אינטראקטיבי: ${m.title}`}>
              <Breadcrumbs trail={[{ label: course.title, href: course.href }, { label: `שיעור ${m.n}: ${m.title}` }]} />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
                  {card.icon}
                </span>
                <h1 ref={heading} tabIndex={-1} className="min-w-0 flex-[1_1_16rem] text-2xl font-semibold tracking-tight text-fg outline-none sm:text-[28px]">
                  {card.title}
                </h1>
                {card.count && <span className="num shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-semibold text-muted">{card.count}</span>}
                {clip !== undefined && (
                  <button
                    type="button"
                    onClick={() => watch(clip.part, clip.at)}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#fbbf24] px-2.5 text-[13px] font-bold text-[#3b2600] transition hover:brightness-105"
                    title="הקטע בסרטון שמסביר את המושג הזה"
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden />
                    בסרטון ·{m.videos!.length > 1 && ` ${m.videos![clip.part].part ?? ""} ·`} <span className="num">{clock(clip.at)}</span>
                  </button>
                )}
                <div className="ms-auto">
                  <LessonStats streak={p.streak} xp={xpOf(m, p)} />
                </div>
              </div>

              {resumable && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft/60 px-4 py-2 text-[13px] text-fg">
                  <span className="flex-1">ממשיכים מאיפה שעצרתם.</span>
                  <button type="button" onClick={() => setMoved(true)} className="font-semibold text-accent hover:underline">
                    הבנתי
                  </button>
                  <button type="button" onClick={restart} className="font-semibold text-muted hover:text-fg hover:underline">
                    להתחיל מחדש
                  </button>
                </div>
              )}

              <div ref={body} className="card mt-4 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={opening ? "opening" : `${place.step}-${place.sub}`}
                    initial={{ opacity: 0, x: -28 * dir }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 28 * dir }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="p-4 sm:p-6"
                  >
                    {card.content}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* A direct child of the lesson's column, so it sticks to the bottom of the screen all the way down the screen. */}
              <LessonNav
                className="mt-6"
                prev={around.prev ? { label: around.prev.label, onClick: prevScreen } : undefined}
                next={(opening || !last) && nextLabel ? { label: nextLabel, onClick: nextScreen } : undefined}
              />
            </div>
          </div>
        </div>

        <Sheet open={sheet} title={m.course} onClose={() => setSheet(false)}>
          {outline}
        </Sheet>
      </LessonContext>
      {/* Over the whole page, not inside the moving card: a transformed ancestor would hold a fixed panel in place. */}
      {mounted &&
        m.videos?.[video.part] &&
        createPortal(
          <VideoDrawer
            item={playable(`${m.slug}-${video.part}`, m.videos[video.part])}
            startAt={video.at}
            open={video.open}
            onClose={() => setVideo((v) => ({ ...v, open: false }))}
            label={m.videos[video.part].part ? `סרטון השיעור · ${m.videos[video.part].part}` : "סרטון השיעור"}
            fullLesson={false}
          />,
          document.body,
        )}
    </MotionConfig>
  );
}
