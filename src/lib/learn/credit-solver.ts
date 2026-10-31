/**
 * Finding the unknowns in a credit-loss question.
 *
 * The question's figures are the two cards of the course's method and what
 * ties them together: the customers' card, the allowance's card, the closing
 * formula, gross less allowance is net (at either end of the year), and the
 * opening allowance as a rate of the opening customers. Whatever the question
 * gives, the solver fills in what follows from it — an equation with one
 * unknown at a time, and two equations together when two unknowns are tied
 * (gross and allowance from the net and a rate) — and records each step, so
 * the page can show the working, not only the answer.
 */

import { round2 } from "./basics";

/** Every figure a question can give or ask for. Rates are fractions (0.05 = 5%). */
export type CreditKey =
  | "openingGross"
  | "openingAllowance"
  | "openingNet"
  | "openingRate"
  | "creditSales"
  | "collections"
  | "writeOffs"
  | "recovered"
  | "closingGross"
  | "closingAllowance"
  | "closingNet"
  | "generalRate"
  | "specificDebt"
  | "specificRate"
  | "expense";

export const CREDIT_LABEL: Record<CreditKey, string> = {
  openingGross: "י.פ לקוחות ברוטו",
  openingAllowance: "י.פ הפרשה להפסדי אשראי",
  openingNet: "לקוחות נטו בתחילת השנה",
  openingRate: "אחוז ההפרשה בתחילת השנה",
  creditSales: "מכירות באשראי",
  collections: "גבייה מלקוחות",
  writeOffs: "מחיקת חובות אבודים",
  recovered: "גביית חוב שנמחק בעבר",
  closingGross: "י.ס לקוחות ברוטו לאחר התאמה",
  closingAllowance: "י.ס הפרשה להפסדי אשראי",
  closingNet: "לקוחות נטו בסוף השנה",
  generalRate: "אחוז הפרשה כללי",
  specificDebt: "חוב ספציפי",
  specificRate: "אחוז ספציפי",
  expense: "הוצאות הפסדי אשראי",
};

export const RATE_KEYS: CreditKey[] = ["openingRate", "generalRate", "specificRate"];

export type CreditValues = Partial<Record<CreditKey, number>>;
type Equation = { id: string; label: string; vars: CreditKey[]; f: (v: Record<CreditKey, number>) => number };

/** The relations of the method, each written as an expression that is 0 when it holds. */
const EQUATIONS: Equation[] = [
  {
    id: "customers",
    label: "כרטיס הלקוחות: י.פ + מכירות באשראי − גבייה − מחיקות = י.ס (חוב שחזר נכנס ויוצא — לא משנה)",
    vars: ["openingGross", "creditSales", "collections", "writeOffs", "closingGross"],
    f: (v) => v.openingGross + v.creditSales - v.collections - v.writeOffs - v.closingGross,
  },
  {
    id: "allowance",
    label: "כרטיס ההפרשה: י.פ − מחיקות + חוב שחזר + הוצאות הפסדי אשראי = י.ס",
    vars: ["openingAllowance", "writeOffs", "recovered", "expense", "closingAllowance"],
    f: (v) => v.openingAllowance - v.writeOffs + v.recovered + v.expense - v.closingAllowance,
  },
  {
    id: "formula",
    label: "הנוסחה: (י.ס לקוחות − חוב ספציפי) × אחוז כללי + חוב ספציפי × אחוז ספציפי = י.ס הפרשה",
    vars: ["closingGross", "specificDebt", "generalRate", "specificRate", "closingAllowance"],
    f: (v) => (v.closingGross - v.specificDebt) * v.generalRate + v.specificDebt * v.specificRate - v.closingAllowance,
  },
  {
    id: "closingNet",
    label: "סוף השנה: לקוחות ברוטו − הפרשה = לקוחות נטו",
    vars: ["closingGross", "closingAllowance", "closingNet"],
    f: (v) => v.closingGross - v.closingAllowance - v.closingNet,
  },
  {
    id: "openingNet",
    label: "תחילת השנה: לקוחות ברוטו − הפרשה = לקוחות נטו",
    vars: ["openingGross", "openingAllowance", "openingNet"],
    f: (v) => v.openingGross - v.openingAllowance - v.openingNet,
  },
  {
    id: "openingRate",
    label: "תחילת השנה: הפרשה = לקוחות ברוטו × אחוז ההפרשה",
    vars: ["openingGross", "openingRate", "openingAllowance"],
    f: (v) => v.openingGross * v.openingRate - v.openingAllowance,
  },
];

/** "The same rate as last year": the opening rate is the year-end general rate. */
const SAME_RATE: Equation = {
  id: "sameRate",
  label: "אותו אחוז כמו בשנה הקודמת: אחוז ההפרשה בתחילת השנה = האחוז הכללי בסוף השנה",
  vars: ["openingRate", "generalRate"],
  f: (v) => v.openingRate - v.generalRate,
};

/** A figure found: its value, the relation it came from, the figure solved with it (a pair), and the figures it was found from. */
export type CreditStep = { key: CreditKey; value: number; equation: string; with?: CreditKey; from: CreditKey[] };
export type CreditSolution = {
  values: CreditValues;
  steps: CreditStep[];
  /** Relations whose figures were all given and do not agree. */
  conflicts: string[];
};

const EPS = 1e-9;
const TOLERANCE = 0.5;

/**
 * Solves what the question's figures allow. `given` holds the figures the
 * question gives; a figure left out is unknown. With `sameRate`, the opening and
 * closing rates are one. A question without a specific customer or a recovered
 * debt gives them as 0.
 */
export function solveCredit(given: CreditValues, { sameRate = false }: { sameRate?: boolean } = {}): CreditSolution {
  const known = new Map<CreditKey, number>(Object.entries(given).filter(([, v]) => v !== undefined && Number.isFinite(v)) as [CreditKey, number][]);
  const equations = sameRate ? [...EQUATIONS, SAME_RATE] : EQUATIONS;
  const steps: CreditStep[] = [];
  const evalAt = (eq: Equation, at: Partial<Record<CreditKey, number>>) => eq.f(new Proxy({} as Record<CreditKey, number>, { get: (_, k) => at[k as CreditKey] ?? known.get(k as CreditKey) ?? 0 }));
  const unknownsOf = (eq: Equation) => [...new Set(eq.vars.filter((k) => !known.has(k)))];
  const set = (key: CreditKey, value: number, eq: Equation, other?: CreditKey) => {
    known.set(key, value);
    steps.push({ key, value: RATE_KEYS.includes(key) ? value : round2(value), equation: eq.label, with: other, from: eq.vars.filter((k) => k !== key && k !== other) });
  };

  let progress = true;
  while (progress) {
    progress = false;
    // One unknown: every relation is affine in each figure alone, so two evaluations solve it.
    for (const eq of equations) {
      const [x, ...more] = unknownsOf(eq);
      if (!x || more.length) continue;
      const b = evalAt(eq, { [x]: 0 });
      const a = evalAt(eq, { [x]: 1 }) - b;
      if (Math.abs(a) < EPS) continue;
      set(x, -b / a, eq);
      progress = true;
    }
    if (progress) continue;
    // Two unknowns shared by two relations, both linear in them: solve the pair together.
    const pairs = equations.filter((eq) => unknownsOf(eq).length === 2);
    search: for (let i = 0; i < pairs.length; i++)
      for (let j = i + 1; j < pairs.length; j++) {
        const [x, y] = unknownsOf(pairs[i]);
        const uj = unknownsOf(pairs[j]);
        if (!uj.includes(x) || !uj.includes(y)) continue;
        const coef = (eq: Equation) => {
          const c = evalAt(eq, { [x]: 0, [y]: 0 });
          const ax = evalAt(eq, { [x]: 1, [y]: 0 }) - c;
          const ay = evalAt(eq, { [x]: 0, [y]: 1 }) - c;
          const cross = evalAt(eq, { [x]: 1, [y]: 1 }) - c - ax - ay;
          return Math.abs(cross) > EPS ? undefined : { ax, ay, c };
        };
        const p = coef(pairs[i]);
        const q = coef(pairs[j]);
        if (!p || !q) continue;
        const det = p.ax * q.ay - p.ay * q.ax;
        if (Math.abs(det) < EPS) continue;
        const vx = (-p.c * q.ay + q.c * p.ay) / det;
        const vy = (-p.ax * q.c + q.ax * p.c) / det;
        set(x, vx, pairs[i], y);
        set(y, vy, pairs[j], x);
        progress = true;
        break search;
      }
  }

  const conflicts = equations.filter((eq) => eq.vars.every((k) => known.has(k)) && Math.abs(evalAt(eq, {})) > TOLERANCE).map((eq) => eq.label);
  const values: CreditValues = {};
  for (const [k, v] of known) values[k] = RATE_KEYS.includes(k) ? v : round2(v);
  return { values, steps, conflicts };
}

/** Only the steps that lead to `target`, in the order they were taken — not every figure that could be worked out on the way. */
export function stepsFor(target: CreditKey, solution: CreditSolution): CreditStep[] {
  const byKey = new Map(solution.steps.map((s) => [s.key, s]));
  const needed = new Set<CreditKey>();
  const visit = (k: CreditKey) => {
    const s = byKey.get(k);
    if (!s || needed.has(k)) return;
    needed.add(k);
    for (const d of s.from) visit(d);
    if (s.with) visit(s.with);
  };
  visit(target);
  return solution.steps.filter((s) => needed.has(s.key));
}

/** What is still missing to reach `target`: the unknowns of every relation it appears in. */
export function missingFor(target: CreditKey, solution: CreditSolution, { sameRate = false }: { sameRate?: boolean } = {}): CreditKey[] {
  if (solution.values[target] !== undefined) return [];
  const equations = sameRate ? [...EQUATIONS, SAME_RATE] : EQUATIONS;
  const out = new Set<CreditKey>();
  for (const eq of equations) if (eq.vars.includes(target)) for (const k of eq.vars) if (k !== target && solution.values[k] === undefined) out.add(k);
  return [...out];
}
