import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "./shared";

// Every figure below is computed here, from the question's own numbers.
const IMPORT = { qty: 500, price: 40, discount: 5, duty: 10, freight: 1_000, storage: 600 }; // percents
const importGross = IMPORT.qty * IMPORT.price;
const importNet = (importGross * (100 - IMPORT.discount)) / 100;
const importDuty = (importNet * IMPORT.duty) / 100;
const importCost = importNet + importDuty + IMPORT.freight;
const UNIT = { qty: 1_000, price: 12, freightPerUnit: 0.5, toCustomers: 800 };
const unitCost = UNIT.price + UNIT.freightPerUnit;
const EXCESS = { qty: 1_200, price: 20, over: 1_000, rate: 10 };
const excessDiscount = ((EXCESS.qty - EXCESS.over) * EXCESS.price * EXCESS.rate) / 100;
const excessCost = EXCESS.qty * EXCESS.price - excessDiscount;
const FINANCE = { qty: 200, price: 100, cashLess: 5 };
const financeCost = (FINANCE.qty * FINANCE.price * (100 - FINANCE.cashLess)) / 100;
const PORT = { qty: 100, price: 50, duty: 250, freight: 300, storage: 200 };
const portCost = PORT.qty * PORT.price + PORT.duty + PORT.freight;
const CREDIT = { price: 10_000, cash: 9_600 };

/** Lesson 2: what goes into the cost of inventory under IAS 2 — the test, an imported purchase built line by line, discounts and financing. */
export const COST: StudyModule = {
  slug: "inventory-cost",
  course: COURSE,
  n: 2,
  title: "עלות המלאי לפי IAS 2",
  description: "מה נכנס לעלות המלאי, מה נשאר בחוץ ומה מנוכה: עלות של רכישה מיובאת שורה אחר שורה, שלושה סוגי הנחה ורכיב מימון.",
  backHref: COURSE_HREF,
  screens: [
    { id: "inv-cost", title: "מה נכנס לעלות המלאי" },
    { id: "inv-shemesh", title: "דוגמה: עלות של רכישה מיובאת" },
    { id: "inv-discounts", title: "שלושה סוגי הנחה" },
    { id: "inv-financing", title: "רכיב מימון" },
    { id: "inv-cost-sort", title: "תרגול הבנה: בעלות, בחוץ או מנוכה?" },
  ],
  exercises: [
    journal(
      "import-periodic",
      "רכישה מיובאת",
      `החברה מנהלת מלאי בשיטה תקופתית. היא ייבאה ${PORT.qty} יחידות ב-${PORT.price} ₪ ליחידה, ושילמה במזומן את הסחורה, מכס של ${PORT.duty} ₪ (לא מוחזר), הובלה מהנמל למחסן ${PORT.freight} ₪, ואחסון של חודש במחסן החברה ${PORT.storage} ₪.`,
      [
        { account: "קניות", dr: portCost },
        { account: "הוצאות אחסון", dr: PORT.storage },
        { account: "מזומן", cr: portCost + PORT.storage },
      ],
      `המחיר, המכס וההובלה פנימה הביאו את הסחורה למחסן — עלות: ${fmt(PORT.qty * PORT.price)} + ${PORT.duty} + ${PORT.freight} = ${fmt(portCost)}. אחסון רגיל במחסן החברה אינו נחוץ לשלב נוסף — הוצאה של התקופה.`,
      ["קניות", "הוצאות אחסון", "מזומן", "מלאי", "הוצאות הובלה"],
    ),
    journal(
      "financing-buy",
      "רכיב מימון",
      `החברה מנהלת מלאי בשיטה תמידית. היא קנתה סחורה במחיר ${fmt(CREDIT.price)} ₪ בתנאי אשראי חריגים בענף; במזומן המחיר היה ${fmt(CREDIT.cash)} ₪. רשמו את הרכישה.`,
      [
        { account: "מלאי", dr: CREDIT.cash },
        { account: "ספקים", cr: CREDIT.cash },
      ],
      `עלות המלאי היא מחיר המזומן, ${fmt(CREDIT.cash)} ₪, וגם החוב לספק נרשם בסכום הזה. ההפרש — ${fmt(CREDIT.price - CREDIT.cash)} ₪ — יירשם כהוצאות מימון לאורך תקופת האשראי (ח׳ הוצאות מימון / ז׳ ספקים).`,
      ["מלאי", "ספקים", "הוצאות מימון", "מזומן"],
    ),
    calc(
      "import-cost",
      "עלות רכישה מיובאת",
      `נקנו ${IMPORT.qty} יחידות ב-${IMPORT.price} ₪. הנחת כמות של ${IMPORT.discount}% על כל הרכישה. מכס ${IMPORT.duty}% מהמחיר נטו (לא מוחזר). הובלה מהנמל למחסן: ${fmt(IMPORT.freight)} ₪ למשלוח. אחסון במחסן החברה: ${IMPORT.storage} ₪. מהי עלות הרכישה?`,
      importCost,
      [
        `מחיר: ${IMPORT.qty} × ${IMPORT.price} = ${fmt(importGross)}; פחות הנחה ${IMPORT.discount}% = ${fmt(importNet)} ₪.`,
        `מכס על המחיר נטו: ${fmt(importNet)} × ${IMPORT.duty}% = ${fmt(importDuty)} ₪.`,
        `הובלה פנימה: ${fmt(IMPORT.freight)} ₪. האחסון במחסן החברה — הוצאה, לא עלות.`,
        `עלות: ${fmt(importNet)} + ${fmt(importDuty)} + ${fmt(IMPORT.freight)} = ${fmt(importCost)} ₪.`,
      ],
    ),
    calc(
      "unit-cost",
      "עלות ליחידה",
      `נקנו ${fmt(UNIT.qty)} יחידות ב-${UNIT.price} ₪. הובלה פנימה ${UNIT.freightPerUnit} ₪ ליחידה, מע״מ 18% בר-קיזוז, והובלה ללקוחות שקנו ${UNIT.toCustomers} ₪. מהי עלות היחידה?`,
      unitCost,
      [
        `נכנסים: המחיר (${UNIT.price}) וההובלה פנימה (${UNIT.freightPerUnit}).`,
        "בחוץ: מע״מ שמוחזר אינו עלות; הובלה ללקוח היא עלות מכירה — הוצאה.",
        `עלות ליחידה: ${UNIT.price} + ${UNIT.freightPerUnit} = ${unitCost} ₪.`,
      ],
    ),
    calc(
      "excess-discount",
      "הנחה רק על העודף",
      `נקנו ${fmt(EXCESS.qty)} יחידות ב-${EXCESS.price} ₪. הספק נותן ${EXCESS.rate}% הנחה על כל יחידה שמעבר ל-${fmt(EXCESS.over)}. מהי עלות הרכישה?`,
      excessCost,
      [
        `ההנחה רק על העודף: ${fmt(EXCESS.qty - EXCESS.over)} יח׳ × ${EXCESS.price} × ${EXCESS.rate}% = ${fmt(excessDiscount)} ₪.`,
        `עלות: ${fmt(EXCESS.qty)} × ${EXCESS.price} − ${fmt(excessDiscount)} = ${fmt(excessCost)} ₪.`,
      ],
    ),
    calc(
      "financing-cost",
      "רכיב מימון",
      `נקנו ${FINANCE.qty} יחידות ב-${FINANCE.price} ₪ בתנאי אשראי ״שוטף + 180״, חריגים בענף. במזומן המחיר היה נמוך ב-${FINANCE.cashLess}%. מהי עלות המלאי?`,
      financeCost,
      [
        "בתנאי אשראי חריגים העלות היא מחיר המזומן; ההפרש הוא הוצאות מימון.",
        `${FINANCE.qty} × ${FINANCE.price} × ${100 - FINANCE.cashLess}% = ${fmt(financeCost)} ₪.`,
      ],
    ),
    choice("vat", "מע״מ", "האם מע״מ בר-קיזוז נכלל בעלות המלאי?", ["כן", "לא"], 1, "מס שאפשר לקבל בחזרה אינו עלות."),
  ],
  traps: [
    {
      id: "duty-on-freight",
      prompt: "מחיר הרכישה נטו, אחרי הנחה: 10,000 ₪. הובלה פנימה: 1,000 ₪. מכס 10% מהמחיר נטו. מהי עלות הרכישה?",
      options: ["12,000 ₪", "12,100 ₪", "11,000 ₪", "10,000 ₪"],
      answer: 0,
      why: "מכס על המחיר נטו בלבד: 1,000 ₪. עלות: 10,000 + 1,000 (מכס) + 1,000 (הובלה) = 12,000 ₪.",
      traps: [
        "",
        "המלכודת: מכס על המחיר ועל ההובלה (11,000 × 10%). כתוב ״מהמחיר נטו״ — בלי ההובלה.",
        "חסר רכיב: גם המכס וגם ההובלה פנימה נכללים בעלות.",
        "המחיר לבד אינו העלות — מוסיפים את מה שהביא את הסחורה למחסן.",
      ],
    },
    {
      id: "sales-target",
      prompt: "הספק מבטיח 10% הנחה אם החברה תמכור השנה מעל 5,000 יחידות, והחברה בטוחה שתעמוד ביעד. מה עושים בעת הרכישה?",
      options: ["לא מנכים — יעד מכירות אינו בשליטת החברה", "מנכים 10% — החברה צופה לעמוד ביעד", "מנכים 5% — חצי מההנחה, מטעמי זהירות", "רושמים את ההנחה כהכנסה"],
      answer: 0,
      why: "יעד מכירות תלוי בלקוחות, לא רק בחברה. מכירים בהנחה רק כשהיעד הושג בפועל.",
      traps: [
        "",
        "המלכודת: ״צופה לעמוד״ מספיק רק ביעד שבשליטה הבלעדית של החברה, כמו יעד רכישות. יעד מכירות — לא.",
        "אין ״חצי הנחה״: או שמכירים בהנחה, או שלא.",
        "הנחה מספק מקטינה את עלות המלאי — היא לעולם אינה הכנסה.",
      ],
    },
    {
      id: "storage",
      prompt: "אילו עלויות אחסון נכללות בעלות המלאי?",
      options: ["רק אחסון שנחוץ לפני שלב נוסף בתהליך", "כל אחסון, עד שהסחורה נמכרת", "אף אחסון", "רק אחסון במחסני החברה"],
      answer: 0,
      why: "סעיף 16(ב): אחסון נכלל רק כשהוא נחוץ בתהליך לפני שלב נוסף — למשל בנמל, בגלל לוח משלוחים קבוע.",
      traps: [
        "",
        "אחסון רגיל, אחרי שהסחורה הגיעה, אינו מביא אותה למקומה ולמצבה — הוא הוצאה.",
        "יש חריג: אחסון שנחוץ לפני השלב הבא בתהליך — נכלל.",
        "הפוך: אחסון רגיל במחסני החברה הוא דווקא הדוגמה הקלאסית להוצאה.",
      ],
    },
  ],
  tips: [
    "עלות = מחיר − הנחות + מכס שלא מוחזר + הובלה פנימה וטיפול. המבחן: האם זה הביא את הסחורה למקומה ולמצבה?",
    "בחוץ: מע״מ בר-קיזוז, אחסון רגיל, הובלה ללקוח, פרסום, בזבוז חריג ותקורה מנהלית.",
    "״מכס X% מהמחיר נטו״ — על המחיר אחרי ההנחה, בלי ההובלה.",
    "הנחת יעד: מכירים כשהושג, או כשהיעד בשליטת החברה והיא צופה לעמוד בו. יעד מכירות — רק כשהושג.",
    "רכיב מימון רק בתנאי אשראי חריגים לענף: העלות היא מחיר המזומן.",
  ],
};
