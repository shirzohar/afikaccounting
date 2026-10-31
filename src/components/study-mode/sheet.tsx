"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

/**
 * A panel that rises from the bottom of the screen, on the native <dialog>
 * (focus trap, Escape and backdrop come with it). For the phone's course list.
 */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none rounded-t-3xl border-t border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/45"
    >
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <span className="absolute top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-line-strong" aria-hidden />
        <p className="flex-1 pt-1 text-[16px] font-bold">{title}</p>
        <button type="button" onClick={onClose} aria-label="סגירה" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[calc(85dvh-4rem)] overflow-y-auto px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{open && children}</div>
    </dialog>
  );
}
