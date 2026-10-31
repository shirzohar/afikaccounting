"use client";

import { ArrowLeftRight, Calculator, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useId, useState } from "react";
import { LessonContext } from "@/components/study-mode/screen-link";
import { NumberInput, parseNumber } from "@/components/study/inputs";
import { type Entry, ledger } from "@/lib/learn/basics";
import { compareMethods, METHOD_LABEL, priceTrend, valuatePeriod } from "@/lib/learn/inventory";
import { lehavaWith, tzlilWith } from "@/lib/learn/inventory-examples";
import { INVENTORY_CALC, inventoryScreenHref } from "@/lib/study/inventory";
import { cn } from "@/lib/utils";
import { FlowStrip } from "./inventory-trace";
import { updateProgress, useProgress } from "./store";
import { EntryView, fmt, Money, Scroller, TCard } from "./ui";

export const LOAD_EVENT = "inventory:load-example";

/** An example asked for before the calculator was on screen: it opens on it when it mounts, then lets it go. */
let pending: string | undefined;
export const pendingExample = () => pending;
export const clearPendingExample = () => {
  pending = undefined;
};

const btn = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-line transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-[var(--ring)] disabled:opacity-40";

/**
 * Opens an example in the calculator: on this screen, it loads at once;
 * elsewhere in the lesson, the lesson moves to the calculator's screen; anywhere
 * else, the calculator's lesson opens there — and the calculator opens on it.
 */
export function TryInCalc({ id, label = "נסו במחשבון" }: { id: string; label?: string }) {
  const lesson = useContext(LessonContext);
  const router = useRouter();
  const open = () => {
    const here = document.getElementById("inv-calc");
    if (here) {
      window.dispatchEvent(new CustomEvent(LOAD_EVENT, { detail: { id } }));
      return here.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
    pending = id;
    const href = inventoryScreenHref(INVENTORY_CALC);
    if (lesson && href.startsWith(`/study/${lesson.slug}?`)) lesson.jump(INVENTORY_CALC);
    else router.push(href);
  };
  return (
    <button type="button" className={cn(btn, "text-accent")} onClick={open}>
      <Calculator className="h-4 w-4" aria-hidden /> {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// "Check yourself": a few multiple-choice questions at the end of a chapter.

export type QuizItem = { q: string; options: string[]; answer: number; why: string };

/** `prefix` keeps each page's saved answers apart; the inventory page keeps its original "inv". */
export function MiniQuiz({ chapter, items, prefix = "inv" }: { chapter: string; items: QuizItem[]; prefix?: string }) {
  const progress = useProgress();
  return (
    <div className="card p-5">
      <p className="text-[16px] font-semibold text-fg">בדקו את עצמכם</p>
      <ol className="mt-3 space-y-4">
        {items.map((it, i) => {
          const key = `${prefix}:${chapter}:${i + 1}`;
          const saved = progress.answers[key];
          const picked = saved ? Number(saved.value) : null;
          return (
            <li key={key}>
              <fieldset>
                <legend className="text-[15px] font-medium text-fg">
                  <span className="num me-1.5 text-accent">{i + 1}.</span>
                  {it.q}
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {it.options.map((o, j) => (
                    <button
                      key={j}
                      type="button"
                      aria-pressed={picked === j}
                      onClick={() => updateProgress((p) => ({ ...p, answers: { ...p.answers, [key]: { value: String(j), correct: j === it.answer } } }))}
                      className={cn(
                        "min-h-10 rounded-lg border px-3 py-2 text-start text-sm transition-colors",
                        picked === j ? (j === it.answer ? "border-success/50 bg-success/10 text-fg" : "border-danger/50 bg-danger/10 text-fg") : "border-line bg-surface hover:border-line-strong",
                      )}
                    >
                      {picked === j && <span aria-hidden>{j === it.answer ? "✓ " : "✗ "}</span>}
                      {o}
                    </button>
                  ))}
                </div>
                <p aria-live="polite" className="mt-2 text-sm">
                  {picked !== null && (
                    <span className={picked === it.answer ? "text-success" : "text-danger"}>
                      {picked === it.answer ? "נכון. " : "לא בדיוק. "}
                      <span className="text-fg/85">{it.why}</span>
                    </span>
                  )}
                </p>
              </fieldset>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 1: how many were sold — and where the purchases go.

export function SoldSlider() {
  const id = useId();
  const [sold, setSold] = useState(6);
  const r = valuatePeriod(lehavaWith(sold), "fifo");
  const share = r.purchasesCost ? r.cogs / r.purchasesCost : 0;
  return (
    <div className="card space-y-4 p-5">
      <label htmlFor={id} className="block text-sm font-semibold text-fg">
        כמה ערכות נמכרו? <span className="num text-accent">{sold}</span> מתוך 10
      </label>
      <input id={id} type="range" min={0} max={10} value={sold} onChange={(e) => setSold(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
      <div>
        <p className="mb-1.5 text-xs text-muted">
          הקניות (<Money v={r.purchasesCost} />) מתפצלות לשניים:
        </p>
        <div className="flex h-9 overflow-hidden rounded-lg ring-1 ring-line" aria-hidden>
          <div className="grid place-items-center bg-[var(--series-2)] text-xs font-semibold text-white transition-[width]" style={{ width: `${share * 100}%` }}>
            {share > 0.15 && "הוצאה"}
          </div>
          <div className="grid flex-1 place-items-center bg-[var(--series-1)] text-xs font-semibold text-white">{share < 0.85 && "נכס"}</div>
        </div>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3" aria-live="polite">
          <p className="rounded-lg bg-surface-2/70 px-3 py-2">
            עלות המכר (נמכר — הוצאה): <strong><Money v={r.cogs} /></strong>
          </p>
          <p className="rounded-lg bg-surface-2/70 px-3 py-2">
            מלאי על המדף (נכס): <strong><Money v={r.closingCarrying} /></strong>
          </p>
          <p className="rounded-lg bg-accent-soft px-3 py-2">
            רווח גולמי: <strong><Money v={r.grossProfit} /></strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 3: the same events under each recording system.

const EVENTS = ["קנייה", "מכירה", "סוף השנה"];

export function SystemSwitch({ data }: { data: Record<"periodic" | "perpetual", { entries: Entry[]; groups: number[][] }> }) {
  const [sys, setSys] = useState<"periodic" | "perpetual">("periodic");
  const [step, setStep] = useState(EVENTS.length - 1);
  const d = data[sys];
  const shown = d.groups.slice(0, step + 1).flat();
  const entries = shown.map((i) => d.entries[i]);
  const current = new Set(d.groups[step]);
  const accounts = ledger(entries).filter((t) => ["מלאי", "קניות", "עלות המכר", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד"].includes(t.account));
  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="שיטת הרישום">
        {(["periodic", "perpetual"] as const).map((s) => (
          <button key={s} type="button" role="radio" aria-checked={sys === s} onClick={() => setSys(s)} className={cn(btn, sys === s && "bg-accent text-accent-fg ring-accent hover:bg-accent")}>
            {s === "periodic" ? "מלאי תקופתי" : "מלאי תמידי"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5" aria-label="אירועים">
        {EVENTS.map((e, i) => (
          <button key={e} type="button" aria-pressed={i === step} onClick={() => setStep(i)} className={cn(btn, "text-xs", i === step && "bg-surface-2 font-semibold text-fg")}>
            <span className="num">{i + 1}.</span> {e}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-sm text-muted">
        {d.groups[step].length === 0 ? "בשיטה תמידית אין פקודת התאמה בסוף השנה — המלאי בספרים כבר מעודכן." : `אחרי ${EVENTS[step]}: ${d.groups[step].length} ${d.groups[step].length > 1 ? "פקודות" : "פקודה"}.`}
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {entries.map((e, i) => (
          <div key={e.id} className={cn("min-w-0", !current.has(shown[i]) && "opacity-60")}>
            <EntryView entry={e} title={e.text} effect={false} note={e.why ?? null} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((t) => (
          <TCard key={t.account} t={t} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 4: a statement with question marks, filled one equation at a time.

export type FillData = {
  years: string[];
  rows: { key: string; label: string; pct?: boolean }[];
  given: boolean[][];
  values: (number | null)[][];
  steps: { year: number; row: string; equation: string; substitution: string; why: string }[];
  /** Where a year's closing balance becomes the next year's opening. */
  rolls: { from: number; to: number }[];
};

export function TableFill({ data }: { data: FillData }) {
  const [n, setN] = useState(0);
  const filled = new Set(data.steps.slice(0, n).map((s) => `${s.year}:${s.row}`));
  const cur = n > 0 ? data.steps[n - 1] : null;
  const at = (t: number, row: string) => {
    const ri = data.rows.findIndex((r) => r.key === row);
    const v = ri < 0 ? null : data.values[t][ri];
    return ri >= 0 && v !== null && (data.given[t][ri] || filled.has(`${t}:${row}`)) ? v : null;
  };
  return (
    <div className="card space-y-3 p-5">
      <Scroller caption="הדוח עם סימני השאלה">
        <table className="w-full min-w-[24rem] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-3 py-2 text-start font-medium">
                סעיף
              </th>
              {data.years.map((y) => (
                <th key={y} scope="col" className="px-3 py-2 text-end font-medium">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={row.key} className="border-t border-line/70">
                <th scope="row" className="px-3 py-1.5 text-start font-normal text-fg">
                  {row.label}
                </th>
                {data.years.map((y, t) => {
                  const k = `${t}:${row.key}`;
                  const v = data.values[t][ri];
                  const show = data.given[t][ri] || filled.has(k);
                  const isCur = cur && cur.year === t && cur.row === row.key;
                  return (
                    <td key={y} className={cn("px-3 py-1.5 text-end", isCur && "bg-success/15 font-semibold", !data.given[t][ri] && show && !isCur && "bg-accent-soft/60")}>
                      {row.key === "opening" && t > 0 && <span className="block text-[10px] font-medium text-accent">← מסגירת {data.years[t - 1]}</span>}
                      {show && v !== null ? (
                        row.pct ? (
                          <bdi dir="ltr" className="num">{fmt(v * 100)}%</bdi>
                        ) : (
                          <Money v={v} plain />
                        )
                      ) : (
                        <span className="rounded bg-accent-soft px-1.5 font-bold text-accent">?</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Scroller>
      {data.rolls.map(({ from, to }) => {
        const close = at(from, "closing");
        const open = at(to, "opening");
        const live = cur?.year === to && cur.row === "opening";
        return (
          <div key={to} className={cn("rounded-lg border px-3 py-2", live ? "border-accent bg-accent-soft/50" : "border-line")}>
            <p className="mb-1.5 text-xs font-semibold text-muted">גלגול יתרות: הסגירה של שנה אחת היא הפתיחה של הבאה</p>
            <FlowStrip
              boxes={[
                { label: `מלאי סגירה ${data.years[from]}`, value: close === null ? "?" : `${fmt(close)} ₪` },
                { label: "עובר שנה", value: "" },
                { label: `מלאי פתיחה ${data.years[to]}`, value: open === null ? "?" : `${fmt(open)} ₪`, tone: "accent" },
              ]}
            />
          </div>
        );
      })}
      <div className="min-h-16 rounded-lg bg-surface-2/70 px-3 py-2 text-sm" aria-live="polite">
        {cur ? (
          <>
            <p className="text-xs font-semibold text-accent">
              צעד {n} מתוך {data.steps.length} · {data.years[cur.year]}
            </p>
            <p className="mt-0.5 text-fg/90">
              <strong>למה עכשיו? </strong>
              {cur.why}
            </p>
            <p className="mt-1 font-semibold text-fg">{cur.equation}</p>
            <p className="num mt-0.5 text-fg/85">{cur.substitution}</p>
          </>
        ) : (
          <p className="text-muted">לחצו &quot;צעד הבא&quot;: בכל צעד מחפשים משוואה אחת שיש בה נעלם אחד.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => setN((x) => Math.max(0, x - 1))} disabled={n === 0}>
          <ChevronRight className="h-4 w-4" aria-hidden /> הקודם
        </button>
        <button type="button" className={cn(btn, "bg-accent text-accent-fg ring-accent hover:bg-accent/90")} onClick={() => setN((x) => Math.min(data.steps.length, x + 1))} disabled={n === data.steps.length}>
          צעד הבא <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" className={btn} onClick={() => setN(data.steps.length)}>
          הצגת הכול
        </button>
        <button type="button" className={btn} onClick={() => setN(0)}>
          <RotateCcw className="h-4 w-4" aria-hidden /> מההתחלה
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sorting quizzes: what goes into cost, what counts as inventory, true or false.

export type SortItem = { text: string; answer: string; why: string; ref?: string };

export function SortQuiz({ id, items, options, title, prefix = "inv" }: { id: string; items: SortItem[]; options: [string, string][]; title?: string; prefix?: string }) {
  const progress = useProgress();
  const done = items.filter((_, i) => progress.answers[`${prefix}:${id}:${i + 1}`]).length;
  const right = items.filter((_, i) => progress.answers[`${prefix}:${id}:${i + 1}`]?.correct).length;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {title && <p className="text-[16px] font-semibold text-fg">{title}</p>}
        <p className="text-xs text-muted" aria-live="polite">
          ענו על <span className="num">{done}</span> מתוך <span className="num">{items.length}</span> · נכונות: <span className="num">{right}</span>
        </p>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {items.map((it, i) => {
          const key = `${prefix}:${id}:${i + 1}`;
          const saved = progress.answers[key];
          return (
            <li key={key} className="py-3">
              <p className="text-[14.5px] text-fg">
                <span className="num me-1.5 text-accent">{i + 1}.</span>
                {it.text}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`תשובה לפריט ${i + 1}`}>
                {options.map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={saved?.value === k}
                    onClick={() => updateProgress((p) => ({ ...p, answers: { ...p.answers, [key]: { value: k, correct: k === it.answer } } }))}
                    className={cn(
                      btn,
                      "text-xs",
                      saved?.value === k && (k === it.answer ? "bg-success/15 ring-success/50" : "bg-danger/10 ring-danger/50"),
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {saved && (
                <p className={cn("mt-1.5 text-[13.5px]", saved.correct ? "text-success" : "text-danger")}>
                  {saved.correct ? "✓ נכון. " : `✗ התשובה: ${options.find(([k]) => k === it.answer)?.[1]}. `}
                  <span className="text-fg/85">{it.why}</span>
                  {it.ref && <span className="num ms-1 text-xs text-muted">({it.ref})</span>}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 6: change three prices and watch the formulas part ways.

export function FormulaLab() {
  const [prices, setPrices] = useState<[string, string, string]>(["20", "30", "40"]);
  const p = prices.map((x) => parseNumber(x)) as [number, number, number];
  const valid = p.every((x) => Number.isFinite(x) && x >= 0);
  const period = tzlilWith(valid ? p : [20, 30, 40]);
  const all = compareMethods([period]);
  const perpetualFifo = valuatePeriod(period, "fifo", { system: "perpetual" });
  const rows = [
    { label: "FIFO תקופתי", r: all.fifo[0] },
    { label: "FIFO תמידי", r: perpetualFifo },
    { label: METHOD_LABEL["wa-periodic"], r: all["wa-periodic"][0] },
    { label: METHOD_LABEL["moving-avg"], r: all["moving-avg"][0] },
  ];
  const trend = priceTrend(period);
  const order = [rows[0], rows[2], rows[3]].sort((a, b) => b.r.grossProfit - a.r.grossProfit);
  return (
    <div className="card space-y-4 p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["1.2 (10 יח')", "10.4 (5 יח')", "17.8 (6 יח')"] as const).map((l, i) => (
          <NumberInput key={l} label={`מחיר הרכישה ב-${l}`} suffix="₪" value={prices[i]} onChange={(v) => setPrices((s) => s.map((x, j) => (j === i ? v : x)) as [string, string, string])} error={Number.isFinite(p[i]) && p[i] >= 0 ? undefined : "הזינו מחיר"} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => setPrices(([a, b, c]) => [c, b, a])}>
          <ArrowLeftRight className="h-4 w-4" aria-hidden /> היפוך מגמה
        </button>
        <button type="button" className={btn} onClick={() => setPrices(["20", "30", "40"])}>
          <RotateCcw className="h-4 w-4" aria-hidden /> מחירי הדוגמה
        </button>
      </div>
      <Scroller caption="אותם נתונים — ארבע תוצאות (מכירות 1,000 ₪)">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-3 py-2 text-start font-medium">שיטה</th>
              <th scope="col" className="px-3 py-2 text-end font-medium">מלאי סגירה (9 יח׳)</th>
              <th scope="col" className="px-3 py-2 text-end font-medium">עלות המכר</th>
              <th scope="col" className="px-3 py-2 text-end font-medium">רווח גולמי</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {rows.map(({ label, r }) => (
              <tr key={label} className="border-t border-line/70">
                <th scope="row" className="px-3 py-1.5 text-start font-normal text-fg">{label}</th>
                <td className="px-3 py-1.5 text-end"><Money v={r.closingCarrying} plain /></td>
                <td className="px-3 py-1.5 text-end"><Money v={r.cogs} plain /></td>
                <td className="px-3 py-1.5 text-end font-semibold"><Money v={r.grossProfit} plain /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Scroller>
      <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-fg" aria-live="polite">
        {trend === "up" && <>המחירים עלו: על המדף ב-FIFO נשארות היחידות היקרות, ולכן עלות המכר נמוכה והרווח הגולמי הגבוה ביותר. </>}
        {trend === "down" && <>המחירים ירדו: עכשיו ב-FIFO נשארות היחידות הזולות — והסדר התהפך. </>}
        {trend === "flat" && <>כל המחירים זהים — כל השיטות נותנות אותה תוצאה. </>}
        {trend === "mixed" && <>המחירים עלו וירדו — אין כלל פשוט; צריך לחשב. </>}
        {trend !== "flat" && (
          <>
            הסדר עכשיו: {order.map((o) => o.label).join(" > ")}.
          </>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 7: the FIFO shelf, event by event.

export type ShelfFrame = { title: string; note: string; layers: { source: string; units: number; unitCost: number; color: number }[]; total: number; units: number };

export function FifoShelf({ frames }: { frames: ShelfFrame[] }) {
  const [i, setI] = useState(0);
  const f = frames[i];
  const max = Math.max(...frames.map((x) => x.units), 1);
  const go = (d: number) => setI((x) => Math.min(frames.length - 1, Math.max(0, x + d)));
  return (
    <div
      className="card space-y-3 p-5"
      tabIndex={0}
      role="group"
      aria-label="מדף השכבות של FIFO — חצים כדי לעבור בין האירועים"
      // Inside a lesson the arrows come here first; past either end they are left to move the lesson.
      aria-roledescription="צעד אחר צעד"
      onKeyDown={(e) => {
        const d = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
        if (!d || i + d < 0 || i + d >= frames.length) return;
        e.preventDefault();
        go(d);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-fg">
          <span className="num text-accent">{i + 1}/{frames.length}</span> · {f.title}
        </p>
        <div className="flex gap-1.5">
          <button type="button" className={btn} onClick={() => go(-1)} disabled={i === 0} aria-label="האירוע הקודם">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" className={btn} onClick={() => go(1)} disabled={i === frames.length - 1} aria-label="האירוע הבא">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex h-14 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-line" aria-hidden>
        {f.layers.map((l) => (
          <div
            key={l.source}
            className="grid min-w-0 place-items-center overflow-hidden border-e-2 border-surface text-[11px] font-semibold text-white transition-[width] duration-300"
            style={{ width: `${(l.units / max) * 100}%`, background: `var(--series-${(l.color % 4) + 1})` }}
            title={l.source}
          >
            <span className="truncate px-1">{l.units >= max * 0.08 ? l.units.toLocaleString("he-IL") : ""}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">הוותיק ביותר מימין — ממנו לוקחים קודם.</p>
      <ul className="grid gap-1 text-[13px] sm:grid-cols-2">
        {f.layers.map((l) => (
          <li key={l.source} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: `var(--series-${(l.color % 4) + 1})` }} aria-hidden />
            <span className="text-fg">
              {l.source}: <span className="num">{l.units.toLocaleString("he-IL")}</span> יח׳ × <Money v={l.unitCost} />
            </span>
          </li>
        ))}
      </ul>
      <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg" aria-live="polite">
        {f.note} על המדף: <span className="num">{f.units.toLocaleString("he-IL")}</span> יח׳ בעלות <Money v={f.total} />.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 11: from the count to the statements.

export function CountBridge({ rows }: { rows: { label: string; amount: number; sign: 1 | -1; why: string }[] }) {
  const [v, setV] = useState(rows.map((r) => String(r.amount)));
  const nums = v.map(parseNumber);
  const total = rows.reduce((s, r, i) => s + r.sign * (Number.isFinite(nums[i]) ? nums[i] : 0), 0);
  return (
    <div className="card space-y-3 p-5">
      <p className="font-semibold text-fg">גשר ספירה: מהמחסן ליתרה בדוחות</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div key={r.label}>
            <NumberInput label={`${r.sign === 1 ? "+" : "−"} ${r.label}`} suffix="₪" value={v[i]} onChange={(x) => setV((s) => s.map((y, j) => (j === i ? x : y)))} />
            <p className="mt-1 text-xs text-muted">{r.why}</p>
          </div>
        ))}
      </div>
      <p className="rounded-lg bg-accent-soft px-3 py-2 text-[15px] font-semibold text-fg" aria-live="polite">
        יתרת המלאי לצורכי הדוחות: <Money v={total} />
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice: type the answer, get ✓ or ✗.

export function AnswerCheck({ answers }: { answers: { label: string; value: number; kind: "amount" | "pct" | "qty" }[] }) {
  const [v, setV] = useState(answers.map(() => ""));
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {answers.map((a, i) => {
          const x = parseNumber(v[i]);
          const target = a.kind === "pct" ? a.value * 100 : a.value;
          const ok = Number.isFinite(x) && Math.abs(x - target) <= 0.5 + 1e-9;
          return (
            <div key={a.label}>
              <NumberInput label={a.label} suffix={a.kind === "pct" ? "%" : a.kind === "qty" ? "יח'" : "₪"} value={v[i]} onChange={(s) => setV((p) => p.map((y, j) => (j === i ? s : y)))} />
              <p className="mt-1 min-h-5 text-xs" aria-live="polite">
                {v[i] && (ok ? <span className="text-success">✓ נכון</span> : <span className="text-danger">✗ עדיין לא</span>)}
                {shown && (
                  <span className="ms-2 text-muted">
                    התשובה: <bdi dir="ltr" className="num">{fmt(Math.round(target * 100) / 100)}</bdi>
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
      <button type="button" className={cn(btn, "text-xs")} onClick={() => setShown((s) => !s)}>
        {shown ? "הסתירו את התשובות" : "הראו תשובות"}
      </button>
    </div>
  );
}
