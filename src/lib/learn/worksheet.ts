/**
 * The multi-column worksheet, from a whole question: a company's trial balance
 * before the year-end adjustments, the facts behind each adjustment, and the
 * adjustments themselves. Shaked Ltd is the lesson's worked question; Tamar
 * Ltd is the practice game's, with more accounts and a trap or two among them.
 * Every balance is computed from these, as on the rest of the course.
 */

import { type Balances, balancesOf, type Entry, isBalanceSheet, ledger, round2, statements } from "./basics";

/** One adjustment: the fact as the question tells it, the entry it calls for, and — for the game — the accounts offered to write it with. */
export type WorksheetItem = { title: string; story: string; entry: Entry; accounts: string[] };

export type WorksheetCase = {
  name: string;
  /** The year-end, as the question dates it. */
  date: string;
  /** The trial balance before the adjustments: debit positive, credit negative. */
  preliminary: Balances;
  items: WorksheetItem[];
  /** A word under an account whose side its name alone does not tell (retained earnings in debit, say). */
  notes?: Record<string, string>;
  /** An account whose balance the question leaves out: its side and amount are what makes the trial balance balance. */
  unknown?: string;
  /** At the end, the closing retained earnings too — not only the profit. */
  askRetained?: boolean;
};

const e = (id: string, text: string, dr: string, cr: string, amount: number, why: string): Entry => ({
  id,
  date: "31.12",
  text,
  lines: [
    { account: dr, dr: amount },
    { account: cr, cr: amount },
  ],
  why,
});

// ---------------------------------------------------------------------------
// The worked question: Shaked Ltd, a trading company, 31.12.2025.

const SH = { rent: 48_000, rentMonthsNext: 9, salary: 15_000, loan: 200_000, loanRate: 0.06, loanMonths: 6, commissionsNext: 10_000, deposit: 100_000, depositRate: 0.04, depositMonths: 9, stockCost: 52_000, stockNrv: 60_000 };

export const SHAKED: WorksheetCase = {
  name: "שקד בע״מ",
  date: "31.12.2025",
  preliminary: {
    מזומן: 187_000,
    לקוחות: 150_000,
    "פיקדונות בבנק": SH.deposit,
    ציוד: 240_000,
    "מלאי פתיחה": 45_000,
    קניות: 310_000,
    "הוצאות שכר": 165_000,
    "הוצאות שכירות": SH.rent,
    "הוצאות ביטוח": 18_000,
    "הוצאות פרסום": 12_000,
    ספקים: -95_000,
    "הלוואה שהתקבלה": -SH.loan,
    "הון מניות": -250_000,
    עודפים: -70_000,
    מכירות: -620_000,
    "הכנסות מעמלות": -40_000,
  },
  items: [
    {
      title: "שכירות",
      story: `ב-1.10.2025 שולמו ${SH.rent.toLocaleString("en-US")} ₪ שכירות לשנה, ונרשמו כולם כהוצאה.`,
      entry: e("א", "שכירות ששולמה מראש", "הוצאות שכירות מראש", "הוצאות שכירות", (SH.rent * SH.rentMonthsNext) / 12, `${SH.rentMonthsNext} מתוך 12 החודשים שייכים ל-2026: ${SH.rent.toLocaleString("en-US")} × ${SH.rentMonthsNext}/12. יוצאים מההוצאה ועוברים להוצאות מראש — נכס.`),
      accounts: ["הוצאות שכירות מראש", "הוצאות שכירות", "מזומן", "הוצאות שכירות לשלם"],
    },
    {
      title: "שכר דצמבר",
      story: `שכר דצמבר, ${SH.salary.toLocaleString("en-US")} ₪, ישולם ב-9.1.2026 ולא נרשם.`,
      entry: e("ב", "שכר דצמבר שטרם שולם", "הוצאות שכר", "הוצאות שכר לשלם", SH.salary, "העובדים עבדו בדצמבר — הוצאה של 2025. הכסף עוד לא יצא: הוצאות לשלם, התחייבות."),
      accounts: ["הוצאות שכר", "הוצאות שכר לשלם", "מזומן", "הוצאות שכר מראש"],
    },
    {
      title: "ריבית על ההלוואה",
      story: `ההלוואה (${SH.loan.toLocaleString("en-US")} ₪) נלקחה ב-1.7.2025 בריבית שנתית של ${SH.loanRate * 100}%. הריבית משולמת פעם בשנה, ב-30.6, ולא נרשמה.`,
      entry: e("ג", "ריבית שנצברה וטרם שולמה", "הוצאות ריבית", "הוצאות ריבית לשלם", SH.loan * SH.loanRate * (SH.loanMonths / 12), `${SH.loanMonths} חודשים של 2025: ${SH.loan.toLocaleString("en-US")} × ${SH.loanRate * 100}% × ${SH.loanMonths}/12. הוצאה של השנה, שעוד לא שולמה.`),
      accounts: ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה שהתקבלה", "מזומן"],
    },
    {
      title: "עמלות",
      story: `בהכנסות מעמלות כלולים ${SH.commissionsNext.toLocaleString("en-US")} ₪ שהתקבלו בדצמבר על שירות שיינתן בינואר–פברואר 2026.`,
      entry: e("ד", "עמלות שהתקבלו מראש", "הכנסות מעמלות", "הכנסות מעמלות מראש", SH.commissionsNext, "השירות עוד לא ניתן — זו לא הכנסה של 2025. יוצא מההכנסה ועובר להכנסות מראש — התחייבות."),
      accounts: ["הכנסות מעמלות", "הכנסות מעמלות מראש", "מזומן", "הכנסות מעמלות לקבל"],
    },
    {
      title: "ריבית על הפיקדון",
      story: `הפיקדון (${SH.deposit.toLocaleString("en-US")} ₪) הופקד ב-1.4.2025 בריבית שנתית של ${SH.depositRate * 100}%. הריבית תתקבל עם הקרן ב-31.3.2026, ולא נרשמה.`,
      entry: e("ה", "ריבית שהורווחה וטרם התקבלה", "הכנסות ריבית לקבל", "הכנסות ריבית", SH.deposit * SH.depositRate * (SH.depositMonths / 12), `${SH.depositMonths} חודשים של 2025: ${SH.deposit.toLocaleString("en-US")} × ${SH.depositRate * 100}% × ${SH.depositMonths}/12. הכנסה של השנה, שעוד לא התקבלה — הכנסות לקבל, נכס.`),
      accounts: ["הכנסות ריבית לקבל", "הכנסות ריבית", "פיקדונות בבנק", "מזומן"],
    },
    {
      title: "מלאי סגירה",
      story: `ב-31.12.2025 נספר מלאי בעלות ${SH.stockCost.toLocaleString("en-US")} ₪. שווי המימוש נטו שלו — ${SH.stockNrv.toLocaleString("en-US")} ₪.`,
      entry: e("ו", "רישום מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(SH.stockCost, SH.stockNrv), "הנמוך מבין העלות לשווי המימוש נטו. נכס במאזן, ומקטין את עלות המכר ברווח והפסד."),
      accounts: ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מלאי פתיחה"],
    },
  ],
};

// ---------------------------------------------------------------------------
// The practice game: Tamar Marketing Ltd, 31.12.2025 — more accounts, and the ones that catch people out.

const TM = { insurance: 24_000, electricity: 2_000, rent: 36_000, rentMonthsNext: 9, interest: 3_000, customers: 210_000, allowance: 10_500, rate: 0.06, stockCost: 75_000, stockNrv: 90_000 };
const tamarAllowanceUp = round2(TM.customers * TM.rate - TM.allowance);

export const TAMAR: WorksheetCase = {
  name: "תמר שיווק בע״מ",
  date: "31.12.2025",
  preliminary: {
    מזומן: 173_500,
    לקוחות: TM.customers,
    "הפרשה להפסדי אשראי חזויים": -TM.allowance,
    "מקדמות לספקים": 15_000,
    "מלאי פתיחה": 60_000,
    "כלי רכב": 180_000,
    ציוד: 95_000,
    "הוצאות ביטוח מראש": TM.insurance,
    ספקים: -130_000,
    "מקדמות מלקוחות": -20_000,
    "הלוואה שהתקבלה": -150_000,
    "הון מניות": -300_000,
    // Accumulated losses: retained earnings in debit.
    עודפים: 40_000,
    מכירות: -880_000,
    "הכנסות משכירות": -TM.rent,
    קניות: 420_000,
    "הוצאות שכר": 230_000,
    "הוצאות חשמל": 18_000,
    "הוצאות אחזקת רכב": 22_000,
    "הוצאות פרסום": 30_000,
    "הוצאות ריבית": 9_000,
  },
  notes: { עודפים: "הפסדים צבורים" },
  items: [
    {
      title: "ביטוח",
      story: `ב-1.7.2025 שולמו ${TM.insurance.toLocaleString("en-US")} ₪ ביטוח לשנה, ונרשמו כולם כהוצאות ביטוח מראש. רשמו את פקודת ההתאמה ב-31.12.`,
      entry: e("1", "החלק של הביטוח שנוצל השנה", "הוצאות ביטוח", "הוצאות ביטוח מראש", TM.insurance / 2, "חצי שנה נוצלה ב-2025: 24,000 × 6/12 = 12,000. החלק הזה עובר מהנכס להוצאה."),
      accounts: ["הוצאות ביטוח", "הוצאות ביטוח מראש", "מזומן", "הוצאות ביטוח לשלם"],
    },
    {
      title: "חשמל",
      story: `חשבון החשמל של דצמבר, ${TM.electricity.toLocaleString("en-US")} ₪, יגיע וישולם בינואר. רשמו את פקודת ההתאמה.`,
      entry: e("2", "חשמל דצמבר שטרם שולם", "הוצאות חשמל", "הוצאות חשמל לשלם", TM.electricity, "את החשמל של דצמבר צרכנו השנה — הוצאה של 2025, שעוד לא שולמה: הוצאות לשלם."),
      accounts: ["הוצאות חשמל", "הוצאות חשמל לשלם", "מזומן", "ספקים"],
    },
    {
      title: "שכירות שהתקבלה",
      story: `ב-1.10.2025 התקבלו ${TM.rent.toLocaleString("en-US")} ₪ על השכרת מחסן לשנה, ונרשמו כולם כהכנסה. רשמו את פקודת ההתאמה.`,
      entry: e("3", "שכירות שהתקבלה מראש", "הכנסות משכירות", "הכנסות משכירות מראש", (TM.rent * TM.rentMonthsNext) / 12, "9 חודשים שייכים ל-2026: 36,000 × 9/12 = 27,000. עד שנספק אותם — אנחנו חייבים: הכנסות מראש, התחייבות."),
      accounts: ["הכנסות משכירות", "הכנסות משכירות מראש", "מזומן", "הכנסות משכירות לקבל"],
    },
    {
      title: "ריבית",
      story: `הריבית על ההלוואה לרבעון האחרון, ${TM.interest.toLocaleString("en-US")} ₪, תשולם בינואר ולא נרשמה. רשמו את פקודת ההתאמה.`,
      entry: e("4", "ריבית שטרם שולמה", "הוצאות ריבית", "הוצאות ריבית לשלם", TM.interest, "השתמשנו בכסף של הבנק ברבעון האחרון — הוצאה של 2025, שעוד לא שולמה."),
      accounts: ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה שהתקבלה", "מזומן"],
    },
    {
      title: "הפסדי אשראי",
      story: `ההפרשה הנדרשת בסוף השנה: ${TM.rate * 100}% מהלקוחות (${TM.customers.toLocaleString("en-US")} ₪). בכרטיס ההפרשה יש ${TM.allowance.toLocaleString("en-US")} ₪. רשמו את פקודת ההתאמה.`,
      entry: e("5", "השלמת ההפרשה להפסדי אשראי", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", tamarAllowanceUp, `נדרשת ${TM.customers.toLocaleString("en-US")} × ${TM.rate * 100}% = ${(TM.customers * TM.rate).toLocaleString("en-US")}. יש ${TM.allowance.toLocaleString("en-US")} — חסרים ${tamarAllowanceUp.toLocaleString("en-US")} בזכות.`),
      accounts: ["הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", "לקוחות", "מזומן"],
    },
    {
      title: "מלאי סגירה",
      story: `ב-31.12.2025 נספר מלאי בעלות ${TM.stockCost.toLocaleString("en-US")} ₪, ששווי המימוש נטו שלו ${TM.stockNrv.toLocaleString("en-US")} ₪. רשמו את מלאי הסגירה.`,
      entry: e("6", "רישום מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(TM.stockCost, TM.stockNrv), "הנמוך מבין העלות לשווי המימוש נטו: 75,000. נכס במאזן, ומקטין את עלות המכר."),
      accounts: ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מלאי פתיחה"],
    },
  ],
};

// ---------------------------------------------------------------------------
// The harder game: Gefen Industries Ltd — an unknown balance, compound and corrective entries, and figures to work out first.

const GF = {
  rentPaid: 36_000,
  rentMonthsNext: 9,
  insurance: 30_000,
  insuranceMonths: 18,
  insuranceMonthsNext: 9,
  feesAdvance: 8_000,
  feesMonthly: 4_000,
  loan: 300_000,
  loanRate: 0.08,
  loanMonths: 8,
  interestPaid: 12_000,
  bankrupt: 6_000,
  customers: 240_000,
  allowance: 9_000,
  rate: 0.05,
  stockCost: 110_000,
  stockNrv: 104_000,
  machine: 16_000,
};
const gfInterest = round2((GF.loan * GF.loanRate * GF.loanMonths) / 12 - GF.interestPaid);
const gfRequired = round2((GF.customers - GF.bankrupt) * GF.rate);
const gfTopUp = round2(gfRequired - (GF.allowance - GF.bankrupt));
const f = (v: number) => v.toLocaleString("en-US");

export const GEFEN: WorksheetCase = {
  name: "גפן תעשיות בע״מ",
  date: "31.12.2025",
  unknown: "עודפים",
  askRetained: true,
  preliminary: {
    מזומן: 192_000,
    לקוחות: GF.customers,
    "הפרשה להפסדי אשראי חזויים": -GF.allowance,
    "פיקדונות בבנק": 120_000,
    "מלאי פתיחה": 85_000,
    מכונות: 400_000,
    "כלי רכב": 160_000,
    ספקים: -145_000,
    "מקדמות מלקוחות": -30_000,
    "הלוואה שהתקבלה": -GF.loan,
    "הון מניות": -400_000,
    // The question leaves this one out: the sorting finds its side and amount.
    עודפים: -95_000,
    מכירות: -1_350_000,
    "הכנסות מדמי ניהול": -48_000,
    קניות: 690_000,
    "הוצאות שכר": 310_000,
    "הוצאות שכירות": 72_000,
    "הוצאות ביטוח": GF.insurance,
    "הוצאות אחזקה": 26_000,
    "הוצאות ריבית": GF.interestPaid,
    "הוצאות פרסום": 40_000,
  },
  items: [
    {
      title: "שכירות",
      story: `בהוצאות השכירות (72,000 ₪) כלול תשלום של ${f(GF.rentPaid)} ₪ ששולם ב-1.10.2025 על שנה — עד 30.9.2026. רשמו את פקודת ההתאמה.`,
      entry: e("1", "החלק של השכירות ששייך ל-2026", "הוצאות שכירות מראש", "הוצאות שכירות", (GF.rentPaid * GF.rentMonthsNext) / 12, `רק התשלום של 1.10 נוגע לשנה הבאה — לא כל 72,000. ${GF.rentMonthsNext} מתוך 12 חודשיו שייכים ל-2026: ${f(GF.rentPaid)} × ${GF.rentMonthsNext}/12.`),
      accounts: ["הוצאות שכירות מראש", "הוצאות שכירות", "מזומן", "הוצאות שכירות לשלם"],
    },
    {
      title: "ביטוח ל-18 חודשים",
      story: `הוצאות הביטוח (${f(GF.insurance)} ₪) שולמו ב-1.4.2025 על 18 חודשים — עד 30.9.2026. רשמו את פקודת ההתאמה.`,
      entry: e("2", "החלק של הביטוח ששייך ל-2026", "הוצאות ביטוח מראש", "הוצאות ביטוח", (GF.insurance * GF.insuranceMonthsNext) / GF.insuranceMonths, `התקופה 18 חודשים, לא 12: ${GF.insuranceMonthsNext} חודשים (ינואר–ספטמבר 2026) שייכים לשנה הבאה: ${f(GF.insurance)} × ${GF.insuranceMonthsNext}/${GF.insuranceMonths}.`),
      accounts: ["הוצאות ביטוח מראש", "הוצאות ביטוח", "מזומן", "הוצאות ביטוח לשלם"],
    },
    {
      title: "דמי ניהול — פקודה מורכבת",
      story: `לקוח משלם ${f(GF.feesMonthly)} ₪ דמי ניהול לחודש. בהכנסות (48,000 ₪) כלולים ${f(GF.feesAdvance)} ₪ ששולמו מראש על ינואר–פברואר 2026, ודמי דצמבר טרם התקבלו ולא נרשמו. רשמו את שני התיקונים בפקודה אחת.`,
      entry: {
        id: "3",
        date: "31.12",
        text: "דמי ניהול: מה ששייך ל-2026, ומה שמגיע על דצמבר",
        lines: [
          { account: "הכנסות מדמי ניהול לקבל", dr: GF.feesMonthly },
          { account: "הכנסות מדמי ניהול", dr: GF.feesAdvance - GF.feesMonthly },
          { account: "הכנסות מדמי ניהול מראש", cr: GF.feesAdvance },
        ],
        why: `שני תיקונים על אותה הכנסה: ${f(GF.feesAdvance)} יוצאים ממנה להכנסות מראש (זכות), ו-${f(GF.feesMonthly)} של דצמבר נכנסים אליה מול הכנסות לקבל (חובה). בפקודה אחת ההכנסה נטו קטנה ב-${f(GF.feesAdvance - GF.feesMonthly)}.`,
      },
      accounts: ["הכנסות מדמי ניהול לקבל", "הכנסות מדמי ניהול", "הכנסות מדמי ניהול מראש", "מזומן", "לקוחות"],
    },
    {
      title: "ריבית — חלק כבר שולם",
      story: `ההלוואה (${f(GF.loan)} ₪) נלקחה ב-1.5.2025 בריבית שנתית של ${GF.loanRate * 100}%. עד 31.12 שולמה ונרשמה ריבית של ${f(GF.interestPaid)} ₪. רשמו את פקודת ההתאמה.`,
      entry: e("4", "ריבית שנצברה וטרם שולמה", "הוצאות ריבית", "הוצאות ריבית לשלם", gfInterest, `ריבית השנה: ${f(GF.loan)} × ${GF.loanRate * 100}% × ${GF.loanMonths}/12 = ${f(GF.interestPaid + gfInterest)}. כבר נרשמו ${f(GF.interestPaid)} — חסרים ${f(gfInterest)}.`),
      accounts: ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה שהתקבלה", "מזומן"],
    },
    {
      title: "לקוח שפשט רגל",
      story: `ב-31.12 התברר שלקוח שחייב ${f(GF.bankrupt)} ₪ פשט רגל. החוב טרם נמחק. רשמו את מחיקת החוב.`,
      entry: e("5", "מחיקת חוב אבוד", "הפרשה להפסדי אשראי חזויים", "לקוחות", GF.bankrupt, "המחיקה כנגד ההפרשה — בלי הוצאה. הלקוחות וההפרשה קטנים יחד."),
      accounts: ["הפרשה להפסדי אשראי חזויים", "לקוחות", "הוצאות הפסדי אשראי", "מזומן"],
    },
    {
      title: "השלמת ההפרשה",
      story: `ההפרשה הנדרשת: ${GF.rate * 100}% מיתרת הלקוחות — אחרי המחיקה. רשמו את פקודת ההתאמה.`,
      entry: e("6", "השלמת ההפרשה להפסדי אשראי", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", gfTopUp, `לקוחות אחרי המחיקה: ${f(GF.customers)} − ${f(GF.bankrupt)} = ${f(GF.customers - GF.bankrupt)}; נדרשת ${f(gfRequired)}. בכרטיס ההפרשה אחרי המחיקה: ${f(GF.allowance)} − ${f(GF.bankrupt)} = ${f(GF.allowance - GF.bankrupt)}. חסרים ${f(gfTopUp)}.`),
      accounts: ["הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", "לקוחות", "מזומן"],
    },
    {
      title: "מלאי סגירה — שווי מימוש נמוך",
      story: `ב-31.12 נספר מלאי בעלות ${f(GF.stockCost)} ₪. בגלל פגם בחלק מהסחורה, שווי המימוש נטו שלו ${f(GF.stockNrv)} ₪. רשמו את מלאי הסגירה.`,
      entry: e("7", "רישום מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(GF.stockCost, GF.stockNrv), `הנמוך מבין העלות (${f(GF.stockCost)}) לשווי המימוש נטו (${f(GF.stockNrv)}): ${f(Math.min(GF.stockCost, GF.stockNrv))}.`),
      accounts: ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מלאי פתיחה"],
    },
    {
      title: "פקודת תיקון — מכונה",
      story: `בהוצאות האחזקה כלולים ${f(GF.machine)} ₪ ששולמו ב-31.12 על רכישת מכונה חדשה. רשמו את פקודת התיקון.`,
      entry: e("8", "תיקון: מכונה שנרשמה כהוצאה", "מכונות", "הוצאות אחזקה", GF.machine, "מכונה שתשמש שנים היא נכס, לא הוצאה. מוציאים את הסכום מהוצאות האחזקה ומעבירים לנכס."),
      accounts: ["מכונות", "הוצאות אחזקה", "מזומן", "ספקים"],
    },
  ],
};

// ---------------------------------------------------------------------------
// The sheet itself.

export const adjustmentsOf = (c: WorksheetCase) => c.items.map((i) => i.entry);

/** Every row of the sheet after the first `upTo` adjustments: the balance before, the adjustments so far, the balance after. */
export function worksheetRows(c: WorksheetCase, upTo = c.items.length) {
  const entries = adjustmentsOf(c).slice(0, upTo);
  const adj = ledger(entries);
  const final = balancesOf(ledger(entries, c.preliminary));
  return Object.keys(final).map((account) => {
    const t = adj.find((x) => x.account === account);
    return {
      account,
      isNew: !(account in c.preliminary),
      before: c.preliminary[account] ?? 0,
      adjDr: round2((t?.dr ?? []).reduce((s, p) => s + p.amount, 0)),
      adjCr: round2((t?.cr ?? []).reduce((s, p) => s + p.amount, 0)),
      after: final[account],
      balanceSheet: isBalanceSheet(account),
    };
  });
}

/** The year's result: profit, and retained earnings from opening to closing (credit positive). */
export function worksheetResult(c: WorksheetCase) {
  const final = balancesOf(ledger(adjustmentsOf(c), c.preliminary));
  const s = statements(final);
  const openingRetained = -(c.preliminary["עודפים"] ?? 0);
  return { profit: s.profit, totalIncome: s.totalIncome, totalExpenses: s.totalExpenses, openingRetained, closingRetained: round2(openingRetained + s.profit) };
}
