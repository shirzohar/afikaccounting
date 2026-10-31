"use client";

import { BookOpenText, ClipboardPen, Flag, Sparkles } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  clampPlace,
  markSeen,
  missedOf,
  move,
  type Place,
  position,
  practiceAt,
  practiceId,
  recordExercise,
  recordTrap,
  retryMissed,
  STEPS,
  subCount,
  xpOf,
} from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { BottomBar } from "./bottom-bar";
import { StudyHeader } from "./header";
import { JournalSimulator } from "./journal-simulator";
import { LessonOpening } from "./lesson-opening";
import { PracticeIntro } from "./practice-intro";
import { resetTopic, updateTopic, useTopic } from "./progress-store";
import { QuestionExercise } from "./question-exercise";
import { LessonContext } from "./screen-link";
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

/** A concept screen's content, rendered on the server: the one principle it teaches, and the rest. */
export type ScreenContent = { lead?: ReactNode; body: ReactNode };

/**
 * The lesson, full screen: a fixed header and bottom bar, and between them one
 * card whose body alone scrolls when it must. The place in the lesson lives in
 * the progress store, so a return or a refresh resumes it; the address follows
 * with ?step=, and ?screen=<id> or ?step=<n> on arrival opens that place. Keys: ← next, → previous (right to
 * left), Esc leaves — unless a control inside the card already used the key.
 */
export function StudyShell({ module: m, screens, next }: { module: StudyModule; screens: ScreenContent[]; next?: { href: string; label: string } }) {
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
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const first = useRef(true);

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

  // The page behind stays still while the lesson is open.
  useEffect(() => {
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = before;
    };
  }, []);

  // On every new screen: back to its top, and focus to its heading for screen readers (not on arrival).
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    if (first.current) first.current = false;
    else heading.current?.focus({ preventScroll: true });
  }, [place.step, place.sub, opening]);

  const keys = useRef<(e: KeyboardEvent) => void>(undefined);
  const forwarding = useRef(false);
  useEffect(() => {
    keys.current = (e) => {
      if (forwarding.current || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || document.querySelector("dialog[open]")) return;
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
  let card: { icon: ReactNode; title: string; count?: string; content: ReactNode };
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

  // The opening already offers to resume or restart; the reminder is for an arrival that skipped it.
  const resumable = !opening && !moved && (p.step > 0 || p.sub > 0);

  return (
    <MotionConfig reducedMotion="user">
      {/* Its own boundary: reading the address must not keep the lesson itself from prerendering. */}
      <Suspense fallback={null}>
        <AddressPlace module={m} onApply={arrived} />
      </Suspense>
      <LessonContext value={{ slug, jump }}>
        <div className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-canvas" aria-label={`שיעור אינטראקטיבי: ${m.title}`} role="region">
          <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-72 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
          <StudyHeader course={m.course} title={`שיעור ${m.n}: ${m.title}`} backHref={m.backHref} step={step} at={at} total={total} streak={p.streak} xp={xpOf(m, p)} />

          <div className="relative min-h-0 flex-1 px-3 py-3 sm:px-4 sm:py-5">
            <div className="card mx-auto flex h-full max-w-6xl flex-col overflow-hidden 2xl:max-w-7xl">
              <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 py-3 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
                  {card.icon}
                </span>
                <h1 ref={heading} tabIndex={-1} className="min-w-0 flex-1 truncate text-[17px] font-semibold text-fg outline-none sm:text-lg">
                  {card.title}
                </h1>
                {card.count && <span className="num shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-semibold text-muted">{card.count}</span>}
              </div>
              {resumable && (
                <div className="flex shrink-0 items-center gap-3 border-b border-line bg-accent-soft/60 px-4 py-2 text-[13px] text-fg sm:px-5">
                  <span className="flex-1">ממשיכים מאיפה שעצרתם.</span>
                  <button type="button" onClick={() => setMoved(true)} className="font-semibold text-accent hover:underline">
                    הבנתי
                  </button>
                  <button
                    type="button"
                    onClick={restart}
                    className="font-semibold text-muted hover:text-fg hover:underline"
                  >
                    להתחיל מחדש
                  </button>
                </div>
              )}
              <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={opening ? "opening" : `${place.step}-${place.sub}`}
                    initial={{ opacity: 0, x: -28 * dir }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 28 * dir }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="p-4 sm:p-5"
                  >
                    {card.content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <BottomBar step={step} first={opening} last={last && !opening} onPrev={prevScreen} onNext={nextScreen} onJump={(i) => i !== step && go({ step: i, sub: 0 }, i > step ? 1 : -1)} />
        </div>
      </LessonContext>
    </MotionConfig>
  );
}
