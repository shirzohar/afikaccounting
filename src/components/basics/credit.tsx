import { ClipboardList, Store } from "lucide-react";
import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { type Balances, balancesOf, type Entry, ledger, round2, type TAccount } from "@/lib/learn/basics";
import { adjustment, ALLOW, ALON, ALON_LOW, AR, DOR, ERAN, EXPENSE, GILBOA, RONIT, SCENARIO_A, SCENARIO_B, SCENARIO_C, writeOff, year } from "@/lib/learn/credit-losses";
import { cn } from "@/lib/utils";
import { ClosingArrow } from "./closing-arrow";
import { CreditLossCalculator } from "./credit-calculator";
import { EntriesDialog } from "./entries-dialog";
import { FormulaDialog } from "./formula-dialog";
import { TCardsDialog } from "./t-dialog";
import { Posted } from "./t-accounts";
import { Calc, JE, KeyCard, Money, Rule, type Step, Stepper } from "./ui";

const pct = (r: number) => `${round2(r * 100)}%`;
const f = (v: number) => v.toLocaleString("he-IL");
/** A key naming one line of a T-account: its account, and an entry id, "פתיחה" or "סגירה". */
const k = (account: string, ref: string) => `${account}|${ref}`;

// ---------------------------------------------------------------------------
// The two T-accounts every question is solved in.

/** `entry`: the allowance's year-end posting against the expense — the unknown the journal entry is made for. */
type Row = { key: string; label: string; ref?: string; amount: number; close?: boolean; entry?: boolean };

/** What a posting is, read from the account on the other side of its entry. */
function labelOf(account: string, side: "dr" | "cr", entry?: Entry) {
  const other = entry?.lines.find((l) => l.account !== account)?.account;
  if (account === AR) {
    if (side === "dr") return other === ALLOW ? "החזרת חוב שנמחק" : "מכירות באשראי";
    if (other === ALLOW) return "מחיקת חוב אבוד";
    return entry?.id.endsWith("ב") ? "גביית החוב שחזר" : "גבייה מלקוחות";
  }
  if (side === "dr") return other === AR ? "מחיקת חוב אבוד" : "ביטול הפרשה (קיטון)";
  return other === AR ? "החזרת חוב שנמחק" : "הוצאות הפסדי אשראי (גידול)";
}

/** Letters for the unknowns, in the order a question names them. */
const LETTERS = ["X", "Y", "Z", "W", "V", "U"];

/**
 * A T-account as the method draws it: the opening balance (zero too), the
 * movements, and under a line the closing balance — customers' balances always
 * in debit, the allowance's always in credit.
 */
function rowsOf(t: TAccount, entries: Entry[]) {
  const byId = new Map(entries.map((x) => [x.id, x]));
  // A balance the other way shows in parentheses.
  const natural = t.account === AR ? "dr" : "cr";
  const sign = natural === "dr" ? 1 : -1;
  const dr: Row[] = [];
  const cr: Row[] = [];
  const open: Row = { key: k(t.account, "פתיחה"), label: "יתרת פתיחה", amount: sign * t.opening };
  (natural === "dr" ? dr : cr).push(open);
  const entry = (ref: string) => t.account === ALLOW && !!byId.get(ref)?.lines.some((l) => l.account === EXPENSE);
  for (const p of t.dr) dr.push({ key: k(t.account, p.ref), label: labelOf(t.account, "dr", byId.get(p.ref)), ref: p.ref, amount: p.amount, entry: entry(p.ref) });
  for (const p of t.cr) cr.push({ key: k(t.account, p.ref), label: labelOf(t.account, "cr", byId.get(p.ref)), ref: p.ref, amount: p.amount, entry: entry(p.ref) });
  const closing: Row = { key: k(t.account, "סגירה"), label: "יתרת סגירה", amount: sign * t.balance, close: true };
  return { dr, cr, closing, closingSide: natural };
}

function LetterT({ t, entries, letters, mode }: { t: TAccount; entries: Entry[]; letters: Map<string, string>; mode: "question" | "solved" }) {
  const { dr, cr, closing, closingSide } = rowsOf(t, entries);
  const n = Math.max(dr.length, cr.length);
  const line = (r: Row) => {
    const letter = letters.get(r.key);
    return (
      <li
        key={r.key}
        // The allowance's closing balance is where the formula's answer goes.
        data-link-to={r.close && t.account === ALLOW ? "closing" : undefined}
        className={cn(
          "flex items-center justify-between gap-2 rounded px-1.5 py-1 text-[12.5px]",
          r.close && "font-bold",
          letter && (mode === "question" ? "bg-amber-500/15 ring-1 ring-amber-500/50" : "bg-success/10 ring-1 ring-success/40"),
        )}
      >
        <span className="min-w-0 text-fg">
          {r.label}
          {r.ref && <span className="ms-1 text-[10px] text-subtle">({r.ref})</span>}
          {r.entry && letter && (
            <span className="ms-1.5 inline-block rounded bg-amber-400 px-1.5 py-px text-[10.5px] font-bold text-amber-950">עליו פקודת היומן</span>
          )}
        </span>
        {letter && mode === "question" ? (
          <span className="shrink-0 font-bold text-amber-600 dark:text-amber-400">{letter}</span>
        ) : (
          <span className="flex shrink-0 items-center gap-1">
            {letter && <span className="text-[11px] font-bold text-success">{letter} =</span>}
            <Money v={r.amount} plain />
          </span>
        )}
      </li>
    );
  };
  const side = (rows: Row[], s: "dr" | "cr") => (
    <div className={cn("flex min-w-0 flex-col", s === "dr" && "border-e-2 border-fg/70")}>
      <p className={cn("px-2 pt-1 text-[11px] font-bold", s === "dr" ? "text-debit" : "text-credit")}>{s === "dr" ? "חובה" : "זכות"}</p>
      <ul className="space-y-0.5 px-1 pb-1">
        {rows.map(line)}
        {Array.from({ length: n - rows.length }, (_, i) => (
          <li key={`e${i}`} className="py-1 text-[12.5px]">
            &nbsp;
          </li>
        ))}
      </ul>
      <ul className="border-t-2 border-fg/70 px-1 py-1">{closingSide === s ? line(closing) : <li className="py-1 text-[12.5px]">&nbsp;</li>}</ul>
    </div>
  );
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-2 border-b-2 border-fg/70 bg-surface-2/60 px-3 py-2 text-sm font-bold text-fg">
        <span>{t.account === AR ? "לקוחות (ברוטו)" : t.account}</span>
        <span className="text-[11px] font-normal text-subtle">{t.account === AR ? "נכס · יתרה בחובה" : "מקטין את הלקוחות · יתרה בזכות"}</span>
      </figcaption>
      <div className="grid grid-cols-2">
        {side(dr, "dr")}
        {side(cr, "cr")}
      </div>
    </figure>
  );
}

/** Customers and the allowance, side by side. Unknowns get letters: X, Y, Z… — amber while open, green once solved. */
function TwoT({
  accounts,
  entries,
  unknown = [],
  mode = "solved",
  closing,
  beside,
}: {
  accounts: TAccount[];
  entries: Entry[];
  unknown?: string[];
  mode?: "question" | "solved";
  /** The formula's answer — the allowance's closing balance — shown under its card, with an arrow to where it goes. */
  closing?: ReactNode;
  /** Under the customers' card, beside the answer: the balance sheet's customers, say. */
  beside?: ReactNode;
}) {
  const letters = new Map(unknown.map((key, i) => [key, LETTERS[i]]));
  const pair = [AR, ALLOW].map((a) => accounts.find((t) => t.account === a)).filter((t): t is TAccount => !!t);
  const cards = (
    <div className="grid gap-3 md:grid-cols-2">
      {pair.map((t) => (
        <LetterT key={t.account} t={t} entries={entries} letters={letters} mode={mode} />
      ))}
    </div>
  );
  return (
    <div>
      {closing ? (
        <ClosingArrow>
          {cards}
          <div className="mt-9 grid gap-3 md:grid-cols-2">
            {beside ?? <div className="max-md:hidden" />}
            <div data-link-from="closing" className="rounded-xl border-2 border-accent/50 bg-accent-soft/50 px-3.5 py-2.5 text-[14.5px] text-fg">
              {closing}
            </div>
          </div>
        </ClosingArrow>
      ) : (
        cards
      )}
      {unknown.length > 0 && (
        <p className="mt-1.5 text-xs text-muted">
          {mode === "question" ? (
            <>
              <span className="rounded bg-amber-500/15 px-1.5 font-bold text-amber-600 dark:text-amber-400">{LETTERS.slice(0, unknown.length).join(", ")}</span> — נעלמים.
              בכל כרטיס: פתיחה + מה שמגדיל − מה שמקטין = סגירה; הנעלם הוא ההפרש.
            </>
          ) : (
            <>
              <span className="rounded bg-success/10 px-1.5 font-bold text-success">מודגש</span> — הנעלמים, אחרי החילוץ.
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** The formula's answer under the cards: it is the closing balance; the expense is what is left, and the entry is made for it. */
function closingNote(allowance: number) {
  return (
    <>
      <strong className="text-accent">התשובה של הנוסחה — י.ס הפרשה להפסדי אשראי: </strong>
      <Money v={allowance} />. היא נכנסת לכרטיס כיתרת הסגירה, מתחת לקו. הנעלם שנשאר בכרטיס — הוצאות הפסדי האשראי — הוא שעליו עושים את פקודת היומן.
    </>
  );
}

/** The rules a step applies, as tags above it. */
function Rules({ n }: { n: number[] }) {
  return (
    <p className="flex flex-wrap gap-1.5">
      {n.map((r) => (
        <span key={r} className="num rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-fg">
          כלל {r}
        </span>
      ))}
    </p>
  );
}

/** Entries of an example, side by side when there is room. */
function Entries({ entries }: { entries: Entry[] }) {
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {entries.map((x) => (
        <JE key={x.id} entry={x} note={null} />
      ))}
    </div>
  );
}

/** Customers as the balance sheet shows them: gross, less the allowance, net. */
function NetView({ gross, allowance, caption }: { gross: number; allowance: number; caption: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border-2 border-accent/40 bg-surface">
      <figcaption className="bg-accent px-4 py-2 text-[14.5px] font-bold text-accent-fg">{caption}</figcaption>
      <div className="divide-y divide-line/60 text-sm">
        <p className="flex justify-between gap-3 px-4 py-2">
          <span className="text-fg">לקוחות (ברוטו)</span>
          <Money v={gross} plain />
        </p>
        <p className="flex justify-between gap-3 px-4 py-2">
          <span className="text-fg">בניכוי: הפרשה להפסדי אשראי חזויים</span>
          <Money v={-allowance} plain className="text-danger" />
        </p>
        <p className="flex justify-between gap-3 border-t-2 border-fg/70 px-4 py-2 font-bold text-fg">
          <span>לקוחות, נטו</span>
          <Money v={round2(gross - allowance)} plain />
        </p>
      </div>
    </figure>
  );
}

/** The general formula behind a button, for every worked example. */
function FormulaButton() {
  return (
    <FormulaDialog>
      <ClosingFormula />
    </FormulaDialog>
  );
}

/** What an example gives and what it asks — the amber box the course opens a full example with. */
export function Given({ title, children, asks }: { title: ReactNode; children: ReactNode; asks?: ReactNode }) {
  return (
    <div className="space-y-2 rounded-2xl border-2 border-amber-500/50 bg-amber-500/[0.08] px-4 py-3.5 [column-span:all]">
      <p className="flex items-center gap-2 text-[16px] font-bold text-fg">
        <ClipboardList className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden /> {title}
      </p>
      <div className="space-y-1.5 text-[15px] leading-relaxed text-fg">{children}</div>
      {asks && (
        <p className="border-t border-amber-500/30 pt-2 text-[15px] text-fg">
          <strong>נדרש: </strong>
          {asks}
        </p>
      )}
    </div>
  );
}

type Year = { result: { accounts: TAccount[]; gross: number; allowance: number }; entries: Entry[]; adj: Entry };

/** A year solved by the method: the cards with the unknowns, then the cards solved — the answer, the balance sheet, and the entries a click away. */
function walk(name: string, x: Year, unknown: string[], { given, solve, all }: { given?: ReactNode; solve: ReactNode; all?: boolean }): Step[] {
  return [
    {
      title: `${name} · מציבים בשני הכרטיסים`,
      body: (
        <>
          <Rules n={[1, 2]} />
          {given}
          <TwoT accounts={x.result.accounts} entries={x.entries} unknown={unknown} mode="question" />
        </>
      ),
    },
    {
      title: `${name} · מחלצים את הנעלמים`,
      body: (
        <>
          <Rules n={[3]} />
          {solve}
          <TwoT
            accounts={x.result.accounts}
            entries={x.entries}
            unknown={unknown}
            closing={
              <>
                {closingNote(x.result.allowance)}
                <div className="mt-2.5">
                  <EntriesDialog>{all ? <Entries entries={x.entries} /> : <JE entry={x.adj} title={`${x.adj.id}. ${x.adj.text} · 31.12`} note={null} />}</EntriesDialog>
                </div>
              </>
            }
            beside={<NetView gross={x.result.gross} allowance={x.result.allowance} caption="המאזן בסוף השנה — סעיף הלקוחות" />}
          />
        </>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// The idea: Ronit's shop. Her first year — 100 customers on credit, 5 expected not to pay.

const RONIT_TOTAL = RONIT.customers * RONIT.each;
/** A few lines of Ronit's credit notebook, and the rest of her customers in one line — adding up to what she is owed. */
const PINKAS_SHOWN: [string, number][] = [
  ["משפחת כהן", 1_200],
  ["מיכל", 850],
  ["יוסי מהבניין ממול", 2_400],
  ["רותם", 650],
  ["אבי והילדים", 1_900],
];
const PINKAS: [string, number][] = [
  ...PINKAS_SHOWN,
  [`ועוד ${RONIT.customers - PINKAS_SHOWN.length} לקוחות`, RONIT_TOTAL - PINKAS_SHOWN.reduce((t, [, v]) => t + v, 0)],
];
const RONIT_LOSS = RONIT.unpaid * RONIT.each;
const RONIT_YEAR = year({ openingAR: 0, openingAllowance: 0, creditSales: RONIT_TOTAL, required: (g) => g * (RONIT.unpaid / RONIT.customers) });

const TERMS: { name: string; what: string; amount: number; tone: string }[] = [
  { name: "לקוחות ברוטו", what: "כל מה שהלקוחות חייבים לפי החשבוניות. נכס, יתרה בחובה.", amount: RONIT_TOTAL, tone: "bg-debit/10 text-debit" },
  { name: "הפרשה להפסדי אשראי", what: "הכרית: החלק שצפוי לא להיגבות. יתרה בזכות, והיא מקטינה את הלקוחות.", amount: RONIT_LOSS, tone: "bg-credit/10 text-credit" },
  { name: "לקוחות נטו", what: "מה שבאמת צפוי להיגבות: ברוטו פחות ההפרשה. זה מה שנכנס לסך הנכסים.", amount: RONIT_TOTAL - RONIT_LOSS, tone: "bg-accent-soft text-accent" },
];

// The terms' example: customers after the adjustments, one of them in trouble, and what the allowance card already holds.
const TERMS_EG = { gross: 110_000, specific: 10_000, specificRate: 0.6, general: 0.05, inCard: 8_000 };
const termsSpecific = round2(TERMS_EG.specific * TERMS_EG.specificRate);
const termsGeneral = round2((TERMS_EG.gross - TERMS_EG.specific) * TERMS_EG.general);
const termsRequired = termsSpecific + termsGeneral;

// The terms that come with a customer who will not pay — every one of them a part of the closing formula. Round illustrative figures.
/** One colour per figure of the closing formula — the same in the term cards, in the formula and in its examples, so each number can be traced. */
const TONES = {
  gross: "bg-sky-500/15 text-sky-700 ring-sky-500/40 dark:text-sky-300",
  specific: "bg-amber-500/15 text-amber-700 ring-amber-500/40 dark:text-amber-300",
  specificRate: "bg-violet-500/15 text-violet-700 ring-violet-500/40 dark:text-violet-300",
  general: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/40 dark:text-emerald-300",
};
type Tone = keyof typeof TONES;

/** A figure of the formula, in its colour. */
function Hl({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={cn("rounded-md px-1.5 py-0.5 font-bold ring-1", TONES[tone])}>{children}</span>;
}

const MORE_TERMS: { name: string; what: ReactNode; eg: ReactNode; aside?: ReactNode }[] = [
  {
    name: "חוב אבוד",
    what: "חוב שכבר ברור שלא ייגבה — למשל לקוח שפשט רגל. כבר לא אומדן: יודעים מי. מוחקים אותו מהלקוחות ומהכרית יחד (ח׳ הפרשה / ז׳ לקוחות), בלי הוצאה.",
    aside: <>לא בנוסחה — כבר ירד מהלקוחות</>,
    eg: (
      <>
        לקוח שחייב <strong className="text-fg">1,000</strong> פשט רגל: הלקוחות ברוטו וההפרשה קטנים שניהם ב-<strong className="text-fg">1,000</strong>.
      </>
    ),
  },
  {
    name: "חוב ספציפי",
    what: "החוב של לקוח מסוים שידוע שהוא בקשיים — אבל עוד לא אבוד. הוא נשאר בלקוחות ברוטו, ורק ההפרשה עליו מחושבת לחוד.",
    eg: (
      <>
        לקוח בקשיים חייב{" "}
        <Hl tone="specific">
          <N v={TERMS_EG.specific} />
        </Hl>
        : זה החוב הספציפי.
      </>
    ),
  },
  {
    name: "אחוז ספציפי",
    what: "החלק מהחוב הספציפי שלא צפוי להיגבות. חוב ספציפי × אחוז ספציפי = ההפרשה הספציפית.",
    eg: (
      <>
        מעריכים ש-
        <Hl tone="specificRate">
          <P r={TERMS_EG.specificRate} />
        </Hl>{" "}
        מהחוב לא ייגבה: זה האחוז הספציפי.
      </>
    ),
  },
  {
    name: "אחוז הפרשה כללי",
    what: "האחוז על כל שאר הלקוחות — הלקוחות ברוטו בניכוי החוב הספציפי, כדי שאותו חוב לא ייספר פעמיים.",
    eg: (
      <>
        י.ס לקוחות ברוטו לאחר התאמה — כבר אחרי מחיקת החוב האבוד:{" "}
        <Hl tone="gross">
          <N v={TERMS_EG.gross} />
        </Hl>
        . על כולם, חוץ מהחוב הספציפי, מפרישים{" "}
        <Hl tone="general">
          <P r={TERMS_EG.general} />
        </Hl>
        : זה האחוז הכללי.
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Ronit's second year, entry by entry: the year's sales and collections, a debt written off, and the year end.

const R2 = { sales: 500_000, collections: 479_000, written: 1_000, rate: 0.05, lowRate: 0.03 };
const R2_OPEN: Balances = { [AR]: RONIT_TOTAL, [ALLOW]: -RONIT_LOSS };
const r2Line = (id: string, date: string, text: string, dr: string, cr: string, amount: number): Entry => ({
  id,
  date,
  text,
  lines: [
    { account: dr, dr: amount },
    { account: cr, cr: amount },
  ],
});
const R2_YEAR: Entry[] = [
  r2Line("1", "2026", "מכירות באשראי במהלך השנה", AR, "מכירות", R2.sales),
  r2Line("2", "2026", "גבייה מלקוחות במהלך השנה", "מזומן", AR, R2.collections),
  writeOff("3", "3.2026", R2.written, "דני, שפשט רגל"),
];
const R2_MID = balancesOf(ledger(R2_YEAR, R2_OPEN));
const r2Gross = R2_MID[AR];
const r2Before = -R2_MID[ALLOW];
const R2_UP = adjustment("4", "31.12.2026", r2Before, round2(r2Gross * R2.rate));
const R2_DOWN = adjustment("4", "31.12.2026", r2Before, round2(r2Gross * R2.lowRate));

/** Customers, the allowance and net, before an entry and after it — and what it did to profit or loss. */
function Effect({ before, after, pl }: { before: Balances; after: Balances; pl: ReactNode }) {
  const read = (b: Balances) => ({ gross: b[AR] ?? 0, allowance: -(b[ALLOW] ?? 0) });
  const [a, z] = [read(before), read(after)];
  const cell = (label: string, x: number, y: number) => (
    <li className={cn("rounded-lg px-3 py-2", x === y ? "bg-surface-2/70" : "bg-accent-soft/70 ring-1 ring-accent/40")}>
      <span className="block text-[11.5px] font-semibold text-muted">{label}</span>
      <span className="num flex flex-wrap items-center gap-1.5 text-[14.5px]">
        {x === y ? (
          <>
            <Money v={y} plain className="font-semibold text-fg" /> <span className="text-[12px] text-muted">לא משתנה</span>
          </>
        ) : (
          <>
            <Money v={x} plain className="text-muted line-through decoration-danger/70" /> <span className="text-subtle">←</span>
            <Money v={y} plain className="font-bold text-fg" />
          </>
        )}
      </span>
    </li>
  );
  return (
    <div className="space-y-2">
      <ul className="grid gap-2 sm:grid-cols-3">
        {cell("לקוחות ברוטו", a.gross, z.gross)}
        {cell("הפרשה", a.allowance, z.allowance)}
        {cell("לקוחות נטו", round2(a.gross - a.allowance), round2(z.gross - z.allowance))}
      </ul>
      <p className="rounded-lg bg-fg/[0.04] px-3 py-2 text-[14px] text-fg">
        <span className="me-1.5 rounded-md bg-fg px-1.5 py-0.5 text-[11px] font-bold text-surface">רווח והפסד</span>
        {pl}
      </p>
    </div>
  );
}

/**
 * The closing-balance formula, term by term, laid out left to right as it is worked — the result at the right end, like
 * every example under it. Each term is its own item, so the Hebrew words cannot pull the order back to right-to-left.
 */
const FORMULA: [string, Tone?][] = [
  ["("],
  ["י.ס לקוחות ברוטו לאחר התאמה", "gross"],
  ["−"],
  ["חוב ספציפי", "specific"],
  [")"],
  ["×"],
  ["אחוז כללי", "general"],
  ["+"],
  ["חוב ספציפי", "specific"],
  ["×"],
  ["אחוז ספציפי", "specificRate"],
  ["="],
  ["י.ס הפרשה להפסדי אשראי"],
];

/**
 * The formula every credit-loss question comes back to: the allowance's closing balance. It gives a balance, not an entry —
 * the entry is the unknown found once that balance is in the card: missing in credit, the expense grows; too much, it is reversed.
 */
function ClosingFormula({ example, found }: { example?: ReactNode; found?: ReactNode }) {
  return (
    <section className="space-y-2.5 rounded-2xl border-2 border-accent bg-accent-soft/40 p-4 [column-span:all]" aria-label="הנוסחה ליתרת הסגירה של ההפרשה">
      <p className="text-[15px] font-bold text-accent">הנוסחה שתלווה אתכם בכל שאלה בהפסדי אשראי</p>
      <p className="rounded-lg bg-surface px-3 py-2.5 text-center text-[16.5px] font-bold leading-relaxed text-fg ring-1 ring-accent/40">
        <span dir="ltr" className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
          {FORMULA.map(([t, tone], i) => (
            <span key={i} dir={/[א-ת]/.test(t) ? "rtl" : "ltr"}>
              {tone ? <Hl tone={tone}>{t}</Hl> : t}
            </span>
          ))}
        </span>
      </p>
      <p className="text-[13px] text-muted">
        <strong className="text-fg">י.ס</strong> — יתרת סגירה · <strong className="text-fg">י.פ</strong> — יתרת פתיחה
      </p>
      {example && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[15px] text-fg">
          <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-fg">בדוגמה</span>
          <span dir="ltr" className="num">
            {example}
          </span>
        </p>
      )}
      <p className="rounded-lg border border-danger/40 bg-danger/[0.08] px-3 py-2 text-[14px] text-fg">
        <strong className="text-danger">חוב אבוד לא מופיע בנוסחה.</strong> מחיקת חוב אבוד (ח׳ הפרשה / ז׳ לקוחות) היא פקודה שכבר הורידה אותו מהלקוחות — ולכן{" "}
        <Hl tone="gross">י.ס לקוחות ברוטו לאחר התאמה</Hl> כבר מתוקנת ולא כוללת אותו. לא מורידים אותו שוב.
      </p>
      <p className="rounded-lg border-s-4 border-amber-500 bg-amber-500/[0.08] px-3 py-2 text-[14.5px] text-fg">
        <strong>שימו לב: הנוסחה נותנת יתרת סגירה — לא פקודת יומן.</strong> מציבים את היתרה בכרטיס ה-T של ההפרשה, יחד עם כל השאר, ומוצאים את הנעלם. עליו עושים את
        הפקודה, לפי הצד שיצא:
      </p>
      <ul className="grid gap-2 text-[14px] sm:grid-cols-2">
        <li className="rounded-lg bg-surface px-3 py-2">
          <strong className="text-credit">חסר בזכות</strong> — מגדילים את ההפרשה: ח׳ הוצאות הפסדי אשראי / ז׳ הפרשה.
        </li>
        <li className="rounded-lg bg-surface px-3 py-2">
          <strong className="text-debit">צריך להשלים בחובה</strong> — מקטינים את ההפרשה: ח׳ הפרשה / ז׳ הוצאות הפסדי אשראי.
        </li>
      </ul>
      {found && <p className="text-[14.5px] font-medium text-fg">{found}</p>}
    </section>
  );
}

/** A year end worked with the formula (behind the button): the required closing balance in figures, and what the card is missing. */
function Worked({ example, found }: { example: ReactNode; found: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-accent">התשובה של הנוסחה — י.ס הפרשה</span>
        <span dir="ltr" className="num">
          {example}
        </span>
      </p>
      <p className="text-[14.5px]">{found}</p>
    </div>
  );
}

/** One of Ronit's entries: the story, the entries, what they did, and the cards they moved behind a button. */
function EventStep({
  story,
  at,
  entries,
  pl,
  note,
  closing,
}: {
  story: ReactNode;
  at: number;
  entries: Entry[];
  pl: ReactNode;
  note?: ReactNode;
  /** At year end: both cards on the page, the formula's answer under them with an arrow into the closing balance — and the entry, the unknown left, after them. */
  closing?: ReactNode;
}) {
  const done = [...R2_YEAR.slice(0, at), ...entries];
  const before = balancesOf(ledger(R2_YEAR.slice(0, at), R2_OPEN));
  const after = balancesOf(ledger(done, R2_OPEN));
  const touched = new Set(entries.flatMap((x) => x.lines.map((l) => l.account)));
  return (
    <>
      <p>{story}</p>
      {closing && <TwoT accounts={ledger(done, R2_OPEN)} entries={done} unknown={[k(ALLOW, entries[0].id), k(ALLOW, "סגירה")]} closing={closing} />}
      <div className={entries.length > 1 ? "grid gap-2 lg:grid-cols-2" : ""}>
        {entries.map((x) => (
          <JE key={x.id} entry={x} note={null} />
        ))}
      </div>
      {!closing && <TCardsDialog cards={ledger(done, R2_OPEN).filter((t) => touched.has(t.account))} fresh={entries.at(-1)!.id} openingLabel="יתרה" />}
      <Effect before={before} after={after} pl={pl} />
      {note}
    </>
  );
}

const ronitYear: Step[] = [
  {
    title: "1. מכירות וגבייה — רק כרטיס הלקוחות",
    body: (
      <EventStep
        story={
          <>
            השנה השנייה של רונית. היא פותחת אותה עם לקוחות של <Money v={RONIT_TOTAL} /> והפרשה של <Money v={RONIT_LOSS} />. במהלך השנה מכרה בהקפה ב-
            <Money v={R2.sales} />, וגבתה <Money v={R2.collections} />.
          </>
        }
        at={0}
        entries={R2_YEAR.slice(0, 2)}
        pl={<>המכירות — הכנסה, כרגיל. ההפרשה לא זזה: גבייה היא לא הפסד.</>}
      />
    ),
  },
  {
    title: "2. מחיקת חוב אבוד",
    body: (
      <EventStep
        story={
          <>
            במרץ דני, שחייב <Money v={R2.written} />, פשט רגל. עכשיו כבר יודעים <strong>מי</strong> לא ישלם — ומורידים אותו מהלקוחות ומהכרית יחד.
          </>
        }
        at={2}
        entries={[R2_YEAR[2]]}
        pl={<>לא משתנה. ההפסד נרשם כבר כשהפרשנו — המחיקה רק משתמשת בכרית.</>}
        note={<Rule>מחיקה: ח׳ הפרשה / ז׳ לקוחות. אין הוצאה — והלקוחות נטו נשארים בדיוק כמו שהיו.</Rule>}
      />
    ),
  },
  {
    title: "3. סוף השנה: השלמת ההפרשה",
    body: (
      <EventStep
        story={
          <>
            ב-31.12 הלקוחות עומדים על <Money v={r2Gross} />, ורונית מעריכה ש-{pct(R2.rate)} מהם לא ייגבו. בכרטיס ההפרשה יש כבר <Money v={r2Before} /> — משלימים רק את
            מה שחסר.
          </>
        }
        at={3}
        entries={[R2_UP]}
        pl={
          <>
            הוצאות הפסדי אשראי <Money v={R2_UP.lines[0].dr!} /> — ההפרש, לא כל ההפרשה הנדרשת.
          </>
        }
        closing={
          <Worked
            example={
              <>
                (<Hl tone="gross"><N v={r2Gross} /></Hl> − <Hl tone="specific"><N v={0} /></Hl>) × <Hl tone="general"><P r={R2.rate} /></Hl> + <Hl tone="specific"><N v={0} /></Hl> × <Hl tone="specificRate"><P r={0} /></Hl> = <strong><N v={round2(r2Gross * R2.rate)} /></strong>
              </>
            }
            found={
              <>
                בכרטיס יש <N v={r2Before} /> בזכות; כדי להגיע ל-<N v={round2(r2Gross * R2.rate)} /> חסרים <N v={R2_UP.lines[0].dr!} /> בזכות — X בזכות, ולכן ח׳ הוצאות / ז׳ הפרשה.
              </>
            }
          />
        }
      />
    ),
  },
  {
    title: "4. ואם נדרש פחות? ביטול הפרשה",
    body: (
      <EventStep
        story={
          <>
            אותה שנה, אבל רונית מעריכה רק {pct(R2.lowRate)}: נדרשת <Money v={round2(r2Gross * R2.lowRate)} />, ובכרטיס כבר <Money v={r2Before} />. את העודף מבטלים — הפקודה
            הפוכה.
          </>
        }
        at={3}
        entries={[R2_DOWN]}
        closing={
          <Worked
            example={
              <>
                (<Hl tone="gross"><N v={r2Gross} /></Hl> − <Hl tone="specific"><N v={0} /></Hl>) × <Hl tone="general"><P r={R2.lowRate} /></Hl> + <Hl tone="specific"><N v={0} /></Hl> × <Hl tone="specificRate"><P r={0} /></Hl> = <strong><N v={round2(r2Gross * R2.lowRate)} /></strong>
              </>
            }
            found={
              <>
                בכרטיס יש <N v={r2Before} /> בזכות — יותר מ-<N v={round2(r2Gross * R2.lowRate)} />. כדי לרדת ליתרה משלימים <N v={R2_DOWN.lines[0].dr!} /> בחובה — X בחובה, ולכן ח׳ הפרשה /
                ז׳ הוצאות.
              </>
            }
          />
        }
        pl={
          <>
            ההוצאה קטנה ב-<Money v={R2_DOWN.lines[0].dr!} /> (זכות) — ביטול ההפרשה מגדיל את הרווח.
          </>
        }
      />
    ),
  },
];

// ---------------------------------------------------------------------------
// The method.

/** The three numbers every extraction formula uses — scenario A's opening balances — so nothing new distracts. */
const BASE = { gross: SCENARIO_A.openingAR, rate: SCENARIO_A.rate, allowance: SCENARIO_A.openingAllowance, net: SCENARIO_A.openingNet };

const RULES: { title: string; body: ReactNode }[] = [
  {
    title: "פותחים שני כרטיסי T סמוכים",
    body: (
      <>
        כרטיס אחד ל<strong>לקוחות (ברוטו)</strong> וכרטיס שני ל<strong>הפרשה להפסדי אשראי</strong> — זה ליד זה. כל שאלה נפתרת בתוך שני הכרטיסים האלה.
      </>
    ),
  },
  {
    title: "מציבים את כל הנתונים — בצד הנכון",
    body: (
      <>
        כל נתון מהשאלה נכנס לכרטיס שלו, בחובה או בזכות. יתרות הפתיחה והסגירה — בצד שבו היתרה יושבת (לקוחות בחובה, הפרשה בזכות), גם כשהן 0. מה שלא ידוע
        מסמנים באות: <span className="font-bold text-amber-600 dark:text-amber-400">X, Y, Z</span>.
      </>
    ),
  },
  {
    title: "מחלצים את הנעלמים",
    body: <>בכל כרטיס: פתיחה + מה שמגדיל − מה שמקטין = סגירה. יתרת הסגירה של ההפרשה באה מהנוסחה שלמטה; הנעלם הוא ההפרש — ועליו הפקודה.</>,
  },
];

/** The three rules, framed so they can't be missed. */
function MethodBox() {
  return (
    <section className="overflow-hidden rounded-2xl border-[3px] border-accent bg-surface shadow-[0_12px_30px_-18px_var(--accent)]" aria-labelledby="method-title">
      <header className="bg-accent px-5 py-3 text-accent-fg">
        <h3 id="method-title" className="text-xl font-extrabold tracking-tight">
          מתווה 3 הכללים
        </h3>
        <p className="text-sm opacity-90">אותו סדר בכל שאלה — מהקלה ביותר ועד שאלת הבחינה.</p>
      </header>
      <ol className="divide-y divide-line">
        {RULES.map((r, i) => (
          <li key={r.title} className="flex gap-4 px-5 py-3.5">
            <span className="num grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg">{i + 1}</span>
            <div className="min-w-0 text-[15px] leading-relaxed text-fg/90">
              <p className="text-[16px] font-bold text-fg">
                כלל {i + 1}: {r.title}
              </p>
              <div className="mt-0.5">{r.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** What goes on each side of one of the two cards: every figure a question gives is one of these lines. */
function TemplateT({ title, dr, cr }: { title: string; dr: string[]; cr: string[] }) {
  const col = (items: string[], first: boolean) => (
    <div className={cn("min-w-0 p-2", first && "border-e-2 border-fg/70")}>
      <p className={cn("text-[11px] font-bold", first ? "text-debit" : "text-credit")}>{first ? "חובה" : "זכות"}</p>
      <ul className="mt-1 space-y-1 text-[13px] text-fg">
        {items.map((x) => (
          <li key={x} className={cn(x.startsWith("יתרת סגירה") && "border-t border-dashed border-line pt-1 font-semibold")}>
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
      <figcaption className="border-b-2 border-fg/70 bg-surface-2/60 px-3 py-2 text-sm font-bold text-fg">{title}</figcaption>
      <div className="grid grid-cols-2">
        {col(dr, true)}
        {col(cr, false)}
      </div>
    </figure>
  );
}

/** An amount inside a formula. */
function N({ v }: { v: number }) {
  return <Money v={v} plain />;
}
/** A rate inside a formula. */
function P({ r }: { r: number }) {
  return (
    <bdi dir="ltr" className="num">
      {pct(r)}
    </bdi>
  );
}

/** A fraction drawn as one: numerator over a bar over denominator. */
function Frac({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  return (
    <span className="mx-1 inline-flex flex-col items-center text-center align-middle leading-tight">
      <span className="px-1.5 pb-1">{top}</span>
      <span className="w-full border-t-2 border-fg/80 px-1.5 pt-1">{bottom}</span>
    </span>
  );
}

/** One extraction formula: when to use it, the formula, and the formula with numbers. */
function Formula({ title, when, formula, example, note }: { title: string; when: string; formula: ReactNode; example: ReactNode; note?: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-line bg-surface-2/40 p-3">
      <p className="font-bold text-fg">{title}</p>
      <p className="text-[13px] text-muted">{when}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-1 rounded-lg bg-surface px-3 py-3 text-[16px] font-semibold text-fg ring-1 ring-accent/40">{formula}</div>
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2.5 text-[15px] text-fg">
        <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-fg">בדוגמה</span>
        <span className="flex flex-1 flex-wrap items-center justify-center gap-x-1">{example}</span>
      </div>
      {note && <p className="mt-1.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The examples, each a walkthrough.

const alon: Step[] = [
  ...walk("אלון", ALON, [k(ALLOW, ALON.ids.adj), k(AR, "סגירה"), k(ALLOW, "סגירה")], {
    solve: (
      <ol className="list-inside list-decimal space-y-1">
        <li>
          <strong>Y</strong> — לקוחות בסגירה (חובה): {f(ALON.openingAR)} + {f(ALON.creditSales!)} − {f(ALON.collections!)} − {f(ALON.writeOffs!)} ={" "}
          <strong>
            <Money v={ALON.result.gross} />
          </strong>
          .
        </li>
        <li>
          <strong>Z</strong> — ההפרשה בסגירה (זכות) היא הנדרשת: {f(ALON.result.gross)} × {pct(ALON.rate)} ={" "}
          <strong>
            <Money v={ALON.required} />
          </strong>
          .
        </li>
        <li>
          <strong>X</strong> — ההוצאה, כהפרש בכרטיס ההפרשה: {f(ALON.required)} = {f(ALON.openingAllowance)} − {f(ALON.writeOffs!)} + X, ולכן X ={" "}
          <strong>
            <Money v={ALON.result.expense} />
          </strong>
          .
        </li>
      </ol>
    ),
    all: true,
  }),
  {
    title: "ואם נדרש פחות? ביטול הפרשה",
    body: (
      <>
        <p>
          אותה שנה, אבל ההנהלה מעריכה רק {pct(ALON.lowRate)}: נדרשת <Money v={ALON_LOW.required} />, ובכרטיס כבר יש <Money v={ALON_LOW.mid.allowance} />. העודף,{" "}
          <Money v={-ALON_LOW.result.expense} />, מבוטל — והפעם הנעלם יושב בצד <strong>החובה</strong> של ההפרשה.
        </p>
        <TwoT accounts={ALON_LOW.result.accounts} entries={ALON_LOW.entries} unknown={[k(ALLOW, ALON_LOW.ids.adj)]} closing={closingNote(ALON_LOW.result.allowance)} />
        <JE entry={ALON_LOW.adj} title={`${ALON_LOW.adj.id}. ${ALON_LOW.adj.text} · 31.12`} note={null} />
      </>
    ),
  },
];

const scenarios: Step[] = [
  {
    title: "א. נעלם בלקוחות לתחילת השנה",
    body: (
      <>
        <p>
          במאזן ליום 31.12.2024 הוצגו לקוחות נטו <Money v={SCENARIO_A.openingNet} />, וההפרשה היא {pct(SCENARIO_A.rate)} מהלקוחות ברוטו. ב-2025: מכירות באשראי{" "}
          <Money v={SCENARIO_A.creditSales!} />, גבייה <Money v={SCENARIO_A.collections!} />, מחיקה <Money v={SCENARIO_A.writeOffs!} />. האחוז לא השתנה.
        </p>
        <p className="text-[14px] text-muted">את הנטו לא מציבים — בכרטיס הלקוחות יש רק ברוטו. לכן שתי יתרות הפתיחה הן נעלם.</p>
        <TwoT
          accounts={SCENARIO_A.result.accounts}
          entries={SCENARIO_A.entries}
          unknown={[k(ALLOW, SCENARIO_A.ids.adj), k(AR, "פתיחה"), k(ALLOW, "פתיחה"), k(AR, "סגירה"), k(ALLOW, "סגירה")]}
          mode="question"
        />
      </>
    ),
  },
  {
    title: "א. החילוץ: מהנטו אל הברוטו",
    body: (
      <>
        <ol className="list-inside list-decimal space-y-1">
          <li>
            הנטו הוא {pct(1 - SCENARIO_A.rate)} מהברוטו. ברוטו = {f(SCENARIO_A.openingNet)} ÷ {pct(1 - SCENARIO_A.rate)} = <strong><Money v={SCENARIO_A.openingAR} /></strong>; הפרשה ={" "}
            {f(SCENARIO_A.openingAR)} − {f(SCENARIO_A.openingNet)} = <strong><Money v={SCENARIO_A.openingAllowance} /></strong>.
          </li>
          <li>
            לקוחות בסגירה: <Money v={SCENARIO_A.result.gross} />, ולכן נדרשת {pct(SCENARIO_A.rate)} = <Money v={SCENARIO_A.required} />.
          </li>
          <li>
            בכרטיס ההפרשה לפני ההתאמה <Money v={SCENARIO_A.mid.allowance} /> — ההוצאה <strong><Money v={SCENARIO_A.result.expense} /></strong>.
          </li>
        </ol>
        <TwoT
          accounts={SCENARIO_A.result.accounts}
          entries={SCENARIO_A.entries}
          unknown={[k(ALLOW, SCENARIO_A.ids.adj), k(AR, "פתיחה"), k(ALLOW, "פתיחה"), k(AR, "סגירה"), k(ALLOW, "סגירה")]}
          closing={closingNote(SCENARIO_A.result.allowance)}
        />
        <JE entry={SCENARIO_A.adj} title={`${SCENARIO_A.adj.id}. ${SCENARIO_A.adj.text} · 31.12`} note={null} />
      </>
    ),
  },
  {
    title: "ב. נעלם בהוצאה — והאחוז מהשנה שעברה",
    body: (
      <>
        <p>
          ב-1.1.2025: לקוחות <Money v={SCENARIO_B.openingAR} />, הפרשה <Money v={SCENARIO_B.openingAllowance} />. ב-2025: מכירות באשראי <Money v={SCENARIO_B.creditSales!} />,
          גבייה <Money v={SCENARIO_B.collections!} />, מחיקת חובות <Money v={SCENARIO_B.writeOffs!} />. בסוף השנה מפרישים באותו אחוז כמו אשתקד.
        </p>
        <TwoT
          accounts={SCENARIO_B.result.accounts}
          entries={SCENARIO_B.entries}
          unknown={[k(ALLOW, SCENARIO_B.ids.adj), k(AR, "סגירה"), k(ALLOW, "סגירה")]}
          mode="question"
        />
      </>
    ),
  },
  {
    title: "ב. החילוץ: האחוז, ואז ההוצאה",
    body: (
      <>
        <ol className="list-inside list-decimal space-y-1">
          <li>
            האחוז מיתרות אשתקד: {f(SCENARIO_B.openingAllowance)} ÷ {f(SCENARIO_B.openingAR)} = <strong>{pct(SCENARIO_B.rate)}</strong>.
          </li>
          <li>
            <strong>Y</strong> — לקוחות בסגירה: <Money v={SCENARIO_B.result.gross} />. <strong>Z</strong> — הפרשה נדרשת: × {pct(SCENARIO_B.rate)} ={" "}
            <Money v={SCENARIO_B.required} />.
          </li>
          <li>
            <strong>X</strong> — {f(SCENARIO_B.required)} = {f(SCENARIO_B.openingAllowance)} − {f(SCENARIO_B.writeOffs!)} + X, ולכן X ={" "}
            <strong><Money v={SCENARIO_B.result.expense} /></strong> — זו ההוצאה.
          </li>
        </ol>
        <TwoT accounts={SCENARIO_B.result.accounts} entries={SCENARIO_B.entries} unknown={[k(ALLOW, SCENARIO_B.ids.adj), k(AR, "סגירה"), k(ALLOW, "סגירה")]} closing={closingNote(SCENARIO_B.result.allowance)} />
        <JE entry={SCENARIO_B.adj} title={`${SCENARIO_B.adj.id}. ${SCENARIO_B.adj.text} · 31.12`} note={null} />
      </>
    ),
  },
  {
    title: "ג. נעלם בגבייה מלקוחות",
    body: (
      <>
        <p>
          לקוחות ב-1.1.2025: <Money v={SCENARIO_C.openingAR} />, וב-31.12.2025: <Money v={SCENARIO_C.closingAR} />. ב-2025: מכירות באשראי <Money v={SCENARIO_C.creditSales!} />,
          מחיקת חובות <Money v={SCENARIO_C.writeOffs!} />. ההפרשה — {pct(SCENARIO_C.rate)} מהלקוחות, בתחילת השנה ובסופה. כמה נגבה?
        </p>
        <TwoT
          accounts={SCENARIO_C.result.accounts}
          entries={SCENARIO_C.entries}
          unknown={[k(AR, SCENARIO_C.ids.collections), k(ALLOW, "פתיחה"), k(ALLOW, SCENARIO_C.ids.adj), k(ALLOW, "סגירה")]}
          mode="question"
        />
      </>
    ),
  },
  {
    title: "ג. החילוץ: הגבייה מאזנת את הכרטיס",
    body: (
      <>
        <ol className="list-inside list-decimal space-y-1">
          <li>
            <strong>X</strong> — {f(SCENARIO_C.closingAR)} = {f(SCENARIO_C.openingAR)} + {f(SCENARIO_C.creditSales!)} − X − {f(SCENARIO_C.writeOffs!)}, ולכן הגבייה X ={" "}
            <strong><Money v={SCENARIO_C.collections!} /></strong>.
          </li>
          <li>
            ההפרשה: פתיחה {f(SCENARIO_C.openingAR)} × {pct(SCENARIO_C.rate)} = <Money v={SCENARIO_C.openingAllowance} />; סגירה {f(SCENARIO_C.closingAR)} × {pct(SCENARIO_C.rate)} ={" "}
            <Money v={SCENARIO_C.required} />; לפני ההתאמה <Money v={SCENARIO_C.mid.allowance} />, ולכן ההוצאה <Money v={SCENARIO_C.result.expense} />.
          </li>
        </ol>
        <TwoT
          accounts={SCENARIO_C.result.accounts}
          entries={SCENARIO_C.entries}
          unknown={[k(AR, SCENARIO_C.ids.collections), k(ALLOW, "פתיחה"), k(ALLOW, SCENARIO_C.ids.adj), k(ALLOW, "סגירה")]}
          closing={closingNote(SCENARIO_C.result.allowance)}
        />
      </>
    ),
  },
];

const dor: Step[] = [
  ...walk("דור", DOR, [k(ALLOW, DOR.ids.adj), k(AR, "סגירה"), k(ALLOW, "סגירה")], {
    solve: (
      <>
        <p>
          לקוחות בסגירה: <Money v={DOR.result.gross} />. &quot;{DOR.specificName}&quot; עדיין חייב — הוא נשאר בכרטיס הלקוחות, ורק ההפרשה עליו מחושבת לחוד:
        </p>
        <DataTable
          head={["", "חישוב", "סכום"]}
          rows={[
            ["הפרשה ספציפית", `${f(DOR.specificDebt)} × ${pct(DOR.specificRate)}`, DOR.specific],
            ["הפרשה כללית — נכון", `(${f(DOR.result.gross)} − ${f(DOR.specificDebt)}) × ${pct(DOR.generalRate)}`, DOR.general],
            ["הפרשה כללית — שגוי (על כולם)", `${f(DOR.result.gross)} × ${pct(DOR.generalRate)}`, DOR.wrongGeneral],
          ]}
          foot={["יתרת סגירה נדרשת", "ספציפית + כללית נכונה", DOR.required]}
        />
        <p>
          בכרטיס ההפרשה יש <Money v={DOR.mid.allowance} />; ההוצאה: <strong><Money v={DOR.result.expense} /></strong>.
        </p>
      </>
    ),
  }),
  {
    title: "ואם הלקוח פשט רגל עוד לפני סוף השנה?",
    body: (
      <>
        <p>
          אז זה כבר לא אומדן — זה חוב אבוד. מוחקים את כל <Money v={DOR.specificDebt} />: הוא יוצא מהלקוחות ומההפרשה, ואין לו יותר הפרשה ספציפית. המחיקה גדולה מהיתרה
          שבכרטיס, ולכן לפני ההתאמה ההפרשה בחובה: <Money v={-DOR.bankrupt.mid.allowance} />. נדרשת רק כללית: {f(DOR.bankrupt.result.gross)} × {pct(DOR.generalRate)} ={" "}
          <Money v={DOR.bankrupt.required} />, וההוצאה <Money v={DOR.bankrupt.result.expense} />.
        </p>
        <TwoT accounts={DOR.bankrupt.result.accounts} entries={DOR.bankrupt.entries} unknown={[k(ALLOW, DOR.bankrupt.ids.adj), k(ALLOW, "סגירה")]} closing={closingNote(DOR.bankrupt.result.allowance)} />
        <Entries entries={[DOR.bankrupt.entries.find((x) => x.id === DOR.bankrupt.ids.writeOff)!, DOR.bankrupt.adj]} />
      </>
    ),
  },
];

const eran: Step[] = walk("ערן", ERAN, [k(ALLOW, ERAN.adj.id), k(AR, "סגירה"), k(ALLOW, "סגירה")], {
  given: (
    <p className="text-[14px] text-muted">
      הקניות באשראי לא נכנסות לאף כרטיס: הן מגדילות ספקים — התחייבות. החוב שחזר נכנס פעמיים לכרטיס הלקוחות (החזרה בחובה, גבייה בזכות) ופעם אחת להפרשה (בזכות).
    </p>
  ),
  solve: (
    <ol className="list-inside list-decimal space-y-1">
      <li>
        לקוחות בסוף השנה: <Money v={ERAN.mid.gross} />; נדרשת × {pct(ERAN.rate)} = <Money v={ERAN.required} />.
      </li>
      <li>
        בהפרשה לפני ההתאמה: {f(ERAN.openingAllowance)} − {f(ERAN.written)} + {f(ERAN.recovered)} = <Money v={ERAN.mid.allowance} />. ההוצאה:{" "}
        <strong><Money v={ERAN.result.expense} /></strong>.
      </li>
    </ol>
  ),
  all: true,
});

// The exam question: Gilboa Ltd.
const g = GILBOA;
const G_UNKNOWN = [k(ALLOW, g.adj.id), k(AR, "פתיחה"), k(ALLOW, "פתיחה"), k(AR, "סגירה"), k(ALLOW, "סגירה")];
const gilboa: Step[] = [
  {
    title: "כללים 1–2: שני הכרטיסים, ומה שלא שייך אליהם",
    body: (
      <>
        <Rules n={[1, 2]} />
        <p className="text-[14px] text-muted">מכירות במזומן, קניות ותשלומים לספקים לא נכנסים לאף אחד מהכרטיסים. הנטו לא מוצב — יתרות הפתיחה הן נעלם.</p>
        <TwoT accounts={g.result.accounts} entries={g.entries} unknown={G_UNKNOWN} mode="question" />
      </>
    ),
  },
  {
    title: "יתרות הפתיחה — מתוך הנטו",
    body: (
      <>
        <Rules n={[3]} />
        <Calc>
          הנטו הוא {pct(1 - g.openingRate)} מהברוטו. ברוטו = {f(g.openingNet)} ÷ {pct(1 - g.openingRate)} = <strong><Money v={g.openingGross} /></strong>. הפרשה ={" "}
          {f(g.openingGross)} − {f(g.openingNet)} = <strong><Money v={g.openingAllowance} /></strong>.
        </Calc>
      </>
    ),
  },
  {
    title: "לקוחות בסגירה, וההפרשה הנדרשת",
    body: (
      <>
        <Rules n={[3]} />
        <Calc>
          {f(g.openingGross)} + {f(g.creditSales)} + {f(g.recovered)} − {f(g.collections)} − {f(g.bankruptDebt)} − {f(g.recovered)} = <strong><Money v={g.mid.gross} /></strong>
        </Calc>
        <DataTable
          head={["", "חישוב", "סכום"]}
          rows={[
            ["הפרשה ספציפית", `${f(g.specificDebt)} × ${pct(g.specificRate)}`, g.specific],
            ["הפרשה כללית", `(${f(g.mid.gross)} − ${f(g.specificDebt)}) × ${pct(g.generalRate)}`, g.general],
          ]}
          foot={["הפרשה נדרשת", "", g.required]}
        />
      </>
    ),
  },
  {
    title: "ההוצאה — כהפרש בכרטיס ההפרשה",
    body: (
      <>
        <Rules n={[3]} />
        <Calc>
          {f(g.required)} = {f(g.openingAllowance)} − {f(g.bankruptDebt)} + {f(g.recovered)} + X, ולכן X = <strong><Money v={g.result.expense} /></strong> — הוצאות הפסדי האשראי.
        </Calc>
        <TwoT
          accounts={g.result.accounts}
          entries={g.entries}
          unknown={G_UNKNOWN}
          closing={
            <>
              {closingNote(g.result.allowance)}
              <div className="mt-2.5">
                <EntriesDialog>
                  <Entries entries={g.entries} />
                </EntriesDialog>
              </div>
            </>
          }
        />
      </>
    ),
  },
  {
    title: "הצגה בדוחות",
    body: (
      <div className="grid gap-3 lg:grid-cols-2">
        <NetView gross={g.result.gross} allowance={g.result.allowance} caption="המאזן ליום 31.12.2025 — סעיף הלקוחות" />
        <figure className="overflow-hidden rounded-xl border-2 border-fg/30 bg-surface">
          <figcaption className="bg-fg px-4 py-2 text-[14.5px] font-bold text-surface">רווח והפסד לשנת 2025 — מתוך</figcaption>
          <div className="divide-y divide-line/60 text-sm">
            <p className="flex justify-between gap-3 px-4 py-2">
              <span className="text-fg">מכירות (באשראי ובמזומן)</span>
              <Money v={g.creditSales + g.cashSales} plain />
            </p>
            <p className="flex justify-between gap-3 px-4 py-2">
              <span className="text-fg">הוצאות הפסדי אשראי</span>
              <Money v={-g.result.expense} plain className="text-danger" />
            </p>
          </div>
        </figure>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------

export const CREDIT_SCREENS: Record<string, ScreenContent> = {
  "cl-idea": {
    lead: "לא כל מי שקנה בהקפה ישלם. את ההפסד הזה רושמים כבר עכשיו — עוד לפני שיודעים מי.",
    body: (
      <>
        <section className="space-y-3 rounded-2xl border-2 border-accent/30 bg-accent-soft/40 p-4">
          <p className="flex items-center gap-2 text-[16px] font-bold text-fg">
            <Store className="h-5 w-5 shrink-0 text-accent" aria-hidden /> דמיינו: המכולת של רונית
          </p>
          <p className="text-[15px]">
            רונית מחזיקה מכולת שכונתית, ולקוחות קבועים קונים אצלה ״על החשבון״: לוקחים עכשיו ומשלמים בסוף החודש. כל קנייה כזו היא כותבת בפנקס ההקפה. השנה{" "}
            {RONIT.customers} לקוחות קנו כך, ובסך הכול מגיעים לה <Money v={RONIT_TOTAL} />.
          </p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <figure className="overflow-hidden rounded-xl border border-line bg-surface" aria-label="פנקס ההקפה של רונית">
              <figcaption className="border-b-2 border-fg/70 bg-surface-2/60 px-3 py-2 text-sm font-bold text-fg">פנקס ההקפה</figcaption>
              <ul className="divide-y divide-dashed divide-line text-[14px]">
                {PINKAS.map(([name, amount]) => (
                  <li key={name} className="flex items-center gap-2 px-3 py-1.5">
                    <span className="min-w-0 flex-1 text-fg">{name}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-semibold text-muted ring-1 ring-line-strong">ישלם?</span>
                    <Money v={amount} plain className="w-20 text-end" />
                  </li>
                ))}
              </ul>
              <p className="flex items-center justify-between border-t-2 border-fg/70 px-3 py-2 text-[14px] font-bold text-fg">
                <span>סך הכול מגיע לרונית</span>
                <Money v={RONIT_TOTAL} plain />
              </p>
            </figure>
            <p className="self-center rounded-xl border-2 border-amber-500/50 bg-amber-500/[0.1] p-3 text-[14px] leading-relaxed text-fg">
              <strong>מניסיון של שנים:</strong> בערך {pct(RONIT.unpaid / RONIT.customers)} מהסכום לא נגבה אף פעם — כ-<Money v={RONIT_LOSS} />. אבל ליד אף שם בפנקס לא כתוב{" "}
              <strong>מי</strong>. רונית יודעת רק <strong>כמה</strong>.
            </p>
          </div>
        </section>
        <h3 className="text-lg font-semibold text-fg">אז כמה באמת יש לה?</h3>
        <p>
          לא <Money v={RONIT_TOTAL} />, אלא בערך <Money v={RONIT_TOTAL - RONIT_LOSS} />. את ה-<Money v={RONIT_LOSS} /> שכנראה לא יגיעו היא רושמת כבר עכשיו כ״כרית״ בצד —
          זו <strong>ההפרשה להפסדי אשראי</strong>. ההפסד שייך לשנה שבה נעשו המכירות, ולכן נרשם בה — גם אם הלקוח יפשוט רגל רק בשנה הבאה.
        </p>
        <KeyCard>
          את הלקוחות לא מוחקים — הרי לא יודעים מי לא ישלם. רושמים לידם חשבון נפרד, כרית, שמקטין אותם. וכשמתברר שלקוח מסוים לא ישלם — מורידים אותו מהלקוחות ומהכרית
          יחד.
        </KeyCard>
      </>
    ),
  },

  "cl-net": {
    lead: "שני חשבונות ושלושה מושגים: הלקוחות ברוטו, ההפרשה שמקטינה אותם — ומה שנשאר, הלקוחות נטו.",
    body: (
      <>
        <ul className="grid gap-2 sm:grid-cols-3 [column-span:all]">
          {TERMS.map((t) => (
            <li key={t.name} className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-3">
              <span className="flex items-center justify-between gap-2">
                <strong className="text-[15.5px] text-fg">{t.name}</strong>
                <span className={cn("num shrink-0 rounded-full px-2.5 py-0.5 text-[12.5px] font-bold", t.tone)}>
                  <Money v={t.amount} plain />
                </span>
              </span>
              <span className="text-[14.5px] text-fg/85">{t.what}</span>
            </li>
          ))}
        </ul>
        <p className="rounded-xl bg-surface-2/70 py-3.5 text-center text-xl font-semibold text-fg [column-span:all]">לקוחות ברוטו − הפרשה = לקוחות נטו</p>
        <div className="space-y-2 [column-span:all]">
          <p className="text-[15px] font-semibold text-fg">אצל רונית: מה שמגיע לה, ומה שבאמת צפוי להגיע</p>
          <div className="flex overflow-hidden rounded-lg text-center text-[13.5px] font-semibold" role="img" aria-label={`לקוחות ברוטו ${f(RONIT_TOTAL)}: נטו ${f(RONIT_TOTAL - RONIT_LOSS)} והפרשה ${f(RONIT_LOSS)}`}>
            <span className="num bg-accent py-2.5 text-accent-fg" style={{ flex: RONIT_TOTAL - RONIT_LOSS }}>
              לקוחות נטו · <Money v={RONIT_TOTAL - RONIT_LOSS} plain />
            </span>
            <span className="num bg-credit/20 px-2 py-2.5 text-credit" style={{ flex: RONIT_LOSS * 3 }}>
              הפרשה · <Money v={RONIT_LOSS} plain />
            </span>
          </div>
          <p className="num text-center text-[13.5px] text-muted">
            כל הפס — <Money v={RONIT_TOTAL} plain />: הלקוחות ברוטו. ההפרשה לא מוחקת אף לקוח — היא רק אומרת איזה חלק מהם כנראה לא יגיע.
          </p>
        </div>
      </>
    ),
  },

  "cl-allowance": {
    lead: "את ההפרשה רושמים בסוף השנה: הוצאה ברווח והפסד, מול כרית במאזן — בשנה שבה נעשו המכירות.",
    body: (
      <>
        <h3 className="text-lg font-semibold text-fg">הפקודה: הוצאה מול כרית</h3>
        <p>
          בסוף השנה רונית רושמת את ההפרשה. בחובה — <strong>הוצאות הפסדי אשראי</strong>, ברווח והפסד של השנה. בזכות — ההפרשה, שיושבת במאזן ליד הלקוחות ומקטינה אותם.
          ההפסד שייך לשנה שבה נעשו המכירות, גם אם הלקוח יפשוט רגל רק בשנה הבאה.
        </p>
        <Posted entries={RONIT_YEAR.entries} at={1} title="ההפרשה של רונית · 31.12" note={null} />
        <NetView gross={RONIT_YEAR.result.gross} allowance={RONIT_YEAR.result.allowance} caption="המאזן של רונית — סעיף הלקוחות" />
        <p className="text-[14.5px] text-muted">
          הלקוחות נשארים <Money v={RONIT_TOTAL} /> בכרטיס שלהם. במאזן מוצגים ליד ההפרשה, ונכנסים לסך הנכסים בנטו: <Money v={RONIT_TOTAL - RONIT_LOSS} />.
        </p>
      </>
    ),
  },

  "cl-terms": {
    lead: "כשיודעים משהו על לקוח מסוים: חוב אבוד נמחק, וחוב ספציפי מקבל הפרשה משלו. וכל המושגים נפגשים בנוסחה אחת.",
    body: (
      <>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 [column-span:all]">
          {MORE_TERMS.map((t) => (
            <li
              key={t.name}
              // Bad debt stands out: it is the one term that does not enter the formula.
              className={cn("flex flex-col gap-1 rounded-xl border px-3.5 py-2.5", t.aside ? "border-danger/40 bg-danger/[0.08]" : "border-line bg-surface")}
            >
              <span className="flex flex-wrap items-center justify-between gap-1.5">
                <strong className="text-[15px] text-fg">{t.name}</strong>
                {t.aside && <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11.5px] font-semibold text-danger ring-1 ring-danger/40">{t.aside}</span>}
              </span>
              <span className="text-[13.5px] text-fg/85">{t.what}</span>
              <span className="num mt-auto rounded-md bg-surface-2/70 px-2 py-1.5 text-[13.5px] leading-loose text-fg/90">
                <span className="me-1 text-[11px] font-bold text-muted">בדוגמה:</span>
                {t.eg}
              </span>
            </li>
          ))}
        </ul>
        <ClosingFormula
          example={
            <>
              (<Hl tone="gross"><N v={TERMS_EG.gross} /></Hl> − <Hl tone="specific"><N v={TERMS_EG.specific} /></Hl>) × <Hl tone="general"><P r={TERMS_EG.general} /></Hl> + <Hl tone="specific"><N v={TERMS_EG.specific} /></Hl> × <Hl tone="specificRate"><P r={TERMS_EG.specificRate} /></Hl> ={" "}
              <N v={termsGeneral} /> + <N v={termsSpecific} /> = <strong><N v={termsRequired} /></strong>
            </>
          }
          found={
            <>
              <N v={termsRequired} /> היא יתרת הסגירה של ההפרשה. אם בכרטיס כבר <N v={TERMS_EG.inCard} /> בזכות — חסרים <N v={termsRequired - TERMS_EG.inCard} /> בזכות: ח׳ הוצאות הפסדי
              אשראי / ז׳ הפרשה <N v={termsRequired - TERMS_EG.inCard} />.
            </>
          }
        />
      </>
    ),
  },

  "cl-entries": {
    lead: "שנה שלמה של רונית, פקודה אחר פקודה: מה כל אחת עושה ללקוחות, להפרשה ולרווח — וכל שאלה בנויה מהן.",
    body: (
      <>
        <Stepper label="רונית · 2026" steps={ronitYear} tool={<FormulaButton />} />
      </>
    ),
  },

  "cl-method": {
    lead: "שיטה אחת לכל שאלה: שני כרטיסים, כל נתון בצד הנכון, והנעלם כהפרש.",
    body: (
      <>
        <MethodBox />
        <h3 className="text-lg font-semibold text-fg">מה נכנס לכל צד</h3>
        <p className="text-[14.5px]">כל נתון בשאלה הוא אחת מהשורות האלה. יתרות הפתיחה והסגירה — בצד שבו היתרה יושבת; הסגירה — מתחת לקו.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TemplateT title="לקוחות (ברוטו)" dr={["יתרת פתיחה", "מכירות באשראי", "החזרת חוב שנמחק", "יתרת סגירה"]} cr={["גבייה מלקוחות", "מחיקת חוב אבוד"]} />
          <TemplateT title={ALLOW} dr={["מחיקת חוב אבוד", "ביטול הפרשה (קיטון)"]} cr={["יתרת פתיחה", "החזרת חוב שנמחק", "הוצאות הפסדי אשראי (גידול)", "יתרת סגירה"]} />
        </div>
        <ClosingFormula />
      </>
    ),
  },

  "cl-extract": {
    lead: "כלל 3 בפועל: ארבע נוסחאות לחילוץ נעלם — כולן על אותם שלושה מספרים, כדי ששום דבר חדש לא יסיח.",
    body: (
      <>
        <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-[14.5px] text-fg [column-span:all]">
          בכל ארבע הדוגמאות: לקוחות ברוטו <N v={BASE.gross} />, אחוז הפרשה <P r={BASE.rate} />, הפרשה <N v={BASE.allowance} />.
        </p>
        <div className="grid gap-3 lg:grid-cols-2 [column-span:all]">
          <Formula
            title="א. אחוז ההפרשה"
            when="נתונות ההפרשה והלקוחות ברוטו באותו יום — למשל ב-31.12 אשתקד."
            formula={
              <>
                אחוז ההפרשה = <Frac top="הפרשה" bottom="לקוחות ברוטו" />
              </>
            }
            example={
              <>
                <Frac top={<N v={BASE.allowance} />} bottom={<N v={BASE.gross} />} /> = <P r={BASE.rate} />
              </>
            }
          />
          <Formula
            title="ב. יתרת הפתיחה של ההפרשה"
            when="נתונים האחוז והלקוחות ברוטו לתחילת השנה (כשאין הפרשה ספציפית)."
            formula={<>הפרשה = לקוחות ברוטו × אחוז</>}
            example={
              <>
                <N v={BASE.gross} /> × <P r={BASE.rate} /> = <N v={BASE.allowance} />
              </>
            }
          />
          <Formula
            title="ג. לקוחות נטו — ובחזרה לברוטו"
            when="במאזן מופיע רק הנטו? מפרקים אותו לברוטו ולהפרשה לפני שמציבים בכרטיסים."
            formula={
              <span className="flex flex-col items-center gap-2">
                <span>נטו = ברוטו − הפרשה</span>
                <span>
                  ברוטו = <Frac top="נטו" bottom="100% − אחוז" />
                </span>
              </span>
            }
            example={
              <span className="flex flex-col items-center gap-2">
                <span>
                  <N v={BASE.gross} /> − <N v={BASE.allowance} /> = <N v={BASE.net} />
                </span>
                <span>
                  <Frac top={<N v={BASE.net} />} bottom={<P r={1 - BASE.rate} />} /> = <N v={BASE.gross} />
                </span>
              </span>
            }
            note="נטו של 95% פירושו שההפרשה היא 5% — לכן מחלקים ב-95%, לא מכפילים ב-5%."
          />
          <Formula
            title="ד. הנעלם בתוך כרטיס"
            when="מה שהיה, ועוד מה שהגדיל, פחות מה שהקטין — שווה למה שנשאר. הנעלם הוא ההפרש."
            formula={<>סגירה = פתיחה + מה שמגדיל − מה שמקטין</>}
            example={
              <span className="flex flex-col items-center gap-2">
                <span className="text-[13px] text-muted">עסק חדש: ההפרשה נפתחת ב-0, ונדרשת בסגירה <N v={BASE.allowance} /></span>
                <span className="font-bold">
                  <N v={BASE.allowance} /> = 0 + X ← X = <N v={BASE.allowance} />
                </span>
              </span>
            }
          />
        </div>
      </>
    ),
  },

  "cl-first": {
    body: (
      <>
        <Given
          title='נתון: חברת אלון בע"מ, 2025'
          asks={<>הוצאות הפסדי האשראי לשנה, פקודות היומן, וסעיף הלקוחות במאזן.</>}
        >
          <p>
            ב-1.1.2025: לקוחות <Money v={ALON.openingAR} />, הפרשה <Money v={ALON.openingAllowance} />. במהלך השנה: מכירות באשראי <Money v={ALON.creditSales!} />, גבייה{" "}
            <Money v={ALON.collections!} />, ונמחק חוב אבוד של <Money v={ALON.writeOffs!} />. בסוף השנה ההנהלה מעריכה ש-{pct(ALON.rate)} מהלקוחות לא ייגבו.
          </p>
        </Given>
        <Stepper label="אלון · 2025" steps={alon} tool={<FormulaButton />} />
      </>
    ),
  },

  "cl-scenarios": {
    lead: "אותם שני כרטיסים — והנעלם בכל פעם במקום אחר. קודם מציבים את מה שידוע, ורק אז מחלצים.",
    body: (
      <>
        <Stepper label="שלושה תרחישים" steps={scenarios} tool={<FormulaButton />} />
      </>
    ),
  },

  "cl-specific": {
    body: (
      <>
        <Given
          title='נתון: חברת דור בע"מ, 2025 — לקוח אחד בקשיים'
          asks={<>ההפרשה הנדרשת ופקודת ההתאמה ב-31.12.</>}
        >
          <p>
            <strong>הפרשה ספציפית</strong> נקבעת ללקוח מסוים שידוע שהוא בקשיים. <strong>הפרשה כללית</strong> היא אחוז על <strong>שאר</strong> הלקוחות — בלי הלקוח הספציפי,
            אחרת ההפסד שלו נספר פעמיים.
          </p>
          <p>
            ב-1.1: לקוחות <Money v={DOR.openingAR} />, הפרשה <Money v={DOR.openingAllowance} />. מכירות באשראי <Money v={DOR.creditSales!} />, גבייה{" "}
            <Money v={DOR.collections!} />. ב-31.12 &quot;{DOR.specificName}&quot; חייב <Money v={DOR.specificDebt} /> ונמצא בקשיים — {pct(DOR.specificRate)} מהחוב לא ייגבה.
            על שאר הלקוחות {pct(DOR.generalRate)}.
          </p>
        </Given>
        <Stepper label="דור · 2025" steps={dor} tool={<FormulaButton />} />
      </>
    ),
  },

  "cl-recovery": {
    body: (
      <>
        <Given
          title='נתון: חברת ערן בע"מ, 2025 — עם נתון שלא שייך'
          asks={<>הוצאות הפסדי האשראי, פקודות היומן וסעיף הלקוחות במאזן.</>}
        >
          <p>
            ב-1.1.2025: לקוחות <Money v={ERAN.openingGross} />, הפרשה <Money v={ERAN.openingAllowance} />. במהלך השנה: מכירות באשראי <Money v={ERAN.creditSales} />, גבייה{" "}
            <Money v={ERAN.collections} />, קניות באשראי <Money v={ERAN.creditPurchases} />, מחיקת חוב אבוד <Money v={ERAN.written} />, וגבייה של חוב שנמחק ב-2024 בסך{" "}
            <Money v={ERAN.recovered} />. בסוף השנה מפרישים {pct(ERAN.rate)} מהלקוחות.
          </p>
        </Given>
        <Stepper label="ערן · 2025" steps={eran} tool={<FormulaButton />} />
      </>
    ),
  },

  "cl-exam": {
    body: (
      <>
        <Given
          title='נתון: חברת גלבוע בע"מ, 2025'
          asks={<>(1) יתרות הפתיחה של הלקוחות וההפרשה; (2) פקודות היומן; (3) הוצאות הפסדי האשראי; (4) סעיף הלקוחות במאזן ליום 31.12.2025.</>}
        >
          <ul className="grid list-inside list-disc gap-x-6 gap-y-1 lg:grid-cols-2">
            <li>
              במאזן ליום 31.12.2024: לקוחות נטו <Money v={g.openingNet} />; ההפרשה — {pct(g.openingRate)} מהברוטו. ספקים <Money v={g.openingSuppliers} />.
            </li>
            <li>
              מכירות באשראי <Money v={g.creditSales} />, במזומן <Money v={g.cashSales} />; גבייה מלקוחות <Money v={g.collections} />.
            </li>
            <li>
              קניות באשראי <Money v={g.creditPurchases} />, תשלומים לספקים <Money v={g.supplierPayments} />.
            </li>
            <li>
              15.6: &quot;{g.bankruptName}&quot;, שחייבה <Money v={g.bankruptDebt} />, פשטה רגל. החוב נמחק.
            </li>
            <li>
              10.9: נגבה במזומן חוב של <Money v={g.recovered} /> שנמחק ב-2023.
            </li>
            <li>
              31.12: &quot;{g.specificName}&quot; חייב <Money v={g.specificDebt} /> ובקשיים — ספציפית {pct(g.specificRate)}; על השאר כללית {pct(g.generalRate)}.
            </li>
          </ul>
        </Given>
        <Stepper label="גלבוע · לפי שלושת הכללים" steps={gilboa} tool={<FormulaButton />} />
      </>
    ),
  },

  "cl-calc": {
    lead: "פתרתם שאלה? הזינו את מה שהשאלה נותנת, והשאירו ריק את מה שלא. המחשבון מוצא את הנעלם בשיטה של השיעור, מראה איך — ובודק את התשובה שלכם.",
    body: (
      <div className="[column-span:all]">
        <CreditLossCalculator />
      </div>
    ),
  },
};
