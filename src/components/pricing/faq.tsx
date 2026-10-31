import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Questions and answers that fold open, one by one (native <details>, so they work without script). */
export function Faq({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line rounded-2xl border border-line bg-surface", className)}>
      {items.map((x) => (
        <details key={x.q} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15.5px] font-semibold text-fg [&::-webkit-details-marker]:hidden">
            {x.q}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="pb-4 text-[14.5px] leading-relaxed text-muted">{x.a}</p>
        </details>
      ))}
    </div>
  );
}
