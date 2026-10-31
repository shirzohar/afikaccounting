import { Q8_TB, round2 } from "@/lib/learn/basics";
import type { StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt, practice } from "./shared";

// Fresh figures for this lesson's own questions; every answer below is computed from them.
const SUPPLIERS = { opening: 20_000, purchases: 35_000, paid: 41_000 };
const suppliersClose = SUPPLIERS.opening + SUPPLIERS.purchases - SUPPLIERS.paid;
const RET = { opening: 40_000, profit: 25_000, dividend: 10_000 };
const YEAR = { income: 300_000, expenses: 260_000 };
const yearProfit = round2(YEAR.income - YEAR.expenses);

/** Lesson 3: from T-accounts to the statements — the trial balance, retained earnings, and closing the year. */
export const BOOKS: StudyModule = {
  slug: "basics-books",
  course: COURSE,
  n: 3,
  title: "מכרטיסי T ועד הדוחות",
  description: "כרטיסי T ויתרות, מאזן בוחן, עודפים, ומהיתרות לדוחות — ומה עובר לשנה הבאה ומה מתאפס.",
  backHref: COURSE_HREF,
  screens: [
    { id: "taccounts", title: "כרטיסי T: כל חשבון בכרטיס משלו" },
    { id: "trial", title: "מאזן בוחן: כל היתרות בטבלה אחת" },
    { id: "trialCheck", title: "תרגול הבנה: חובה או זכות?" },
    { id: "retained", title: "עודפים" },
    { id: "reports", title: "מהיתרות לדוחות" },
    { id: "carry", title: "מעבר משנה לשנה" },
  ],
  // The recorded lesson, slide by slide: its slides fade into one another, and each chapter starts with the fade.
  videos: [
    {
      src: "/videos/basics-books.mp4",
      title: "מכרטיסי T ועד הדוחות — לאן הולכות פקודות היומן",
      duration: 250,
      chapters: [
        { at: 0, title: "פתיחה" },
        { at: 15, title: "הדרך לדוחות: ארבע תחנות" },
        { at: 30, title: "כרטיס T: מזומן", screen: "taccounts" },
        { at: 76, title: "מאזן בוחן", screen: "trial" },
        { at: 119, title: "מהיתרות לדוחות", screen: "reports" },
        { at: 151, title: "עודפים", screen: "retained" },
        { at: 183, title: "מעבר משנה לשנה", screen: "carry" },
        { at: 217, title: "לסיכום" },
      ],
    },
  ],
  exercises: [
    {
      ...practice("q10"),
      prompt: "בנו את כרטיס המזומן של מוסך ״גלגל״ לחודש מרץ: גררו כל תנועה לצד שלה בכרטיס — חובה או זכות. אחר כך מצאו את יתרת הסגירה ואת הצד שלה.",
      // The same amounts as the practice set's question, each with what happened, so the side has to be worked out.
      table: {
        kind: "card",
        account: "מזומן",
        items: [
          { label: "יתרת פתיחה: מזומן בקופה ב-1.3", amount: 7_000, side: "dr" },
          { label: "לקוח שילם על תיקון", amount: 12_000, side: "dr" },
          { label: "מכירת חלקים במזומן", amount: 4_500, side: "dr" },
          { label: "תשלום לספק החלקים", amount: 9_800, side: "cr" },
          { label: "תשלום חשבון החשמל", amount: 2_200, side: "cr" },
        ],
      },
    },
    {
      kind: "choice",
      id: "suppliers-card",
      skill: "כרטיס T",
      prompt: `בכרטיס ספקים: יתרת פתיחה ${fmt(SUPPLIERS.opening)} בזכות, קניות באשראי ${fmt(SUPPLIERS.purchases)}, ותשלומים לספקים ${fmt(SUPPLIERS.paid)}. מהי יתרת הסגירה?`,
      options: [`${fmt(suppliersClose)} בזכות`, `${fmt(suppliersClose)} בחובה`, `${fmt(SUPPLIERS.paid - SUPPLIERS.purchases)} בחובה`, `${fmt(SUPPLIERS.opening + SUPPLIERS.purchases + SUPPLIERS.paid)} בזכות`],
      answer: 0,
      steps: [
        `סך הזכות (החוב גדל): פתיחה ${fmt(SUPPLIERS.opening)} + קניות באשראי ${fmt(SUPPLIERS.purchases)} = ${fmt(SUPPLIERS.opening + SUPPLIERS.purchases)}.`,
        `סך החובה (החוב קטן): תשלומים ${fmt(SUPPLIERS.paid)}.`,
        `הזכות גדולה יותר, ולכן היתרה בזכות: ${fmt(SUPPLIERS.opening + SUPPLIERS.purchases)} − ${fmt(SUPPLIERS.paid)} = ${fmt(suppliersClose)}.`,
      ],
    },
    {
      ...practice("q8"),
      prompt: "בנו את מאזן הבוחן של המשתלה של שירן: גררו כל חשבון לצד שלו — חובה או זכות. יתרת המזומן חסרה — מצאו אותה, כך שמאזן הבוחן יתאזן.",
      table: { kind: "trial", balances: Q8_TB, missing: "מזומן" },
    },
    {
      kind: "number",
      id: "retained-close",
      skill: "עודפים",
      prompt: `עודפי הפתיחה של חברה הם ${fmt(RET.opening)} ₪. השנה הרוויחה ${fmt(RET.profit)} ₪ וחילקה לבעלים ${fmt(RET.dividend)} ₪. מהם עודפי הסגירה?`,
      answer: RET.opening + RET.profit - RET.dividend,
      steps: ["עודפי סגירה = עודפי פתיחה + רווח השנה − מה שחולק.", `${fmt(RET.opening)} + ${fmt(RET.profit)} − ${fmt(RET.dividend)} = ${fmt(RET.opening + RET.profit - RET.dividend)}.`],
    },
    {
      kind: "number",
      id: "profit-to-retained",
      skill: "הרווח עובר לעודפים",
      prompt: `בסוף השנה: סך ההכנסות ${fmt(YEAR.income)} ₪ וסך ההוצאות ${fmt(YEAR.expenses)} ₪. בכמה גדלים העודפים של החברה?`,
      answer: yearProfit,
      steps: [
        `רווח השנה: ${fmt(YEAR.income)} − ${fmt(YEAR.expenses)} = ${fmt(yearProfit)}.`,
        "בסוף השנה הרווח עובר לעודפים — הרווחים שהחברה צברה ולא חילקה — והכנסות והוצאות מתחילות את השנה הבאה מאפס.",
        `לכן העודפים גדלים ב-${fmt(yearProfit)}. בהפסד הם היו קטנים.`,
      ],
    },
  ],
  traps: [
    {
      id: "tb-balanced",
      prompt: "מאזן הבוחן מאוזן: סך החובה שווה לסך הזכות. האם זה אומר שאין בספרים טעויות?",
      options: ["לא בהכרח", "כן, תמיד", "כן, אם אין חשבונות חדשים", "רק אם העודפים בזכות"],
      answer: 0,
      why: "פקודה שלמה שנרשמה לחשבון הלא נכון, או פקודה שנשכחה לגמרי, לא יפריעו לאיזון. האיזון תופס רק טעויות חד-צדדיות.",
      traps: [
        "",
        "המלכודת: איזון נראה כמו הוכחה. אבל טעות שנרשמה באותו סכום בשני הצדדים שומרת על האיזון.",
        "חשבונות חדשים אינם קשורים — גם בלעדיהם אפשר לטעות בצורה מאוזנת.",
        "הצד של העודפים לא מעיד על נכונות הרישום.",
      ],
    },
    {
      id: "new-company-retained",
      prompt: "חברה הוקמה ב-1.1 השנה, ובסוף השנה הרוויחה 30,000 ₪. מהם עודפי הפתיחה שלה?",
      options: ["0 ₪", "30,000 ₪", "אי אפשר לדעת", "כמו הון הבעלים"],
      answer: 0,
      why: "לחברה שנפתחה השנה אין רווחים מהעבר: העודפים לתחילת השנה הם 0. הרווח של 30,000 הוא עודפי הסגירה.",
      traps: [
        "",
        "המלכודת: 30,000 הם עודפי הסגירה — אחרי שהרווח עבר לעודפים. בפתיחה עוד לא היה רווח.",
        "חברה חדשה — אין לה עבר, ולכן אפשר לדעת: 0.",
        "הון הבעלים הוא ההשקעה, לא רווחים שנצברו.",
      ],
    },
    {
      id: "income-next-year",
      prompt: "ב-31.12 יתרת ״מכירות״ היא 500,000 ₪. מה היתרה שלה ב-1.1 בשנה הבאה?",
      options: ["0 ₪", "500,000 ₪", "500,000 ₪ בחובה", "היא עוברת להון בעלים"],
      answer: 0,
      why: "מכירות הן חשבון תוצאתי: בסוף השנה הוא מתאפס, והרווח עובר לעודפים. כל שנה מתחילה מאפס.",
      traps: [
        "",
        "המלכודת: רק חשבונות מאזניים ממשיכים. אילו המכירות היו ממשיכות, היינו סופרים אותן גם בשנה הבאה.",
        "היתרה לא עוברת לצד השני — היא מתאפסת. מה שנשאר מהשנה הוא הרווח, והוא עובר לעודפים.",
        "הרווח עובר לעודפים, לא להון הבעלים — והמכירות עצמן מתאפסות.",
      ],
    },
    {
      id: "retained-debit",
      prompt: "במאזן הבוחן העודפים ביתרת חובה. מה זה אומר?",
      options: ["הפסדים צבורים", "רווחים צבורים", "יש טעות ברישום", "החברה חילקה דיבידנד"],
      answer: 0,
      why: "כשהעסק הפסיד לאורך השנים יותר משהרוויח, יתרת העודפים עוברת לחובה — הפסדים צבורים.",
      traps: [
        "",
        "רווחים מגדילים את העודפים בזכות. יתרת חובה היא ההפך.",
        "המלכודת: הון ״אמור״ להיות בזכות — אבל עודפים יכולים לרדת מתחת לאפס, ואז הם בחובה.",
        "חלוקה לבעלים מקטינה את העודפים, אבל יתרת עודפים בחובה נקראת הפסדים צבורים: ההפסדים לאורך השנים גדולים מהרווחים.",
      ],
    },
  ],
  tips: [
    "יתרת כרטיס: סך חובה מול סך זכות — היתרה בצד הגדול, בגובה ההפרש. אל תשכחו את יתרת הפתיחה.",
    "חסרה יתרה במאזן בוחן? היא ההפרש: סך החובה חייב להיות שווה לסך הזכות.",
    "עודפי סגירה = פתיחה + רווח (− הפסד) − חלוקה. חברה חדשה: פתיחה 0.",
    "מאזני ממשיך, תוצאתי מתאפס: בסוף השנה הרווח עובר לעודפים, והכנסות והוצאות מתחילות מאפס.",
  ],
};
