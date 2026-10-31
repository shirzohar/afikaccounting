"use client";

import { ArrowLeft, CornerDownLeft, Lock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLast } from "@/components/study-mode/progress-store";
import { search, SEARCH_KINDS, type SearchItem } from "@/lib/search";
import { studyHref } from "@/lib/study";
import { cn } from "@/lib/utils";

const OPEN = "afik-open-search";
/** Open the quick search from anywhere (the header, the phone's bottom bar). */
export const openSearch = () => window.dispatchEvent(new Event(OPEN));

// Fetched once per visit, when the search first opens.
let index: Promise<SearchItem[]> | null = null;
const load = () => (index ??= fetch("/api/search").then((r) => (r.ok ? r.json() : [])).catch(() => ((index = null), [])));

/** The header's way in: a search field on a wide screen, an icon on a phone. */
export function SearchTrigger() {
  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="hidden h-9 w-52 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-[13px] text-subtle transition-colors hover:border-accent/50 hover:text-muted lg:flex"
      >
        <Search className="h-4 w-4" aria-hidden />
        חיפוש בכל האתר…
        <kbd dir="ltr" className="ms-auto rounded border border-line-strong px-1.5 font-sans text-[11px]">
          Ctrl K
        </kbd>
      </button>
      <button type="button" onClick={openSearch} aria-label="חיפוש" className="hidden h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg md:grid lg:hidden">
        <Search className="h-[18px] w-[18px]" />
      </button>
    </>
  );
}

/**
 * The quick search: Ctrl+K (⌘K, or "/") from anywhere. Courses, lessons, a
 * concept inside a lesson (opened right on its screen), calculators, exams,
 * videos and articles; arrows to choose, Enter to go. With nothing typed yet,
 * it offers the lesson to continue and the courses.
 */
export function SearchPalette() {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [active, setActive] = useState(0);
  const last = useLast();

  useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(OPEN, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      void load().then(setItems);
      input.current?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const results = useMemo<SearchItem[]>(() => {
    if (q.trim()) return search(items, q);
    const courses = items.filter((i) => i.kind === "course");
    return last ? [{ kind: "lesson", title: `להמשיך: ${last.title}`, hint: `${last.course} · שיעור ${last.n} · ${last.percent}%`, href: studyHref(last.slug) }, ...courses] : courses;
  }, [q, items, last]);

  const close = () => {
    setOpen(false);
    setQ("");
    setActive(0);
  };
  const go = (item?: SearchItem) => {
    if (!item) return;
    close();
    router.push(item.href);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = results.length;
      if (!n) return;
      const next = (active + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      setActive(next);
      document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(e) => e.target === ref.current && close()}
      aria-label="חיפוש מהיר"
      className="fixed inset-x-0 top-[8vh] mx-auto mt-0 w-[min(40rem,calc(100%-1.5rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="חפשו מושג, שיעור, מחשבון או מבחן…"
          aria-label="מה לחפש"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
          className="h-14 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-subtle"
        />
        <kbd className="rounded border border-line-strong px-1.5 font-sans text-[11px] text-muted">Esc</kbd>
      </div>
      <ul id={listId} role="listbox" aria-label="תוצאות" className="max-h-[60vh] overflow-y-auto p-2">
        {results.map((r, i) => {
          // A heading wherever the kind changes (with nothing typed: "continue", then the courses).
          const heading = i === 0 || r.kind !== results[i - 1].kind ? r.kind : undefined;
          return (
            <li key={`${r.href}-${i}`} role="presentation">
              {heading && <p className="px-3 pt-2 pb-1 text-[11.5px] font-semibold text-muted">{q.trim() ? SEARCH_KINDS.find((k) => k.kind === heading)?.label : i === 0 && last ? "להמשיך" : "קורסים"}</p>}
              <button
                type="button"
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => go(r)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start", i === active ? "bg-accent-soft" : "hover:bg-surface-2")}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold text-fg">{r.title}</span>
                  <span className="block truncate text-[12px] text-muted">{r.hint}</span>
                </span>
                {r.tier && (
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", r.tier === "exams" ? "bg-amber-400/15 text-amber-700 dark:text-amber-300" : "bg-accent-soft text-accent")}>
                    <Lock className="h-3 w-3" aria-hidden /> {r.tier === "exams" ? "קורסים + מבחנים" : "קורסים"}
                  </span>
                )}
                {i === active ? <CornerDownLeft className="h-4 w-4 shrink-0 text-muted" aria-hidden /> : <ArrowLeft className="h-4 w-4 shrink-0 text-subtle" aria-hidden />}
              </button>
            </li>
          );
        })}
        {q.trim() && !results.length && <li className="px-3 py-6 text-center text-sm text-muted">{items.length ? `לא מצאנו את ״${q}״. נסו מילה אחרת.` : "טוען…"}</li>}
      </ul>
      <p className="hidden border-t border-line px-4 py-2 text-[12px] text-muted sm:block">↑↓ לבחירה · Enter לפתיחה · מושג מתוך שיעור נפתח בדיוק במסך שלו</p>
    </dialog>
  );
}
