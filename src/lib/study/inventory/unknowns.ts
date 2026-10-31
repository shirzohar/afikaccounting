import type { StudyModule } from "../types";
import { calc, COURSE, COURSE_HREF, fmt } from "./shared";

// Every figure below is computed here, from the question's own numbers.
const SALES = { cogs: 84_000, gp: 30 }; // percents
const sales = (SALES.cogs * 100) / (100 - SALES.gp);
const QTY = { avg: 8, cost: 4_000 };
const LAST = { available: 3_000, others: 1_900, counted: 350 };
const lastQty = LAST.available - LAST.others - LAST.counted;
const RETAIL = { opening: 30_000, purchases: 90_000, sales: 150_000, gp: 40 };
const retailCogs = (RETAIL.sales * (100 - RETAIL.gp)) / 100;
const retailClosing = RETAIL.opening + RETAIL.purchases - retailCogs;
const AVG = { openUnits: 200, openCost: 2_000, qty: 200, avg: 12 };
const avgTotal = (AVG.openUnits + AVG.qty) * AVG.avg;
const avgPrice = (avgTotal - AVG.openCost) / AVG.qty;
const DISC = { amount: 2_400, qty: 400, price: 75 };
const discPct = (DISC.amount * 100) / (DISC.qty * DISC.price);
const SOLD = { p: 60, cogs: 180_000 };
const soldPurchases = (SOLD.cogs * 100) / SOLD.p;

/** Lesson 5: unknowns — one equation with one unknown, and the patterns that recur in exams. */
export const UNKNOWNS: StudyModule = {
  slug: "inventory-unknowns",
  course: COURSE,
  n: 5,
  title: "חילוץ נעלמים",
  description: "משוואה אחת עם נעלם אחד: עץ זיהוי, שרשרת המשוואות של הדוח, ותבניות לכמות, למחיר, לשיעור הנחה ולמלאי בלי ספירה.",
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-unknowns", title: "עץ זיהוי: מה נתון ומה חסר" },
    { id: "inv-chain", title: "תבנית 1: שרשרת המשוואות" },
    { id: "inv-qty", title: "כמות חסרה: תבניות 2–3" },
    { id: "inv-gp", title: "שיעור רווח גולמי: תבניות 4–5" },
    { id: "inv-avg-price", title: "מחיר רכישה מממוצע: תבנית 6" },
    { id: "inv-pct", title: "אחוזים: תבניות 7–8" },
  ],
  exercises: [
    calc("sales-from-gp", "מכירות משיעור גולמי", `עלות המכר ${fmt(SALES.cogs)} ₪, ושיעור הרווח הגולמי ${SALES.gp}%. מהן המכירות?`, sales, [
      `שיעור גולמי של ${SALES.gp}% אומר: עלות המכר היא ${100 - SALES.gp}% מהמכירות.`,
      `מכירות = ${fmt(SALES.cogs)} ÷ ${100 - SALES.gp}% = ${fmt(sales)} ₪.`,
    ]),
    calc("qty-ma", "כמות מכירה בממוצע נע", `ממוצע נע: העלות הממוצעת לפני מכירה ${QTY.avg} ₪, ועלות המכירה ${fmt(QTY.cost)} ₪. כמה יחידות נמכרו?`, QTY.cost / QTY.avg, [
      "בממוצע נע כל יחידה יוצאת בממוצע שלפני המכירה.",
      `כמות = ${fmt(QTY.cost)} ÷ ${QTY.avg} = ${fmt(QTY.cost / QTY.avg)} יח׳.`,
    ]),
    calc(
      "last-sale",
      "כמות המכירה האחרונה",
      `במהלך השנה היו זמינות ${fmt(LAST.available)} יח׳. כל המכירות ידועות חוץ מהאחרונה — יחד ${fmt(LAST.others)} יח׳. בספירה בסוף השנה נמצאו ${LAST.counted} יח׳. כמה יחידות נמכרו במכירה האחרונה?`,
      lastQty,
      ["מה שהיה = מה שיצא + מה שנשאר.", `${fmt(LAST.available)} − ${fmt(LAST.others)} − ${LAST.counted} = ${fmt(lastQty)} יח׳.`],
    ),
    calc(
      "retail-closing",
      "מלאי סגירה בשיטה הקמעונאית",
      `אין ספירה. מלאי פתיחה ${fmt(RETAIL.opening)} ₪, קניות ${fmt(RETAIL.purchases)} ₪, מכירות ${fmt(RETAIL.sales)} ₪, ושיעור הרווח הגולמי הרגיל ${RETAIL.gp}%. מהו מלאי הסגירה?`,
      retailClosing,
      [
        `עלות המכר מתוך המכירות: ${fmt(RETAIL.sales)} × ${100 - RETAIL.gp}% = ${fmt(retailCogs)} ₪.`,
        `סגירה = ${fmt(RETAIL.opening)} + ${fmt(RETAIL.purchases)} − ${fmt(retailCogs)} = ${fmt(retailClosing)} ₪.`,
      ],
    ),
    calc(
      "price-from-avg",
      "מחיר רכישה מממוצע",
      `ממוצע תקופתי. מלאי פתיחה ${AVG.openUnits} יח׳ בעלות ${fmt(AVG.openCost)} ₪; נקנו ${AVG.qty} יח׳ במחיר לא ידוע. העלות הממוצעת לשנה: ${AVG.avg} ₪. מה היה מחיר הרכישה ליחידה?`,
      avgPrice,
      [
        `סך העלות = הממוצע × כל היחידות = ${AVG.avg} × ${AVG.openUnits + AVG.qty} = ${fmt(avgTotal)} ₪.`,
        `מזה ${fmt(AVG.openCost)} של הפתיחה; נשאר לרכישה ${fmt(avgTotal - AVG.openCost)} ₪.`,
        `מחיר = ${fmt(avgTotal - AVG.openCost)} ÷ ${AVG.qty} = ${fmt(avgPrice)} ₪.`,
      ],
    ),
    calc(
      "discount-rate",
      "שיעור הנחה",
      `הספק נותן אחוז הנחה קבוע שלא נמסר. ברכישה של ${DISC.qty} יח׳ ב-${DISC.price} ₪ התקבלה הנחה של ${fmt(DISC.amount)} ₪. מהו שיעור ההנחה, באחוזים?`,
      discPct,
      [`מחיר לפני הנחה: ${DISC.qty} × ${DISC.price} = ${fmt(DISC.qty * DISC.price)} ₪.`, `שיעור = ${fmt(DISC.amount)} ÷ ${fmt(DISC.qty * DISC.price)} = ${discPct}%.`],
    ),
    calc(
      "purchases-from-pct",
      "קניות מאחוז שנמכר",
      `חברה שהוקמה השנה מכרה ${SOLD.p}% מערך מה שקנתה. עלות המכר: ${fmt(SOLD.cogs)} ₪. בכמה קנתה?`,
      soldPurchases,
      [`בלי מלאי פתיחה, עלות המכר = ${SOLD.p}% × הקניות.`, `קניות = ${fmt(SOLD.cogs)} ÷ ${SOLD.p}% = ${fmt(soldPurchases)} ₪.`],
    ),
  ],
  traps: [
    {
      id: "gp-markup",
      prompt: "עלות המכר 60,000 ₪, ושיעור הרווח הגולמי 25%. מהן המכירות?",
      options: ["80,000 ₪", "75,000 ₪", "45,000 ₪", "240,000 ₪"],
      answer: 0,
      why: "עלות המכר היא 75% מהמכירות: 60,000 ÷ 0.75 = 80,000 ₪.",
      traps: [
        "",
        "המלכודת: 60,000 × 1.25 — תוספת על העלות. שיעור הרווח הגולמי הוא אחוז מהמכירות, לא מהעלות.",
        "60,000 × 75% מקטין את העלות — אבל המכירות גדולות ממנה.",
        "60,000 ÷ 25% מחלק ברווח במקום בעלות.",
      ],
    },
    {
      id: "fire-year",
      prompt: "המחסן נשרף ב-30.6. כדי לחשב בשיטה הקמעונאית כמה מלאי נשרף, אילו קניות ומכירות לוקחים?",
      options: ["רק עד תאריך השריפה", "של כל השנה", "של השנה הקודמת", "רק אחרי השריפה"],
      answer: 0,
      why: "מגלגלים את המלאי עד הרגע של השריפה: פתיחה + קניות עד 30.6 − עלות המכירות עד 30.6. מורידים את מה שניצל.",
      traps: [
        "",
        "המלכודת: גלגול לכל השנה מכניס קניות ומכירות שקרו אחרי השריפה.",
        "השנה הקודמת נותנת רק את מלאי הפתיחה.",
        "אחרי השריפה המלאי כבר לא היה שם.",
      ],
    },
    {
      id: "chain-link",
      prompt: "בדוח עם סימני שאלה לשנתיים חסר מלאי הפתיחה של השנה השנייה. איפה מוצאים אותו?",
      options: ["במלאי הסגירה של השנה הראשונה", "במלאי הפתיחה של השנה הראשונה", "בקניות של השנה השנייה פחות עלות המכר שלה", "אי אפשר — זה נתון חסר"],
      answer: 0,
      why: "מה שעמד במחסן ב-31.12 הוא מה שעומד בו ב-1.1: פתיחה(t) = סגירה(t−1).",
      traps: [
        "",
        "זו נקודת ההתחלה של השנה הראשונה — שנה לפני.",
        "קניות פחות עלות המכר הן השינוי במלאי במהלך השנה, לא הפתיחה.",
        "אפשר: זו החוליה שמחברת בין השנים בשרשרת המשוואות.",
      ],
    },
  ],
  tips: [
    "מחפשים משוואה אחת עם נעלם אחד: פותרים, מציבים, וממשיכים עד שאין נעלמים.",
    "מכירות = עלות המכר ÷ (1 − שיעור גולמי) — לא עלות המכר × (1 + שיעור).",
    "סגירה של שנה = פתיחה של הבאה. זו החוליה בין השנים.",
    "כמות חסרה: מה שהיה = מה שיצא + מה שנשאר. בממוצע נע — עלות המכירה ÷ הממוצע שלפניה.",
    "שריפה: גלגול רק עד תאריך השריפה, ומורידים את מה שניצל.",
  ],
};
