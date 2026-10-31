"use client";

import { Eraser } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useReducer, useSyncExternalStore } from "react";
import type { Method } from "@/lib/learn/inventory";
import { anyExample, CALC_EXAMPLES } from "@/lib/learn/inventory-examples";
import { cn } from "@/lib/utils";
import { DataStep } from "./inventory-calc-data";
import { EventsStep } from "./inventory-calc-events";
import { smallBtn } from "./inventory-calc-fields";
import { FireTab } from "./inventory-calc-fire";
import { LiveBar, ResultsStep, solveAll, status } from "./inventory-calc-results";
import { build, type CalcState, emptyState, fromExample, loadState, saveState, STEP_COUNT, type Tab } from "./inventory-calc-state";
import { TableTab } from "./inventory-calc-table";
import { clearPendingExample, LOAD_EVENT, pendingExample } from "./inventory-interactive";

export type Update = (fn: (s: CalcState) => CalcState) => void;

const noop = () => () => {};

/** Rendered only in the browser, so the saved form can be read without a hydration mismatch. */
export function InventoryCalculator() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  if (!ready) return <div className="card p-6 text-sm text-muted">טוען את המחשבון…</div>;
  return <Calculator />;
}

/** The kind of question: almost every one is the first; the other two have no table of purchases and sales. */
const MODES: [Tab, string, string][] = [
  ["full", "שאלת מלאי", "רכישות ומכירות, הנחות, שווי מימוש, נעלמים ושריפה"],
  ["table", "דוח עם סימני שאלה", "דוח רווח גולמי שחסרים בו סעיפים"],
  ["fire", "שיעור גולמי בלבד", "שיטה קמעונאית, שריפה לפי שיעור גולמי"],
];

function Calculator() {
  const [st, dispatch] = useReducer((s: CalcState, fn: (s: CalcState) => CalcState) => fn(s), undefined, () => {
    const asked = anyExample(pendingExample() ?? "");
    return asked ? fromExample(asked) : (loadState() ?? emptyState());
  });
  useEffect(clearPendingExample, []);
  const set: Update = dispatch;
  useEffect(() => saveState(st), [st]);
  useEffect(() => {
    const on = (e: Event) => {
      const ex = anyExample((e as CustomEvent<{ id: string }>).detail?.id);
      if (ex) dispatch(() => fromExample(ex));
    };
    window.addEventListener(LOAD_EVENT, on);
    return () => window.removeEventListener(LOAD_EVENT, on);
  }, []);

  const onModeKey = (e: KeyboardEvent) => {
    const i = MODES.findIndex(([t]) => t === st.tab);
    // Right-to-left: the left arrow moves to the next tab.
    const d = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = MODES[(i + d + MODES.length) % MODES.length][0];
    set((s) => ({ ...s, tab: next }));
    document.getElementById(`inv-tab-${next}`)?.focus();
  };

  return (
    <div id="inv-calc" className="card overflow-clip">
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
        <p className="me-auto text-[17px] font-semibold text-fg">מחשבון מלאי</p>
        <label className="sr-only" htmlFor="inv-example">
          טענו שאלה לדוגמה
        </label>
        <select
          id="inv-example"
          value=""
          onChange={(e) => {
            const ex = anyExample(e.target.value);
            if (ex) set(() => fromExample(ex));
          }}
          className="h-10 max-w-[14rem] rounded-lg border border-line-strong bg-surface px-2 text-sm text-fg"
        >
          <option value="">שאלה לדוגמה…</option>
          {CALC_EXAMPLES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={smallBtn}
          onClick={() => {
            if (window.confirm("לנקות את כל הנתונים במחשבון?")) set(() => ({ ...emptyState(), tab: st.tab }));
          }}
        >
          <Eraser className="h-4 w-4" aria-hidden /> שאלה חדשה
        </button>
      </div>
      <div role="tablist" aria-label="סוג השאלה" className="no-print grid grid-cols-3 gap-1 border-b border-line px-3 pt-2" onKeyDown={onModeKey}>
        {MODES.map(([t, label, hint]) => (
          <button
            key={t}
            id={`inv-tab-${t}`}
            role="tab"
            type="button"
            aria-selected={st.tab === t}
            aria-controls={`inv-panel-${t}`}
            tabIndex={st.tab === t ? 0 : -1}
            onClick={() => set((s) => ({ ...s, tab: t }))}
            className={cn("min-h-10 rounded-t-lg border-b-2 px-2 py-2 text-start", st.tab === t ? "border-accent" : "border-transparent hover:bg-surface-2/60")}
          >
            <span className={cn("block text-sm font-semibold", st.tab === t ? "text-fg" : "text-muted")}>{label}</span>
            <span className="hidden text-[11px] text-muted sm:block">{hint}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`inv-panel-${st.tab}`} aria-labelledby={`inv-tab-${st.tab}`} className="p-4">
        {st.tab === "full" && <Flow st={st} set={set} />}
        {st.tab === "table" && <TableTab st={st} set={set} />}
        {st.tab === "fire" && <FireTab st={st} set={set} />}
      </div>
    </div>
  );
}

const STEPS: [string, string][] = [
  ["הנתונים", "שיטה, תנאי רכישה, רכישות ומכירות"],
  ["אירועים ונתונים", "שווי מימוש נטו, נעלמים, שריפה"],
  ["תוצאות", "התשובות ודרך הפתרון"],
];

/** The full question in three steps; the answer is computed on every keystroke and shown all along. */
function Flow({ st, set }: { st: CalcState; set: Update }) {
  const built = useMemo(() => build(st), [st]);
  const method: Method = st.method === "compare" ? "fifo" : st.method;
  const solution = useMemo(() => solveAll(st, built, method), [st, built, method]);
  const step = Math.min(Math.max(0, st.step), STEP_COUNT - 1);
  const ok = status(built, solution).ok;
  const go = (n: number) => {
    set((s) => ({ ...s, step: Math.min(Math.max(0, n), STEP_COUNT - 1) }));
    const top = document.getElementById("inv-calc");
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  return (
    <div>
      <nav aria-label="שלבי המחשבון" className="no-print mb-4">
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map(([title, hint], i) => (
            <li key={title}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={step === i ? "step" : undefined}
                className={cn("flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-start transition-colors", step === i ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong")}
              >
                <span className={cn("num grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold", step === i ? "bg-accent text-accent-fg" : i === 2 && ok ? "bg-success/15 text-success" : "bg-surface-2 text-muted")}>
                  {i === 2 && ok && step !== 2 ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-fg">{title}</span>
                  <span className="hidden truncate text-[11px] text-muted md:block">{hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {step === 0 && <DataStep st={st} set={set} built={built} results={solution.results} />}
      {step === 1 && <EventsStep st={st} set={set} built={built} solution={solution} />}
      {step === 2 && <ResultsStep st={st} set={set} built={built} solution={solution} method={method} go={go} />}
      {step < 2 && <LiveBar st={st} built={built} solution={solution} step={step} go={go} />}
    </div>
  );
}
