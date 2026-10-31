import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { dateLabel, valuatePeriod } from "@/lib/learn/inventory";
import { u } from "@/lib/learn/inventory-explain";
import { MAHBERET } from "@/lib/learn/inventory-examples";
import { cn } from "@/lib/utils";
import { Money, type Step } from "./ui";

/**
 * The four cost formulas solved on one year (the stationery shop, "מחברת") the
 * way an exam answer is written, a stage at a time: the purchases, the sales,
 * the quantities, then the cost — read off the rows that matter — the
 * comparison with net realisable value, and the cost of sales. Every figure is
 * worked here from the year's own data; the lesson's test checks them against
 * the engine.
 */

export const FIFO = valuatePeriod(MAHBERET, "fifo");
export const FIFO_T = valuatePeriod(MAHBERET, "fifo", { system: "perpetual" });
export const WA = valuatePeriod(MAHBERET, "wa-periodic");
export const MA = valuatePeriod(MAHBERET, "moving-avg");

const OPEN = MAHBERET.opening ?? { units: 0, cost: 0 };
const BUYS = MAHBERET.purchases.map((p, i) => ({ iso: p.date!, date: dateLabel(p.date!), qty: p.qty, unit: FIFO.costs[i].perUnit, total: FIFO.costs[i].total }));
const SALES = MAHBERET.sales.map((s) => ({ iso: s.date!, date: dateLabel(s.date!), qty: s.qty, price: s.unitPrice!, total: s.qty * s.unitPrice! }));
const BOUGHT = BUYS.reduce((a, b) => a + b.qty, 0);
const BOUGHT_COST = BUYS.reduce((a, b) => a + b.total, 0);
const SOLD = SALES.reduce((a, s) => a + s.qty, 0);
const CLOSING_UNITS = OPEN.units + BOUGHT - SOLD;
const NO_NRV = MAHBERET.nrvPerUnit === undefined;

/** Every event of the year in date order; a purchase and a sale on the same day — the purchase first. */
type Event = { kind: "buy"; i: number } | { kind: "sell"; i: number };
const EVENTS: Event[] = [...BUYS.map((_, i) => ({ kind: "buy" as const, i })), ...SALES.map((_, i) => ({ kind: "sell" as const, i }))].sort((a, b) => {
  const da = a.kind === "buy" ? BUYS[a.i].iso : SALES[a.i].iso;
  const db = b.kind === "buy" ? BUYS[b.i].iso : SALES[b.i].iso;
  return da === db ? (a.kind === "buy" ? -1 : 1) : da < db ? -1 : 1;
});

const qty = (v: number) => v.toLocaleString("he-IL");
const th = "px-3 py-2 text-start text-[13px] font-semibold text-muted";
const td = "num px-3 py-2";

/** A table with a caption, head and rows; `lit` rows are the ones the step is about. */
function Table({ caption, head, rows, lit, foot }: { caption: string; head: ReactNode[]; rows: ReactNode[][]; lit?: (i: number) => boolean; foot?: ReactNode[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-[14.5px]">
        <caption className="border-b border-line bg-surface-2/60 px-3 py-2 text-start text-[14px] font-bold text-fg">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {head.map((h, i) => (
              <th key={i} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn("border-b border-line/60 last:border-0", lit?.(i) && "bg-accent-soft font-semibold")}>
              {r.map((c, j) => (
                <td key={j} className={td}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr className="border-t-2 border-fg/70 font-bold">
              {foot.map((c, j) => (
                <td key={j} className={td}>
                  {c}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** A tip: another way to the same answer, offered to check one's own — not the way the solution must go. */
export function TipNote({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border-2 border-amber-500/50 bg-amber-500/[0.08] px-3.5 py-2.5 text-[14.5px] text-fg">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
      <div className="space-y-1">
        <p className="font-bold">טיפ — עוד דרך לפתור, אם תרצו לוודא את עצמכם</p>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

/** One line of a working, set apart: the formula in words, then in numbers. */
function Working({ words, numbers }: { words: ReactNode; numbers: ReactNode }) {
  return (
    <div className="space-y-1 rounded-xl border-2 border-accent/40 bg-surface px-4 py-3">
      <p className="text-[14px] text-muted">{words}</p>
      <p className="num text-[17px] font-bold text-fg">{numbers}</p>
    </div>
  );
}

/** The purchases, one row each — and, when `taken` is given, how many units of each row the step takes, its rows lit. */
function BuysTable({ taken, label }: { taken?: Map<number, number>; label?: string }) {
  const t = taken ?? new Map<number, number>();
  return (
    <Table
      caption="טבלת הקניות"
      head={["תאריך", "כמות", "עלות ליחידה", "סה״כ", ...(taken ? [<span key="l" className="text-accent">{label}</span>] : [])]}
      rows={BUYS.map((b, i) => [
        b.date,
        qty(b.qty),
        u(b.unit),
        <Money key="t" v={b.total} plain />,
        ...(taken ? [t.get(i) ? <span key="k" className="text-accent">{qty(t.get(i)!)} × {u(b.unit)} = <Money v={t.get(i)! * b.unit} plain /></span> : "—"] : []),
      ])}
      lit={(i) => !!t.get(i)}
      foot={["סה״כ", qty(BOUGHT), "", <Money key="t" v={BOUGHT_COST} plain />, ...(taken ? [<span key="k" className="text-accent">{qty([...t.values()].reduce((a, q) => a + q, 0))} יח׳ · <Money v={layerCost(t)} plain /></span>] : [])]}
    />
  );
}

function SalesTable() {
  return (
    <Table
      caption="טבלת המכירות"
      head={["תאריך", "כמות", "מחיר מכירה", "סה״כ מכירות"]}
      rows={SALES.map((s) => [s.date, qty(s.qty), u(s.price), <Money key="t" v={s.total} plain />])}
      foot={["סה״כ", qty(SOLD), "", <Money key="t" v={SALES.reduce((a, s) => a + s.total, 0)} plain />]}
    />
  );
}

/** How many units each purchase gives, taking `units` from one end of the purchases: the closing stock from the last, the cost of sales from the first. */
function take(units: number, from: "last" | "first") {
  const order = from === "last" ? [...BUYS.keys()].reverse() : [...BUYS.keys()];
  const taken = new Map<number, number>();
  let left = units;
  for (const i of order) {
    const q = Math.min(left, BUYS[i].qty);
    if (q > 0) taken.set(i, q);
    left -= q;
  }
  return taken;
}
const layerCost = (m: Map<number, number>) => [...m].reduce((a, [i, q]) => a + q * BUYS[i].unit, 0);
const sumOf = (m: Map<number, number>) =>
  [...m]
    .map(([i, q]) => `${qty(q)} × ${u(BUYS[i].unit)}`)
    .join(" + ");

/** The stages every method opens with: the two tables. */
const tablesSteps = (salesNote: ReactNode): Step[] => [
  {
    title: "שלב 1 · טבלת הקניות",
    body: (
      <>
        <p>מסדרים את כל הקניות של השנה לפי התאריך: כמה יחידות, בכמה ליחידה, וכמה בסך הכול.</p>
        <BuysTable />
      </>
    ),
  },
  {
    title: "שלב 2 · טבלת המכירות",
    body: (
      <>
        <p>ובנפרד — כל המכירות. {salesNote}</p>
        <SalesTable />
      </>
    ),
  },
];

const quantitiesStep: Step = {
  title: "שלב 3 · כמה יחידות נשארו במלאי?",
  body: (
    <>
      <p>רק כמויות, עוד בלי שקלים:</p>
      <Working
        words="מלאי פתיחה (כמות) + קניות השנה (כמות) − מכירות השנה (כמות) = כמות במלאי הסגירה"
        numbers={
          <>
            {qty(OPEN.units)} + {qty(BOUGHT)} − {qty(SOLD)} = {qty(CLOSING_UNITS)} יח׳
          </>
        }
      />
    </>
  ),
};

/** The comparison with net realisable value, on a closing stock valued at `cost`. */
const nrvStep = (title: string, carrying: number): Step => ({
  title,
  body: (
    <>
      <p>
        מלאי הסגירה נרשם לפי <strong>הנמוך</strong> מבין העלות שמצאנו לבין שווי המימוש נטו של אותן יחידות.
      </p>
      <Working
        words={NO_NRV ? "בשאלה של מחברת לא נתון שווי מימוש נטו — ולכן מלאי הסגירה נשאר בעלות" : "הנמוך מבין העלות לשווי המימוש נטו"}
        numbers={
          <>
            מלאי סגירה בספרים: <Money v={carrying} plain /> ₪
          </>
        }
      />
      <p className="text-[14.5px] text-muted">
        אילו היה נתון שווי נמוך יותר — ההפרש היה מוסף לעלות המכר. ראו <ScreenLink id="inv-nrv" />.
      </p>
    </>
  ),
});

/** The cost-of-sales statement: opening + purchases − closing. */
const reportStep = (title: string, closing: number, cogs: number, extra?: ReactNode): Step => ({
  title,
  body: (
    <>
      <div className="overflow-hidden rounded-xl border border-line bg-surface text-[15px]">
        {(
          [
            ["מלאי פתיחה (בעלות)", OPEN.cost],
            ["+ קניות השנה", BOUGHT_COST],
            ["− מלאי סגירה", closing],
          ] as const
        ).map(([label, v]) => (
          <p key={label} className="flex justify-between gap-3 border-b border-line/60 px-4 py-2">
            <span>{label}</span>
            <Money v={v} plain />
          </p>
        ))}
        <p className="flex justify-between gap-3 border-t-2 border-fg/70 bg-accent-soft px-4 py-2.5 font-bold">
          <span>= עלות המכר</span>
          <Money v={cogs} plain />
        </p>
      </div>
      {extra}
    </>
  ),
});

// ---------------------------------------------------------------------------
// FIFO, periodic: the closing stock from the last purchases.

const CLOSING_LAYERS = take(CLOSING_UNITS, "last");
const SOLD_LAYERS = take(SOLD - OPEN.units, "first");

export const FIFO_PERIODIC_STEPS: Step[] = [
  ...tablesSteps(
    <>
      ב-FIFO תקופתי מהטבלה הזו צריך רק את <strong>הכמות</strong> שנמכרה; המחיר שייך להכנסות.
    </>,
  ),
  quantitiesStep,
  {
    title: "שלב 4 · מאיזו עלות בנויות היחידות שנשארו?",
    body: (
      <>
        <p>
          ב-FIFO הוותיקות נמכרו קודם — אז מה שנשאר הוא מהקניות <strong>האחרונות</strong>. הולכים לשורות האחרונות בטבלת הקניות, מלמטה למעלה, עד שמשלימים{" "}
          {qty(CLOSING_UNITS)} יחידות:
        </p>
        <BuysTable taken={CLOSING_LAYERS} label="נשאר במלאי" />
        <Working
          words="מלאי סגירה לפי FIFO, בעלות"
          numbers={
            <>
              {sumOf(CLOSING_LAYERS)} = <Money v={FIFO.closingCostBasis} plain /> ₪
            </>
          }
        />
      </>
    ),
  },
  nrvStep("שלב 5 · משווים לשווי מימוש נטו", FIFO.closingCarrying),
  reportStep("שלב 6 · דוח עלות המכר", FIFO.closingCarrying, FIFO.cogs),
  {
    title: "טיפ · עוד דרך להגיע לעלות המכר",
    body: (
      <>
        <TipNote />
        <p>
          אפשר גם הפוך: היחידות שנמכרו הן <strong>הראשונות</strong> שנכנסו. לוקחים {qty(SOLD)} יחידות מהשורות הראשונות של טבלת הקניות, מלמעלה למטה
          {OPEN.units ? " (אחרי מלאי הפתיחה, שיוצא ראשון)" : ""}:
        </p>
        <BuysTable taken={SOLD_LAYERS} label="נמכר" />
        <Working
          words="עלות המכר — ישר מהשכבות הראשונות"
          numbers={
            <>
              {sumOf(SOLD_LAYERS)} = <Money v={OPEN.cost + layerCost(SOLD_LAYERS)} plain /> ₪
            </>
          }
        />
        <p className="text-[14.5px] text-muted">אותה תוצאה — אם יצא לכם אחרת, יש טעות באחת הדרכים. כשיש הורדה לשווי מימוש נטו, הדרך הראשית היא הדוח: ההורדה נכנסת דרך מלאי הסגירה.</p>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// The perpetual methods: a stock card, a row per event. Before a sale that follows a purchase (or opens the
// year), a summary row adds up what is in stock — and, in the moving average, works out the average itself;
// a sale straight after another sale needs none, since nothing has changed.

/** A row of a stock card: a purchase, the summary before a sale, or a sale. Cells are what the card prints. */
type CardRow = {
  kind: "buy" | "sum" | "sell";
  date: string;
  qty?: number;
  unit?: ReactNode;
  amount?: number;
  units: number;
  cost: number;
  /** The fourth balance column: the layers (FIFO), or the average per unit (moving average). */
  extra: ReactNode;
};

const ROW_LABEL: Record<CardRow["kind"], string> = { buy: "קנייה", sum: "סיכום לפני המכירה", sell: "מכירה" };

/** The cost of sales so far, after row `i`: in a perpetual system it is known at every moment, not only at year end. */
const cogsTo = (rows: CardRow[], i: number) => rows.slice(0, i + 1).reduce((a, r) => a + (r.kind === "sell" ? r.amount! : 0), 0);

/** The stock card up to row `upTo`; the rows added by this step lit, the summary rows set apart. */
function StockCard({ rows, upTo, from, extraHead }: { rows: CardRow[]; upTo: number; from: number; extraHead: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-[14.5px]">
        <caption className="border-b border-line bg-surface-2/60 px-3 py-2 text-start text-[14px] font-bold text-fg">כרטיס המלאי</caption>
        <thead>
          <tr className="border-b border-line">
            {["תאריך", "תנועה", "כמות (יח׳)", "עלות ליחידה", "סכום (₪)"].map((h) => (
              <th key={h} className={th}>
                {h}
              </th>
            ))}
            {["יתרה (יח׳)", "יתרה (₪)", extraHead].map((h) => (
              <th key={h} className={cn(th, "bg-accent-soft/60")}>
                {h}
              </th>
            ))}
            <th className={cn(th, "bg-danger/10 text-danger")}>עלות המכר (מצטבר)</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, upTo + 1).map((r, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-line/60 last:border-0",
                r.kind === "sum" && "border-t-2 border-t-fg/60 bg-surface-2/70",
                i >= from && "outline outline-2 -outline-offset-2 outline-accent",
              )}
            >
              <td className={td}>{r.kind === "sum" ? "" : r.date}</td>
              <td className={cn(td, r.kind === "sum" && "font-bold", r.kind === "sell" && "text-danger", r.kind === "buy" && "text-success")}>{ROW_LABEL[r.kind]}</td>
              <td className={td}>{r.qty === undefined ? "" : `${r.kind === "sell" ? "−" : "+"}${qty(r.qty)}`}</td>
              <td className={td}>{r.unit}</td>
              <td className={td}>{r.amount === undefined ? "" : <Money v={r.amount} plain />}</td>
              <td className={cn(td, "bg-accent-soft/40 font-semibold")}>{qty(r.units)}</td>
              <td className={cn(td, "bg-accent-soft/40 font-semibold")}>
                <Money v={r.cost} plain />
              </td>
              <td className={cn(td, "bg-accent-soft/40 font-semibold", r.kind === "sum" && "text-accent")}>{r.extra}</td>
              <td className={cn(td, "bg-danger/5", r.kind === "sell" ? "font-bold text-danger" : "text-muted")}>
                <Money v={cogsTo(rows, i)} plain />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A card's rows grouped by event: each step of the walkthrough adds one group (a purchase; or a summary and its sale). */
type CardStep = { event: Event; first: number; last: number };

/** The steps of a card: one per event, the table growing, with a sentence on what the step does. */
function cardSteps(rows: CardRow[], groups: CardStep[], extraHead: string, say: (g: CardStep) => ReactNode): Step[] {
  return groups.map((g, n) => {
    const x = g.event.kind === "buy" ? BUYS[g.event.i] : SALES[g.event.i];
    return {
      title: `שלב ${3 + n} · ${x.date}: ${g.event.kind === "buy" ? "קנייה" : "מכירה"} של ${qty(x.qty)} יח׳`,
      body: (
        <>
          <p>{say(g)}</p>
          <StockCard rows={rows} upTo={g.last} from={g.first} extraHead={extraHead} />
        </>
      ),
    };
  });
}

// ---------------------------------------------------------------------------
// FIFO, perpetual: at every sale, the oldest layers go first.

type Layer = { units: number; unit: number };
const layersText = (layers: Layer[]) => (layers.length ? layers.map((l) => `${qty(l.units)} × ${u(l.unit)}`).join(" + ") : "—");

function fifoCard() {
  let layers: Layer[] = OPEN.units ? [{ units: OPEN.units, unit: OPEN.cost / OPEN.units }] : [];
  let bought = true;
  const rows: CardRow[] = [];
  const groups: CardStep[] = [];
  const sales: { date: string; qty: number; cost: number; taken: string }[] = [];
  const units = () => layers.reduce((a, l) => a + l.units, 0);
  const cost = () => layers.reduce((a, l) => a + l.units * l.unit, 0);
  for (const e of EVENTS) {
    const first = rows.length;
    if (e.kind === "buy") {
      const b = BUYS[e.i];
      layers = [...layers, { units: b.qty, unit: b.unit }];
      rows.push({ kind: "buy", date: b.date, qty: b.qty, unit: u(b.unit), amount: b.total, units: units(), cost: cost(), extra: layersText(layers) });
      bought = true;
    } else {
      const s = SALES[e.i];
      if (bought) rows.push({ kind: "sum", date: s.date, units: units(), cost: cost(), extra: layersText(layers) });
      let left = s.qty;
      const taken: Layer[] = [];
      layers = layers
        .map((l) => {
          const q = Math.min(left, l.units);
          left -= q;
          if (q) taken.push({ units: q, unit: l.unit });
          return { ...l, units: l.units - q };
        })
        .filter((l) => l.units > 0);
      const out = taken.reduce((a, l) => a + l.units * l.unit, 0);
      rows.push({ kind: "sell", date: s.date, qty: s.qty, unit: layersText(taken), amount: out, units: units(), cost: cost(), extra: layersText(layers) });
      sales.push({ date: s.date, qty: s.qty, cost: out, taken: layersText(taken) });
      bought = false;
    }
    groups.push({ event: e, first, last: rows.length - 1 });
  }
  return { rows, groups, sales, closing: cost() };
}
const FIFO_CARD = fifoCard();
export const FIFO_PERPETUAL_COGS = FIFO_CARD.sales.reduce((a, s) => a + s.cost, 0);
export const FIFO_PERPETUAL_CLOSING = FIFO_CARD.closing;

export const FIFO_PERPETUAL_STEPS: Step[] = [
  ...tablesSteps(<>הפעם צריך גם את <strong>התאריך</strong> של כל מכירה — כי בכל מכירה בודקים מה היה במלאי באותו רגע.</>),
  ...cardSteps(FIFO_CARD.rows, FIFO_CARD.groups, "שכבות במלאי", (g) =>
    g.event.kind === "buy" ? (
      <>קנייה נכנסת כשכבה חדשה, בסוף התור — בעמודת השכבות היא האחרונה. עלות המכר לא זזה: קנייה היא עוד לא הוצאה.</>
    ) : FIFO_CARD.rows[g.first].kind === "sum" ? (
      <>
        לפני המכירה — סיכום: מה יש במלאי, שכבה אחר שכבה. אז המכירה לוקחת קודם מהשכבה <strong>הוותיקה</strong> (הראשונה ברשימת השכבות), ויורדת עד שמשלימים את הכמות. עלות המכירה מתווספת מיד לעמודת עלות המכר.
      </>
    ) : (
      <>מכירה מיד אחרי מכירה: לא נכנס דבר בינתיים, אז אין צורך בסיכום חדש — ממשיכים לקחת מהשכבה הוותיקה שנשארה.</>
    ),
  ),
  {
    title: `שלב ${3 + FIFO_CARD.groups.length} · מלאי הסגירה, ומשווים לשווי מימוש נטו`,
    body: (
      <>
        <p>
          השורה האחרונה בכרטיס היא מלאי הסגירה: <span className="num">{FIFO_CARD.rows.at(-1)!.extra}</span> = <Money v={FIFO_PERPETUAL_CLOSING} /> בעלות — בדיוק
          כמו בדרך התקופתית, כי ב-FIFO תמיד נשארות האחרונות.
        </p>
        <Working
          words={NO_NRV ? "בשאלה של מחברת לא נתון שווי מימוש נטו — ולכן מלאי הסגירה נשאר בעלות" : "הנמוך מבין העלות לשווי המימוש נטו"}
          numbers={
            <>
              מלאי סגירה בספרים: <Money v={FIFO_T.closingCarrying} plain /> ₪
            </>
          }
        />
      </>
    ),
  },
  {
    title: `שלב ${4 + FIFO_CARD.groups.length} · עלות המכר — סכום המכירות`,
    body: (
      <>
        <p>
          אין צורך לחכות לסוף השנה ולבנות דוח: בשיטה תמידית עלות המכר ידועה בכל רגע — השורה האחרונה בעמודת עלות המכר בכרטיס היא כבר עלות המכר של השנה.
        </p>
        <Table
          caption="עלות כל מכירה"
          head={["מכירה", "יחידות", "מאילו שכבות", "עלות"]}
          rows={FIFO_CARD.sales.map((s) => [s.date, qty(s.qty), s.taken, <Money key="c" v={s.cost} plain />])}
          foot={["עלות המכר", qty(SOLD), "", <Money key="c" v={FIFO_PERPETUAL_COGS} plain />]}
        />
        <TipNote>
          דרך נוספת, בלי הכרטיס: מלאי פתיחה + קניות − מלאי סגירה = <Money v={OPEN.cost} plain /> + <Money v={BOUGHT_COST} plain /> − <Money v={FIFO_T.closingCarrying} plain /> ={" "}
          <Money v={FIFO_T.cogs} plain /> — אותה עלות המכר.
        </TipNote>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Weighted average, periodic: one average for the whole year.

const WA_AVG = (OPEN.cost + BOUGHT_COST) / (OPEN.units + BOUGHT);

export const WA_STEPS: Step[] = [
  ...tablesSteps(
    <>
      בממוצע תקופתי <strong>תאריכי המכירות לא משנים</strong> — צריך רק את הכמות שנמכרה.
    </>,
  ),
  quantitiesStep,
  {
    title: "שלב 4 · ממוצע אחד לכל השנה",
    body: (
      <>
        <p>כל מה שהיה זמין השנה — בשקלים, חלקי ביחידות. מלאי הפתיחה נכנס גם לסכום וגם לכמות:</p>
        <BuysTable taken={new Map(BUYS.map((b, i) => [i, b.qty]))} label="נכנס לממוצע" />
        <Working
          words="עלות ממוצעת ליחידה = (עלות פתיחה + עלות הקניות) ÷ (יח׳ פתיחה + יח׳ שנקנו)"
          numbers={
            <>
              (<Money v={OPEN.cost} plain /> + <Money v={BOUGHT_COST} plain />) ÷ ({qty(OPEN.units)} + {qty(BOUGHT)}) = {u(WA_AVG)} ₪
            </>
          }
        />
        <p className="text-[14.5px] text-muted">לא מעגלים את הממוצע — רק בסוף, או לפי הוראת השאלה.</p>
      </>
    ),
  },
  {
    title: "שלב 5 · מלאי הסגירה",
    body: (
      <Working
        words="מלאי סגירה = כמות הסגירה × הממוצע"
        numbers={
          <>
            {qty(CLOSING_UNITS)} × {u(WA_AVG)} = <Money v={WA.closingCostBasis} plain /> ₪
          </>
        }
      />
    ),
  },
  nrvStep("שלב 6 · משווים לשווי מימוש נטו", WA.closingCarrying),
  reportStep("שלב 7 · דוח עלות המכר", WA.closingCarrying, WA.cogs),
  {
    title: "טיפ · עוד דרך להגיע לעלות המכר",
    body: (
      <>
        <TipNote />
        <p>כל יחידה שנמכרה יצאה באותו ממוצע — אז פשוט מכפילים:</p>
        <Working
          words="עלות המכר = יחידות שנמכרו × הממוצע"
          numbers={
            <>
              {qty(SOLD)} × {u(WA_AVG)} = <Money v={SOLD * WA_AVG} plain /> ₪
            </>
          }
        />
        <p className="text-[14.5px] text-muted">אותה תוצאה — אם יצא לכם אחרת, יש טעות באחת הדרכים. כשיש הורדה לשווי מימוש נטו, הדרך הראשית היא הדוח: ההורדה נכנסת דרך מלאי הסגירה.</p>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Moving average, perpetual: before a sale, the summary row works out the average in the card itself.

function maCard() {
  let units = OPEN.units;
  let cost = OPEN.cost;
  let avg = units ? cost / units : 0;
  let bought = true;
  const rows: CardRow[] = [];
  const groups: CardStep[] = [];
  const sales: { date: string; qty: number; avg: number; cost: number }[] = [];
  for (const e of EVENTS) {
    const first = rows.length;
    if (e.kind === "buy") {
      const b = BUYS[e.i];
      units += b.qty;
      cost += b.total;
      rows.push({ kind: "buy", date: b.date, qty: b.qty, unit: u(b.unit), amount: b.total, units, cost, extra: "" });
      bought = true;
    } else {
      const s = SALES[e.i];
      if (bought) {
        avg = cost / units;
        rows.push({
          kind: "sum",
          date: s.date,
          units,
          cost,
          extra: (
            <>
              <Money v={cost} plain /> ÷ {qty(units)} = {u(avg)}
            </>
          ),
        });
      }
      const out = s.qty * avg;
      units -= s.qty;
      cost -= out;
      rows.push({ kind: "sell", date: s.date, qty: s.qty, unit: u(avg), amount: out, units, cost, extra: u(avg) });
      sales.push({ date: s.date, qty: s.qty, avg, cost: out });
      bought = false;
    }
    groups.push({ event: e, first, last: rows.length - 1 });
  }
  return { rows, groups, sales, closing: cost };
}
const MA_CARD = maCard();
export const MA_COGS = MA_CARD.sales.reduce((a, s) => a + s.cost, 0);
export const MA_CLOSING = MA_CARD.closing;

export const MA_STEPS: Step[] = [
  ...tablesSteps(<>הפעם צריך גם את <strong>התאריך</strong> של כל מכירה — כי כל מכירה יוצאת בממוצע של אותו רגע.</>),
  ...cardSteps(MA_CARD.rows, MA_CARD.groups, "ממוצע ליחידה", (g) =>
    g.event.kind === "buy" ? (
      <>קנייה מוסיפה יחידות ושקלים ליתרה. את הממוצע עוד לא מחשבים — רק לפני המכירה הבאה. ועלות המכר לא זזה: קנייה היא עוד לא הוצאה.</>
    ) : MA_CARD.rows[g.first].kind === "sum" ? (
      <>
        לפני המכירה — שורת סיכום: כל מה שבמלאי עכשיו, בשקלים וביחידות, ומחלקים: <strong>יתרה (₪) ÷ יתרה (יח׳) = ממוצע ליחידה</strong>. המכירה יוצאת בממוצע הזה — ועלותה מתווספת מיד לעמודת עלות המכר.
      </>
    ) : (
      <>מכירה מיד אחרי מכירה: לא נכנסה קנייה בינתיים, אז הממוצע לא השתנה — אין צורך בסיכום חדש, והמכירה יוצאת באותו ממוצע.</>
    ),
  ),
  {
    title: `שלב ${3 + MA_CARD.groups.length} · מלאי הסגירה, ומשווים לשווי מימוש נטו`,
    body: (
      <>
        <p>
          השורה האחרונה בכרטיס היא מלאי הסגירה: {qty(MA_CARD.rows.at(-1)!.units)} יח׳, <Money v={MA_CLOSING} /> בעלות.
        </p>
        <Working
          words={NO_NRV ? "בשאלה של מחברת לא נתון שווי מימוש נטו — ולכן מלאי הסגירה נשאר בעלות" : "הנמוך מבין העלות לשווי המימוש נטו"}
          numbers={
            <>
              מלאי סגירה בספרים: <Money v={MA.closingCarrying} plain /> ₪
            </>
          }
        />
      </>
    ),
  },
  {
    title: `שלב ${4 + MA_CARD.groups.length} · עלות המכר — סכום המכירות`,
    body: (
      <>
        <p>
          אין צורך לחכות לסוף השנה ולבנות דוח: בשיטה תמידית עלות המכר ידועה בכל רגע — השורה האחרונה בעמודת עלות המכר בכרטיס היא כבר עלות המכר של השנה.
        </p>
        <Table
          caption="עלות כל מכירה"
          head={["מכירה", "יחידות", "ממוצע באותו יום", "עלות"]}
          rows={MA_CARD.sales.map((s) => [s.date, qty(s.qty), u(s.avg), <Money key="c" v={s.cost} plain />])}
          foot={["עלות המכר", qty(SOLD), "", <Money key="c" v={MA_COGS} plain />]}
        />
        <TipNote>
          דרך נוספת, בלי הכרטיס: מלאי פתיחה + קניות − מלאי סגירה = <Money v={OPEN.cost} plain /> + <Money v={BOUGHT_COST} plain /> − <Money v={MA.closingCarrying} plain /> ={" "}
          <Money v={MA.cogs} plain /> — אותה עלות המכר.
        </TipNote>
      </>
    ),
  },
];
