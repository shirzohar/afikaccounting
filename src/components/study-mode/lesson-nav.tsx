"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = { label: string; onClick: () => void };

/**
 * "Previous" and "next" at the foot of the lesson, each naming where it goes —
 * a concept, the move into practice, a question, the summary. It stays in view
 * at the bottom of the screen. Right to left: previous sits on the right.
 */
export function LessonNav({ prev, next, className }: { prev?: Step; next?: Step; className?: string }) {
  return (
    <nav aria-label="מעבר בשיעור" className={cn(className, "no-print sticky bottom-0 z-20 -mx-4 border-t border-line bg-canvas/90 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:bottom-3 sm:mx-0 sm:rounded-2xl sm:border sm:bg-surface/95 sm:px-3 sm:pb-2.5 sm:shadow-card")}>
      <div className="flex items-stretch gap-2">
        {prev ? (
          <button type="button" onClick={prev.onClick} className="flex max-w-[45%] min-w-0 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 py-2 text-start transition-colors hover:bg-surface-2">
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[11.5px] text-muted">הקודם</span>
              <span className="block truncate text-[13.5px] font-semibold text-fg">{prev.label}</span>
            </span>
          </button>
        ) : (
          <span className="flex-1" />
        )}
        <span className="hidden flex-1 items-center justify-center text-[12px] text-subtle lg:flex">מקלדת: ← הבא · → הקודם</span>
        {next && (
          <button
            type="button"
            onClick={next.onClick}
            className={cn("ms-auto flex min-w-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-end text-accent-fg shadow-[0_8px_24px_-10px_var(--accent)] transition hover:brightness-110", prev ? "max-w-[55%] flex-1 sm:flex-none" : "flex-1 sm:flex-none")}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] opacity-85">הבא</span>
              <span className="block truncate text-[14px] font-bold">{next.label}</span>
            </span>
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        )}
      </div>
    </nav>
  );
}
