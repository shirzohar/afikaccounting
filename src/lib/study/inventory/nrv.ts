import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Every figure below is computed here, from the question's own numbers.
const DOWN = { qty: 400, cost: 25, nrv: 21 };
const downAmount = DOWN.qty * (DOWN.cost - DOWN.nrv);
const NRV = { price: 60, complete: 8, sell: 4, cost: 50 };
const nrvUnit = NRV.price - NRV.complete - NRV.sell;
const REVERSE = { qty: 300, cost: 50, written: 40, nrv: 58 };
const reversal = REVERSE.qty * (Math.min(REVERSE.cost, REVERSE.nrv) - REVERSE.written);
const PERPETUAL = { cost: 30_000, nrv: 26_000 };
const PERIODIC = { cost: 50_000, nrv: 46_000 };
const COUNT = { warehouse: 100_000, inTransit: 12_000, heldForOthers: 8_000, consignedOut: 15_000 };
const owned = COUNT.warehouse + COUNT.inTransit - COUNT.heldForOthers + COUNT.consignedOut;

/** Lesson 4: measurement at the lower of cost and net realisable value, its reversal, and which goods are the company's to count. */
export const NRV_LESSON: StudyModule = {
  slug: "inventory-nrv",
  course: COURSE,
  n: 4,
  title: "שווי מימוש נטו ומה נספר כמלאי",
  description: "הנמוך מבין העלות לשווי מימוש נטו, הורדת ערך וביטולה — ואיזה מלאי שייך לחברה: בדרך, במשגור, ומכור והחזק.",
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-nrv", title: "הנמוך מבין העלות לשווי מימוש נטו" },
    { id: "inv-nrv-reverse", title: "שנה אחרי: ביטול הורדת הערך" },
    { id: "inv-count", title: "מה נספר כמלאי?" },
    { id: "inv-count-sort", title: "תרגול הבנה: שלנו או לא?" },
    { id: "inv-bridge", title: "מהספירה במחסן למלאי בספרים" },
  ],
  exercises: [
    journal(
      "writedown-perpetual",
      "הורדת ערך בשיטה תמידית",
      `החברה מנהלת מלאי בשיטה תמידית. ב-31.12 עלות המלאי ${fmt(PERPETUAL.cost)} ₪, ושווי המימוש נטו שלו ${fmt(PERPETUAL.nrv)} ₪. רשמו את הפקודה.`,
      [
        { account: "עלות המכר", dr: PERPETUAL.cost - PERPETUAL.nrv },
        { account: "מלאי", cr: PERPETUAL.cost - PERPETUAL.nrv },
      ],
      `מורידים את המלאי לנמוך מבין השניים: ${fmt(PERPETUAL.cost)} − ${fmt(PERPETUAL.nrv)} = ${fmt(PERPETUAL.cost - PERPETUAL.nrv)}. ההורדה נכנסת לעלות המכר — לא להוצאות אחרות.`,
      ["עלות המכר", "מלאי", "הוצאות אחרות", "קניות"],
    ),
    journal(
      "closing-at-nrv",
      "מלאי סגירה בשיטה תקופתית",
      `החברה מנהלת מלאי בשיטה תקופתית. בספירה ב-31.12: עלות המלאי ${fmt(PERIODIC.cost)} ₪, ושווי המימוש נטו שלו ${fmt(PERIODIC.nrv)} ₪. רשמו את מלאי הסגירה.`,
      [
        { account: "מלאי סגירה מאזני", dr: PERIODIC.nrv },
        { account: "מלאי סגירה רווח או הפסד", cr: PERIODIC.nrv },
      ],
      `בשיטה תקופתית ההורדה ״מגולמת״: רושמים את מלאי הסגירה ישר בנמוך — ${fmt(PERIODIC.nrv)}. מלאי סגירה קטן יותר פירושו עלות מכר גדולה יותר.`,
      ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "עלות המכר", "קניות"],
    ),
    calc("writedown", "הורדת ערך", `במלאי הסגירה ${DOWN.qty} יחידות בעלות ${DOWN.cost} ₪ ליחידה. שווי המימוש נטו ליחידה: ${DOWN.nrv} ₪. בכמה מורידים את ערך המלאי?`, downAmount, [
      `השווי נמוך מהעלות ב-${DOWN.cost - DOWN.nrv} ₪ ליחידה.`,
      `${DOWN.qty} × ${DOWN.cost - DOWN.nrv} = ${fmt(downAmount)} ₪ — לעלות המכר.`,
    ]),
    calc(
      "nrv-unit",
      "שווי מימוש נטו",
      `מחיר המכירה הצפוי ${NRV.price} ₪ ליחידה; עלויות השלמה ${NRV.complete} ₪ ועלויות מכירה ${NRV.sell} ₪ ליחידה. עלות היחידה ${NRV.cost} ₪. באיזה ערך ליחידה יוצג המלאי?`,
      Math.min(NRV.cost, nrvUnit),
      [`שווי מימוש נטו = ${NRV.price} − ${NRV.complete} − ${NRV.sell} = ${nrvUnit} ₪.`, `הנמוך מבין העלות (${NRV.cost}) לשווי (${nrvUnit}): ${Math.min(NRV.cost, nrvUnit)} ₪.`],
    ),
    calc(
      "reversal",
      "ביטול הורדת ערך",
      `בשנה שעברה הורד ערכן של ${REVERSE.qty} יחידות מעלות ${REVERSE.cost} ₪ ל-${REVERSE.written} ₪. השנה הן עדיין במלאי, ושווי המימוש נטו עלה ל-${REVERSE.nrv} ₪. בכמה מבטלים?`,
      reversal,
      [
        `הערך החדש: הנמוך מבין העלות (${REVERSE.cost}) לשווי (${REVERSE.nrv}) — ${Math.min(REVERSE.cost, REVERSE.nrv)} ₪. לא עולים מעל העלות.`,
        `ביטול: ${REVERSE.qty} × (${Math.min(REVERSE.cost, REVERSE.nrv)} − ${REVERSE.written}) = ${fmt(reversal)} ₪ — מקטין את עלות המכר.`,
      ],
    ),
    calc(
      "owned",
      "מה נספר כמלאי",
      `בספירה במחסני החברה נמצא מלאי בעלות ${fmt(COUNT.warehouse)} ₪. בנוסף: סחורה בדרך בעלות ${fmt(COUNT.inTransit)} ₪ שהסיכון בה כבר עבר לחברה; סחורה של ספק אחר שמוחזקת במחסן במשגור, ${fmt(COUNT.heldForOthers)} ₪; וסחורה שהחברה מסרה במשגור לרשת וטרם נמכרה, ${fmt(COUNT.consignedOut)} ₪. מהו המלאי של החברה?`,
      owned,
      [
        `מוסיפים את מה ששלנו ונמצא בחוץ: בדרך (${fmt(COUNT.inTransit)}) ומשגור שמסרנו (${fmt(COUNT.consignedOut)}).`,
        `מורידים את מה שבמחסן ואינו שלנו: משגור של ספק אחר (${fmt(COUNT.heldForOthers)}).`,
        `${fmt(COUNT.warehouse)} + ${fmt(COUNT.inTransit)} − ${fmt(COUNT.heldForOthers)} + ${fmt(COUNT.consignedOut)} = ${fmt(owned)} ₪.`,
      ],
    ),
    choice("lower", "הנמוך מבין", "עלות המלאי 5,000 ₪, ושווי המימוש נטו שלו 5,600 ₪. באיזה סכום יוצג המלאי?", ["5,000 ₪", "5,600 ₪", "600 ₪", "5,300 ₪"], 0, "הנמוך מביניהם. רווח צפוי לא נרשם — הוא יוכר כשהמלאי יימכר."),
    choice("consigned", "משגור", "מלאי שמסרנו במשגור לסוכן, וטרם נמכר — של מי?", ["של הסוכן", "שלנו", "של הלקוח", "של אף אחד"], 1, "הבעלות והסיכון נשארים אצלנו עד המכירה ללקוח הסופי."),
    choice("bill-and-hold", "מכור והחזק", "מכור והחזק — האם נכלל במלאי שלנו?", ["כן, הוא במחסן שלנו", "לא, הוא כבר של הלקוח"], 1, "המכירה הוכרה והעלות עברה לעלות המכר. אנחנו רק מחזיקים את הסחורה בשביל הלקוח."),
  ],
  traps: [
    {
      id: "fair-value",
      prompt: "עלות היחידה 100 ₪; השווי ההוגן (מחיר בשוק) 90 ₪; שווי המימוש נטו של החברה 105 ₪. באיזה ערך ליחידה יוצג המלאי?",
      options: ["100 ₪", "90 ₪", "105 ₪", "95 ₪"],
      answer: 0,
      why: "משווים את העלות לשווי המימוש נטו של החברה: הנמוך מבין 100 ל-105 — 100 ₪. השווי ההוגן הוא מסיח.",
      traps: [
        "",
        "המלכודת: שווי הוגן ≠ שווי מימוש נטו. משווים לעלות רק את מה שהחברה צפויה לקבל, נטו.",
        "לא עולים מעל העלות — רווח צפוי לא נרשם.",
        "אין ממוצעים כאן: לוקחים את הנמוך מבין שני מספרים.",
      ],
    },
    {
      id: "reversal-cap",
      prompt: "בשנה שעברה הורד ערך המלאי ב-300 ₪. השנה שווי המימוש נטו עלה ב-500 ₪ מעל הערך בספרים. בכמה מבטלים?",
      options: ["300 ₪", "500 ₪", "0", "200 ₪"],
      answer: 0,
      why: "הביטול חסום בגובה ההורדה המקורית — המלאי חוזר לכל היותר לעלות.",
      traps: [
        "",
        "המלכודת: ביטול של 500 מעלה את המלאי 200 ₪ מעל העלות. רווח צפוי לא נרשם.",
        "מבטלים: כששווי המימוש נטו עולה, ההורדה מתבטלת — עד העלות.",
        "אין סיבה להפרש: הביטול מחזיר את כל ההורדה, כי השווי עלה מעל העלות.",
      ],
    },
    {
      id: "writedown-line",
      prompt: "איפה מוצגת הורדת ערך של מלאי לשווי מימוש נטו?",
      options: ["בעלות המכר", "בהוצאות אחרות", "בהוצאות מכירה", "ישירות בהון"],
      answer: 0,
      why: "ההורדה מגדילה את עלות המכר ומקטינה את הרווח הגולמי — בתקופה שבה היא קרתה.",
      traps: [
        "",
        "המלכודת: ״הוצאה אחרת״ נשמע הגיוני — אבל המלאי נמדד מחדש, וההפרש שייך לעלות המכר.",
        "זו לא עלות של מכירה — זו מדידה של המלאי.",
        "ההורדה עוברת ברווח או הפסד, לא ישירות להון.",
      ],
    },
  ],
  tips: [
    "מלאי נמדד לפי הנמוך מבין העלות לשווי מימוש נטו: הפסד צפוי — מיד; רווח צפוי — רק במכירה.",
    "שווי מימוש נטו = מחיר מכירה צפוי − עלויות השלמה − עלויות מכירה. לא שווי הוגן.",
    "הורדת הערך — לעלות המכר. ביטול — רק עד העלות המקורית.",
    "של מי המלאי? של מי שהסיכון עליו. משגור שמסרנו — שלנו; מכור והחזק — של הלקוח.",
  ],
};
