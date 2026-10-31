"use client";

import { BookOpen, Check, ChevronLeft, RotateCcw, X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { cn } from "@/lib/utils";

/**
 * The inventory lessons' ways of saying less at once: a story to start from,
 * details a click away, steps revealed one by one, items sorted into columns,
 * and a picker that answers "which pattern?".
 */

/** The example a screen opens with, framed so it reads as a story, not as data. */
export function Story({ icon, title, children, className }: { icon?: ReactNode; title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-2.5 rounded-2xl border-2 border-accent/30 bg-accent-soft/40 p-4", className)}>
      <p className="flex items-center gap-2 text-[16px] font-bold text-fg">
        {icon && <span className="shrink-0 text-accent [&>svg]:h-5 [&>svg]:w-5">{icon}</span>}
        {title}
      </p>
      <div className="space-y-2 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

/** What is not needed to get the principle — a full table, an exception — behind a button, in a window (Esc or a click outside closes it). */
export function MoreDialog({ label, title, children }: { label: string; title?: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-[14px] font-semibold text-accent ring-1 ring-accent/40 transition hover:bg-accent-soft"
      >
        <BookOpen className="h-4 w-4 shrink-0" aria-hidden /> {label}
      </button>
      <dialog
        ref={dialog}
        aria-label={title ?? label}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-[min(60rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/55"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-[16px] font-bold">{title ?? label}</p>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="סגירה" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4 text-start text-[15px] leading-relaxed">{children}</div>
      </dialog>
    </>
  );
}

/** A worked solution, one step at a time: the steps so far stay, and "the next step" adds one. No arrow keys — the lesson keeps them. */
export function Reveal({ steps, label = "הצעד הבא" }: { steps: ReactNode[]; label?: string }) {
  const [shown, setShown] = useState(1);
  const done = shown >= steps.length;
  return (
    <div className="space-y-2">
      <ol className="space-y-1.5" aria-live="polite">
        {steps.slice(0, shown).map((x, i) => (
          <li key={i} className="anim-step-in flex items-start gap-2 rounded-lg bg-accent-soft px-3 py-2 text-[14.5px] text-fg">
            <span className="num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">{i + 1}</span>
            <span className="min-w-0">{x}</span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => setShown(done ? 1 : shown + 1)}
        className="inline-flex h-9 items-center gap-1 rounded-lg bg-surface px-3 text-sm font-semibold text-accent ring-1 ring-accent/40 hover:bg-accent-soft"
      >
        {done ? (
          <>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> מההתחלה
          </>
        ) : (
          <>
            {label}{" "}
            <span className="num text-muted">
              ({shown + 1}/{steps.length})
            </span>{" "}
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
    </div>
  );
}

const TONES = {
  good: { box: "border-success/40 bg-success/5", head: "text-success", chip: "bg-surface ring-success/30" },
  bad: { box: "border-danger/40 bg-danger/5", head: "text-danger", chip: "bg-surface ring-danger/30" },
  neutral: { box: "border-accent/40 bg-accent-soft/40", head: "text-accent", chip: "bg-surface ring-accent/30" },
};

/** Items sorted into a few columns, one short line each: the sorting is the lesson, so it is all there is. */
export function Sorted({ columns }: { columns: { title: string; tone: keyof typeof TONES; items: ReactNode[] }[] }) {
  return (
    <div className={cn("grid gap-3", columns.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2")}>
      {columns.map((c) => (
        <section key={c.title} className={cn("rounded-2xl border-2 p-3", TONES[c.tone].box)}>
          <p className={cn("mb-2 flex items-center gap-1.5 text-[15px] font-bold", TONES[c.tone].head)}>
            {c.tone === "good" ? <Check className="h-4 w-4" aria-hidden /> : c.tone === "bad" ? <X className="h-4 w-4" aria-hidden /> : null}
            {c.title}
          </p>
          <ul className="space-y-1.5">
            {c.items.map((x, i) => (
              <li key={i} className={cn("rounded-lg px-3 py-1.5 text-[14px] text-fg ring-1", TONES[c.tone].chip)}>
                {x}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** A routine as numbered chips joined by arrows — the whole road at a glance. */
export function ChainChips({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {items.map((x, i) => (
        <li key={x} className="flex items-center gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[13.5px] font-medium text-fg ring-1 ring-line-strong">
            <span className="num grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">{i + 1}</span>
            {x}
          </span>
          {i < items.length - 1 && <ChevronLeft className="h-4 w-4 text-subtle" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

/** "What is missing in your question?": a button per unknown; the answer is the pattern to use and the screen that teaches it. */
export function PatternPicker({ items }: { items: { missing: string; given: string; pattern: number; screen: string }[] }) {
  const [at, setAt] = useState<number | null>(null);
  const hit = at === null ? null : items[at];
  return (
    <div className="space-y-3">
      <p className="text-[15px] font-semibold text-fg">מה חסר בשאלה שלכם?</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="מה חסר בשאלה">
        {items.map((x, i) => (
          <button
            key={x.missing + x.given}
            type="button"
            role="radio"
            aria-checked={at === i}
            onClick={() => setAt(i)}
            className={cn(
              "rounded-xl px-3 py-2 text-start text-[14px] ring-1 transition",
              at === i ? "bg-accent font-semibold text-accent-fg ring-accent" : "bg-surface text-fg ring-line-strong hover:ring-accent/60",
            )}
          >
            {x.missing}
            <span className={cn("block text-[12.5px]", at === i ? "text-accent-fg/85" : "text-muted")}>{x.given}</span>
          </button>
        ))}
      </div>
      {hit ? (
        <p className="anim-step-in rounded-xl border-2 border-accent bg-surface px-4 py-3 text-[15px] text-fg">
          <strong className="text-accent">תבנית {hit.pattern}.</strong> לומדים אותה במסך <ScreenLink id={hit.screen} />.
        </p>
      ) : (
        <p className="text-[13.5px] text-muted">בחרו — ותקבלו את התבנית, ואת המסך שמלמד אותה.</p>
      )}
    </div>
  );
}
