/**
 * The inventory page's examples, practice and calculator presets: inputs only.
 * Every result shown on the page is computed from these by the engine.
 */

import {
  type ClaimTerms,
  type GpFireInput,
  gpFire,
  gpRate,
  grossProfitMethod,
  historyFire,
  type Method,
  type Period,
  purchaseCost,
  type Purchase,
  type Rounding,
  type Sale,
  type System,
  valuateChain,
  valuatePeriod,
} from "./inventory";
import { explainCosts, explainGpFire, explainHistoryFire, explainNrv, explainPeriod, explainSolve, explainTable, type TraceStep } from "./inventory-explain";
import { type Known, solveTable, solveUnknowns, type TableInput, type Unknown } from "./inventory-solver";

const B = (date: string | undefined, qty: number, unitPrice: number, more: Partial<Purchase> = {}): Purchase => ({ date, qty, unitPrice, ...more });
const S = (date: string | undefined, qty: number, unitPrice?: number): Sale => ({ date, qty, unitPrice });

// ---------------------------------------------------------------------------
// The page's examples.

/** Chapter 1 and 3: a candle shop buys 10 kits and sells 6. */
export const LEHAVA: Period = { label: "2025", purchases: [B("2025-01-05", 10, 50, { label: "קניית ערכות" })], sales: [S("2025-01-20", 6, 150)] };
export const lehavaWith = (sold: number): Period => ({ ...LEHAVA, sales: sold ? [S("2025-01-20", sold, 150)] : [] });

/** Example A: the headphone shop — the lecture's structure, prices ×10. */
export const TZLIL: Period = {
  label: "2025",
  purchases: [B("2025-02-01", 10, 20, { label: "רכישה 1.2" }), B("2025-04-10", 5, 30, { label: "רכישה 10.4" }), B("2025-08-17", 6, 40, { label: "רכישה 17.8" })],
  sales: [S("2025-03-12", 5, 60), S("2025-09-15", 7, 100)],
};
export const tzlilWith = (prices: [number, number, number]): Period => ({ ...TZLIL, purchases: TZLIL.purchases.map((p, i) => ({ ...p, unitPrice: prices[i] })) });
export const TZLIL_FLIP: Period = tzlilWith([40, 30, 20]);

/** Example B: the stationery wholesaler, eight events, used in the FIFO and average chapters. */
export const NEYAR: Period = {
  label: "2025",
  purchases: [
    B("2025-01-05", 400, 10, { label: "רכישה 5.1" }),
    B("2025-03-03", 300, 12, { label: "רכישה 3.3" }),
    B("2025-06-09", 500, 15, { label: "רכישה 9.6" }),
    B("2025-10-01", 200, 18, { label: "רכישה 1.10" }),
  ],
  sales: [S("2025-02-15", 250, 30), S("2025-05-20", 400, 32), S("2025-08-15", 300, 35), S("2025-11-20", 100, 38)],
};

/**
 * The cost-formula lesson's year: a stationery shop whose dates show that events need not alternate — two
 * purchases in a row (5.1, 2.2) and two sales in a row (15.3, 20.4). Prices chosen so that every method comes
 * out in round figures (periodic average 13.2; moving averages 10.8, 14.16, 15.44).
 */
export const MAHBERET: Period = {
  label: "2025",
  purchases: [
    B("2025-01-05", 300, 10, { label: "קנייה 5.1" }),
    B("2025-02-02", 200, 12, { label: "קנייה 2.2" }),
    B("2025-06-10", 400, 15, { label: "קנייה 10.6" }),
    B("2025-10-05", 100, 18, { label: "קנייה 5.10" }),
  ],
  sales: [S("2025-03-15", 350, 25), S("2025-04-20", 50, 26), S("2025-08-01", 300, 28), S("2025-11-20", 150, 30)],
};

/** Chapter 8: a periodic average with opening inventory. */
export const WA_OPEN: Period = {
  label: "2025",
  opening: { units: 100, cost: 900 },
  purchases: [B(undefined, 300, 11), B(undefined, 200, 12)],
  sales: [S(undefined, 400, 20)],
};

/** Chapter 5: an imported purchase, costed line by line. */
export const SHEMESH_PURCHASE: Purchase = {
  label: "יבוא 2,000 מאווררים",
  date: "2025-03-01",
  qty: 2000,
  unitPrice: 80,
  discounts: [{ kind: "qty-whole", threshold: 1500, pct: 0.1 }],
  extras: [
    { category: "duty", label: "מכס 5% מהמחיר נטו (לא ניתן להחזר)", amount: 0.05, basis: "pct-of-net-price" },
    { category: "freight", label: "הובלה ימית — למשלוח", amount: 3000, basis: "per-shipment" },
    { category: "freight", label: "הובלה מהנמל — ליחידה", amount: 2, basis: "per-unit" },
    { category: "storage", label: "אחסון בחנות (חודש)", amount: 1, basis: "per-unit" },
    { category: "vat", label: 'מע"מ 18% בר-קיזוז', amount: 0.18, basis: "pct-of-net-price" },
  ],
};
export const SHEMESH: Period = { label: "2025", purchases: [SHEMESH_PURCHASE], sales: [] };

/** Chapter 5: the same order with the discount on every unit, or only on the units above the threshold. */
export const DISCOUNT_WHOLE: Purchase = { qty: 1000, unitPrice: 20, discounts: [{ kind: "qty-whole", threshold: 800, pct: 0.05 }] };
export const DISCOUNT_EXCESS: Purchase = { qty: 1000, unitPrice: 20, discounts: [{ kind: "qty-excess", threshold: 800, pct: 0.05 }] };
/** Chapter 5: unusual credit terms — cash would have been 4% cheaper. */
export const FINANCING: Purchase = { qty: 1, unitPrice: 100, financingPct: 0.04 };

/** Chapter 10: speakers below cost, and the year after. */
export const KOL_NRV = { price: 160, completion: 10, selling: 8 };
export const kolNrv = (x: typeof KOL_NRV) => x.price - x.completion - x.selling;
export const KOL: Period = { label: "2025", opening: { units: 120, cost: 18_000 }, purchases: [], sales: [], nrvPerUnit: kolNrv(KOL_NRV) };
export const kolNextYear = (nrvPerUnit: number): Period[] => [KOL, { label: "2026", purchases: [], sales: [], nrvPerUnit }];

/** Chapter 4 and the calculator's second tab: a statement with question marks over two years. */
export const DAF: TableInput = {
  years: [
    {
      label: "2024",
      founded: true,
      cells: { grossSales: 500_000, custDiscounts: 20_000, custReturns: 15_000, grossPurchases: "?", suppDiscounts: 10_000, suppReturns: 6_000, closing: 80_000, cogs: 264_000, grossProfit: "?", netSales: "?", netPurchases: "?", gpPct: "?" },
    },
    {
      label: "2025",
      cells: { grossSales: 620_000, custDiscounts: "?", opening: "?", grossPurchases: 400_000, suppDiscounts: 12_000, suppReturns: 0, closing: 95_000, grossProfit: 237_000, netSales: "?", netPurchases: "?", cogs: "?" },
    },
  ],
};

/** Chapter 14: the full exam-level question. */
const SUPPLIER_A = (date: string, qty: number, price: number): Purchase =>
  B(date, qty, price, {
    label: `ספק א' ${date.slice(8).replace(/^0/, "")}.${date.slice(5, 7).replace(/^0/, "")}`,
    discounts: [{ kind: "qty-excess", threshold: 500, pct: 0.1, to: "2025-06-30" }],
    extras: [
      { category: "duty", label: "מכס 6% מהמחיר נטו", amount: 0.06, basis: "pct-of-net-price" },
      { category: "freight", label: "הובלה ימית — ליחידה", amount: 4, basis: "per-unit" },
      { category: "storage", label: "אחסון במחסן החברה", amount: 1.5, basis: "per-unit" },
    ],
  });
const SUPPLIER_B = (date: string, qty: number, price: number): Purchase =>
  B(date, qty, price, {
    label: `ספק ב' ${date.slice(8).replace(/^0/, "")}.${date.slice(5, 7).replace(/^0/, "")}`,
    financingPct: 0.04,
    discounts: [{ kind: "target", pct: 0.12, companyControlled: false, expected: true, achieved: false }],
    extras: [{ category: "freight", label: "הובלה — ליחידה", amount: 2, basis: "per-unit" }],
  });
export const GALYAM: Period = {
  label: "2025",
  purchases: [SUPPLIER_A("2025-01-20", 800, 60), SUPPLIER_A("2025-04-15", 600, 64), SUPPLIER_B("2025-08-10", 500, 70), SUPPLIER_B("2025-11-05", 300, 72)],
  sales: [S("2025-03-10", 500, 0), S("2025-06-20", 700, 100), S("2025-09-30", 600, 105)],
  nrvPerUnit: 65,
};
export const GALYAM_GP = 0.3;
export const GALYAM_UNKNOWN: Unknown = { id: "price", label: "מחיר המכירה ב-10.3", ref: { t: "sale", year: 0, index: 0, field: "unitPrice" }, guess: 50 };
export const GALYAM_KNOWN: Known = { year: 0, metric: "gpPct", value: GALYAM_GP };
export const galyam = () => {
  const solved = solveUnknowns([GALYAM], "moving-avg", [GALYAM_UNKNOWN], [GALYAM_KNOWN]);
  const period = solved.periods[0];
  return { solved, period, result: valuatePeriod(period, "moving-avg") };
};

/** Chapter 11: a count bridge, from the warehouse to the statements. */
export const COUNT_BRIDGE: { label: string; amount: number; sign: 1 | -1; why: string }[] = [
  { label: "ספירה פיזית במחסנים (בעלות)", amount: 180_000, sign: 1, why: "נקודת המוצא" },
  { label: "מלאי בדרך — הסיכון עבר אלינו ביציאה ממחסן הספק", amount: 25_000, sign: 1, why: "כבר שלנו, למרות שלא הגיע" },
  { label: "משגור שמסרנו לרשת וטרם נמכר", amount: 40_000, sign: 1, why: "עדיין בבעלותנו" },
  { label: "מכור והחזק — נמכר ללקוח וארוז בנפרד", amount: 15_000, sign: -1, why: "כבר של הלקוח" },
  { label: "סחורה במשגור שקיבלנו מספק אחר", amount: 10_000, sign: -1, why: "לא שלנו — רק מוחזקת אצלנו" },
];

// ---------------------------------------------------------------------------
// Chapter 12: eight patterns for unknowns, each with a small example.

export const P_QTY_MA: Period = { label: "2025", purchases: [B("2025-01-10", 600, 20), B("2025-02-10", 400, 25)], sales: [S("2025-03-01", 0, 40)] };
export const P_QTY_MA_COST = 13_200;
export const P_LAST = { available: 2000, otherSales: 1200, closing: 300 };
export const P_PRICE = { cogs: 60_000, gp: 0.25, otherSales: 50_000, qty: 300 };
export const P_RETAIL = { opening: 20_000, purchases: 70_000, netSales: 100_000, rate: 0.3 };
export const P_AVG: Period = { label: "2025", opening: { units: 100, cost: 5_000 }, purchases: [B(undefined, 200, 0)], sales: [S(undefined, 150, 80)] };
export const P_AVG_KNOWN = 56;
export const P_DISC = { amount: 1_500, qty: 500, unitPrice: 60 };
export const P_SOLD = { cogs: 260_000, p: 0.65 };

// ---------------------------------------------------------------------------
// Calculator presets.

export type FireSetup =
  | { basis: "gp"; years: { label: string; netSales: number; cogs: number }[]; input: Omit<GpFireInput, "rates"> }
  | { basis: "history"; method: Method; savedUnits: number; terms?: ClaimTerms; fireDate?: string };

export type CalcExample = {
  id: string;
  title: string;
  hint: string;
  tab: "full" | "table" | "fire";
  method?: Method | "compare";
  system?: System;
  periods?: Period[];
  unknowns?: Unknown[];
  knowns?: Known[];
  rounding?: Rounding;
  carryWriteDown?: boolean;
  table?: TableInput;
  fire?: FireSetup;
  /** Every purchase has the same terms: the calculator shows them once, in its shared terms. */
  sharedTerms?: boolean;
};

const OR: Period = {
  label: "2025",
  purchases: [B("2025-01-15", 2000, 8), B("2025-03-10", 3000, 10), B("2025-08-01", 5000, 11)],
  sales: [S("2025-04-01", 0, 20), S("2025-06-01", 1000, 22), S("2025-11-01", 0, 25)],
};
const RIMON: Period = {
  label: "2025",
  purchases: [B("2025-01-10", 1000, 50), B("2025-03-01", 1000, 60), B("2025-07-01", 800, 65)],
  sales: [S("2025-04-01", 1200, 0), S("2025-10-01", 1000, 90)],
  nrvPerUnit: 58,
};
const ARON: Period = { label: "2025", opening: { units: 100, cost: 50_000 }, purchases: [B(undefined, 50, 0), B(undefined, 150, 560)], sales: [S(undefined, 200, 800)] };
const shared = (threshold: number, pct = 0) => [{ kind: "qty-whole" as const, threshold, pct, shared: true }];
const GALIM: Period = {
  label: "2025",
  purchases: [
    B(undefined, 400, 100, { discounts: shared(300), extras: [{ category: "freight", amount: 5, basis: "per-unit" }] }),
    B(undefined, 200, 110, { discounts: shared(300), extras: [{ category: "freight", amount: 5, basis: "per-unit" }] }),
    B(undefined, 500, 105, { discounts: shared(300), extras: [{ category: "freight", amount: 5, basis: "per-unit" }] }),
  ],
  sales: [S(undefined, 800, 150)],
};
/** Two years with FIFO layers crossing into the fire year. */
export const AGAM: Period[] = [
  { label: "2024", purchases: [B("2024-02-01", 300, 40), B("2024-06-01", 500, 44)], sales: [S("2024-09-01", 600, 70)] },
  { label: "2025 עד השריפה", purchases: [B("2025-02-01", 400, 48), B("2025-04-01", 300, 50)], sales: [S("2025-05-01", 700, 75)] },
];
export const AGAM_FIRE: FireSetup = { basis: "history", method: "fifo", savedUnits: 50, terms: { deductible: { kind: "pct", value: 0.2 }, cap: 5_500 } };
export const GP_FIRE: FireSetup = {
  basis: "gp",
  years: [
    { label: "2024", netSales: 400_000, cogs: 260_000 },
    { label: "2025", netSales: 500_000, cogs: 350_000 },
  ],
  input: { opening: 60_000, purchases: 120_000, sales: 200_000, saved: 5_000, terms: { deductible: { kind: "pct", value: 0.1 } } },
};

/**
 * Gabi Ltd: three years by periodic average, then a fire claimed by FIFO. Every
 * order carries the same terms: 6% off each unit from the 401st, duty and
 * freight per order in the cost, storage an expense. (The sales bonus is a
 * percentage of sales, a selling expense with no place in a purchase.)
 */
const gabiTerms = (): Partial<Purchase> => ({
  discounts: [{ kind: "qty-excess", threshold: 400, pct: 0.06 }],
  extras: [
    { category: "duty", label: "מס ייבוא", amount: 1_500, basis: "per-shipment" },
    { category: "freight", amount: 500, basis: "per-shipment" },
    { category: "storage", amount: 5, basis: "per-unit" },
  ],
});
const G = (date: string, qty: number, unitPrice: number) => B(date, qty, unitPrice, gabiTerms());
export const GABI: Period[] = [
  { label: "2022", purchases: [G("2022-10-31", 400, 195), G("2022-12-10", 100, 200)], sales: [S(undefined, 0, 272)] },
  {
    label: "2023",
    // The question's "31.11" is a day November doesn't have; its last day stands in.
    purchases: [G("2023-01-23", 250, 200), G("2023-03-30", 400, 250), G("2023-07-28", 500, 180), G("2023-11-30", 600, 210), G("2023-12-31", 530, 225)],
    sales: [S(undefined, 1_850, 0)],
    nrvPerUnit: 205,
  },
  { label: "2024", purchases: [G("2024-04-01", 350, 210), G("2024-06-27", 250, 220), G("2024-07-15", 400, 230)], sales: [S(undefined, 850, 275)] },
];
export const GABI_UNKNOWNS: Unknown[] = [
  { id: "q", label: "כמות שנמכרה ב-2022", ref: { t: "sale", year: 0, index: 0, field: "qty" }, guess: 100 },
  { id: "p", label: "מחיר המכירה ב-2023", ref: { t: "sale", year: 1, index: 0, field: "unitPrice" }, guess: 200 },
];
export const GABI_KNOWNS: Known[] = [
  { year: 0, metric: "saleRevenue", index: 0, value: 95_200 },
  { year: 1, metric: "gpPctChange", value: -0.02 },
];
export const GABI_FIRE: FireSetup = { basis: "history", method: "fifo", savedUnits: 0, terms: { deductible: { kind: "pct", value: 0.12 } }, fireDate: "2024-07-01" };

export const CALC_EXAMPLES: CalcExample[] = [
  { id: "tzlil", title: "צליל — ארבע שיטות", hint: "דוגמה א': אותם נתונים בכל השיטות", tab: "full", method: "compare", periods: [TZLIL] },
  { id: "neyar", title: "נייר — שמונה אירועים", hint: "דוגמה ב' בממוצע נע", tab: "full", method: "moving-avg", periods: [NEYAR] },
  { id: "shemesh", title: "שמש — בניית עלות", hint: "הנחה, מכס, הובלה, אחסון ומע״מ", tab: "full", method: "fifo", periods: [SHEMESH] },
  { id: "kol", title: "קול — שווי מימוש נטו וביטול", hint: "הורדת ערך ושנה אחרי", tab: "full", method: "fifo", periods: kolNextYear(155), carryWriteDown: true },
  {
    id: "or",
    title: "נעלם: כמות מכירה",
    hint: "עלות המכירה ידועה; כמות הסגירה ידועה",
    tab: "full",
    method: "moving-avg",
    periods: [OR],
    unknowns: [
      { id: "q1", label: "כמות המכירה ב-1.4", ref: { t: "sale", year: 0, index: 0, field: "qty" }, guess: 1000 },
      { id: "q2", label: "כמות המכירה ב-1.11", ref: { t: "sale", year: 0, index: 2, field: "qty" }, guess: 1000 },
    ],
    knowns: [
      { year: 0, metric: "saleCost", index: 0, value: 18_400 },
      { year: 0, metric: "closingUnits", value: 4_000 },
    ],
  },
  {
    id: "rimon",
    title: "נעלם: מחיר מכירה משיעור גולמי",
    hint: "ממוצע נע, שווי מימוש נטו ושיעור גולמי 20%",
    tab: "full",
    method: "moving-avg",
    periods: [RIMON],
    unknowns: [{ id: "p", label: "מחיר המכירה ב-1.4", ref: { t: "sale", year: 0, index: 0, field: "unitPrice" }, guess: 50 }],
    knowns: [{ year: 0, metric: "gpPct", value: 0.2 }],
  },
  {
    id: "aron",
    title: "נעלם: מחיר רכישה מממוצע",
    hint: "ממוצע תקופתי נתון — מחלצים מחיר",
    tab: "full",
    method: "wa-periodic",
    periods: [ARON],
    unknowns: [{ id: "x", label: "מחיר הרכישה הראשונה", ref: { t: "purchase", year: 0, index: 0, field: "unitPrice" }, guess: 500 }],
    knowns: [{ year: 0, metric: "avgCost", value: 535 }],
  },
  {
    id: "galim",
    title: "נעלם: שיעור הנחה",
    hint: "ההנחה ברכישה הראשונה ידועה בסכום",
    tab: "full",
    method: "wa-periodic",
    periods: [GALIM],
    unknowns: [{ id: "d", label: "שיעור ההנחה", ref: { t: "discountPct", year: 0 }, guess: 0.05 }],
    knowns: [{ year: 0, metric: "purchaseDiscount", index: 0, value: 2_400 }],
  },
  { id: "daf", title: "דף — דוח עם חסרים", hint: "שתי שנים, סימני שאלה", tab: "table", table: DAF },
  { id: "gpfire", title: "שריפה לפי שיעור גולמי", hint: "ממוצע שני שיעורים, השתתפות עצמית", tab: "fire", fire: GP_FIRE },
  { id: "agam", title: "שריפה לפי FIFO חוצה שנים", hint: "שכבות שעוברות בין שנים, השתתפות ותקרה", tab: "fire", method: "fifo", periods: AGAM, fire: AGAM_FIRE },
  { id: "galyam", title: "גל-ים — שאלה מלאה", hint: "הנחות, מכס, מימון, יעד, שווי מימוש נטו ונעלם", tab: "full", method: "moving-avg", periods: [GALYAM], unknowns: [GALYAM_UNKNOWN], knowns: [GALYAM_KNOWN], rounding: { mode: "exact" } },
  {
    id: "gabi",
    title: "גאבי — שאלה מלאה: 3 שנים ושריפה",
    hint: "הנחה מדורגת, מכס והובלה, ירידה בשיעור הגולמי ושיפוי לפי FIFO",
    tab: "full",
    method: "wa-periodic",
    periods: GABI,
    unknowns: GABI_UNKNOWNS,
    knowns: GABI_KNOWNS,
    fire: GABI_FIRE,
    sharedTerms: true,
  },
];

export const exampleById = (id: string) => CALC_EXAMPLES.find((e) => e.id === id);

// ---------------------------------------------------------------------------
// Practice: original questions; answers and solutions come from the engine.

export type PracticeAnswer = { label: string; value: number; kind: "amount" | "pct" | "qty" };
export type PracticeStatement = { text: string; answer: boolean; why: string };
export type PracticeItem = {
  id: string;
  title: string;
  level: "קל" | "בינוני" | "קשה";
  prompt: string[];
  hint: string;
  calc?: string;
  answers?: () => PracticeAnswer[];
  solution?: () => TraceStep[];
  statements?: PracticeStatement[];
  labels?: [string, string];
};

const PR_TABLE: TableInput = {
  years: [
    { label: "2024", founded: true, cells: { grossSales: 300_000, custDiscounts: 10_000, grossPurchases: "?", suppReturns: 5_000, closing: 40_000, cogs: 180_000 } },
    { label: "2025", cells: { grossSales: 350_000, custReturns: "?", opening: "?", grossPurchases: 200_000, closing: 30_000, grossProfit: 120_000 } },
  ],
};
const PR_FIFO: Period = { label: "2025", purchases: [B(undefined, 200, 10), B(undefined, 300, 12), B(undefined, 250, 15)], sales: [S(undefined, 450, 25)] };
const PR_WA: Period = { label: "2025", opening: { units: 100, cost: 2_000 }, purchases: [B(undefined, 300, 24), B(undefined, 200, 26)], sales: [S(undefined, 450, 40)] };
const PR_MA: Period = { label: "2025", purchases: [B("2025-01-05", 400, 10), B("2025-03-05", 300, 15)], sales: [S("2025-02-05", 200, 20), S("2025-04-05", 300, 25)] };
const PR_CMP: Period = { label: "2025", purchases: [B("2025-01-01", 100, 10), B("2025-03-01", 100, 14)], sales: [S("2025-02-01", 50, 20), S("2025-04-01", 100, 20)] };
export const PR_IMPORT: Purchase = {
  qty: 1000,
  unitPrice: 50,
  discounts: [{ kind: "qty-whole", threshold: 800, pct: 0.04 }],
  extras: [
    { category: "duty", label: "מכס 8% מהמחיר נטו", amount: 0.08, basis: "pct-of-net-price" },
    { category: "freight", label: "הובלה ימית למשלוח", amount: 2_500, basis: "per-shipment" },
    { category: "freight", label: "הובלה בארץ — 30 ₪ לארגז של 50", amount: 30, basis: "per-pack", packSize: 50 },
    { category: "storage", label: "אחסון במחסן", amount: 0.5, basis: "per-unit" },
    { category: "vat", label: 'מע"מ בר-קיזוז', amount: 0.18, basis: "pct-of-net-price" },
  ],
};
const PR_NRV: Period[] = [
  { label: "2025", opening: { units: 500, cost: 20_000 }, purchases: [], sales: [], nrvPerUnit: 45 - 3 - 4 },
  { label: "2026", purchases: [], sales: [], nrvPerUnit: 39 },
];
const PR_QTY: Period = { label: "2025", purchases: [B("2025-01-10", 600, 20), B("2025-02-10", 400, 25)], sales: [S("2025-03-01", 0, 40)] };
const PR_PRICE: Period = {
  label: "2025",
  purchases: [B("2025-01-10", 500, 30), B("2025-02-10", 500, 34), B("2025-05-10", 400, 38)],
  sales: [S("2025-03-10", 600, 0), S("2025-08-10", 500, 60)],
  nrvPerUnit: 33,
};
const PR_FIRE_GP: Omit<GpFireInput, "rates"> & { years: { netSales: number; cogs: number }[] } = {
  years: [
    { netSales: 200_000, cogs: 150_000 },
    { netSales: 250_000, cogs: 175_000 },
  ],
  opening: 40_000,
  purchases: 90_000,
  sales: 160_000,
  saved: 2_000,
  terms: { deductible: { kind: "pct", value: 0.15 } },
};
const PR_TARGET: Purchase = {
  qty: 1000,
  unitPrice: 80,
  financingPct: 0.05,
  discounts: [{ kind: "target", pct: 0.1, companyControlled: false, expected: true, achieved: false }],
  extras: [{ category: "freight", amount: 2, basis: "per-unit" }],
};
const PR_SOLD_TABLE: TableInput = { years: [{ label: "2024", founded: true, cells: { netSales: 500_000, gpPct: 0.28, closing: "?", netPurchases: "?" }, cogsPctOfPurchases: 0.6 }] };
const prSoldPeriod = (): Period => {
  const t = solveTable(PR_SOLD_TABLE).values[0];
  return { label: "2025", opening: { units: t.closing! / 20, cost: t.closing! }, purchases: [B(undefined, 10_000, 22), B(undefined, 8_000, 25)], sales: [S(undefined, 15_000, 40)] };
};

const one = (p: Period, m: Method) => valuatePeriod(p, m);
const gpYears = (ys: { netSales: number; cogs: number }[]) => ys.map((y) => gpRate(y.netSales, y.cogs));

export const PRACTICE: PracticeItem[] = [
  {
    id: "pr1",
    title: "דוח עם חסרים, שתי שנים",
    level: "קל",
    prompt: [
      "חברה הוקמה ב-2024. 2024: מכירות 300,000, הנחות ללקוחות 10,000, קניות ?, החזרות לספקים 5,000, מלאי סגירה 40,000, עלות המכר 180,000.",
      "2025: מכירות 350,000, החזרות מלקוחות ?, מלאי פתיחה ?, קניות 200,000, מלאי סגירה 30,000, רווח גולמי 120,000.",
      "מצאו את הקניות ב-2024 ואת ההחזרות מלקוחות ב-2025.",
    ],
    hint: "מלאי הפתיחה של 2025 הוא הסגירה של 2024. חפשו בכל פעם משוואה עם נעלם אחד.",
    calc: "table:pr1",
    answers: () => {
      const v = solveTable(PR_TABLE).values;
      return [
        { label: "קניות ברוטו 2024", value: v[0].grossPurchases!, kind: "amount" },
        { label: "החזרות מלקוחות 2025", value: v[1].custReturns!, kind: "amount" },
      ];
    },
    solution: () => explainTable(PR_TABLE, solveTable(PR_TABLE)),
  },
  {
    id: "pr2",
    title: "FIFO תקופתי — מלאי סגירה משלוש רכישות",
    level: "קל",
    prompt: ["רכישות: 200 יח' ב-10 ₪, 300 יח' ב-12 ₪, 250 יח' ב-15 ₪. נמכרו 450 יחידות ב-25 ₪. השיטה: FIFO.", "חשבו את מלאי הסגירה ואת עלות המכר."],
    hint: "מתחילים מהסוף: מה שנשאר הוא הרכישות האחרונות.",
    answers: () => {
      const r = one(PR_FIFO, "fifo");
      return [
        { label: "מלאי סגירה", value: r.closingCarrying, kind: "amount" },
        { label: "עלות המכר", value: r.cogs, kind: "amount" },
      ];
    },
    solution: () => explainPeriod(PR_FIFO, one(PR_FIFO, "fifo")),
  },
  {
    id: "pr3",
    title: "ממוצע תקופתי עם מלאי פתיחה",
    level: "קל",
    prompt: ["מלאי פתיחה: 100 יח' בעלות 2,000 ₪. רכישות: 300 יח' ב-24 ₪ ו-200 יח' ב-26 ₪. נמכרו 450 יח'. השיטה: ממוצע משוקלל תקופתי.", "מהי העלות הממוצעת, ומהו מלאי הסגירה?"],
    hint: "מלאי הפתיחה נכנס גם לסכום וגם לכמות.",
    answers: () => {
      const r = one(PR_WA, "wa-periodic");
      return [
        { label: "עלות ממוצעת ליחידה", value: r.avgCost!, kind: "amount" },
        { label: "מלאי סגירה", value: r.closingCarrying, kind: "amount" },
      ];
    },
    solution: () => explainPeriod(PR_WA, one(PR_WA, "wa-periodic")),
  },
  {
    id: "pr4",
    title: "ממוצע נע — טבלת יתרות",
    level: "בינוני",
    prompt: ["5.1: קנייה 400 יח' ב-10 ₪ · 5.2: מכירה 200 יח' · 5.3: קנייה 300 יח' ב-15 ₪ · 5.4: מכירה 300 יח'. השיטה: ממוצע משוקלל נע.", "מהי עלות המכר, ומהו מלאי הסגירה?"],
    hint: "הממוצע מתעדכן רק אחרי קנייה.",
    answers: () => {
      const r = one(PR_MA, "moving-avg");
      return [
        { label: "עלות המכר", value: r.cogs, kind: "amount" },
        { label: "מלאי סגירה", value: r.closingCarrying, kind: "amount" },
      ];
    },
    solution: () => explainPeriod(PR_MA, one(PR_MA, "moving-avg")),
  },
  {
    id: "pr5",
    title: "השוואת שלוש השיטות",
    level: "בינוני",
    prompt: ["1.1: קנייה 100 יח' ב-10 ₪ · 1.2: מכירה 50 יח' · 1.3: קנייה 100 יח' ב-14 ₪ · 1.4: מכירה 100 יח'. כל המכירות ב-20 ₪.", "חשבו את מלאי הסגירה בשלוש השיטות. באיזו שיטה הרווח הגולמי הגבוה ביותר, ולמה?"],
    hint: "המחירים עולים — מה נשאר על המדף ב-FIFO?",
    answers: () => [
      { label: "סגירה FIFO", value: one(PR_CMP, "fifo").closingCarrying, kind: "amount" },
      { label: "סגירה ממוצע תקופתי", value: one(PR_CMP, "wa-periodic").closingCarrying, kind: "amount" },
      { label: "סגירה ממוצע נע", value: one(PR_CMP, "moving-avg").closingCarrying, kind: "amount" },
    ],
    solution: () => [
      ...explainPeriod(PR_CMP, one(PR_CMP, "fifo")).slice(-1),
      {
        id: "cmp",
        title: "למה FIFO גבוה כאן",
        text: ["המחירים עלו. ב-FIFO נשארות על המדף היחידות היקרות (האחרונות), ולכן עלות המכר הנמוכה ביותר והרווח הגולמי הגבוה ביותר. אילו המחירים היו יורדים — הסדר היה מתהפך."],
      },
    ],
  },
  {
    id: "pr6",
    title: "בניית עלות מיבוא",
    level: "בינוני",
    prompt: [
      "יבוא 1,000 יח' ב-50 ₪. הנחה 4% על כל הרכישה אם הכמות מעל 800. מכס 8% מהמחיר נטו (לא ניתן להחזר). הובלה ימית 2,500 ₪ למשלוח. הובלה בארץ 30 ₪ לארגז של 50 יחידות. אחסון במחסן 0.5 ₪ ליחידה. מע״מ 18% בר-קיזוז.",
      "מהי עלות המלאי, ומהי העלות ליחידה?",
    ],
    hint: "מה מביא את המלאי למיקומו ולמצבו — ומה לא?",
    answers: () => {
      const c = purchaseCost(PR_IMPORT);
      return [
        { label: "עלות המלאי", value: c.total, kind: "amount" },
        { label: "עלות ליחידה", value: c.perUnit, kind: "amount" },
      ];
    },
    solution: () => [explainCosts({ label: "", purchases: [PR_IMPORT], sales: [] }, one({ label: "", purchases: [PR_IMPORT], sales: [] }, "fifo"))],
  },
  {
    id: "pr7",
    title: "שווי מימוש נטו, הורדת ערך וביטול",
    level: "בינוני",
    prompt: [
      "500 יח' בעלות 40 ₪ ליחידה. מחיר מכירה צפוי 45 ₪, עלויות השלמה 3 ₪, עלויות מכירה 4 ₪.",
      "בשנה שאחריה כל היחידות עדיין במלאי ושווי המימוש נטו עלה ל-39 ₪. כמה הורדת ערך בשנה הראשונה, וכמה מבטלים בשנייה?",
    ],
    hint: "ביטול — רק עד גובה ההורדה המקורית, ולא מעל העלות.",
    answers: () => {
      const [a, b] = valuateChain(PR_NRV, "fifo", { carryWriteDown: true });
      return [
        { label: "הורדת ערך בשנה הראשונה", value: a.writeDown, kind: "amount" },
        { label: "ביטול בשנה השנייה", value: b.reversal, kind: "amount" },
      ];
    },
    solution: () => {
      const rs = valuateChain(PR_NRV, "fifo", { carryWriteDown: true });
      return rs.map((r, i) => ({ ...explainNrv({ ...PR_NRV[i], priorWriteDown: i ? rs[0].writeDown : 0 }, r)!, id: `n${i}`, title: `שווי מימוש נטו ${r.label}` }));
    },
  },
  {
    id: "pr8",
    title: "נעלם: כמות מכירה בממוצע נע",
    level: "בינוני",
    prompt: ["10.1: קנייה 600 יח' ב-20 ₪ · 10.2: קנייה 400 יח' ב-25 ₪ · 1.3: מכירה של ? יח'. עלות המכירה הזו נרשמה ב-13,200 ₪.", "כמה יחידות נמכרו?"],
    hint: "כמות = עלות המכירה ÷ הממוצע שלפני המכירה.",
    answers: () => {
      const s = solveUnknowns([PR_QTY], "moving-avg", [{ id: "q", label: "כמות המכירה", ref: { t: "sale", year: 0, index: 0, field: "qty" }, guess: 100 }], [{ year: 0, metric: "saleCost", index: 0, value: 13_200 }]);
      return [{ label: "כמות שנמכרה", value: s.values.q, kind: "qty" }];
    },
    solution: () =>
      explainSolve(solveUnknowns([PR_QTY], "moving-avg", [{ id: "q", label: "כמות המכירה", ref: { t: "sale", year: 0, index: 0, field: "qty" }, guess: 100 }], [{ year: 0, metric: "saleCost", index: 0, value: 13_200 }])),
  },
  {
    id: "pr9",
    title: "נעלם: מחיר מכירה משיעור גולמי",
    level: "קשה",
    prompt: [
      "ממוצע נע. 10.1: קנייה 500 יח' ב-30 ₪ · 10.2: קנייה 500 יח' ב-34 ₪ · 10.3: מכירה 600 יח' במחיר ? · 10.5: קנייה 400 יח' ב-38 ₪ · 10.8: מכירה 500 יח' ב-60 ₪.",
      "שווי מימוש נטו ליחידה בסוף השנה 33 ₪. שיעור הרווח הגולמי השנתי 30%. מצאו את מחיר המכירה ב-10.3 (עגלו לשתי ספרות).",
    ],
    hint: "הורדת הערך נכנסת לעלות המכר, ואז מכירות = עלות המכר ÷ (1 − 30%).",
    calc: "pr9",
    answers: () => {
      const s = solveUnknowns([PR_PRICE], "moving-avg", [{ id: "p", label: "מחיר המכירה", ref: { t: "sale", year: 0, index: 0, field: "unitPrice" }, guess: 40 }], [{ year: 0, metric: "gpPct", value: 0.3 }]);
      return [{ label: "מחיר המכירה ב-10.3", value: s.values.p, kind: "amount" }];
    },
    solution: () => {
      const s = solveUnknowns([PR_PRICE], "moving-avg", [{ id: "p", label: "מחיר המכירה ב-10.3", ref: { t: "sale", year: 0, index: 0, field: "unitPrice" }, guess: 40 }], [{ year: 0, metric: "gpPct", value: 0.3 }]);
      return [...explainPeriod(s.periods[0], one(s.periods[0], "moving-avg")).filter((x) => x.id !== "statement"), ...explainSolve(s)];
    },
  },
  {
    id: "pr10",
    title: "שיטה קמעונאית",
    level: "קל",
    prompt: ["מלאי פתיחה 45,000 ₪, קניות 155,000 ₪, מכירות 240,000 ₪, שיעור רווח גולמי 25%.", "מהו מלאי הסגירה לפי השיטה הקמעונאית?"],
    hint: "עלות המכר = מכירות × (1 − שיעור גולמי).",
    answers: () => [{ label: "מלאי סגירה", value: grossProfitMethod({ netSales: 240_000, rate: 0.25, opening: 45_000, purchases: 155_000 }).closing, kind: "amount" }],
    solution: () => {
      const r = grossProfitMethod({ netSales: 240_000, rate: 0.25, opening: 45_000, purchases: 155_000 });
      return [{ id: "retail", title: "השיטה הקמעונאית", text: [`עלות המכר = 240,000 × 75% = ${r.cogs.toLocaleString("he-IL")}.`, `מלאי סגירה = 45,000 + 155,000 − ${r.cogs.toLocaleString("he-IL")} = ${r.closing.toLocaleString("he-IL")}.`], rules: ["R25", "R30"] }];
    },
  },
  {
    id: "pr11",
    title: "שריפה — ממוצע שני שיעורים והשתתפות עצמית",
    level: "בינוני",
    prompt: [
      "בשנתיים האחרונות: שנה א' — מכירות 200,000, עלות המכר 150,000; שנה ב' — מכירות 250,000, עלות המכר 175,000.",
      "השנה עד השריפה: מלאי פתיחה 40,000, קניות 90,000, מכירות 160,000. ניצל מלאי בעלות 2,000. הביטוח לפי ממוצע שיעור הרווח הגולמי בשנתיים, השתתפות עצמית 15%. כמה תקבל החברה?",
    ],
    hint: "ממוצע פשוט של שני השיעורים.",
    calc: "fire:pr11",
    answers: () => {
      const r = gpFire({ ...PR_FIRE_GP, rates: gpYears(PR_FIRE_GP.years) });
      return [
        { label: "מלאי שנשרף", value: r.burned, kind: "amount" },
        { label: "שיפוי נטו", value: r.settlement.net, kind: "amount" },
      ];
    },
    solution: () => {
      const x = { ...PR_FIRE_GP, rates: gpYears(PR_FIRE_GP.years) };
      return explainGpFire(x, gpFire(x));
    },
  },
  {
    id: "pr12",
    title: "שריפה — FIFO חוצה שנים ותקרה",
    level: "קשה",
    prompt: [
      "2024: קניות 300 יח' ב-40 ₪ ו-500 יח' ב-44 ₪; נמכרו 600 יח'. 2025 עד השריפה: קניות 400 יח' ב-48 ₪ ו-300 יח' ב-50 ₪; נמכרו 700 יח'.",
      "בשריפה ניצלו 50 יחידות. הביטוח לפי עלות FIFO, השתתפות עצמית 20%, תקרת שיפוי 5,500 ₪. כמה תקבל החברה?",
    ],
    hint: "מה שנשרף מוערך מהשכבות האחרונות.",
    calc: "agam",
    answers: () => {
      const r = historyFire({ periods: AGAM, method: "fifo", savedUnits: 50, terms: (AGAM_FIRE as { terms: ClaimTerms }).terms });
      return [
        { label: "מלאי שנשרף", value: r.burned, kind: "amount" },
        { label: "שיפוי נטו", value: r.settlement.net, kind: "amount" },
      ];
    },
    solution: () => explainHistoryFire("fifo", historyFire({ periods: AGAM, method: "fifo", savedUnits: 50, terms: (AGAM_FIRE as { terms: ClaimTerms }).terms })),
  },
  {
    id: "pr13",
    title: "הנחת יעד ורכיב מימון",
    level: "קשה",
    prompt: [
      "קנייה של 1,000 יח' ב-80 ₪, בתנאי אשראי חריגים בענף — במזומן המחיר היה נמוך ב-5%. הספק הבטיח הנחה של 10% אם החברה תמכור השנה מעל 5,000 יח' (החברה צופה שתעמוד ביעד). הובלה 2 ₪ ליחידה.",
      "מהי עלות המלאי, ומהן הוצאות המימון?",
    ],
    hint: "יעד מכירות אינו בשליטת החברה.",
    answers: () => {
      const c = purchaseCost(PR_TARGET);
      return [
        { label: "עלות המלאי", value: c.total, kind: "amount" },
        { label: "הוצאות מימון", value: c.financing, kind: "amount" },
      ];
    },
    solution: () => [explainCosts({ label: "", purchases: [PR_TARGET], sales: [] }, one({ label: "", purchases: [PR_TARGET], sales: [] }, "fifo"))],
  },
  {
    id: "pr14",
    title: "סיווג: האם זה מלאי של החברה?",
    level: "קל",
    prompt: ["לכל משפט: האם הפריט נכלל במלאי של החברה ליום הדוח?"],
    hint: "שאלו: של מי הסיכון והבעלות?",
    labels: ["מלאי שלנו", "לא מלאי שלנו"],
    statements: [
      { text: "סחורה בדרך מחו״ל; לפי ההסכם הסיכון עבר אלינו כשיצאה ממחסן הספק.", answer: true, why: "הסיכון כבר שלנו — זה מלאי שלנו למרות שלא הגיע." },
      { text: "סחורה בדרך; לפי ההסכם הסיכון עובר אלינו רק בהגעה למחסן שלנו.", answer: false, why: "הסיכון עדיין אצל הספק. אם שילמנו — מקדמה לספקים." },
      { text: "מלאי שמסרנו לרשת חנויות במשגור, וטרם נמכר ללקוח הסופי.", answer: true, why: "במשגור הבעלות נשארת אצלנו עד המכירה ללקוח הסופי." },
      { text: "סחורה שנמכרה ללקוח, ארוזה בנפרד במחסן שלנו; האחריות כבר עברה ללקוח.", answer: false, why: "מכור והחזק — המכירה הוכרה והסחורה של הלקוח." },
      { text: "קטלוגים ודוגמיות שמחולקים חינם ללקוחות.", answer: false, why: "לא מוחזקים למכירה — הוצאה." },
      { text: "מלאי איטי שלא זז שנה וכנראה יימכר מתחת לעלות.", answer: true, why: "עדיין מלאי — אבל צריך לבדוק שווי מימוש נטו ולהוריד ערך." },
    ],
  },
  {
    id: "pr15",
    title: "נכון או לא נכון — מלכודת ה״בהכרח״",
    level: "בינוני",
    prompt: ["לכל טענה: נכון או לא נכון?"],
    hint: "טענה עם ״תמיד״ או ״בהכרח״ — חפשו דוגמת נגד.",
    labels: ["נכון", "לא נכון"],
    statements: [
      { text: "רווח גולמי לפי FIFO תמיד גבוה מהרווח לפי ממוצע משוקלל.", answer: false, why: "רק כשהמחירים עולים. במחירים יורדים — הפוך." },
      { text: "כל רכישה בתשלום דחוי כוללת רכיב מימון שיש להפריד.", answer: false, why: "רק בתנאי אשראי חריגים לענף." },
      { text: "FIFO תקופתי ו-FIFO תמידי מניבים אותו מלאי סגירה.", answer: true, why: "בשתיהן נשארות הרכישות האחרונות." },
      { text: "הורדת ערך מלאי שבוטלה יכולה להעלות אותו מעל העלות המקורית.", answer: false, why: "הביטול חסום בגובה ההורדה המקורית." },
    ],
  },
  {
    id: "pr16",
    title: "שחזור מלאי פתיחה מ״נמכר p% מהקניות״",
    level: "קשה",
    prompt: [
      "החברה הוקמה ב-2024. ב-2024 מכרה ב-500,000 ₪ בשיעור רווח גולמי 28%, ועלות המכר הייתה 60% מערך הקניות. מלאי הסגירה של 2024 נרשם בעלות של 20 ₪ ליחידה.",
      "ב-2025: קניות 10,000 יח' ב-22 ₪ ואז 8,000 יח' ב-25 ₪; נמכרו 15,000 יח'. השיטה: FIFO. מהו מלאי הסגירה של 2025 ומהי עלות המכר?",
    ],
    hint: "עלות המכר 2024 = 500,000 × 72%. ואז קניות = עלות המכר ÷ 60%.",
    answers: () => {
      const p = prSoldPeriod();
      const r = one(p, "fifo");
      return [
        { label: "מלאי פתיחה 2025", value: p.opening!.cost, kind: "amount" },
        { label: "מלאי סגירה 2025", value: r.closingCarrying, kind: "amount" },
        { label: "עלות המכר 2025", value: r.cogs, kind: "amount" },
      ];
    },
    solution: () => [...explainTable(PR_SOLD_TABLE, solveTable(PR_SOLD_TABLE)), ...explainPeriod(prSoldPeriod(), one(prSoldPeriod(), "fifo"))],
  },
];

/** Presets the practice set opens in the calculator, beyond the menu's twelve. */
export const PRACTICE_CALC: CalcExample[] = [
  { id: "table:pr1", title: "תרגיל 1 — דוח עם חסרים", hint: "", tab: "table", table: PR_TABLE },
  {
    id: "pr9",
    title: "תרגיל 9 — מחיר מכירה",
    hint: "",
    tab: "full",
    method: "moving-avg",
    periods: [PR_PRICE],
    unknowns: [{ id: "p", label: "מחיר המכירה ב-10.3", ref: { t: "sale", year: 0, index: 0, field: "unitPrice" }, guess: 40 }],
    knowns: [{ year: 0, metric: "gpPct", value: 0.3 }],
  },
  {
    id: "fire:pr11",
    title: "תרגיל 11 — שריפה",
    hint: "",
    tab: "fire",
    fire: { basis: "gp", years: PR_FIRE_GP.years.map((y, i) => ({ label: `שנה ${i + 1}`, ...y })), input: { opening: 40_000, purchases: 90_000, sales: 160_000, saved: 2_000, terms: { deductible: { kind: "pct", value: 0.15 } } } },
  },
];
export const anyExample = (id: string) => exampleById(id) ?? PRACTICE_CALC.find((e) => e.id === id);
