import { Library } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { InventoryReference } from "@/components/basics/inventory-exam";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ExamsSection } from "@/components/pricing/exams-teaser";
import { GatedCoursePath } from "@/components/pricing/gated-course";
import { LegacyHashRedirect } from "@/components/study-mode/course";
import { Container } from "@/components/ui/primitives";
import { INVENTORY_LEGACY_CHAPTERS, INVENTORY_LESSONS, inventoryLegacyHref } from "@/lib/study/inventory";

export const metadata: Metadata = {
  title: "מלאי (IAS 2) — קורס אינטראקטיבי ומחשבון",
  description:
    "מלאי מהרעיון ועד רמת מבחן, שיעור אחר שיעור: רישום תקופתי ותמידי, עלות לפי IAS 2, FIFO וממוצע משוקלל תקופתי ונע, שווי מימוש נטו, חילוץ נעלמים ושאלה מלאה — עם תרגול בכל שיעור ומחשבון שמראה את כל הדרך.",
};

// The former long page's chapter anchors, and where each lands now.
const REDIRECTS = Object.fromEntries(INVENTORY_LEGACY_CHAPTERS.map((id) => [id, inventoryLegacyHref(id) ?? ""]));

/**
 * The inventory course: six interactive lessons, each with its concept
 * screens and a practice section by kind of question; progress on top, and
 * the course's reference (summary sheet, traps, true or false, practice
 * questions) at the bottom.
 */
export default function InventoryPage() {
  return (
    <div className="relative">
      <LegacyHashRedirect redirects={REDIRECTS} />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <Breadcrumbs trail={[{ label: "שלב 1 · יסודות" }, { label: "מלאי (IAS 2)" }]} />
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          מלאי <span className="text-gradient">מאפס ועד מבחן</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          <span className="num">{INVENTORY_LESSONS.length}</span> שיעורים אינטראקטיביים, צעד אחר צעד. בכל שיעור: מושגים עם דוגמאות חיות, ואחריהם תרגול עם משוב מיידי — פקודות
          יומן, שאלות אמריקאיות ושאלות חישוב. ובסוף, מחשבון שמראה את כל הדרך.
        </p>
        <p className="mt-2 text-sm text-muted">
          מה צריך לדעת מראש: פקודת יומן בסיסית — חובה וזכות.{" "}
          <Link href="/basics" className="font-medium text-accent hover:underline">
            לחשבונאות מאפס
          </Link>
        </p>

        <div className="mt-6">
          <GatedCoursePath lessons={INVENTORY_LESSONS} />
        </div>

        <section id="reference" aria-labelledby="reference-title" className="mt-14 scroll-mt-24">
          <h2 id="reference-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
            <Library className="h-6 w-6 text-accent" aria-hidden /> כלי עזר
          </h2>
          <p className="mt-1 text-[15px] text-muted">כל מה שצריך לחזרה, במקום אחד: דף סיכום להדפסה, ארגז המלכודות, בנק נכון / לא נכון, ושאלות ברמת בחינה לתרגול עצמי.</p>
          <div className="mt-4">
            <InventoryReference />
          </div>
        </section>

        <ExamsSection topic="inventory" />
      </Container>
    </div>
  );
}
