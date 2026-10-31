"use client";

import { Loader2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChipGroup } from "@/components/content/content-filters";

/** Course, subject and year — in the URL, like the content hub's filters, so a filtered view is linkable and rendered on the server. */
export function ExamFilters({ topics, subjects, years }: { topics: { value: string; label: string }[]; subjects: string[]; years: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const active = ["topic", "subject", "year"].some((k) => params.get(k));

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <ChipGroup label="קורס" options={topics} value={params.get("topic")} onChange={(v) => set("topic", v)} />
      {years.length > 1 && <ChipGroup label="שנה" options={years.map((y) => ({ value: String(y), label: String(y) }))} value={params.get("year")} onChange={(v) => set("year", v)} />}
      <label className="flex items-center gap-2 text-xs text-muted">
        נושא
        <select
          value={params.get("subject") ?? ""}
          onChange={(e) => set("subject", e.target.value || null)}
          className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs text-fg outline-none focus:border-accent"
        >
          <option value="">הכול</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {active && (
        <button type="button" onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))} className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <X className="h-3.5 w-3.5" /> ניקוי סינון
        </button>
      )}
      {pending && <Loader2 className="h-4 w-4 animate-spin text-subtle" aria-label="טוען" />}
    </div>
  );
}
