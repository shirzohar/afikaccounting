import { Printer } from "lucide-react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { explainPeriod, explainSolve, m, pc } from "@/lib/learn/inventory-explain";
import { cn } from "@/lib/utils";
import { GALYAM_GP, galyam, PRACTICE } from "@/lib/learn/inventory-examples";
import { InventoryCalculator } from "./inventory-calculator";
import { AnswerCheck, SortQuiz, TryInCalc } from "./inventory-interactive";
import { ChainChips, MoreDialog } from "./inventory-teach";
import { TraceStepView, TraceView } from "./inventory-trace";
import { PrintButton } from "./print-button";
import { Tabs } from "./tabs";
import { Card, KeyCard, Rule, type Step, Stepper, Wide } from "./ui";

// The full question (Gal-Yam) also supplies the examples for the routine.
const G = galyam();
const GR = G.result;
const q = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 2 });

const STEPS: { title: string; what: string; how: string[]; ex: string; trap: string }[] = [
  {
    title: "מה מבקשים?",
    what: "קוראים את ה״נדרש״ לפני כל דבר אחר — הוא קובע מה לחשב ואיפה לעצור.",
    how: [
      "מסמנים כל דרישה בנפרד: מלאי סגירה, עלות המכר, רווח גולמי, שיעור, פקודות יומן, שיפוי, ערך נעלם.",
      "שואלים לגבי כל אחת: לאיזו שנה? לפי איזו שיטה? בספרים (אחרי שווי מימוש נטו) או בעלות?",
      "אם מבקשים ערך נעלם — רושמים בצד מה הנעלם ומה הנתון שאמור להגדיר אותו.",
    ],
    ex: "״חשבו את מחיר המכירה ב-10.3״ — הנעלם הוא מחיר, והכלי כנראה שיעור גולמי.",
    trap: "לחשב דוח שלם כשביקשו רק מלאי סגירה.",
  },
  {
    title: "נתונים נוספים — לפני הטבלה",
    what: "עוברים על הנתונים הממוספרים ומסווגים כל אחד לפי מה שהוא משנה — לפני שמחשבים משהו.",
    how: [
      "ליד כל סעיף כותבים במילה אחת על מה הוא משפיע: עלות רכישה / כמויות / שיטה / שווי מימוש נטו / נעלם / עיגול.",
      "מחפשים מילות מפתח: ״הנחה״, ״מכס״, ״הובלה״, ״אחסון״, ״אשראי״, ״משגור״, ״נשרף״, ״יש לעגל״.",
      "סעיף שלא ברור לאן הוא שייך — מסמנים ב-? וחוזרים אליו אחרי שבונים את הטבלה.",
    ],
    ex: "״מכס 6% מהמחיר נטו״ ← עלות רכישה. ״שווי מימוש נטו 65 ליחידה״ ← בדיקת הנמוך בסוף.",
    trap: "להתחיל לחשב ולגלות באמצע שיש הנחה שמשנה הכול.",
  },
  {
    title: "שיטה ומערכת רישום",
    what: "מזהים את נוסחת העלות ואת שיטת הרישום — הן קובעות איזה כלי עבודה בונים.",
    how: [
      "FIFO ← טבלת שכבות; לסגירה מספיק ללכת מהרכישה האחרונה אחורה.",
      "ממוצע תקופתי ← ממוצע אחד לשנה; תאריכי המכירות לא משנים.",
      "ממוצע נע (תמידי) ← כרטיס מלאי עם יתרה אחרי כל תנועה; התאריכים קובעים את הסדר.",
      "לא כתוב? בודקים אם יש ״תמידי״ / ״תקופתי״ בטקסט, ואם לא — לפי הוראת הקורס.",
    ],
    ex: "״ממוצע משוקלל נע״ ← כרטיס מלאי עם שורה אחרי כל אירוע.",
    trap: "לחשב ממוצע תקופתי כשהשאלה אומרת תמידי.",
  },
  {
    title: "עלות לכל רכישה",
    what: "בונים לכל רכישה את העלות שלה לפי IAS 2 — מחיר, פחות הנחות, ועוד מה שהביא את הסחורה למחסן.",
    how: [
      "מתחילים מכמות × מחיר. מנכים הנחות שחלות באותה רכישה (שימו לב: על כל הרכישה או רק על העודף).",
      "מוסיפים מכס שלא מוחזר (על המחיר נטו), הובלה פנימה וטיפול. ליחידה — כופלים בכמות; למשלוח — סכום אחד.",
      "משאירים בחוץ: מע״מ בר-קיזוז, אחסון רגיל, הובלה ללקוח, פרסום, ורכיב מימון באשראי חריג.",
      "מחלקים בכמות ומקבלים עלות ליחידה — זה המספר שנכנס לטבלת התנועות.",
    ],
    ex: "אחסון במחסן החברה ומע״מ בר-קיזוז — בחוץ.",
    trap: "לחשב מכס על המחיר כולל ההובלה.",
  },
  {
    title: "טבלת תנועות וגלגול כמויות",
    what: "בונים טבלה אחת של כל הרכישות והמכירות לפי תאריך, עם יתרת יחידות אחרי כל תנועה.",
    how: [
      "שורה לכל רכישה (+) ולכל מכירה (−), לפי סדר התאריכים. בעמודה האחרונה — היתרה.",
      "בודקים: פתיחה + קניות − מכירות = סגירה. היתרה לא יורדת אף פעם מתחת לאפס.",
      "מתקנים לפי הסיווג: מלאי בדרך, משגור, מכור והחזק, דוגמיות.",
    ],
    ex: `${q(GR.openingUnits)} + ${q(GR.purchasesUnits)} − ${q(GR.soldUnits)} = ${q(GR.closingUnits)} יחידות.`,
    trap: "לשכוח שחברה שהוקמה השנה — אין לה מלאי פתיחה.",
  },
  {
    title: "הערכת הסגירה, ואז שווי מימוש נטו",
    what: "מעריכים את מלאי הסגירה לפי השיטה, ורק אחר כך משווים לשווי המימוש נטו.",
    how: [
      "מוצאים את עלות הסגירה לפי השיטה (שכבות / ממוצע / יתרת הכרטיס).",
      "שווי מימוש נטו = מחיר מכירה צפוי − עלויות השלמה − עלויות מכירה; כופלים ביחידות שבסגירה.",
      "לוקחים את הנמוך מבין השניים. אם השווי נמוך מהעלות — ההפרש הוא הורדת ערך, והיא נכנסת לעלות המכר.",
      "שנה אחרי הורדה: אם השווי עלה — מבטלים, אבל רק עד העלות המקורית.",
    ],
    ex: `${q(GR.closingUnits)} × ${q(G.period.nrvPerUnit!)} = ${m(GR.nrvTotal!)} מול עלות ${m(GR.closingCostBasis)} ← הורדה ${m(GR.writeDown)}.`,
    trap: "להציג את ההורדה כהוצאה אחרת, מחוץ לעלות המכר.",
  },
  {
    title: "הדוח והתשובה לנדרש",
    what: "ממלאים את תבנית הדוח עד הרווח הגולמי, ואז פותרים את הנעלמים.",
    how: [
      "רושמים את התבנית: מכירות נטו; עלות המכר = פתיחה + קניות נטו − סגירה; רווח גולמי.",
      "נעלם? מחפשים משוואה אחת עם נעלם אחד (שיעור 5), פותרים ומציבים בחזרה.",
      "עונים בדיוק על מה שנשאל — באותו ניסוח, עם יחידות (₪ / יח׳ / %).",
    ],
    ex: `מכירות = ${m(GR.cogs)} ÷ (1 − ${pc(GALYAM_GP)}) = ${m(GR.netSales)}, ומשם המחיר.`,
    trap: "לחשב שיעור גולמי על העלות.",
  },
  {
    title: "בדיקות סבירות",
    what: "שלוש דקות של בדיקה חוסכות טעות שמורידה את כל הסעיף.",
    how: [
      "פתיחה + קניות = עלות המכר + סגירה (לפני הורדת ערך).",
      "ממוצע — בין המחיר הנמוך לגבוה; אין יתרה שלילית; שיעור גולמי בין 0% ל-100%.",
      "עיגול — רק בסוף, או כפי שהשאלה מורה. רושמים כל הנחה שהנחתם.",
    ],
    ex: "רושמים נוסחה לפני המספרים — מקבלים ניקוד על הדרך.",
    trap: "לעגל באמצע ולצבור טעות.",
  },
];

const PHRASES: [string, string, string][] = [
  ["״הנחה של X% על רכישות מעל N יחידות״", "הנחת כמות באותה רכישה", "״על כל הרכישה״ ← הכול; ״על הכמות שמעל N״ ← רק העודף"],
  ["״אם תמכור מעל N יחידות — הנחה של X% על כל הרכישות״", "יעד מכירות — לא בשליטת החברה", "לא מכירים עד שהושג, גם אם ״צופה לעמוד״"],
  ["״במזומן העלות הייתה נמוכה ב-3%; תנאי אשראי חריגים״", "רכיב מימון", "עלות = מחיר × 0.97; ההפרש — הוצאות מימון"],
  ["״הובלה לכל משלוח / ליחידה / לק״ג״", "רכיב הובלה", "למשלוח = סכום קבוע; ליחידה = × כמות; לק״ג = × משקל × כמות"],
  ["״ארגז של 100 יחידות, הובלה 20 ₪ לארגז״", "הובלה לפי ארגזים", "כמות ÷ 100 × 20"],
  ["״מכס X% מעלות הרכישה נטו״", "מס יבוא שאינו מוחזר", "נכלל; הבסיס — המחיר אחרי הנחה, בלי נלוות"],
  ["״מע״מ ניתן להחזר״", "מס בר-קיזוז", "לא נכלל"],
  ["״אחסון בנמל לפני ההובלה, כי ההובלה בלוח זמנים קבוע״", "אחסון הכרחי", "נכלל (16ב)"],
  ["״אחסון במחסני החברה / חברת האחסון״", "אחסון רגיל", "לא נכלל"],
  ["״שווי מימוש נטו ליחידה X״", "בדיקת הנמוך", "יחידות × X מול העלות; ההפרש לעלות המכר"],
  ["״שיעור הרווח הגולמי Y״", "נתון לחילוץ", "עלות המכר = מכירות × (1 − Y)"],
  ["״מכרה 65% מערך הרכישות״", "קשר בין עלות מכר לקניות", "קניות = עלות המכר ÷ 65%"],
  ["״מבוטחת לפי עלות בשיטת X; השתתפות עצמית p%״", "בסיס שיפוי נפרד", "מחשבים מחדש בשיטת הפוליסה, בלי שווי מימוש נטו"],
  ["״החברה הוקמה ב-…״", "אין מלאי פתיחה", "לא מחפשים פתיחה"],
  ["״יש לעגל ל… ספרות״", "הוראת עיגול", "מעגלים בסוף, או כפי שנאמר"],
  ["״במשגור אצל…״ / ״הלקוח יאסוף; האחריות עברה״", "משגור / מכור והחזק", "משגור — עדיין שלנו; מכור והחזק — כבר לא"],
];

const TRAPS: [string, string, string][] = [
  ["קניות ≠ עלות המכר", "עלות המכר = פתיחה + קניות − סגירה", "R5"],
  ["שיעור גולמי על העלות", "רווח גולמי ÷ מכירות נטו", "R7"],
  ["הנחות ללקוחות בקניות (או להפך)", "ללקוחות ← מכירות נטו; מספקים ← קניות נטו", "R6"],
  ["מלאי פתיחה לפי העלות המקורית", "הסגירה הקודמת בערך בספרים (אחרי הורדה)", "D4"],
  ["לחפש מלאי פתיחה בחברה חדשה", "הוקמה השנה ← פתיחה אפס", "R9"],
  ["מע״מ בר-קיזוז בעלות", "לא נכלל", "11"],
  ["מכס על המחיר ועל ההובלה", "על המחיר נטו אחרי הנחה בלבד", "11"],
  ["הובלה למשלוח כאילו ליחידה", "למשלוח — סכום אחד לרכישה", "11"],
  ["כל אחסון בעלות", "רק הכרחי לפני שלב נוסף; רגיל — הוצאה", "16(ב)"],
  ["הובלה ללקוח בעלות", "עלות מכירה — הוצאה", "16(ד)"],
  ["הנחת כמות תמיד על כל הרכישה", "לפי הניסוח: כל הרכישה או רק העודף", "11"],
  ["הנחת יעד מכירות נרשמת מראש", "לא בשליטת החברה ← רק כשהושג", "11"],
  ["רכיב מימון בכל אשראי", "רק בתנאי אשראי חריגים לענף", "18"],
  ["ממוצע תקופתי = ממוצע נע", "רק FIFO זהה בשתי המערכות", "25"],
  ["מכירה משנה את הממוצע הנע", "רק קנייה משנה אותו", "25"],
  ["ממוצע תקופתי בלי מלאי הפתיחה", "הפתיחה בסכום וגם בכמות", "25"],
  ["שווי מימוש נטו = שווי הוגן; מנכים פרסום", "מחיר − השלמה − מכירה; לא שיווק ופרסום", "6, 28"],
  ["הורדת ערך כ״הוצאה אחרת״", "לעלות המכר", "34"],
  ["ביטול מעל העלות", "עד גובה ההורדה המקורית", "33"],
  ["מלאי בדרך — תמיד של הקונה", "לפי מעבר הסיכון", "—"],
  ["משגור שמסרנו — לא שלנו", "שלנו עד המכירה ללקוח הסופי", "—"],
  ["מכור והחזק — במלאי", "כבר של הלקוח", "—"],
  ["דוגמיות לחלוקה — במלאי", "לא מוחזקות למכירה — הוצאה", "6"],
  ["שיפוי לפי שיטת החברה ועם שווי מימוש נטו", "לפי שיטת הפוליסה, בלי שווי מימוש נטו, פחות מה שניצל", "R28"],
  ["שריפה באמצע שנה — גלגול לכל השנה", "גלגול רק עד תאריך השריפה", "R27"],
  ["עיגול בכל שלב", "מעגלים בסוף, או לפי ההוראה", "D1"],
  ["״בהכרח״, ״תמיד״ — לקבל כמו שזה", "מחפשים דוגמת נגד", "R33"],
  ["כמות שבורה — טעות", "בשחזור כמויות שבר מותר", "D2"],
];

const TF = [
  { text: "שווי מימוש נטו שווה תמיד לשווי הוגן בניכוי עלויות מכירה.", answer: "f", why: "שווי מימוש נטו ספציפי לחברה; שווי הוגן הוא מחיר שוק.", ref: "IAS 2.7" },
  { text: "מותר למדוד מלאי בשיטת LIFO.", answer: "f", why: "בקורס עובדים רק עם FIFO או ממוצע משוקלל.", ref: "IAS 2.25" },
  { text: "דוגמיות שמחולקות חינם נכללות במלאי.", answer: "f", why: "לא מוחזקות למכירה.", ref: "IAS 2.6" },
  { text: "עלויות אחסון נכללות בעלות רק אם הן נחוצות לתהליך לפני שלב נוסף.", answer: "t", why: "זה החריג בסעיף 16(ב).", ref: "IAS 2.16(ב)" },
  { text: "מלאי נמדד לפי הגבוה מבין העלות לשווי מימוש נטו.", answer: "f", why: "לפי הנמוך.", ref: "IAS 2.9" },
  { text: "אחרי הורדת ערך, בוחנים בכל תקופה אם אפשר לבטל אותה.", answer: "t", why: "בכל תאריך דוח מעריכים מחדש את שווי המימוש נטו.", ref: "IAS 2.33" },
  { text: "ביטול הורדת ערך יכול להעלות את המלאי מעל העלות המקורית.", answer: "f", why: "הביטול חסום בגובה ההורדה המקורית.", ref: "IAS 2.33" },
  { text: "בכל רכישה באשראי יש לזהות רכיב מימון.", answer: "f", why: "רק בתנאי אשראי חריגים.", ref: "IAS 2.18" },
  { text: "בעת קניית מלאי, עלותו נזקפת מיד כהוצאה.", answer: "f", why: "היא נכס עד שהמלאי נמכר.", ref: "IAS 2.34" },
  { text: "FIFO תקופתי ו-FIFO תמידי מניבים אותו מלאי סגירה.", answer: "t", why: "בשתיהן נשארות הרכישות האחרונות.", ref: "IAS 2.25" },
  { text: "ממוצע תקופתי וממוצע נע מניבים תמיד אותה עלות מכר.", answer: "f", why: "רק במחיר אחיד; בדרך כלל הן שונות.", ref: "IAS 2.25" },
  { text: "בקביעת שווי מימוש נטו מנכים גם עלויות פרסום ושיווק.", answer: "f", why: "בפתרונות הקורס לא מנכים אותן.", ref: "IAS 2.6" },
  { text: "הנחה המותנית ביעד מכירות נרשמת כבר ברכישה אם החברה צופה לעמוד ביעד.", answer: "f", why: "יעד מכירות אינו בשליטה הבלעדית של החברה.", ref: "IAS 2.11" },
  { text: "בממוצע נע, מכירה משנה את העלות הממוצעת ליחידה.", answer: "f", why: "רק קנייה משנה את הממוצע.", ref: "IAS 2.27" },
  { text: "FIFO תקופתי מניב בהכרח רווח גולמי גבוה יותר מממוצע תקופתי.", answer: "f", why: "תלוי במגמת המחירים — ראו שיעור 3.", ref: "R33" },
  { text: "מלאי שנמסר בקונסיגנציה אינו מלאי של החברה.", answer: "f", why: "הוא שלה עד המכירה ללקוח הסופי.", ref: "—" },
  { text: "שווי מימוש נטו נבחן בכל תאריך דוח כספי.", answer: "t", why: "כך קובע התקן.", ref: "IAS 2.33" },
  { text: "הורדת ערך מלאי מוכרת ברווח או הפסד רק כשהמלאי נמכר.", answer: "f", why: "היא מוכרת מיד, בתקופה שבה התרחשה.", ref: "IAS 2.34" },
  { text: "חברה יכולה להשתמש בנוסחאות עלות שונות לשני סוגי מלאי דומים באופיים ובשימוש.", answer: "f", why: "לאותו סוג מלאי — אותה נוסחה.", ref: "IAS 2.25" },
];

// The full question, solved by the same code as the calculator.
const G_STEPS = [...explainPeriod(G.period, G.result).filter((s) => s.id !== "statement"), ...explainSolve(G.solved), ...explainPeriod(G.period, G.result).filter((s) => s.id === "statement")];
const ROUTINE: Record<string, string> = { cost: "צעד 4", qty: "צעד 5", value: "צעדים 3 ו-6", nrv: "צעד 6", statement: "צעדים 7–8" };

/** The eight steps of the routine, one at a time. */
const routineSteps: Step[] = STEPS.map((s, i) => ({
  title: `צעד ${i + 1} · ${s.title}`,
  body: (
    <>
      <p className="font-medium text-fg">{s.what}</p>
      <ul className="space-y-1.5">
        {s.how.map((h) => (
          <li key={h} className="rounded-lg bg-surface-2/70 px-3 py-2 text-[14.5px]">
            {h}
          </li>
        ))}
      </ul>
      <p className="text-[14px] text-muted">
        <strong className="text-fg/80">דוגמה:</strong> {s.ex}
      </p>
      <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-[14px]">
        <strong className="text-danger">טעות נפוצה:</strong> {s.trap}
      </p>
    </>
  ),
}));

/** The phrases of "additional data", in four small groups rather than one long table. */
const PHRASE_GROUPS: [string, number[]][] = [
  ["הנחות ומימון", [0, 1, 2]],
  ["הובלה, מכס, מע״מ ואחסון", [3, 4, 5, 6, 7, 8]],
  ["מדידה וחילוץ", [9, 10, 11]],
  ["ביטוח, הקמה, עיגול ובעלות", [12, 13, 14, 15]],
];
const phraseSteps: Step[] = PHRASE_GROUPS.map(([title, rows]) => ({
  title,
  body: (
    <ul className="space-y-2">
      {rows.map((r) => {
        const [phrase, meaning, action] = PHRASES[r];
        return (
          <li key={phrase} className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
            <p className="font-semibold text-fg">{phrase}</p>
            <p className="mt-0.5 text-[14px] text-muted">{meaning}</p>
            <p className="mt-1 text-[14.5px] text-fg">← {action}</p>
          </li>
        );
      })}
    </ul>
  ),
}));

/** The full question's solution, a step at a time, each marked with its step of the routine. */
const solveSteps: Step[] = G_STEPS.map((s) => {
  const routine = s.id.startsWith("solve") ? "צעד 7 — הנעלם" : ROUTINE[s.id];
  return {
    title: s.title,
    body: <TraceStepView s={{ ...s, title: routine ? `בשגרה: ${routine}` : "" }} />,
  };
});

/** The four parts of an exam question, as a question would lay them out. */
const ANATOMY: { part: string; what: string; why: string; tone: string }[] = [
  { part: "כותרת", what: "״חברת גל-ים הוקמה ב-1.1.2025 ומייבאת…״", why: "הוקמה השנה ← אין מלאי פתיחה; יבוא ← מכס, הובלה, נמל.", tone: "border-line-strong" },
  { part: "טבלת נתונים", what: "רכישות ומכירות לפי תאריך — ולפעמים סימן ?", why: "הסדר קובע בשיטות תמידיות; ? = נעלם שצריך משוואה.", tone: "border-accent/50" },
  { part: "נתונים נוספים", what: "1. הנחה… 2. הובלה… 3. שווי מימוש נטו…", why: "כאן מתחבאות רוב הנקודות — קוראים לפני שמחשבים.", tone: "border-amber-500/60" },
  { part: "נדרש", what: "״חשבו את מלאי הסגירה ואת…״", why: "קובע מה לחשב — ואיפה לעצור.", tone: "border-success/50" },
];

/** The concept screens of lesson 6: an exam question, the routine, the phrases, a full question solved, and the calculator. */
export const EXAM_SCREENS: Record<string, ScreenContent> = {
  "inv-exam": {
    lead: "שאלת מלאי בנויה מארבעה חלקים: כותרת, טבלת נתונים, נתונים נוספים ו״נדרש״. רוב הנקודות מתחבאות בנתונים הנוספים.",
    body: (
      <>
        <Wide>
          <ol className="space-y-2 rounded-2xl border border-line bg-surface p-3" aria-label="חלקי שאלת מלאי">
            {ANATOMY.map((a, i) => (
              <li key={a.part} className={cn("grid gap-1 rounded-xl border-2 border-dashed p-3 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-3", a.tone)}>
                <span className="flex items-center gap-2 font-bold text-fg">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] text-accent-fg">{i + 1}</span>
                  {a.part}
                </span>
                <span className="text-[14px] text-muted">{a.what}</span>
                <span className="text-[14.5px] text-fg">{a.why}</span>
              </li>
            ))}
          </ol>
        </Wide>
        <KeyCard>קוראים קודם את ה״נדרש״, אחר כך את הנתונים הנוספים — ורק אז מתחילים לחשב.</KeyCard>
        <div className="flex flex-wrap gap-2">
          <MoreDialog label="סוגי השאלות שחוזרים">
            <ol className="list-inside list-[hebrew] space-y-1.5">
              <li>שאלה פתוחה בשני חלקים — הערכת מלאי, ואחר כך נעלם או ביטוח.</li>
              <li>סעיף מלאי בתוך גיליון רב-טורי: &quot;עלות 700,000, שווי מימוש נטו 660,000&quot; ← מלאי הסגירה 660,000, וההפרש לעלות המכר.</li>
              <li>שאלות אמריקאיות עם חישוב מאחורי כל היגד.</li>
              <li>שאלות תיאורטיות קצרות.</li>
            </ol>
          </MoreDialog>
          <MoreDialog label="ניהול זמן וניקוד">
            <ul className="list-inside list-disc space-y-1.5">
              <li>שאלת מלאי פתוחה שווה בדרך כלל רבע מהמבחן — אל תיתקעו על סעיף אחד.</li>
              <li>כתבו נוסחה לפני המספרים, ורשמו כל הנחה שהנחתם — מקבלים ניקוד על היגיון.</li>
              <li>נעלם תוקע? המשיכו בדוח עם תא ריק — משוואה אחרת תפתור אותו.</li>
            </ul>
          </MoreDialog>
        </div>
      </>
    ),
  },
  "inv-routine": {
    lead: "שגרה של שמונה צעדים, באותו סדר בכל שאלה: מה מבקשים, מה נתון, באיזו שיטה — ורק אז מחשבים.",
    body: (
      <>
        <Wide>
          <ChainChips items={STEPS.map((s) => s.title)} />
        </Wide>
        <Stepper label="שגרת שמונה הצעדים" steps={routineSteps} />
      </>
    ),
  },
  "inv-phrases": {
    lead: "כל ביטוי ב״נתונים נוספים״ אומר משהו מדויק. מזהים אותו — והחישוב כמעט כותב את עצמו.",
    body: <Stepper label="הביטויים, לפי נושא" steps={phraseSteps} />,
  },
  "inv-fullexam": {
    lead: "שאלה אחת שמכסה הכול: שני ספקים, הנחה, מכס, מימון, ממוצע נע, שווי מימוש נטו — ומחיר חסר. נסו לפתור לבד לפני המסך הבא.",
    body: (
      <>
        <Card title="השאלה">
          <p>חברת &quot;גל-ים&quot; הוקמה ב-1.1.2025 ומנהלת מלאי לפי ממוצע משוקלל נע. שווי מימוש נטו ליחידה ב-31.12.2025: 65 ₪. שיעור הרווח הגולמי השנתי: {pc(GALYAM_GP)}.</p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>ספק א&apos; (חו״ל): 20.1 — 800 יח&apos; ב-60 ₪; 15.4 — 600 יח&apos; ב-64 ₪. הנחה 10% על הכמות שמעל 500 ברכישה — בתוקף עד 30.6.2025. מכס 6% מהמחיר נטו. הובלה ימית 4 ₪ ליחידה. אחסון במחסן החברה 1.5 ₪ ליחידה. מע״מ בר-קיזוז.</li>
            <li>ספק ב&apos; (מקומי), מ-1.7: 10.8 — 500 יח&apos; ב-70 ₪; 5.11 — 300 יח&apos; ב-72 ₪. אשראי &quot;שוטף + 150&quot;, חריג בענף — במזומן המחיר היה נמוך ב-4%. הובלה 2 ₪ ליחידה. הספק מבטיח 12% הנחה אם החברה תמכור השנה מעל 2,500 יח&apos;.</li>
            <li>מכירות: 10.3 — 500 יח&apos; במחיר ?; 20.6 — 700 יח&apos; ב-100 ₪; 30.9 — 600 יח&apos; ב-105 ₪.</li>
          </ul>
          <p className="font-semibold">נדרש: מלאי הסגירה בספרים, עלות המכר, ומחיר המכירה ב-10.3.</p>
        </Card>
        <KeyCard>לפני שממשיכים: מה נדרש? איזה נתון נוסף משנה מה? באיזו שיטה? במסך הבא — הפתרון, צעד אחר צעד.</KeyCard>
      </>
    ),
  },
  "inv-fullexam-solve": {
    lead: "הפתרון מופק מאותו קוד שמפעיל את המחשבון. ליד כל צעד — לאיזה צעד בשגרה הוא שייך.",
    body: (
      <>
        <Stepper label="גל-ים · הפתרון" steps={solveSteps} />
        <Rule>
          מלאי סגירה בספרים: {m(G.result.closingCarrying)} ₪ · עלות המכר: {m(G.result.cogs)} ₪ · מחיר המכירה ב-10.3: {m(G.solved.values.price)} ₪.
        </Rule>
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="galyam" label="פתחו את השאלה הזו במחשבון" />
        </div>
      </>
    ),
  },
  "inv-calc": {
    lead: "פתרתם שאלה? הזינו את הנתונים — והמחשבון מראה את כל הדרך, צעד אחר צעד. כל דוגמה מהשיעורים נטענת אליו בלחיצה.",
    body: (
      <Wide>
        <InventoryCalculator />
      </Wide>
    ),
  },
};

/** The course's reference: a printable summary sheet, the box of traps, true or false, and practice questions solved by the engine. */
export function InventoryReference() {
  return (
    <Tabs
      label="כלי עזר"
      tabs={[
        {
          id: "inv-sheet",
          label: "דף סיכום",
          content: (
            <section className="card print-sheet p-5" aria-labelledby="inv-sheet-title">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="inv-sheet-title" className="text-lg font-semibold text-fg">
                  דף סיכום — מלאי
                </h3>
                <PrintButton icon={<Printer className="h-4 w-4" />} />
              </div>
              <div className="mt-3 grid gap-4 text-[13.5px] md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="font-semibold text-fg">נוסחאות</p>
                  <p>עלות המכר = מלאי פתיחה + קניות נטו − מלאי סגירה</p>
                  <p>רווח גולמי = מכירות נטו − עלות המכר · שיעור = רווח ÷ מכירות נטו</p>
                  <p>ממוצע תקופתי = (עלות פתיחה + קניות) ÷ (יח׳ פתיחה + יח׳ שנקנו)</p>
                  <p>ממוצע נע = עלות המלאי ÷ יחידות — מתעדכן רק בקנייה</p>
                  <p>שווי מימוש נטו = מחיר מכירה − עלויות השלמה − עלויות מכירה; מלאי = הנמוך</p>
                  <p>קמעונאית: סגירה = פתיחה + קניות − מכירות × (1 − שיעור גולמי)</p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-fg">שלוש שיטות במבט אחד</p>
                  <p>FIFO — נשארות הרכישות האחרונות; זהה בתקופתי ובתמידי.</p>
                  <p>ממוצע תקופתי — ממוצע אחד לשנה; תאריכי המכירות לא משנים.</p>
                  <p>ממוצע נע — טבלת יתרות; המכירה לא משנה את הממוצע.</p>
                  <p className="pt-1 font-semibold text-fg">שמונה הצעדים</p>
                  <p>נדרש · נתונים נוספים · שיטה · עלות לרכישה · טבלת תנועות · הערכה ושווי מימוש נטו · דוח ונעלמים · בדיקות</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="font-semibold text-fg">עשר המלכודות המובילות</p>
                  <ol className="list-inside list-decimal columns-1 gap-6 sm:columns-2">
                    {TRAPS.slice(0, 10).map(([a, b]) => (
                      <li key={a}>
                        {a} — {b}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          ),
        },
        {
          id: "inv-traps",
          label: "ארגז המלכודות",
          content: <DataTable head={["מלכודת", "מה עושים", "סעיף"]} rows={TRAPS.map(([a, b, c]) => [`✗ ${a}`, `✓ ${b}`, c])} />,
        },
        {
          id: "inv-tf",
          label: "נכון / לא נכון",
          content: (
            <SortQuiz
              id="tf"
              title="בנק נכון / לא נכון"
              options={[
                ["t", "נכון"],
                ["f", "לא נכון"],
              ]}
              items={TF}
            />
          ),
        },
        {
          id: "inv-practice",
          label: "שאלות לתרגול עצמי",
          content: (
            <div className="card p-5">
              <p className="text-sm text-muted">שאלות ברמת בחינה: פתרו, הזינו את התשובה לבדיקה, ורק אז פתחו את הפתרון. התשובות והפתרונות מחושבים על ידי המנוע.</p>
              <div className="mt-3 divide-y divide-line">
                {PRACTICE.map((x, i) => (
                  <details key={x.id} className="group py-3">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-[15px] font-medium text-fg [&::-webkit-details-marker]:hidden">
                      <span className="num text-accent">{i + 1}.</span>
                      <span className="flex-1">{x.title}</span>
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] text-muted">{x.level}</span>
                    </summary>
                    <div className="mt-2 space-y-3">
                      {x.prompt.map((p, j) => (
                        <p key={j} className="text-[14.5px] text-fg/90">
                          {p}
                        </p>
                      ))}
                      <p className="text-[13px] text-muted">רמז: {x.hint}</p>
                      {x.answers && <AnswerCheck answers={x.answers()} />}
                      {x.statements && (
                        <SortQuiz
                          id={`pr:${x.id}`}
                          options={[
                            ["t", x.labels![0]],
                            ["f", x.labels![1]],
                          ]}
                          items={x.statements.map((s) => ({ text: s.text, answer: s.answer ? "t" : "f", why: s.why }))}
                        />
                      )}
                      {x.calc && <TryInCalc id={x.calc} label="פתחו במחשבון" />}
                      {x.solution && (
                        <details className="rounded-xl border border-line bg-surface-2/40 p-3">
                          <summary className="cursor-pointer text-sm font-semibold text-accent">הציגו פתרון</summary>
                          <div className="mt-3">
                            <TraceView steps={x.solution()} />
                          </div>
                        </details>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
