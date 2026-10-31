import { ArrowLeft, ArrowRight, Calculator } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { screenHref } from "@/lib/study/basics";
import type { ReactNode } from "react";
import { type ChapterLink, ChapterNav } from "@/components/basics/chapter-nav";
import { ExchangeCalculator } from "@/components/exchange/calculator";
import { ExchangeJournalSection } from "@/components/exchange/journal";
import { NewAssetSection } from "@/components/exchange/new-asset";
import { ExchangeStepsSection } from "@/components/exchange/steps";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GatedChapters } from "@/components/pricing/locked-chapters";
import { ExamTipsSection } from "@/components/learn/exam-tips";
import { FundamentalsSection } from "@/components/learn/fundamentals";
import { MethodologySection } from "@/components/learn/methodology";
import { DepreciationSimulator } from "@/components/learn/simulator";
import { WhatIsPpeSection } from "@/components/learn/what-is-ppe";
import { RenovationCalculator } from "@/components/renovation/calculator";
import { DistinctionSection } from "@/components/renovation/distinction";
import { RenovationExamplesSection } from "@/components/renovation/examples";
import { RenovationStepsSection } from "@/components/renovation/steps";
import { RenovationTipsSection } from "@/components/renovation/tips";
import { RevaluationCalculator } from "@/components/revaluation/calculator";
import { CheckTipsSection } from "@/components/revaluation/check-tips";
import { RevaluationExamplesSection } from "@/components/revaluation/examples";
import { RevaluationStandardSection } from "@/components/revaluation/standard";
import { YearlyRevaluationSection } from "@/components/revaluation/yearly";
import { LandBuildingSection } from "@/components/revaluation/land-building";
import { RevaluationStepsSection } from "@/components/revaluation/steps";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "תקן IAS 16 רכוש קבוע מהקל לקשה",
  description:
    "כל IAS 16 בדף אחד, מהבסיס ועד שאלת מבחן: מהו רכוש קבוע, מושגי יסוד, שיטות הפחת, תשעה שלבים לפתרון שאלה, שיפוצים, החלפת נכסים, מודל הערכה מחדש וטיפים למבחן — עם מחשבון לכל סוגיה.",
};

type Sub = { id: string; label: string; content: ReactNode };
type Topic = { id: string; label: string; title: string; lead: string; subs?: Sub[]; content?: ReactNode };
type Part = { id: string; n: number; title: string; lead: string; topics: Topic[] };

/**
 * One page for the whole standard, read top to bottom: what an item of PPE
 * is, the concepts, then the issues from the simplest to the most involved.
 * Every block of the former IAS 16 pages is here, in that order.
 */
const PARTS: Part[] = [
  {
    id: "basics-part",
    n: 1,
    title: "מהבסיס",
    lead: "מה זה רכוש קבוע, ומה הופך פריט לכזה — לפני כל מספר.",
    topics: [{ id: "what", label: "מהו רכוש קבוע", title: "מהו רכוש קבוע לפי התקן", lead: "ההגדרה, שלושת התנאים, ומתי רושמים את הפריט בספרים.", content: <WhatIsPpeSection /> }],
  },
  {
    id: "concepts-part",
    n: 2,
    title: "מושגי יסוד",
    lead: "המילים שחוזרות בכל שאלה, בשפה פשוטה ובסדר שבו הן נבנות זו על זו.",
    topics: [
      {
        id: "concepts",
        label: "מושגי יסוד",
        title: "עלות, פחת, יתרה בספרים — ואיך הם מתחברים",
        lead: "שישה מושגים, ציר אחד שמחבר ביניהם, וגישת הרכיבים על מטוס נוסעים.",
        content: <FundamentalsSection />,
      },
    ],
  },
  {
    id: "issues-part",
    n: 3,
    title: "הסוגיות — מהפשוט למורכב",
    lead: "קודם הפחת עצמו, אחר כך שאלה מלאה מתחילתה, ומשם לאירועים שקורים לנכס בדרך: שיפוץ, החלפה והערכה מחדש.",
    topics: [
      {
        id: "depreciation",
        label: "שיטות הפחת",
        title: "שיטות הפחת — סימולטור",
        lead: "ארבע שיטות על אותם נתונים, עם לוח נוסחאות צמוד: מזיזים נתון ורואים מה משתנה.",
        content: <DepreciationSimulator />,
      },
      {
        id: "method",
        label: "שאלה מלאה",
        title: "שאלה מלאה — תשעה שלבים לפתרון",
        lead: "כל שאלה על רכוש קבוע נפתרת באותם שלבים ובאותו סדר, מרישום הנתונים ועד נדרשי השאלה — על שאלה אחת מלאה.",
        content: <MethodologySection />,
      },
      {
        id: "renovation",
        label: "שיפוצים",
        title: "שיפוצים ואירועים עוקבים",
        lead: "מתי שיפוץ נכנס לנכס ומתי הוא הוצאה, חמישה שלבים קבועים לפתרון, דוגמאות מלאות בכל שיטות הפחת — ומחשבון שמראה את הפחת לפני השיפוץ ואחריו, שנה אחרי שנה.",
        subs: [
          { id: "renovation-distinction", label: "נכנס לנכס או הוצאה", content: <DistinctionSection /> },
          { id: "renovation-steps", label: "שלבי הפתרון", content: <RenovationStepsSection /> },
          { id: "renovation-examples", label: "דוגמאות לפי שיטות", content: <RenovationExamplesSection /> },
          { id: "renovation-calculator", label: "מחשבון שיפוץ", content: <RenovationCalculator /> },
          { id: "renovation-tips", label: "דגשים למבחן", content: <RenovationTipsSection /> },
        ],
      },
      {
        id: "exchange",
        label: "החלפת נכסים",
        title: "החלפת נכסים צעד אחר צעד",
        lead: "שלושה שלבים קבועים לכל שאלת החלפה: תאריך ההחלפה, עדכון הפחת עד אליו, וסיווג העסקה — יש או אין מהות מסחרית. ואחר כך: פקודות היומן, פחת הנכס החדש עד סוף השנה, ומחשבון שפותר כל תרחיש.",
        subs: [
          { id: "exchange-steps", label: "שלבי הפתרון", content: <ExchangeStepsSection /> },
          { id: "exchange-entries", label: "פקודות יומן", content: <ExchangeJournalSection /> },
          { id: "exchange-new-asset", label: "המשך השנה", content: <NewAssetSection /> },
          { id: "exchange-calculator", label: "מחשבון החלפה", content: <ExchangeCalculator /> },
        ],
      },
      {
        id: "revaluation",
        label: "הערכה מחדש",
        title: "מודל הערכה מחדש",
        lead: "פחת עד יום ההערכה, פער לשווי ההוגן, וסיווג — קרן הערכה מחדש או רווח והפסד. ואחר כך: קרקע מול מבנה, העברה לעודפים, דוגמאות בכל שיטות הפחת, טיפ בדיקה שתופס כמעט כל טעות — ומחשבון.",
        subs: [
          { id: "revaluation-standard", label: "מה התקן אומר", content: <RevaluationStandardSection /> },
          { id: "revaluation-steps", label: "דרכים לפתור שאלה", content: <RevaluationStepsSection /> },
          { id: "revaluation-land-building", label: "קרקע מול מבנה", content: <LandBuildingSection /> },
          { id: "revaluation-examples", label: "דוגמאות לפי שיטות", content: <RevaluationExamplesSection /> },
          { id: "revaluation-yearly", label: "דוגמה 4: הערכה בכל שנה", content: <YearlyRevaluationSection /> },
          { id: "revaluation-check", label: "בדיקה ודגשים", content: <CheckTipsSection /> },
          { id: "revaluation-calculator", label: "מחשבון הערכה מחדש", content: <RevaluationCalculator /> },
        ],
      },
      { id: "exam", label: "טיפים למבחן", title: "טיפים למבחן", lead: "הטעויות שעולות הכי הרבה נקודות, וצ׳ק-ליסט שמוודא שלא פספסתם כלום.", content: <ExamTipsSection /> },
    ],
  },
];

/** The sidebar's chapters: every topic, straight through the page, then the full calculator. */
const CHAPTERS: ChapterLink[] = [...PARTS.flatMap((p) => p.topics.map((t) => ({ id: t.id, title: t.label }))), { id: "full-calculator", title: "המחשבון המלא" }];
const NUM = new Map(PARTS.flatMap((p) => p.topics).map((t, i) => [t.id, i + 1]));
/** The tabs of the former page, so their old links still land on the right topic. */
const ALIASES: Record<string, string> = { depreciation: "simulator", concepts: "basics" };

/** The chapters past the free first part, as the paywall lists them in their places. */
const LOCKED = PARTS.slice(1).flatMap((p) =>
  p.topics.map((t) => ({ id: t.id, title: t.title, lead: t.lead, anchors: [...(t.subs?.map((x) => x.id) ?? []), ...(ALIASES[t.id] ? [ALIASES[t.id]] : [])] })),
);

const ROADMAP: [string, string, string][] = [
  ["#what", "אני רוצה ללמוד מהיסוד", "מהו רכוש קבוע, ואז מושגי היסוד"],
  ["#method", "אני רוצה לפתור שאלת מבחן", "תשעה שלבים על שאלה אחת מלאה"],
  ["#full-calculator", "אני רוצה מחשבון", "שאלה שלמה, עם כל הדרך"],
];

export default function Ias16Page() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <Link href="/basics" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          <ArrowRight className="h-4 w-4" aria-hidden /> חזרה לחשבונאות מאפס
        </Link>
        <div className="mt-4">
          <Breadcrumbs trail={[{ label: "שלב 1 · יסודות" }, { label: "רכוש קבוע (IAS 16)" }]} />
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          תקן IAS 16 רכוש קבוע <span className="text-gradient">מהקל לקשה</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          הכול בדף אחד, לפי הסדר: מהו רכוש קבוע, מושגי היסוד, ואז הסוגיות מהפשוטה למורכבת — שיטות הפחת, שאלה מלאה, שיפוצים, החלפת נכסים והערכה מחדש. בכל סוגיה:
          דרכי פעולה, דוגמאות מלאות ומחשבון, ובסוף צ׳ק-ליסט שמוודא שלא פספסתם כלום.
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
          מה צריך לדעת מראש: הוצאה מול השקעה, ופקודת יומן בסיסית — חובה וזכות.{" "}
          <Link href={screenHref("expense")} className="font-medium text-accent hover:underline">
            לשיעור ״הוצאה מול השקעה״
          </Link>
        </p>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="contents lg:block lg:min-w-0">
            <ChapterNav chapters={CHAPTERS} />
          </aside>
          <div className="min-w-0">
            <PartSection part={PARTS[0]} first />
            <GatedChapters topic="ias16" chapters={LOCKED} taste={{ href: "#what", label: "לפרק הראשון — בחינם" }}>
              {PARTS.slice(1).map((part) => (
                <PartSection key={part.id} part={part} />
              ))}
            </GatedChapters>

            <section id="full-calculator" data-chapter="full-calculator" aria-labelledby="full-calculator-h" className="mt-14 scroll-mt-32 lg:scroll-mt-24">
              <div className="card flex flex-wrap items-center gap-4 border-accent/40 p-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <Calculator className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="full-calculator-h" className="text-lg font-semibold text-fg">
                    שאלה שלמה? המחשבון המלא פותר אותה
                  </h2>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">
                    מחשבון אחד לכל סוגי השאלות: עלות, כל שיטות הפחת, שיפוץ, הערכה מחדש והחלפה — ואם חסר נתון, מסמנים אותו X. הפתרון מראה את רישום הנתונים, מציאת
                    הנעלם, כל שלבי החישוב, פקודות היומן, מאזן ורווח והפסד לכל שנה, והמעבר משנה לשנה.
                  </p>
                </div>
                <ButtonLink href="/engine?calc=ias-16-property-plant-equipment">
                  למחשבון <ArrowLeft className="h-4 w-4" />
                </ButtonLink>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}

/** One part of the page: its header, then each topic with its sub-sections. */
function PartSection({ part, first }: { part: Part; first?: boolean }) {
  return (
    <section id={part.id} aria-labelledby={`${part.id}-h`} className={first ? undefined : "mt-16"}>
      <header className="border-b-2 border-accent/40 pb-3">
        <p className="text-xs font-semibold text-accent">חלק {part.n}</p>
        <h2 id={`${part.id}-h`} className="mt-0.5 text-2xl font-semibold tracking-tight text-fg">
          {part.title}
        </h2>
        <p className="mt-1 max-w-3xl text-[14.5px] leading-relaxed text-muted">{part.lead}</p>
      </header>
      {part.topics.map((t) => {
        const n = NUM.get(t.id)!;
        return (
          <section key={t.id} id={t.id} data-chapter={t.id} aria-labelledby={`${t.id}-h`} className="mt-10 scroll-mt-32 lg:scroll-mt-24">
            {ALIASES[t.id] && <span id={ALIASES[t.id]} className="block scroll-mt-32" aria-hidden />}
            <div className="flex items-start gap-3">
              <span className="num mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg">{n}</span>
              <div className="min-w-0">
                <h3 id={`${t.id}-h`} className="text-xl font-semibold text-fg">
                  {t.title}
                </h3>
                <p className="mt-1 max-w-3xl text-[14.5px] leading-relaxed text-muted">{t.lead}</p>
              </div>
            </div>
            {t.subs && (
              <ul className="no-print mt-3 flex flex-wrap gap-1.5 ps-12" aria-label={`בתוך ${t.label}`}>
                {t.subs.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="inline-flex min-h-8 items-center rounded-full border border-line px-3 py-1 text-[12.5px] font-medium text-fg hover:border-accent hover:bg-accent-soft/50">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {t.content && <div className="mt-5 space-y-4">{t.content}</div>}
            {t.subs?.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-8 scroll-mt-32 lg:scroll-mt-24">
                <h4 id={`${s.id}-h`} className="flex items-center gap-2 text-[17px] font-semibold text-fg">
                  <span className="num rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-bold text-accent">
                    {n}.{i + 1}
                  </span>
                  {s.label}
                </h4>
                <div className="mt-4 space-y-4">{s.content}</div>
              </section>
            ))}
          </section>
        );
      })}
    </section>
  );
}
