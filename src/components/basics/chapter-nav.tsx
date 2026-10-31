"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { updateProgress, useProgress } from "./store";

export type ChapterLink = { id: string; title: string };

/**
 * The chapter list: a sticky sidebar on wide screens, a scrolling chip bar on
 * narrow ones, a reading-progress bar, and a mark on every chapter already seen.
 */
export function ChapterNav({ chapters }: { chapters: ChapterLink[] }) {
  const progress = useProgress();
  const [active, setActive] = useState(chapters[0].id);
  const [read, setRead] = useState(0);

  useEffect(() => {
    let current = "";
    // The current chapter is the last one whose top has passed the upper third of the screen.
    // Looked up on every scroll: chapters behind a boundary can stream in after the nav mounts.
    const onScroll = () => {
      const sections = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
      const line = window.innerHeight * 0.3;
      const hit = sections.filter((el) => el.getBoundingClientRect().top <= line).at(-1) ?? sections[0];
      const id = hit?.dataset.chapter;
      if (id && id !== current) {
        current = id;
        setActive(id);
        updateProgress((p) => (p.visited.includes(id) ? p : { ...p, visited: [...p.visited, id] }));
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setRead(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Keep the current chip in view on narrow screens. Only the chip bar scrolls: scrollIntoView
  // inside a sticky bar would also scroll the page back to the bar's original place.
  useEffect(() => {
    const bar = document.getElementById("chapter-chips");
    const chip = document.getElementById(`chip-${active}`);
    if (!bar || !chip || bar.offsetParent === null) return;
    const b = bar.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    bar.scrollBy({ left: c.left + c.width / 2 - (b.left + b.width / 2) });
  }, [active]);

  const visited = new Set(progress.visited);
  const link = (c: ChapterLink, i: number, chip: boolean) => (
    <a
      key={c.id}
      id={chip ? `chip-${c.id}` : undefined}
      href={`#${c.id}`}
      aria-current={active === c.id ? "true" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
        chip ? "shrink-0 whitespace-nowrap px-3 py-1.5" : "px-2.5 py-1.5",
        active === c.id ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <span
        className={cn(
          "num grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
          active === c.id ? "bg-accent-fg/20" : visited.has(c.id) ? "bg-success/15 text-success" : "bg-surface-2",
        )}
      >
        {visited.has(c.id) && active !== c.id ? <Check className="h-3 w-3" aria-label="נקרא" /> : i + 1}
      </span>
      <span className={cn(!chip && "truncate")}>{c.title}</span>
    </a>
  );

  return (
    <>
      <div className="no-print fixed inset-x-0 top-16 z-30 h-1 bg-transparent" aria-hidden>
        <div className="h-full bg-accent transition-[width]" style={{ width: `${read * 100}%` }} />
      </div>
      <nav aria-label="פרקים" className="no-print sticky top-16 z-20 -mx-4 min-w-0 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur lg:hidden">
        <div id="chapter-chips" className="flex gap-1 overflow-x-auto">{chapters.map((c, i) => link(c, i, true))}</div>
      </nav>
      <nav aria-label="פרקים" className="no-print sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto lg:block">
        <p className="mb-2 px-2.5 text-xs font-semibold text-subtle">
          פרקים · <span className="num">{visited.size}</span>/<span className="num">{chapters.length}</span> נקראו
        </p>
        <div className="space-y-0.5">{chapters.map((c, i) => link(c, i, false))}</div>
      </nav>
    </>
  );
}
