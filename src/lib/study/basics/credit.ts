import { type Entry, round2 } from "@/lib/learn/basics";
import { ALLOW, AR, EXPENSE, SELF, year } from "@/lib/learn/credit-losses";
import type { JournalExercise, StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt } from "./shared";

/** A journal-entry question: the event, the answer's lines, why, and the accounts offered (the answer's and some that tempt). */
const journal = (id: string, skill: string, text: string, lines: Entry["lines"], why: string, accounts: string[]): JournalExercise => ({
  kind: "journal",
  id,
  skill,
  entry: { id: "1", text, lines, why },
  accounts,
});

// Every figure below is computed here, or by the credit-loss model, from the question's own numbers.
const FIRST = { gross: 300_000, rate: 0.04 }; // a new business's first year end
const firstAllowance = round2(FIRST.gross * FIRST.rate);
const BANKRUPT = 7_000;
const RECOVERED = 3_000;
const [TOPUP, OPENING, REVERSAL] = SELF;
// A troubled customer beside the general rate.
const SPECIFIC = { debt: 40_000, rate: 0.5, general: 0.05 };
const SPEC = year({
  openingAR: 600_000,
  openingAllowance: 20_000,
  creditSales: 1_500_000,
  collections: 1_400_000,
  required: (g) => SPECIFIC.debt * SPECIFIC.rate + (g - SPECIFIC.debt) * SPECIFIC.general,
});
// A recovered debt, and a credit purchase that has nothing to do with customers.
const BACK = { openingAR: 400_000, openingAllowance: 16_000, creditSales: 900_000, collections: 880_000, writeOffs: 10_000, recovered: 2_000, rate: 0.04, purchases: 300_000 };
const RECOVERY = year({ ...BACK, required: (g) => g * BACK.rate });
const NET = { gross: 300_000, rate: 0.03 };
const FROM_NET = { net: 475_000, rate: 0.05 };
const GAP = { opening: 300_000, closing: 350_000, sales: 1_000_000, writeOffs: 6_000 };
const CARD = { opening: 500_000, sales: 1_200_000, collections: 869_000, writeOffs: 31_000 };

const pct = (r: number) => `${round2(r * 100)}%`;
const adjLines = (x: { adj: Entry }) => x.adj.lines;
const amountOf = (x: { adj: Entry }) => x.adj.lines[0].dr!;

/** Lesson 5: credit losses — the allowance against customers, its entries, the three-rule method, and unknowns up to an exam question. */
export const CREDIT: StudyModule = {
  slug: "basics-credit",
  course: COURSE,
  n: 5,
  title: "הפסדי אשראי",
  description: "לקוחות ברוטו, הפרשה ונטו; מחיקה וגבייה של חוב אבוד; מתווה 3 הכללים עם שני כרטיסי T — ועד שאלה ברמת בחינה.",
  backHref: COURSE_HREF,
  screens: [
    { id: "cl-idea", title: "הרעיון: לא כל לקוח ישלם" },
    { id: "cl-net", title: "ברוטו, הפרשה ונטו" },
    { id: "cl-allowance", title: "ההפרשה של רונית: הוצאה מול כרית" },
    { id: "cl-terms", title: "חוב אבוד, חוב ספציפי — והנוסחה" },
    { id: "cl-entries", title: "הפקודות של השנה" },
    { id: "cl-method", title: "מתווה 3 הכללים" },
    { id: "cl-extract", title: "חילוץ נעלמים: ארבע נוסחאות" },
    { id: "cl-first", title: "דוגמה ראשונה: אלון בע״מ" },
    { id: "cl-scenarios", title: "שלושה תרחישים, שלושה נעלמים" },
    { id: "cl-specific", title: "הפרשה ספציפית וכללית" },
    { id: "cl-recovery", title: "מסיחים וחוב שחזר" },
    { id: "cl-exam", title: "שאלה ברמת בחינה: גלבוע בע״מ" },
    { id: "cl-calc", title: "מחשבון: בדקו את התשובה שלכם" },
  ],
  tools: [{ screen: "cl-calc", label: "מחשבון הפסדי אשראי" }],
  exercises: [
    journal(
      "first-allowance",
      "הפרשה ראשונה",
      `עסק חדש. ב-31.12, בסוף השנה הראשונה, יתרת הלקוחות ${fmt(FIRST.gross)} ₪, וההנהלה מעריכה ש-${pct(FIRST.rate)} מהם לא ייגבו. רשמו את פקודת ההפרשה.`,
      [
        { account: EXPENSE, dr: firstAllowance },
        { account: ALLOW, cr: firstAllowance },
      ],
      `${fmt(FIRST.gross)} × ${pct(FIRST.rate)} = ${fmt(firstAllowance)}. ההפרשה נפתחה ב-0, ולכן כל הסכום הוא הוצאה של השנה — השנה שבה נעשו המכירות. בזכות: ההפרשה, שמקטינה את הלקוחות.`,
      [EXPENSE, ALLOW, AR, "מזומן"],
    ),
    journal(
      "write-off",
      "מחיקת חוב אבוד",
      `לקוח שחייב ${fmt(BANKRUPT)} ₪ פשט רגל, והחוב לא ייגבה. רשמו את מחיקת החוב.`,
      [
        { account: ALLOW, dr: BANKRUPT },
        { account: AR, cr: BANKRUPT },
      ],
      "החוב יוצא מהלקוחות (זכות) ומהכרית שהכנו מראש (חובה). אין כאן הוצאה: ההפסד כבר נרשם כשהפרשנו, והלקוחות נטו לא משתנים.",
      [ALLOW, AR, EXPENSE, "מזומן"],
    ),
    journal(
      "recovery-back",
      "חוב שחזר",
      `חוב של ${fmt(RECOVERED)} ₪ שנמחק לפני שנתיים נגבה היום במזומן. רשמו את השלב הראשון — החזרת החוב לספרים.`,
      [
        { account: AR, dr: RECOVERED },
        { account: ALLOW, cr: RECOVERED },
      ],
      "מבטלים את המחיקה: החוב חוזר ללקוחות (חובה) ולהפרשה (זכות). בשלב השני הוא נגבה כרגיל — ח׳ מזומן / ז׳ לקוחות.",
      [AR, ALLOW, "מזומן", EXPENSE],
    ),
    journal(
      "top-up",
      "השלמת ההפרשה",
      `לקוחות ב-1.1: ${fmt(TOPUP.openingAR)} ₪, הפרשה ${fmt(TOPUP.openingAllowance)} ₪. במהלך השנה: מכירות באשראי ${fmt(TOPUP.creditSales!)} ₪, גבייה ${fmt(TOPUP.collections!)} ₪, מחיקת חובות אבודים ${fmt(TOPUP.writeOffs!)} ₪. ההפרשה הנדרשת: 5% מהלקוחות. רשמו את פקודת ההתאמה ב-31.12.`,
      adjLines(TOPUP),
      `לקוחות בסוף השנה: ${fmt(TOPUP.mid.gross)}, ולכן נדרשת ${fmt(TOPUP.required)}. בכרטיס ההפרשה המחיקה (${fmt(TOPUP.writeOffs!)}) גדולה מהפתיחה (${fmt(TOPUP.openingAllowance)}) — לפני ההתאמה יש ${fmt(-TOPUP.mid.allowance)} בחובה. כדי להגיע ל-${fmt(TOPUP.required)} בזכות: ${fmt(amountOf(TOPUP))}.`,
      [EXPENSE, ALLOW, AR, "מזומן"],
    ),
    journal(
      "specific",
      "הפרשה ספציפית וכללית",
      `לקוחות ב-1.1: ${fmt(SPEC.openingAR)} ₪, הפרשה ${fmt(SPEC.openingAllowance)} ₪. מכירות באשראי ${fmt(SPEC.creditSales!)} ₪, גבייה ${fmt(SPEC.collections!)} ₪. ב-31.12 לקוח בקשיים חייב ${fmt(SPECIFIC.debt)} ₪ — הפרשה ספציפית ${pct(SPECIFIC.rate)}; על שאר הלקוחות ${pct(SPECIFIC.general)}. רשמו את פקודת ההתאמה.`,
      adjLines(SPEC),
      `לקוחות בסוף השנה: ${fmt(SPEC.mid.gross)}. ספציפית: ${fmt(SPECIFIC.debt)} × ${pct(SPECIFIC.rate)} = ${fmt(SPECIFIC.debt * SPECIFIC.rate)}. כללית — בלי הלקוח הספציפי: (${fmt(SPEC.mid.gross)} − ${fmt(SPECIFIC.debt)}) × ${pct(SPECIFIC.general)} = ${fmt(round2((SPEC.mid.gross - SPECIFIC.debt) * SPECIFIC.general))}. נדרשת ${fmt(SPEC.required)}, יש ${fmt(SPEC.mid.allowance)}: ההוצאה ${fmt(amountOf(SPEC))}.`,
      [EXPENSE, ALLOW, AR, "מזומן"],
    ),
    journal(
      "reversal",
      "ביטול הפרשה עודפת",
      `לקוחות ב-1.1: ${fmt(REVERSAL.openingAR)} ₪, הפרשה ${fmt(REVERSAL.openingAllowance)} ₪. במהלך השנה: מכירות באשראי ${fmt(REVERSAL.creditSales!)} ₪, גבייה ${fmt(REVERSAL.collections!)} ₪. בסוף השנה לקוח בקשיים חייב 50,000 ₪ (הפרשה ספציפית 80%), ועל השאר 3%. רשמו את פקודת ההתאמה ב-31.12.`,
      adjLines(REVERSAL),
      `לקוחות בסוף השנה: ${fmt(REVERSAL.mid.gross)}. ספציפית 40,000 + כללית 3% × ${fmt(REVERSAL.mid.gross - 50_000)} = ${fmt(REVERSAL.required - 40_000)} → נדרשת ${fmt(REVERSAL.required)}. בכרטיס כבר ${fmt(REVERSAL.mid.allowance)} — יותר מדי. מבטלים ${fmt(amountOf(REVERSAL))}: ההפרשה קטנה (חובה), וההוצאה קטנה (זכות).`,
      [ALLOW, EXPENSE, AR, "מזומן"],
    ),
    journal(
      "with-recovery",
      "התאמה עם חוב שחזר",
      `לקוחות ב-1.1: ${fmt(BACK.openingAR)} ₪, הפרשה ${fmt(BACK.openingAllowance)} ₪. במהלך השנה: מכירות באשראי ${fmt(BACK.creditSales)} ₪, גבייה ${fmt(BACK.collections)} ₪, קניות באשראי ${fmt(BACK.purchases)} ₪, מחיקת חוב אבוד ${fmt(BACK.writeOffs)} ₪, וגבייה של חוב שנמחק בשנה שעברה ${fmt(BACK.recovered)} ₪. ההפרשה הנדרשת: ${pct(BACK.rate)} מהלקוחות. רשמו את פקודת ההתאמה ב-31.12.`,
      adjLines(RECOVERY),
      `הקניות באשראי שייכות לספקים — לא נוגעות בלקוחות. לקוחות בסוף השנה: ${fmt(RECOVERY.mid.gross)} (החוב שחזר נכנס ויצא), ולכן נדרשת ${fmt(RECOVERY.required)}. בהפרשה לפני ההתאמה: ${fmt(BACK.openingAllowance)} − ${fmt(BACK.writeOffs)} + ${fmt(BACK.recovered)} = ${fmt(RECOVERY.mid.allowance)}. ההוצאה: ${fmt(amountOf(RECOVERY))}.`,
      [EXPENSE, ALLOW, AR, "ספקים", "קניות"],
    ),
    {
      kind: "number",
      id: "closing-gross",
      skill: "כרטיס הלקוחות",
      prompt: "סדרו את התנועות בכרטיס הלקוחות לשנה. מה יתרת הסגירה — הלקוחות ברוטו ב-31.12?",
      answer: CARD.opening + CARD.sales - CARD.collections - CARD.writeOffs,
      table: {
        kind: "card",
        account: AR,
        items: [
          { label: "יתרת פתיחה ב-1.1", amount: CARD.opening, side: "dr" },
          { label: "מכירות באשראי", amount: CARD.sales, side: "dr" },
          { label: "גבייה מלקוחות", amount: CARD.collections, side: "cr" },
          { label: "מחיקת חובות אבודים", amount: CARD.writeOffs, side: "cr" },
        ],
      },
      steps: [
        "לקוחות הם נכס: היתרה והמכירות בחובה; הגבייה והמחיקות מקטינות אותם — בזכות.",
        `${fmt(CARD.opening)} + ${fmt(CARD.sales)} − ${fmt(CARD.collections)} − ${fmt(CARD.writeOffs)} = ${fmt(CARD.opening + CARD.sales - CARD.collections - CARD.writeOffs)}.`,
      ],
    },
    {
      kind: "number",
      id: "net-customers",
      skill: "לקוחות נטו",
      prompt: `לקוחות ברוטו ב-31.12: ${fmt(NET.gross)} ₪, וההפרשה להפסדי אשראי היא ${pct(NET.rate)} מהם. באיזה סכום יוצגו הלקוחות בסך הנכסים במאזן?`,
      answer: round2(NET.gross * (1 - NET.rate)),
      steps: [
        `ההפרשה: ${fmt(NET.gross)} × ${pct(NET.rate)} = ${fmt(round2(NET.gross * NET.rate))}.`,
        `לקוחות נטו = ברוטו − הפרשה = ${fmt(NET.gross)} − ${fmt(round2(NET.gross * NET.rate))} = ${fmt(round2(NET.gross * (1 - NET.rate)))}.`,
      ],
    },
    {
      kind: "number",
      id: "gross-from-net",
      skill: "מנטו לברוטו",
      prompt: `במאזן ליום 31.12 הוצגו לקוחות נטו ${fmt(FROM_NET.net)} ₪. ההפרשה היא ${pct(FROM_NET.rate)} מהלקוחות ברוטו. מה הלקוחות ברוטו?`,
      answer: round2(FROM_NET.net / (1 - FROM_NET.rate)),
      steps: [
        `הנטו הוא ${pct(1 - FROM_NET.rate)} מהברוטו — לכן מחלקים, לא מכפילים ב-${pct(FROM_NET.rate)}.`,
        `${fmt(FROM_NET.net)} ÷ ${pct(1 - FROM_NET.rate)} = ${fmt(round2(FROM_NET.net / (1 - FROM_NET.rate)))}.`,
      ],
    },
    {
      kind: "number",
      id: "collections",
      skill: "נעלם בגבייה",
      prompt: `לקוחות ב-1.1: ${fmt(GAP.opening)} ₪, וב-31.12: ${fmt(GAP.closing)} ₪. במהלך השנה: מכירות באשראי ${fmt(GAP.sales)} ₪, מחיקת חובות ${fmt(GAP.writeOffs)} ₪. כמה נגבה מהלקוחות?`,
      answer: GAP.opening + GAP.sales - GAP.writeOffs - GAP.closing,
      steps: [
        "בכרטיס הלקוחות: סגירה = פתיחה + מכירות − גבייה − מחיקות. הגבייה היא הנעלם.",
        `${fmt(GAP.closing)} = ${fmt(GAP.opening)} + ${fmt(GAP.sales)} − X − ${fmt(GAP.writeOffs)}, ולכן X = ${fmt(GAP.opening + GAP.sales - GAP.writeOffs - GAP.closing)}.`,
      ],
    },
    {
      kind: "number",
      id: "opening-allowance",
      skill: "נעלם בפתיחה",
      prompt: `לקוחות ב-1.1: ${fmt(OPENING.openingAR)} ₪. במהלך השנה: מכירות באשראי ${fmt(OPENING.creditSales!)} ₪, גבייה ${fmt(OPENING.collections!)} ₪, מחיקות ${fmt(OPENING.writeOffs!)} ₪, ונגבה חוב שנמחק בעבר ${fmt(OPENING.recovered!)} ₪. ב-31.12 ההפרשה היא 6% מהלקוחות, והוצאות הפסדי האשראי השנה ${fmt(OPENING.result.expense)} ₪. מה הייתה יתרת הפתיחה של ההפרשה?`,
      answer: OPENING.openingAllowance,
      steps: [
        `לקוחות בסוף השנה: ${fmt(OPENING.result.gross)}, ולכן ההפרשה בסגירה ${fmt(OPENING.required)}.`,
        `בכרטיס ההפרשה: סגירה = X − מחיקה + חוב שחזר + הוצאה, כלומר ${fmt(OPENING.required)} = X − ${fmt(OPENING.writeOffs!)} + ${fmt(OPENING.recovered!)} + ${fmt(OPENING.result.expense)}.`,
        `X = ${fmt(OPENING.openingAllowance)}.`,
      ],
    },
  ],
  traps: [
    {
      id: "write-off-expense",
      prompt: "לקוח פשט רגל, וחובו נמחק כנגד ההפרשה. מה קורה ביום המחיקה להוצאות הפסדי האשראי?",
      options: ["לא משתנות", "גדלות בסכום החוב", "קטנות בסכום החוב", "גדלות רק אם אין הפרשה ספציפית"],
      answer: 0,
      why: "המחיקה היא ח׳ הפרשה / ז׳ לקוחות — שני חשבונות מאזניים. ההוצאה נרשמה כבר כשהפרשנו, וההתאמה של סוף השנה תשלים אם צריך.",
      traps: [
        "",
        "המלכודת: לרשום את החוב האבוד כהוצאה. כך ההפסד נספר פעמיים — פעם בהפרשה ופעם במחיקה.",
        "מחיקה לא מקטינה הוצאה. היא רק מורידה את הלקוח מהלקוחות ומהכרית יחד.",
        "גם עם הפרשה ספציפית וגם בלעדיה — המחיקה כנגד ההפרשה. אם הכרית לא הספיקה, ההשלמה תבוא בסוף השנה.",
      ],
    },
    {
      id: "expense-is-required",
      prompt: "ההפרשה הנדרשת ב-31.12 היא 40,000 ₪. בכרטיס ההפרשה, לפני ההתאמה, יש 25,000 ₪ בזכות. מה הוצאות הפסדי האשראי השנה?",
      options: ["15,000 ₪", "40,000 ₪", "65,000 ₪", "25,000 ₪"],
      answer: 0,
      why: "ההוצאה היא רק מה שחסר בכרטיס כדי להגיע לנדרשת: 40,000 − 25,000 = 15,000.",
      traps: [
        "",
        "המלכודת: 40,000 היא יתרת הסגירה של ההפרשה, לא ההוצאה. 25,000 מתוכה כבר בכרטיס.",
        "מחברים במקום להחסיר: היתרה שבכרטיס כבר נספרה — משלימים עד הנדרשת.",
        "25,000 הם מה שיש, לא מה שחסר.",
      ],
    },
  ],
  tips: [
    "לקוחות נטו = לקוחות ברוטו − הפרשה. בכרטיס הלקוחות יש רק ברוטו — נטו מפרקים לפני שמציבים.",
    "מחיקת חוב אבוד: ח׳ הפרשה / ז׳ לקוחות — בלי הוצאה. חוב שחזר: מחזירים לספרים, ואז גובים.",
    "ההוצאה היא ההפרש בכרטיס ההפרשה: הנדרשת בסוף השנה, פחות מה שכבר יש בו אחרי מחיקות וגביות.",
    "הפרשה כללית — רק על הלקוחות שאין להם הפרשה ספציפית. אחרת אותו הפסד נספר פעמיים.",
  ],
};
