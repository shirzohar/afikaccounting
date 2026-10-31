import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

/**
 * The pen shop of this lesson's practice: two purchases and two sales, with
 * prices chosen so that every method comes out in whole shekels. The lesson's
 * test values the same year with the engine and expects these figures.
 */
export const ET = {
  buy1: { date: "1.2", qty: 100, price: 10 },
  sell1: { date: "1.4", qty: 50 },
  buy2: { date: "1.6", qty: 150, price: 14 },
  sell2: { date: "1.9", qty: 120, price: 25 },
};
const units = ET.buy1.qty + ET.buy2.qty;
const cost = ET.buy1.qty * ET.buy1.price + ET.buy2.qty * ET.buy2.price;
const closingUnits = units - ET.sell1.qty - ET.sell2.qty;
export const ET_FIFO_CLOSING = closingUnits * ET.buy2.price;
export const ET_WA_AVG = cost / units;
export const ET_WA_COGS = cost - closingUnits * ET_WA_AVG;
const left = (ET.buy1.qty - ET.sell1.qty) * ET.buy1.price;
export const ET_MA_AVG = (left + ET.buy2.qty * ET.buy2.price) / (ET.buy1.qty - ET.sell1.qty + ET.buy2.qty);
export const ET_MA_SALE2 = ET.sell2.qty * ET_MA_AVG;

const DATA = `חנות ״עט״, בלי מלאי פתיחה: ${ET.buy1.date} — קנתה ${ET.buy1.qty} יח׳ ב-${ET.buy1.price} ₪; ${ET.sell1.date} — מכרה ${ET.sell1.qty} יח׳; ${ET.buy2.date} — קנתה ${ET.buy2.qty} יח׳ ב-${ET.buy2.price} ₪; ${ET.sell2.date} — מכרה ${ET.sell2.qty} יח׳.`;

/** Lesson 3: the cost formulas — FIFO, the periodic weighted average and the moving average, on one table of movements. */
export const FORMULAS: StudyModule = {
  slug: "inventory-formulas",
  course: COURSE,
  n: 3,
  title: "FIFO וממוצע משוקלל",
  description: "כשהמחירים משתנים — איזו יחידה נמכרה? FIFO, ממוצע משוקלל תקופתי וממוצע נע על אותה טבלת תנועות, ולמה כל שיטה נותנת מספר אחר.",
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-formulas", title: "שתי נוסחאות עלות: התמונה הגדולה" },
    { id: "inv-fifo", title: "FIFO: טבלת התנועות והדרך התקופתית" },
    { id: "inv-fifo-shelf", title: "FIFO תמידי: מאיזו שכבה לקחנו" },
    { id: "inv-wa", title: "ממוצע משוקלל תקופתי" },
    { id: "inv-ma", title: "ממוצע משוקלל נע" },
    { id: "inv-compare", title: "שלוש שיטות, שלוש תוצאות" },
  ],
  exercises: [
    journal(
      "ma-sale",
      "מכירה בממוצע נע",
      `החברה מנהלת מלאי בשיטה תמידית, לפי ממוצע משוקלל נע. ב-${ET.sell2.date} מכרה ${ET.sell2.qty} יחידות ב-${ET.sell2.price} ₪ באשראי. העלות הממוצעת ליחידה לפני המכירה: ${ET_MA_AVG} ₪.`,
      [
        { account: "לקוחות", dr: ET.sell2.qty * ET.sell2.price },
        { account: "מכירות", cr: ET.sell2.qty * ET.sell2.price },
        { account: "עלות המכר", dr: ET_MA_SALE2 },
        { account: "מלאי", cr: ET_MA_SALE2 },
      ],
      `ההכנסה: ${ET.sell2.qty} × ${ET.sell2.price} = ${fmt(ET.sell2.qty * ET.sell2.price)}. העלות: כל יחידה יוצאת בממוצע שלפני המכירה — ${ET.sell2.qty} × ${ET_MA_AVG} = ${fmt(ET_MA_SALE2)}.`,
      ["לקוחות", "מכירות", "עלות המכר", "מלאי", "קניות", "מזומן"],
    ),
    calc("fifo-closing", "FIFO", `${DATA} מהו מלאי הסגירה לפי FIFO?`, ET_FIFO_CLOSING, [
      `כמות הסגירה: ${units} − ${ET.sell1.qty} − ${ET.sell2.qty} = ${closingUnits} יח׳.`,
      `ב-FIFO נשארות האחרונות: כל ${closingUnits} היחידות מהרכישה של ${ET.buy2.date}.`,
      `${closingUnits} × ${ET.buy2.price} = ${fmt(ET_FIFO_CLOSING)} ₪.`,
    ]),
    calc("wa-avg", "ממוצע תקופתי", `${DATA} מהי העלות הממוצעת ליחידה לפי ממוצע משוקלל תקופתי?`, ET_WA_AVG, [
      `כל העלות שהייתה זמינה: ${ET.buy1.qty} × ${ET.buy1.price} + ${ET.buy2.qty} × ${ET.buy2.price} = ${fmt(cost)} ₪.`,
      `חלקי כל היחידות: ${fmt(cost)} ÷ ${units} = ${ET_WA_AVG} ₪. תאריכי המכירות לא משנים.`,
    ]),
    calc("wa-cogs", "ממוצע תקופתי", `${DATA} מהי עלות המכר לפי ממוצע משוקלל תקופתי?`, ET_WA_COGS, [
      `הממוצע: ${fmt(cost)} ÷ ${units} = ${ET_WA_AVG} ₪; מלאי הסגירה: ${closingUnits} × ${ET_WA_AVG} = ${fmt(closingUnits * ET_WA_AVG)} ₪.`,
      `עלות המכר: ${fmt(cost)} − ${fmt(closingUnits * ET_WA_AVG)} = ${fmt(ET_WA_COGS)} ₪ (או ${ET.sell1.qty + ET.sell2.qty} × ${ET_WA_AVG}).`,
    ]),
    calc("ma-sale-cost", "ממוצע נע", `${DATA} החנות מנהלת ממוצע משוקלל נע. מהי עלות המכירה של ${ET.sell2.date}?`, ET_MA_SALE2, [
      `אחרי המכירה הראשונה נשארו ${ET.buy1.qty - ET.sell1.qty} יח׳ ב-${ET.buy1.price} ₪ = ${fmt(left)} ₪.`,
      `ממוצע חדש אחרי הקנייה: (${fmt(left)} + ${fmt(ET.buy2.qty * ET.buy2.price)}) ÷ (${ET.buy1.qty - ET.sell1.qty} + ${ET.buy2.qty}) = ${ET_MA_AVG} ₪.`,
      `עלות המכירה: ${ET.sell2.qty} × ${ET_MA_AVG} = ${fmt(ET_MA_SALE2)} ₪.`,
    ]),
    choice("lifo", "נוסחת עלות", "איזו נוסחת עלות אסורה לפי IAS 2?", ["FIFO", "ממוצע משוקלל תקופתי", "LIFO", "ממוצע משוקלל נע"], 2, "התקן אינו מתיר LIFO."),
    choice("fifo-which", "FIFO", "ב-FIFO, מאילו רכישות מוערך מלאי הסגירה?", ["מהראשונות", "מהאחרונות", "מממוצע של כולן", "מהזולה ביותר"], 1, "הוותיקות נמכרו קודם — נשארות האחרונות."),
    choice("ma-when", "ממוצע נע", "מתי מחשבים ממוצע חדש בשיטה הנעה?", ["אחרי כל מכירה", "אחרי כל קנייה", "בסוף השנה", "בכל חודש"], 1, "רק קנייה מוסיפה יחידות בעלות אחרת. מכירה יוצאת בממוצע הקיים."),
    choice(
      "falling-prices",
      "השוואת שיטות",
      "המחירים ירדו לאורך השנה. באיזו שיטה הרווח הגולמי הנמוך ביותר?",
      ["FIFO", "ממוצע תקופתי", "ממוצע נע", "בכולן זהה"],
      0,
      "ב-FIFO נמכרות קודם היחידות הוותיקות — כשהמחירים יורדים, הן היקרות. עלות המכר הגבוהה ביותר, והרווח הנמוך ביותר.",
    ),
  ],
  traps: [
    {
      id: "simple-average",
      prompt: "רכישות: 100 יח׳ ב-10 ₪ ו-300 יח׳ ב-14 ₪. מהו הממוצע המשוקלל?",
      options: ["13 ₪", "12 ₪", "14 ₪", "10 ₪"],
      answer: 0,
      why: "(100 × 10 + 300 × 14) ÷ 400 = 5,200 ÷ 400 = 13 ₪.",
      traps: [
        "",
        "המלכודת: ממוצע פשוט של המחירים, (10 + 14) ÷ 2. הכמויות שונות — שוקלים לפיהן.",
        "זה המחיר האחרון, לא ממוצע.",
        "זה המחיר הראשון — חשיבה של FIFO, לא ממוצע.",
      ],
    },
    {
      id: "wa-opening",
      prompt: "ממוצע תקופתי: מלאי פתיחה 100 יח׳ בעלות 900 ₪; רכישות 300 יח׳ ב-11 ₪ ו-200 יח׳ ב-12 ₪. מהו הממוצע?",
      options: ["11 ₪", "11.4 ₪", "11.5 ₪", "9 ₪"],
      answer: 0,
      why: "מלאי הפתיחה נכנס גם לסכום וגם לכמות: (900 + 3,300 + 2,400) ÷ (100 + 300 + 200) = 6,600 ÷ 600 = 11 ₪.",
      traps: [
        "",
        "המלכודת: ממוצע בלי מלאי הפתיחה, 5,700 ÷ 500. הפתיחה היא חלק ממה שהיה זמין.",
        "ממוצע פשוט של שני המחירים, בלי משקל ובלי הפתיחה.",
        "זו העלות ליחידה של מלאי הפתיחה בלבד.",
      ],
    },
    {
      id: "sale-moves-average",
      prompt: "ממוצע נע: ביתרה 200 יח׳ בעלות 2,600 ₪. נמכרו 50 יחידות. מהי העלות ליחידה של היתרה?",
      options: ["13 ₪", "17.33 ₪", "9.75 ₪", "תלוי במחיר המכירה"],
      answer: 0,
      why: "המכירה יוצאת בממוצע הקיים, 13 ₪: נשארות 150 יח׳ בעלות 1,950 ₪ — עדיין 13 ₪ ליחידה.",
      traps: [
        "",
        "המלכודת: הורדתם את היחידות אבל לא את העלות שלהן (2,600 ÷ 150).",
        "הורדתם את העלות אבל לא את היחידות (1,950 ÷ 200).",
        "מחיר המכירה קובע את ההכנסה, לא את העלות של מה שנשאר.",
      ],
    },
    {
      id: "fifo-always",
      prompt: "״FIFO נותן תמיד רווח גולמי גבוה יותר מממוצע משוקלל״. נכון?",
      options: ["לא — זה תלוי במגמת המחירים", "כן, תמיד", "כן, אבל רק בשיטה תמידית", "לא — ממוצע תמיד נותן רווח גבוה יותר"],
      answer: 0,
      why: "כשהמחירים עולים, FIFO נותן את הרווח הגבוה ביותר; כשהם יורדים — את הנמוך ביותר.",
      traps: [
        "",
        "המלכודת: ״תמיד״. כשהמחירים יורדים, FIFO מוכר קודם את היקרות — והרווח שלו הנמוך ביותר.",
        "השיטה התמידית לא משנה את התמונה: ב-FIFO היא נותנת את אותם מספרים כמו התקופתית.",
        "גם זה ״תמיד״ — וגם הוא תלוי במגמה.",
      ],
    },
  ],
  tips: [
    "FIFO: נשארות הרכישות האחרונות. לסגירה הולכים מהרכישה האחרונה אחורה — וזה זהה בתקופתי ובתמידי.",
    "ממוצע תקופתי: (עלות פתיחה + קניות) ÷ (יח׳ פתיחה + יח׳ שנקנו). ממוצע אחד לשנה; תאריכי המכירות לא משנים.",
    "ממוצע נע: ממוצע חדש רק אחרי קנייה. מכירה יוצאת בממוצע הקיים ולא משנה אותו.",
    "LIFO אסור. ואין שיטה שתמיד נותנת רווח גבוה יותר — זה תלוי במגמת המחירים.",
    "לא מעגלים באמצע — רק בסוף, או לפי הוראת השאלה.",
  ],
};
