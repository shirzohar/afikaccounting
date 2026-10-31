import { ArrowLeft, BookOpenCheck, Crown, FileSearch, ListOrdered } from "lucide-react";
import type { Metadata } from "next";
import { ExamsTeaser } from "@/components/pricing/exams-teaser";
import { TierBadge } from "@/components/pricing/tier-badge";
import { WaitlistForm } from "@/components/pricing/waitlist-form";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Container } from "@/components/ui/primitives";
import { EXAMS_HUB, FIRST_LESSON } from "@/lib/catalog";

export const metadata: Metadata = {
  title: EXAMS_HUB.label,
  description: "בקרוב: פתרונות מלאים מאפס לתרגילים ברמת מבחן, וארכיון מבחנים עם פתרונות — באותה שיטה של הקורסים. הירשמו לעדכון.",
};

const WHAT = [
  { icon: ListOrdered, title: "פתרון מלא מאפס", body: "כל תרגיל נפתר מההתחלה: רישום הנתונים, הסדר שבו פותרים, וההסבר לכל מספר — לא רק התשובה." },
  { icon: FileSearch, title: "תרגילים ברמת מבחן", body: "שאלות שמשלבות כמה נושאים יחד, כמו במבחן אמיתי — מלאי, רכוש קבוע, התאמות ודוחות." },
  { icon: BookOpenCheck, title: "ארכיון מבחנים", body: "מבחנים שלמים עם פתרונות לכל סעיף, לתרגול בתנאי אמת לפני המבחן שלכם." },
];

/** The exams area, before it opens: what it will hold, and a sign-up for the day it does. */
export default function ExamsPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <div className="flex flex-wrap items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" aria-hidden />
          <TierBadge tier="exams" />
          <Badge tone="warning">בקרוב</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          {EXAMS_HUB.label} — <span className="text-gradient">מתרגלים כמו במבחן</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          המקום לשלב שאחרי הקורסים: תרגילים ברמת מבחן עם פתרון מלא מאפס, וארכיון מבחנים עם פתרונות. אנחנו בונים אותו עכשיו — הירשמו, ונודיע לכם ברגע שהוא נפתח.
        </p>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <ExamsTeaser />
          <section aria-labelledby="notify" className="card p-5 sm:p-6">
            <h2 id="notify" className="text-lg font-semibold text-fg">
              עדכנו אותי כשנפתח
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted">רק הודעה אחת, ביום שהמתחם נפתח.</p>
            <WaitlistForm topic="exams" />
          </section>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          {WHAT.map((w) => (
            <li key={w.title} className="card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-300" aria-hidden>
                <w.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-semibold text-fg">{w.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{w.body}</p>
            </li>
          ))}
        </ul>

        <div className="glass mt-12 flex flex-col items-start gap-5 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-fg">בינתיים — הבסיס למבחן כבר כאן</p>
            <p className="mt-1 text-sm text-muted">חשבונאות מאפס פתוחה בחינם, וממנה ממשיכים לקורסים המתקדמים.</p>
          </div>
          <ButtonLink href={FIRST_LESSON} size="lg">
            התחילו את שיעור 1 <ArrowLeft className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
