import { ArrowLeft, Layers, Printer } from "lucide-react";
import { trialBalance } from "@/lib/learn/basics";
import { GEFEN, SHAKED, TAMAR } from "@/lib/learn/worksheet";
import { Given } from "./credit";
import { Glossary } from "./glossary";
import type { ScreenContent } from "@/components/study-mode/shell";
import { PrintButton } from "./print-button";
import { Tabs } from "./tabs";
import { KeyCard, Rule, TBTable } from "./ui";
import { WorksheetWalk } from "./worksheet";
import { WorksheetGame } from "./worksheet-game";

const MISTAKES: [string, string][] = [
  ["רושמים משיכת בעלים כהוצאה", "משיכה מקטינה את ההון (ח׳ הון בעלים), ולא נכנסת לרווח והפסד."],
  ["רושמים קניית מחשב כהוצאה", "רכוש שישמש יותר משנה הוא נכס — ח׳ מחשב, לא ח׳ הוצאות."],
  ["רושמים מקדמה מלקוח כמכירה", "עד האספקה זו התחייבות — מקדמות מלקוחות בזכות."],
  ["רושמים פירעון הלוואה כהוצאה", "רק הריבית היא הוצאה. החזר הקרן מקטין את ההלוואה."],
  ["מבלבלים בין ספקים ללקוחות", "ספקים — אנחנו חייבים להם (זכות). לקוחות — הם חייבים לנו (חובה)."],
  ["שוכחים מלאי סגירה", "בלי מלאי סגירה כל הקניות נראות כהוצאה, והרווח יוצא נמוך מדי."],
  ["מעבירים חשבון תוצאתי לשנה הבאה", "הכנסות והוצאות מתחילות כל שנה מאפס; רק התוצאה עוברת לעודפים."],
  ["רושמים הוצאה של השנה רק כשמשלמים", "בסיס מצטבר: שכר דצמבר שייך לדצמבר גם אם ישולם בינואר."],
];

const FAQ: [string, string][] = [
  ["למה ימין הוא חובה?", "זו מוסכמה של הרישום: בכרטיס T החובה מימין והזכות משמאל. מה שחשוב הוא העיקרון — מקבל בחובה, נותן בזכות."],
  ["חובה זה דבר רע?", "לא. 'חובה' היא רק שם של צד. מזומן בחובה הוא דבר טוב — זה כסף שיש לעסק."],
  ["למה עודפים יכולים להיות בחובה?", "כשהעסק הפסיד לאורך השנים יותר משהרוויח, היתרה עוברת לחובה. קוראים לזה הפסדים צבורים."],
  ["מה ההבדל בין מאזן למאזן בוחן?", "מאזן בוחן הוא כלי עבודה פנימי עם כל היתרות. המאזן הוא דוח, עם החשבונות המאזניים בלבד."],
  ["אם מאזן הבוחן מאוזן — אין טעויות?", "לא בהכרח. פקודה שלמה בחשבון הלא נכון, או פקודה שנשכחה, לא יפריעו לאיזון. האיזון תופס רק טעויות חד-צדדיות."],
  ["למה הוצאות מראש הן נכס?", "כי שילמתם על משהו שעוד תקבלו — חודשי ביטוח או שימוש. זה ערך שיש לעסק."],
];

/** The sheet's columns, in order: what each one holds. */
const COLUMNS: [string, string][] = [
  ["לפני התאמות", "מאזן הבוחן כפי שמקבלים אותו בשאלה."],
  ["התאמות", "פקודות ההתאמה, כל חשבון בשורה שלו. חשבון חדש — בשורה חדשה."],
  ["מאזן בוחן סופי", "לכל חשבון: לפני + התאמות, בצד הנכון."],
  ["תוצאתי", "הכנסות והוצאות — מהן הרווח."],
  ["מאזני", "נכסים, התחייבויות והון — עם עודפי הסגירה."],
];

export const FINAL_SCREENS: Record<string, ScreenContent> = {
  worksheet: {
    lead: "גיליון רב-טורי מוביל, בטבלה אחת, ממאזן הבוחן לפני ההתאמות ועד רווח השנה ויתרת העודפים בסוף השנה.",
    body: (
      <>
        <KeyCard icon={<Layers className="h-5 w-5" />}>כל מה שלמדנו עד עכשיו נועד להגיע לרגע הזה: מרכזים הכול בגיליון אחד.</KeyCard>
        <ol className="flex flex-wrap items-stretch gap-2 [column-span:all]">
          {COLUMNS.map(([title, what], i) => (
            <li key={title} className="flex min-w-0 flex-[1_1_10rem] items-center gap-2">
              <div className="h-full flex-1 rounded-xl border border-line bg-surface px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[15px] font-bold text-fg">
                  <span className="num grid h-6 w-6 place-items-center rounded-full bg-accent text-[12px] text-accent-fg">{i + 1}</span>
                  {title}
                </p>
                <p className="mt-1 text-[13.5px] text-muted">{what}</p>
              </div>
              {i < COLUMNS.length - 1 && <ArrowLeft className="h-4 w-4 shrink-0 text-subtle max-sm:hidden" aria-hidden />}
            </li>
          ))}
        </ol>
        <p>
          <strong>מה מקבלים בשאלה:</strong> מאזן בוחן לפני התאמות, ורשימת עובדות — מה קרה ומה לא נרשם. <strong>מה מבקשים:</strong> לבנות את הגיליון, ולהגיע לרווח השנה
          ולעודפי הסגירה.
        </p>
        <Rule>מאזן בוחן לפני התאמות + התאמות = מאזן בוחן סופי. ממנו: תוצאתי ← רווח השנה; מאזני ← עם עודפי הסגירה, מאוזן.</Rule>
      </>
    ),
  },

  "ws-question": {
    body: (
      <Given title={`נתון: ${SHAKED.name} — מאזן בוחן ליום ${SHAKED.date}, לפני פקודות התאמה`} asks={<>גיליון רב-טורי ליום {SHAKED.date}, רווח השנה ועודפי הסגירה.</>}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TBTable tb={trialBalance(SHAKED.preliminary)} caption="מאזן בוחן לפני התאמות" />
          <div>
            <p className="mb-1.5 font-bold">מידע נוסף לסוף השנה:</p>
            <ol className="space-y-1.5">
              {SHAKED.items.map((it) => (
                <li key={it.entry.id} className="flex gap-2 rounded-lg bg-surface px-3 py-2 text-[14.5px]">
                  <span className="font-bold text-amber-700 dark:text-amber-400">{it.entry.id}.</span>
                  <span>{it.story}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Given>
    ),
  },

  "ws-solve": {
    lead: `פותרים את השאלה של ${SHAKED.name}: קודם מעתיקים את מאזן הבוחן, אחר כך פקודת התאמה אחת בכל צעד — ובסוף מפצלים ומגיעים לרווח.`,
    body: <WorksheetWalk c={SHAKED} />,
  },

  "ws-game": {
    lead: `עכשיו תורכם, עם חברה חדשה — ${TAMAR.name}. ממיינים את המאזן הראשוני (אפשר נגד השעון), רושמים ומשבצים כל פקודת התאמה, ומגיעים לרווח השנה.`,
    body: (
      <div className="[column-span:all]">
        <WorksheetGame c={TAMAR} />
      </div>
    ),
  },

  "ws-game-hard": {
    lead: `אותו משחק, ברמה של בחינה — ${GEFEN.name}: יתרה אחת במאזן לא נתונה, פקודה מורכבת, פקודת תיקון, ונתונים שצריך לחשב לפני שרושמים. ובסוף — גם רווח השנה וגם עודפי הסגירה.`,
    body: (
      <div className="[column-span:all]">
        <WorksheetGame c={GEFEN} />
      </div>
    ),
  },
};

/** The course's reference: a one-page cheat sheet (printable), the glossary, common mistakes and questions. */
export function BasicsReference() {
  return (
        <Tabs
          label="כלי עזר"
          tabs={[
            {
              id: "sheet",
              label: "גיליון עזר",
              content: (
                <section id="cheatsheet" className="card print-sheet p-4" aria-labelledby="cheatsheet-title">
                  <div className="flex items-center gap-3">
                    <h3 id="cheatsheet-title" className="me-auto text-base font-semibold text-fg">
                      גיליון עזר — עמוד אחד
                    </h3>
                    <PrintButton icon={<Printer className="h-4 w-4" />} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <Sheet title="מהי חשבונאות">זיהוי (מה קרה) ← מדידה (כמה) ← דיווח (רישום ודוחות).</Sheet>
                    <Sheet title="ארבעת השלבים">פקודת יומן ← כרטיסי T ← מאזן בוחן ← דוחות כספיים.</Sheet>
                    <Sheet title="כלל הזהב">מקבל (נכנס) = חובה · נותן (יוצא) = זכות · סך החובה = סך הזכות.</Sheet>
                    <Sheet title="חמשת הסוגים">נכסים והוצאות — גדלים בחובה. התחייבויות, הון והכנסות — גדלים בזכות.</Sheet>
                    <Sheet title="הזהות">נכסים = התחייבויות + הון.</Sheet>
                    <Sheet title="יתרת סגירה">סך חובה מול סך זכות; היתרה בצד הגדול, בגובה ההפרש.</Sheet>
                    <Sheet title="מאזני / תוצאתי">מאזני ממשיך לשנה הבאה. תוצאתי מתאפס בכל 1.1, והרווח עובר לעודפים.</Sheet>
                    <Sheet title="עודפים">פתיחה + רווח (− הפסד) = סגירה. חברה חדשה: פתיחה 0. יתרה בחובה = הפסדים צבורים.</Sheet>
                    <Sheet title="חשבונות חתך">הוצאות מראש והכנסות לקבל — נכסים. הוצאות לשלם והכנסות מראש — התחייבויות.</Sheet>
                    <Sheet title="עלות המכר">מלאי פתיחה + קניות − מלאי סגירה. המלאי — בנמוך מבין עלות לשווי מימוש נטו.</Sheet>
                  </div>
                </section>
              ),
            },
            { id: "glossary", label: "מילון", content: <Glossary /> },
            {
              id: "mistakes",
              label: "טעויות נפוצות",
              content: (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {MISTAKES.map(([wrong, right]) => (
                    <li key={wrong} className="rounded-xl border border-line bg-surface p-3 text-sm">
                      <span className="font-semibold text-danger">✗ {wrong}</span>
                      <span className="mt-0.5 block text-fg/85">✓ {right}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              id: "faq",
              label: "שאלות נפוצות",
              content: (
                <div className="card divide-y divide-line px-4">
                  {FAQ.map(([q, a]) => (
                    <details key={q} className="group py-2.5">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
                        <span className="me-1 inline-block text-accent transition-transform group-open:-rotate-90">‹</span> {q}
                      </summary>
                      <p className="mt-1.5 text-sm text-fg/85">{a}</p>
                    </details>
                  ))}
                </div>
              ),
            },
          ]}
        />
  );
}

function Sheet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-3">
      <p className="text-xs font-semibold text-accent">{title}</p>
      <p className="mt-1 text-fg">{children}</p>
    </div>
  );
}
