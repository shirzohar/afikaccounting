import type { Entry } from "@/lib/learn/basics";
import type { JournalExercise, StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt, practice } from "./shared";

/** A journal-entry question: the event, the answer's lines, why, and the accounts offered (the answer's and some that tempt). */
const journal = (id: string, skill: string, text: string, lines: Entry["lines"], why: string, accounts: string[]): JournalExercise => ({
  kind: "journal",
  id,
  skill,
  entry: { id: "1", text, lines, why },
  accounts,
});

// Every figure below is computed here, from the event's own numbers.
const RENT = { paid: 6_000, monthsUsed: 4 }; // paid 1.9 for a year, recorded as prepaid
const rentUsed = (RENT.paid * RENT.monthsUsed) / 12;
const INSURANCE = { paid: 2_400, monthsUsed: 2 }; // paid 1.11 for a year, in one entry
const insuranceUsed = (INSURANCE.paid * INSURANCE.monthsUsed) / 12;
const ADS = { paid: 12_000, monthsNext: 6 }; // paid 1.7 for a year, recorded as expense
const adsNext = (ADS.paid * ADS.monthsNext) / 12;
const POWER = 1_500; // December's electricity, paid in January
const SALARY = { december: 8_000, paid: 5_000 };
const LOAN = { amount: 200_000, rate: 0.06, months: 3 }; // taken 1.10, interest paid yearly
const loanInterest = (LOAN.amount * LOAN.rate * LOAN.months) / 12;
const SUBSCRIPTION = { received: 9_000, monthsEarned: 3 }; // received 1.10 for a year, recorded as unearned
const subscriptionEarned = (SUBSCRIPTION.received * SUBSCRIPTION.monthsEarned) / 12;
const STORE = { received: 3_000, months: 3, monthsEarned: 1 }; // received 1.12 for three months, in one entry
const storeEarned = (STORE.received * STORE.monthsEarned) / STORE.months;
const DEPOSIT = { amount: 50_000, rate: 0.06, months: 6 }; // from 1.7, interest paid 30.6
const depositInterest = (DEPOSIT.amount * DEPOSIT.rate * DEPOSIT.months) / 12;
const STOCK = { cost: 80_000, nrv: 72_000 };
const stock = Math.min(STOCK.cost, STOCK.nrv);

/** Lesson 4: year-end adjustments — the accrual basis, the four cut-off accounts, a full example, and closing inventory. */
export const ADJUST: StudyModule = {
  slug: "basics-adjust",
  course: COURSE,
  n: 4,
  title: "התאמות סוף שנה",
  description: "בסיס מצטבר וארבעת חשבונות החתך, דוגמה מלאה של פקודות התאמה, ומלאי סגירה.",
  backHref: COURSE_HREF,
  screens: [
    { id: "accrual", title: "חשבונות חתך: שם של הוצאה, מקום במאזן" },
    { id: "prepaid", title: "הוצאות מראש — נכס" },
    { id: "accrued", title: "הוצאות לשלם — התחייבות" },
    { id: "unearned", title: "הכנסות מראש — התחייבות" },
    { id: "receivable", title: "הכנסות לקבל — נכס" },
    { id: "inventory", title: "מלאי סגירה" },
    { id: "ronen", title: "דוגמה מלאה: רונן בע״מ" },
  ],
  // The recorded lesson, slide by slide: its slides fade into one another, and each chapter starts with the fade.
  // One slide teaches both cut-off accounts on each side, so it opens from both of their screens.
  videos: [
    {
      src: "/videos/basics-adjust.mp4",
      title: "התאמות סוף שנה — כל שנה נושאת רק את מה ששייך לה",
      duration: 220,
      chapters: [
        { at: 0, title: "פתיחה" },
        { at: 15, title: "חותכים את השנה ב-31.12", screen: "accrual" },
        { at: 47, title: "ארבעת חשבונות החתך" },
        { at: 72, title: "בצד ההוצאות: מראש ולשלם", screen: ["prepaid", "accrued"] },
        { at: 110, title: "בצד ההכנסות: מראש ולקבל", screen: ["unearned", "receivable"] },
        { at: 155, title: "מלאי סגירה", screen: "inventory" },
        { at: 192, title: "לסיכום" },
      ],
    },
  ],
  exercises: [
    // Prepaid expenses.
    journal(
      "prepaid-used",
      "הוצאות מראש",
      `ב-1.9 שולמו ${fmt(RENT.paid)} ₪ שכירות לשנה, ונרשמו כ״הוצאות שכירות מראש״. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הוצאות שכירות", dr: rentUsed },
        { account: "הוצאות שכירות מראש", cr: rentUsed },
      ],
      `הכול נרשם כנכס, ועד 31.12 נוצלו ${RENT.monthsUsed} חודשים: ${fmt(RENT.paid)} × ${RENT.monthsUsed}/12 = ${fmt(rentUsed)}. החלק שנוצל עובר מההוצאה מראש להוצאה.`,
      ["הוצאות שכירות", "הוצאות שכירות מראש", "מזומן", "הוצאות שכירות לשלם"],
    ),
    journal(
      "prepaid-one",
      "הוצאות מראש — פקודה אחת",
      `ב-1.11 שילמנו במזומן ${fmt(INSURANCE.paid)} ₪ ביטוח לשנה. רשמו בפקודה אחת את התשלום, כך שב-31.12 הוא כבר מחולק נכון בין השנה הזו לשנה הבאה.`,
      [
        { account: "הוצאות ביטוח", dr: insuranceUsed },
        { account: "הוצאות ביטוח מראש", dr: INSURANCE.paid - insuranceUsed },
        { account: "מזומן", cr: INSURANCE.paid },
      ],
      `${INSURANCE.monthsUsed} חודשים נוצלו השנה: ${fmt(insuranceUsed)} — הוצאה. השאר, ${fmt(INSURANCE.paid - insuranceUsed)}, שייך לשנה הבאה — הוצאה מראש. בזכות: כל המזומן ששולם.`,
      ["הוצאות ביטוח", "הוצאות ביטוח מראש", "מזומן", "הוצאות ביטוח לשלם", "ספקים"],
    ),
    journal(
      "prepaid-from-expense",
      "הוצאות מראש — כשנרשם כהוצאה",
      `ב-1.7 שולמו ${fmt(ADS.paid)} ₪ על פרסום לשנה, ונרשמו כולם כ״הוצאות פרסום״. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הוצאות פרסום מראש", dr: adsNext },
        { account: "הוצאות פרסום", cr: adsNext },
      ],
      `הכול נרשם כהוצאה, אבל ${ADS.monthsNext} חודשים שייכים לשנה הבאה: ${fmt(adsNext)}. הם יוצאים מההוצאה ועוברים להוצאות מראש — נכס. בודקים תמיד קודם מה כבר נרשם.`,
      ["הוצאות פרסום מראש", "הוצאות פרסום", "מזומן", "הוצאות פרסום לשלם"],
    ),
    // Accrued expenses.
    journal(
      "accrued-power",
      "הוצאות לשלם",
      `חשבון החשמל של דצמבר, ${fmt(POWER)} ₪, יגיע וישולם רק בינואר. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הוצאות חשמל", dr: POWER },
        { account: "הוצאות חשמל לשלם", cr: POWER },
      ],
      "את החשמל של דצמבר צרכנו השנה — הוצאה של השנה. הכסף עוד לא יצא, ולכן נוצר חוב: הוצאות לשלם, התחייבות.",
      ["הוצאות חשמל", "הוצאות חשמל לשלם", "מזומן", "הוצאות חשמל מראש"],
    ),
    journal(
      "accrued-paid",
      "הוצאות לשלם — התשלום",
      `ב-10.1 שולם במזומן חשבון החשמל של דצמבר, ${fmt(POWER)} ₪, שנרשם ב-31.12 כ״הוצאות חשמל לשלם״.`,
      [
        { account: "הוצאות חשמל לשלם", dr: POWER },
        { account: "מזומן", cr: POWER },
      ],
      "ההוצאה כבר נרשמה בשנה הקודמת. עכשיו רק נסגר החוב: הוצאות לשלם בחובה, ומזומן בזכות. אין הוצאה חדשה.",
      ["הוצאות חשמל לשלם", "מזומן", "הוצאות חשמל", "הוצאות חשמל מראש"],
    ),
    journal(
      "accrued-one",
      "הוצאות לשלם — פקודה אחת",
      `שכר דצמבר הוא ${fmt(SALARY.december)} ₪. ב-31.12 שולמו ${fmt(SALARY.paid)} ₪ במזומן, ואת השאר נשלם בינואר. רשמו בפקודה אחת.`,
      [
        { account: "הוצאות שכר", dr: SALARY.december },
        { account: "מזומן", cr: SALARY.paid },
        { account: "הוצאות שכר לשלם", cr: SALARY.december - SALARY.paid },
      ],
      `כל שכר דצמבר הוא הוצאה של השנה: ${fmt(SALARY.december)}. בזכות — מה ששולם (מזומן ${fmt(SALARY.paid)}) ומה שעוד חייבים (הוצאות שכר לשלם ${fmt(SALARY.december - SALARY.paid)}).`,
      ["הוצאות שכר", "מזומן", "הוצאות שכר לשלם", "הוצאות שכר מראש"],
    ),
    journal(
      "accrued-interest",
      "הוצאות לשלם — ריבית",
      `ב-1.10 נלקחה הלוואה של ${fmt(LOAN.amount)} ₪ בריבית שנתית של ${LOAN.rate * 100}%. הריבית משולמת פעם בשנה, ב-30.9. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הוצאות ריבית", dr: loanInterest },
        { account: "הוצאות ריבית לשלם", cr: loanInterest },
      ],
      `השתמשנו בכסף של הבנק ${LOAN.months} חודשים השנה: ${fmt(LOAN.amount)} × ${LOAN.rate * 100}% × ${LOAN.months}/12 = ${fmt(loanInterest)}. זו הוצאה של השנה, שעוד לא שולמה.`,
      ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה", "מזומן", "הוצאות ריבית מראש"],
    ),
    // Unearned income.
    journal(
      "unearned-earned",
      "הכנסות מראש",
      `ב-1.10 קיבלנו ${fmt(SUBSCRIPTION.received)} ₪ על מנוי לשנה, ורשמנו אותם כ״הכנסות מנויים מראש״. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הכנסות מנויים מראש", dr: subscriptionEarned },
        { account: "הכנסות מנויים", cr: subscriptionEarned },
      ],
      `הכול נרשם כהתחייבות, ועד 31.12 סיפקנו ${SUBSCRIPTION.monthsEarned} חודשים: ${fmt(SUBSCRIPTION.received)} × ${SUBSCRIPTION.monthsEarned}/12 = ${fmt(subscriptionEarned)}. החלק שהורווח עובר מההכנסה מראש להכנסה.`,
      ["הכנסות מנויים מראש", "הכנסות מנויים", "מזומן", "הכנסות מנויים לקבל"],
    ),
    journal(
      "unearned-one",
      "הכנסות מראש — פקודה אחת",
      `ב-1.12 קיבלנו במזומן ${fmt(STORE.received)} ₪ על השכרת מחסן ל-${STORE.months} חודשים. רשמו בפקודה אחת, כך שב-31.12 הסכום כבר מחולק נכון.`,
      [
        { account: "מזומן", dr: STORE.received },
        { account: "הכנסות שכירות", cr: storeEarned },
        { account: "הכנסות שכירות מראש", cr: STORE.received - storeEarned },
      ],
      `חודש אחד הורווח השנה: ${fmt(storeEarned)} — הכנסה. ${STORE.months - STORE.monthsEarned} החודשים הבאים עוד חייבים לשוכר: ${fmt(STORE.received - storeEarned)} — הכנסות מראש. בחובה: כל המזומן שהתקבל.`,
      ["מזומן", "הכנסות שכירות", "הכנסות שכירות מראש", "הכנסות שכירות לקבל"],
    ),
    // Accrued income.
    journal(
      "receivable-interest",
      "הכנסות לקבל",
      `ב-1.7 הפקדנו ${fmt(DEPOSIT.amount)} ₪ בפיקדון בריבית שנתית של ${DEPOSIT.rate * 100}%. הריבית תתקבל ב-30.6 בשנה הבאה. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הכנסות ריבית לקבל", dr: depositInterest },
        { account: "הכנסות ריבית", cr: depositInterest },
      ],
      `הכסף שלנו עבד ${DEPOSIT.months} חודשים השנה: ${fmt(DEPOSIT.amount)} × ${DEPOSIT.rate * 100}% × ${DEPOSIT.months}/12 = ${fmt(depositInterest)}. ההכנסה הורווחה השנה, והכסף עוד לא הגיע — הכנסות לקבל, נכס.`,
      ["הכנסות ריבית לקבל", "הכנסות ריבית", "מזומן", "הכנסות ריבית מראש"],
    ),
    journal(
      "receivable-received",
      "הכנסות לקבל — התקבול",
      `ב-30.6 התקבלה במזומן ריבית של שנה שלמה על הפיקדון: ${fmt(depositInterest * 2)} ₪. ב-31.12 נרשמו ממנה ${fmt(depositInterest)} ₪ כ״הכנסות ריבית לקבל״.`,
      [
        { account: "מזומן", dr: depositInterest * 2 },
        { account: "הכנסות ריבית לקבל", cr: depositInterest },
        { account: "הכנסות ריבית", cr: depositInterest },
      ],
      `החצי של השנה הקודמת כבר נרשם כהכנסה — הוא רק סוגר את ההכנסות לקבל. החצי של השנה הזו הוא הכנסה שלה. בחובה: כל המזומן שהתקבל.`,
      ["מזומן", "הכנסות ריבית לקבל", "הכנסות ריבית", "הכנסות ריבית מראש"],
    ),
    // Closing inventory.
    journal(
      "closing-stock",
      "מלאי סגירה",
      `ב-31.12 נספר מלאי שעלותו ${fmt(STOCK.cost)} ₪. שווי המימוש נטו שלו — ${fmt(STOCK.nrv)} ₪. רשמו את מלאי הסגירה.`,
      [
        { account: "מלאי סגירה מאזני", dr: stock },
        { account: "מלאי סגירה רווח או הפסד", cr: stock },
      ],
      `מלאי נמדד לפי הנמוך מבין העלות לשווי המימוש נטו: ${fmt(stock)}. הנכס במאזן בחובה, ובזכות — הקטנת העלות ברווח והפסד.`,
      ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מזומן"],
    ),
    practice("q14"),
  ],
  traps: [
    {
      id: "forgot-inventory",
      prompt: "שכחו לרשום מלאי סגירה של 50,000 ₪. מה קורה לרווח השנה?",
      options: ["נמוך מדי ב-50,000 ₪", "גבוה מדי ב-50,000 ₪", "לא משתנה", "נמוך מדי ב-100,000 ₪"],
      answer: 0,
      why: "עלות המכר = מלאי פתיחה + קניות − מלאי סגירה. בלי מלאי הסגירה עלות המכר גבוהה ב-50,000, והרווח נמוך באותו סכום.",
      traps: [
        "",
        "הפוך: מלאי סגירה מקטין את עלות המכר. בלעדיו העלות גבוהה מדי, והרווח נמוך מדי.",
        "המלכודת: מלאי סגירה הוא לא רק נכס במאזן — הוא גם מקטין את העלות ברווח והפסד.",
        "הטעות היא בסכום אחד: 50,000 בעלות המכר, ולכן 50,000 ברווח.",
      ],
    },
    {
      id: "preliminary-statements",
      prompt: "בשאלה קיבלתם מאזן בוחן ראשוני ליום 31.12. אפשר לבנות ממנו מיד את הדוחות?",
      options: ["לא — קודם פקודות התאמה", "כן", "רק את המאזן", "רק את רווח והפסד"],
      answer: 0,
      why: "מאזן הבוחן הראשוני כולל רק מה שנרשם במהלך השנה. קודם רושמים את ההתאמות (חתך ומלאי), ורק ממאזן הבוחן הסופי בונים דוחות.",
      traps: [
        "",
        "המלכודת: דוחות שנבנים ישר ממאזן הבוחן הראשוני — שגויים. חסרות בו ההתאמות של סוף השנה.",
        "ההתאמות משנות גם חשבונות מאזניים (מראש, לשלם, מלאי) — גם המאזן יהיה שגוי.",
        "ההתאמות משנות הכנסות והוצאות — גם רווח והפסד יהיה שגוי.",
      ],
    },
  ],
  tips: [
    "בסיס מצטבר: הכנסה והוצאה שייכות לתקופה שבה נהנו מהן, לא לתקופה שבה הכסף זז.",
    "הוצאות מראש והכנסות לקבל — נכסים. הוצאות לשלם והכנסות מראש — התחייבויות.",
    "לפני התאמה בודקים מה כבר נרשם: כהוצאה או כנכס? הכיוון של הפקודה תלוי בזה.",
    "עלות המכר = מלאי פתיחה + קניות − מלאי סגירה. המלאי — בנמוך מבין עלות לשווי מימוש נטו.",
  ],
};
