import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type ChapterLink, ChapterNav } from "@/components/basics/chapter-nav";
import { StatementsChapters } from "@/components/basics/statements";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GatedChapters } from "@/components/pricing/locked-chapters";

export const metadata: Metadata = {
  title: "הכנת דוחות כספיים והמסגרת המושגית (IFRS 18)",
  description:
    "ממאזן בוחן סופי לדוחות כספיים לפי IFRS 18: המסגרת המושגית והמאפיינים האיכותיים, הדוח על המצב הכספי, דוח רווח או הפסד בשלוש קטגוריות, סיווג הוצאות לפי מאפיין פעילות, רווח כולל אחר — ושאלה מלאה עם בונה דוחות.",
};

const CHAPTERS: ChapterLink[] = [
  { id: "fs-framework", title: "המסגרת המושגית" },
  { id: "fs-qualities", title: "מאפיינים איכותיים" },
  { id: "fs-concepts", title: "מושגי המסגרת" },
  { id: "fs-set", title: "מערכת דוחות שלמה" },
  { id: "fs-sofp", title: "הדוח על המצב הכספי" },
  { id: "fs-pl", title: "רווח או הפסד" },
  { id: "fs-function", title: "מאפיין פעילות" },
  { id: "fs-oci", title: "רווח כולל אחר" },
  { id: "fs-exam", title: "שאלה מלאה" },
  { id: "fs-practice", title: "תרגול" },
  { id: "fs-summary", title: "סיכום" },
];

/** The chapters past the free first one, as the paywall lists them in their places; the builder's anchor sits in the full question. */
const LOCKED = CHAPTERS.slice(1).map((c) => ({ ...c, anchors: c.id === "fs-exam" ? ["fs-builder"] : undefined }));

const ROADMAP: [string, string, string][] = [
  ["#fs-framework", "אני רוצה ללמוד מהיסוד", "המסגרת המושגית, ואז IFRS 18"],
  ["#fs-exam", "אני רוצה לפתור שאלה", "שגרת 7 צעדים על שאלה מלאה"],
  ["#fs-builder", "אני רוצה את בונה הדוחות", "משבצים יתרות — והדוחות נבנים"],
];

export default function StatementsPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <Breadcrumbs trail={[{ label: "שלב 2 · קורסים מתקדמים" }, { label: "הכנת דוחות כספיים (IFRS 18)" }]} />
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          הכנת דוחות כספיים <span className="text-gradient">והמסגרת המושגית</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          יש לכם מאזן בוחן סופי, אחרי התאמות. מכאן לומדים להפוך אותו לשני דוחות לפי הכללים: למה (המסגרת המושגית), איך הם בנויים (IFRS 18), ואיך כל יתרה מגיעה לשורה שלה
          — עד שאלת מבחן מלאה.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {ROADMAP.map(([href, title, hint]) => (
            <a key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-accent/60 hover:bg-accent-soft">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-fg">{title}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
              <ArrowLeft className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:-translate-x-1" aria-hidden />
            </a>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          מה צריך לדעת מראש: מאזן בוחן, מאזני מול תוצאתי ופקודות התאמה (
          <Link href="/basics" className="font-medium text-accent hover:underline">
            חשבונאות מאפס
          </Link>
          ), הפרשה להפסדי אשראי (
          <Link href="/study/basics-credit" className="font-medium text-accent hover:underline">
            הפסדי אשראי
          </Link>
          ), ופחת והערכה מחדש (
          <Link href="/basics/ias16" className="font-medium text-accent hover:underline">
            רכוש קבוע
          </Link>
          ).
        </p>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="contents lg:block lg:min-w-0">
            <ChapterNav chapters={CHAPTERS} />
          </aside>
          <div className="min-w-0 space-y-14">
            <StatementsChapters part="first" />
            <GatedChapters topic="statements" chapters={LOCKED} taste={{ href: "#fs-framework", label: "לפרק הראשון — בחינם" }}>
              <StatementsChapters part="rest" />
            </GatedChapters>
          </div>
        </div>
      </Container>
    </div>
  );
}
