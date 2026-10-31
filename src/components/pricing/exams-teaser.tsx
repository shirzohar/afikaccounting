import { ArrowLeft, Crown, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { EXAMS_HUB } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { TierBadge } from "./tier-badge";

/** What the exams area will hold, for the blurred preview. Kinds of items, not real exams. */
const SAMPLE = [
  ["תרגיל ברמת מבחן", "מלאי — FIFO, ממוצע ושווי מימוש נטו בשאלה אחת"],
  ["פתרון מלא מאפס", "רכוש קבוע — שיפוץ, ואחריו הערכה מחדש"],
  ["תרגיל ברמת מבחן", "ממאזן בוחן לדוחות כספיים, עם התאמות"],
  ["ארכיון מבחנים", "מבחן שלם, עם פתרון מלא לכל סעיף"],
];

/**
 * The exams area, not open yet: what it will hold, blurred, with a "soon"
 * tag and the way to its page. `bare` leaves out the title and the lead, for
 * a page section that has its own (a course page's, like its reference section).
 */
export function ExamsTeaser({ className, bare = false }: { className?: string; bare?: boolean }) {
  return (
    <div className={cn("card relative overflow-hidden p-5 sm:p-6", className)}>
      {!bare && <ExamsTitle />}
      <ul className={cn("grid gap-2 select-none sm:grid-cols-2", !bare && "mt-4")} aria-hidden>
        {SAMPLE.map(([kind, title]) => (
          <li key={title} className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3.5 py-3 blur-[3px]">
            <FileCheck2 className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-muted">{kind}</span>
              <span className="block truncate text-sm font-medium text-fg">{title}</span>
            </span>
          </li>
        ))}
      </ul>
      <Link href={EXAMS_HUB.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
        מה יהיה במתחם, והרשמה לעדכון <ArrowLeft className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

export const EXAMS_LEAD = "פתרונות מלאים מאפס לתרגילים ברמת מבחן, וארכיון מבחנים עם פתרונות — באותה שיטה של הקורסים: שלב אחר שלב, עם ההסבר לכל מספר.";

function ExamsTitle() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-300" aria-hidden>
          <Crown className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-semibold text-fg">{EXAMS_HUB.label}</h3>
        <TierBadge tier="exams" />
        <Badge tone="warning">בקרוב</Badge>
      </div>
      <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted">{EXAMS_LEAD}</p>
    </>
  );
}

/** A course page's exams section, under its reference section and in the same form: a heading with its icon, a lead, and the card. */
export function ExamsSection() {
  return (
    <section id="exams" aria-labelledby="exams-title" className="mt-14 scroll-mt-24">
      <h2 id="exams-title" className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
        <Crown className="h-6 w-6 text-amber-500" aria-hidden /> {EXAMS_HUB.label}
        <Badge tone="warning">בקרוב</Badge>
      </h2>
      <p className="mt-1 text-[15px] text-muted">{EXAMS_LEAD}</p>
      <div className="mt-4">
        <ExamsTeaser bare />
      </div>
    </section>
  );
}
