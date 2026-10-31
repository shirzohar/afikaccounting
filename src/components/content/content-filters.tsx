"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LEVELS } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const KINDS = [
  { value: "video", label: "סרטונים" },
  { value: "article", label: "מאמרים" },
];

/** Filters live in the URL, so every filtered view is linkable and server-rendered. */
export function ContentFilters({ standards, categories }: { standards: string[]; categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Debounce the search box.
  useEffect(() => {
    if ((params.get("q") ?? "") === q.trim()) return;
    const id = setTimeout(() => set("q", q.trim() || null), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = ["standard", "category", "level", "kind", "q"].some((k) => params.get(k));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 start-4 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש שיעורים, תקנים, נושאים…"
          aria-label="חיפוש תוכן"
          className="h-12 w-full rounded-2xl border border-line-strong bg-surface pe-11 ps-11 text-[15px] text-fg shadow-card outline-none placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
        {pending && <Loader2 className="absolute top-1/2 end-4 h-4 w-4 -translate-y-1/2 animate-spin text-subtle" />}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <ChipGroup label="תקן" options={standards.map((s) => ({ value: s, label: s }))} value={params.get("standard")} onChange={(v) => set("standard", v)} />
        <ChipGroup label="רמה" options={LEVELS} value={params.get("level")} onChange={(v) => set("level", v)} />
        <ChipGroup label="פורמט" options={KINDS} value={params.get("kind")} onChange={(v) => set("kind", v)} />
        <label className="flex items-center gap-2 text-xs text-muted">
          קטגוריה
          <select
            value={params.get("category") ?? ""}
            onChange={(e) => set("category", e.target.value || null)}
            className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs text-fg outline-none focus:border-accent"
          >
            <option value="">הכול</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {active && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
          >
            <X className="h-3.5 w-3.5" /> ניקוי סינון
          </button>
        )}
      </div>
    </div>
  );
}

/** Single-choice chips; choosing the chosen one again clears it. */
export function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="me-1 text-xs text-muted">{label}</span>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? null : o.value)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
              on ? "border-accent bg-accent text-accent-fg" : "border-line-strong bg-surface text-muted hover:border-accent/50 hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
