"use client";

import { Check, Eye, ListChecks, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The worked solution, one step at a time: the student tries the step alone,
 * then opens it. Steps opened stay open; "show everything" is there for a
 * review. The steps' content is rendered on the server and handed in.
 */
export function SolutionSteps({ steps }: { steps: { title: string; body: ReactNode }[] }) {
  const [shown, setShown] = useState(0);
  const last = useRef<HTMLLIElement>(null);
  // Whether the reader has opened a step yet: only then does a step animate in and scroll into view.
  const [moved, setMoved] = useState(false);

  // The step just opened comes into view, under the sticky header.
  useEffect(() => {
    if (moved) last.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [shown, moved]);
  const open = (n: number) => {
    setMoved(true);
    setShown(n);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="num flex-1 text-sm text-muted">
          {shown === 0 ? "נסו לפתור לבד, ואז פתחו שלב אחר שלב." : `שלב ${shown} מתוך ${steps.length}`}
        </p>
        {shown < steps.length ? (
          <Button variant="ghost" size="sm" onClick={() => open(steps.length)}>
            <ListChecks className="h-3.5 w-3.5" aria-hidden /> הצג את כל הפתרון
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShown(0)}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> להסתיר שוב
          </Button>
        )}
      </div>
      <ol className="space-y-4" aria-label="שלבי הפתרון">
        {steps.map((s, i) =>
          i < shown ? (
            <motion.li
              key={i}
              ref={i === shown - 1 ? last : undefined}
              initial={moved ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="card scroll-mt-24 overflow-hidden"
            >
              <div className="flex items-center gap-2.5 border-b border-line px-4 py-3 sm:px-5">
                <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">{i + 1}</span>
                <h3 className="min-w-0 flex-1 text-[17px] font-semibold text-fg">{s.title}</h3>
                {i < shown - 1 && <Check className="h-4 w-4 text-success" aria-label="נפתח" />}
              </div>
              <div className="p-4 sm:p-5">{s.body}</div>
            </motion.li>
          ) : (
            <li key={i} className={cn("flex items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3.5", i > shown && "opacity-60")}>
              <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line-strong text-sm font-bold text-muted">{i + 1}</span>
              <span className="min-w-0 flex-1 font-medium text-fg">{s.title}</span>
              {i === shown && (
                <Button size="sm" onClick={() => open(i + 1)}>
                  <Eye className="h-3.5 w-3.5" aria-hidden /> {i === 0 ? "הראה את השלב הראשון" : "הראה את השלב הבא"}
                </Button>
              )}
            </li>
          ),
        )}
      </ol>
      {shown === steps.length && steps.length > 0 && (
        <p className="mt-5 flex items-center gap-2 font-semibold text-success">
          <Check className="h-5 w-5" aria-hidden /> זה כל הפתרון. נסו עכשיו לפתור שוב מההתחלה, בלי להציץ.
        </p>
      )}
    </div>
  );
}
