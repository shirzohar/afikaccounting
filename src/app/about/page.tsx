import { ArrowLeft, BookOpenText, ClipboardPen, Gift, Route } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { FIRST_LESSON } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "אודות", description: site.description };

const PILLARS = [
  {
    icon: BookOpenText,
    title: "רעיון אחד בכל פעם",
    body: "כל מסך מלמד מושג אחד, עם דוגמה חיה שאפשר לשחק בה. לא עוברים הלאה לפני שהבסיס יושב.",
  },
  {
    icon: ClipboardPen,
    title: "תרגול שמסביר את הטעות",
    body: "משוב מיידי על כל תשובה — ועל כל תשובה שגויה, למה היא מפתה. ככה לומדים לזהות את המלכודות לפני המבחן.",
  },
  {
    icon: Route,
    title: "תמיד יודעים איפה אתם",
    body: "מסלול לכל קורס, XP על כל שיעור ושאלות שכדאי לתרגל שוב. ההתקדמות נשמרת בדפדפן, וממשיכים בדיוק מאיפה שעצרתם.",
  },
  {
    icon: Gift,
    title: "הבסיס פתוח לכולם",
    body: "חשבונאות מאפס — כל הקורס — בחינם. הקורסים המתקדמים ומתחם המבחנים במנוי, והשיעור הראשון בכל אחד מהם פתוח.",
  },
];

export default function AboutPage() {
  return (
    <Container className="pt-12 sm:pt-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold text-accent">אודות {site.name}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          חשבונאות שלומדים <span className="text-gradient">צעד אחר צעד</span>, עד המבחן.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-muted">
          {site.name} נבנתה לסטודנטים: מי שפוגש חובה וזכות בפעם הראשונה, ומי שמתכונן למבחן במלאי, ברכוש קבוע או בדוחות כספיים. במקום הרצאה ארוכה — שיעורים קצרים, תרגול עם משוב
          מיידי, וכלים שמראים את כל הדרך עד המספר.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.title} className="card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
              <p.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-semibold text-fg">{p.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="glass mt-14 flex flex-col items-start gap-5 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-fg">הדרך הכי טובה להבין — לנסות</p>
          <p className="mt-1 text-sm text-muted">שיעור 1 פתוח עכשיו, בלי הרשמה.</p>
        </div>
        <ButtonLink href={FIRST_LESSON} size="lg">
          התחילו את שיעור 1 <ArrowLeft className="h-4 w-4" />
        </ButtonLink>
      </div>
    </Container>
  );
}
