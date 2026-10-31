"use client";

import { NotebookPen, X } from "lucide-react";
import { type ReactNode, useRef } from "react";

/**
 * A solution's journal entries kept a click away, on the step that explains
 * it rather than a step of their own: a button that opens them in a window
 * (Esc, the close button or a click outside closes it), like the T-cards button.
 */
export function EntriesDialog({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-[14px] font-bold text-accent-fg shadow-[0_6px_18px_-10px_var(--accent)] transition hover:opacity-90 active:scale-95"
      >
        <NotebookPen className="h-4 w-4" aria-hidden /> תראה לי את פקודות היומן
      </button>
      <dialog
        ref={dialog}
        aria-label="פקודות היומן"
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-[min(60rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/55"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-[16px] font-bold">פקודות היומן</p>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="סגירה" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4 text-start">{children}</div>
      </dialog>
    </>
  );
}
