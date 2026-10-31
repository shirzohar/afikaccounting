"use client";

import { ArrowLeft, CircleCheck, CircleX, GripVertical, Hourglass, RotateCcw, Rocket, Scale, Shuffle, ThumbsUp, Timer, Trophy, Zap } from "lucide-react";
import { type DragEvent, type ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { JournalSimulator } from "@/components/study-mode/journal-simulator";
import { typedAmount } from "@/lib/amount";
import { isBalanceSheet, round2, typeOf } from "@/lib/learn/basics";
import { type WorksheetCase, worksheetResult, worksheetRows } from "@/lib/learn/worksheet";
import type { ExResult } from "@/lib/study/score";
import type { JournalExercise } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

type Side = "dr" | "cr";
const SIDE: Record<Side, string> = { dr: "חובה", cr: "זכות" };
const sideOf = (v: number): Side => (v > 0 ? "dr" : "cr");
const parse = (s: string) => {
  const x = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : 0;
};

/** Why an account's balance sits where it does — the course's reasons, the traps first. */
function whySide(account: string, side: Side): string {
  const special: Record<string, string> = {
    "הפרשה להפסדי אשראי חזויים": "היא יושבת בצד הנכסים, אבל מקטינה את הלקוחות — ולכן היתרה שלה בזכות.",
    "מקדמות לספקים": "שילמנו לספק מראש, והוא חייב לנו סחורה — נכס, ולכן בחובה.",
    "מקדמות מלקוחות": "לקוח שילם מראש, ואנחנו חייבים לו סחורה — התחייבות, ולכן בזכות.",
    "מלאי פתיחה": "מלאי מתחילת השנה נכנס לעלות המכר, כמו קניות — יתרה בחובה.",
    "הוצאות ביטוח מראש": "שילמנו על חודשים שעוד לא נוצלו — נכס, ולכן בחובה, למרות המילה ״הוצאות״.",
    עודפים: side === "dr" ? "עודפים בחובה הם הפסדים צבורים: בשנים קודמות החברה הפסידה יותר משהרוויחה." : "עודפים הם רווחים שנצברו — הון, ולכן בזכות.",
  };
  if (special[account]) return special[account];
  const t = typeOf(account);
  return {
    asset: "נכס — יתרה בחובה.",
    contraAsset: "מקטין נכס — יתרה בזכות.",
    liability: "התחייבות — יתרה בזכות.",
    equity: "הון — יתרה בזכות.",
    income: "הכנסה — יתרה בזכות.",
    expense: "הוצאה — יתרה בחובה.",
  }[t];
}

/** Why an account is in profit or loss, or in the balance sheet. */
function whyKind(account: string): string {
  if (account === "מלאי סגירה מאזני") return "המלאי שבמחסן בסוף השנה — נכס, ממשיך לשנה הבאה: מאזני.";
  if (account === "מלאי סגירה רווח או הפסד") return "הצד של מלאי הסגירה שמקטין את עלות המכר — חלק מרווח והפסד: תוצאתי.";
  if (account === "מלאי פתיחה") return "מלאי הפתיחה נכנס לעלות המכר של השנה — תוצאתי.";
  const t = typeOf(account);
  return t === "income" || t === "expense"
    ? `${t === "income" ? "הכנסה" : "הוצאה"} — נכנסת לרווח והפסד ומתאפסת בכל שנה: תוצאתי.`
    : "נכס, התחייבות או הון — ממשיך לשנה הבאה: מאזני.";
}

/** A speed rating: seconds per card, a mistake counting as five more seconds. */
function rating(seconds: number, mistakes: number, cards: number): { icon: ReactNode; label: string } {
  const per = (seconds + mistakes * 5) / cards;
  if (per <= 3) return { icon: <Zap className="h-5 w-5" />, label: "מהירות שיא" };
  if (per <= 5) return { icon: <Rocket className="h-5 w-5" />, label: "מהיר מאוד" };
  if (per <= 8) return { icon: <ThumbsUp className="h-5 w-5" />, label: "טוב" };
  return { icon: <Hourglass className="h-5 w-5" />, label: "עוד קצת תרגול — ותשברו את השיא" };
}

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function best(key: string): number | undefined {
  try {
    const v = Number(localStorage.getItem(key));
    return v > 0 ? v : undefined;
  } catch {
    return undefined;
  }
}
function saveBest(key: string, ms: number) {
  try {
    localStorage.setItem(key, String(ms));
  } catch {
    // Storage blocked: the record lasts for this visit only.
  }
}

// ---------------------------------------------------------------------------
// Stage 1: sorting the trial balance.

type SortStats = { ms?: number; mistakes: number };

function SortStage({ c, onDone }: { c: WorksheetCase; onDone: (s: SortStats) => void }) {
  const accounts = useMemo(() => Object.keys(c.preliminary), [c]);
  const [order, setOrder] = useState(accounts);
  const [placed, setPlaced] = useState<Record<string, Side>>({});
  const [picked, setPicked] = useState<string>();
  const [missing, setMissing] = useState("");
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [timed, setTimed] = useState(false);
  const [start, setStart] = useState<number>();
  const [now, setNow] = useState(0);
  const [doneAt, setDoneAt] = useState<number>();
  const key = `afik.ws-sort.best.${c.name}`;
  // The personal best, read from this browser (nothing on the server); a new one set here overrides it.
  const stored = useSyncExternalStore(
    () => () => {},
    () => best(key),
    () => undefined,
  );
  const [fresh, setRecord] = useState<number>();
  const record = fresh ?? stored;
  useEffect(() => {
    if (!start || doneAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [start, doneAt]);

  const hidden = timed && !start;
  const pool = order.filter((a) => !placed[a]);
  const done = doneAt !== undefined;
  const elapsed = start ? (doneAt ?? now) - start : 0;
  // The "?" account counts with the amount typed for it.
  const amountOf = (a: string) => (a === c.unknown ? parse(missing) : Math.abs(c.preliminary[a]));
  const total = (s: Side) => round2(Object.entries(placed).filter(([, v]) => v === s).reduce((t, [a]) => t + amountOf(a), 0));
  const missingOff = (a: string) => a === c.unknown && Math.abs(parse(missing) - Math.abs(c.preliminary[a])) > 0.5;

  const go = () => {
    // A fresh deal each time: the order is shuffled when the clock starts.
    setOrder([...accounts].sort(() => Math.random() - 0.5));
    setStart(Date.now());
    setNow(Date.now());
  };
  const place = (a: string, s: Side) => {
    setPlaced((p) => ({ ...p, [a]: s }));
    setPicked(undefined);
    setWrong((w) => {
      const n = new Set(w);
      n.delete(a);
      return n;
    });
  };
  const unplace = (a: string) => {
    setPlaced((p) => {
      const n = { ...p };
      delete n[a];
      return n;
    });
  };
  const check = () => {
    const bad = accounts.filter((a) => placed[a] !== sideOf(c.preliminary[a]) || missingOff(a));
    setWrong(new Set(bad));
    setMistakes((m) => m + bad.length);
    if (bad.length) return;
    const at = Date.now();
    setDoneAt(at);
    if (start) {
      const ms = at - start;
      if (!record || ms < record) {
        saveBest(key, ms);
        setRecord(ms);
      }
    }
  };
  const reset = () => {
    setPlaced({});
    setMissing("");
    setWrong(new Set());
    setMistakes(0);
    setStart(undefined);
    setDoneAt(undefined);
  };

  const onDrop = (side: Side) => (e: DragEvent) => {
    e.preventDefault();
    const a = e.dataTransfer.getData("text/plain");
    if (a in c.preliminary) place(a, side);
  };
  const label = (a: string) => (
    <>
      {a}
      {c.notes?.[a] && <span className="ms-1.5 text-[11.5px] font-normal text-muted">({c.notes[a]})</span>}
    </>
  );

  /** An amount waiting next to its account: dragged to the debit or the credit cell of its row. */
  const chip = (a: string) => (
    <span
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", a);
        setPicked(a);
      }}
      onDragEnd={() => setPicked(undefined)}
      className={cn(
        "inline-flex cursor-grab items-center gap-1 rounded-lg border bg-surface px-2 py-1 text-[13.5px] font-semibold text-fg shadow-sm active:cursor-grabbing",
        picked === a ? "border-accent ring-2 ring-accent/40" : "border-line-strong hover:border-accent/60",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-subtle" aria-hidden />
      {a === c.unknown ? <span className="px-1 font-extrabold text-accent">?</span> : <Money v={Math.abs(c.preliminary[a])} plain />}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-2/60 px-4 py-3">
        <p className="min-w-0 flex-1 text-[14.5px] text-fg">
          {accounts.length} כרטיסים מהמאזן הראשוני של {c.name}. העבירו כל כרטיס לחובה או לזכות — ובסוף, בדקו.
          {c.unknown && (
            <>
              {" "}
              <strong>
                הפעם היתרה של ״{c.unknown}״ לא נתונה: מצאו את הצד שלה ואת הסכום שמאזן את המאזן.
              </strong>
            </>
          )}
        </p>
        {!start && !done && (
          <label className="flex items-center gap-2 text-[14px] font-semibold text-fg">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            <Timer className="h-4 w-4 text-accent" aria-hidden /> למדוד לי זמן
          </label>
        )}
        {start && (
          <span className={cn("num inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[16px] font-bold", done ? "bg-success/15 text-success" : "bg-accent-soft text-accent")}>
            <Timer className="h-4 w-4" aria-hidden /> {clock(elapsed)}
          </span>
        )}
        {record && (
          <span className="num inline-flex items-center gap-1 text-[13px] text-muted">
            <Trophy className="h-4 w-4 text-[#eda100]" aria-hidden /> השיא שלכם: {clock(record)}
          </span>
        )}
      </div>

      {hidden ? (
        <div className="grid place-items-center rounded-2xl border-2 border-dashed border-accent/40 p-8 text-center">
          <p className="text-[15px] text-fg">השעון יתחיל ברגע שהכרטיסים יופיעו.</p>
          <Button size="lg" className="mt-3" onClick={go}>
            <Timer className="h-4 w-4" aria-hidden /> מוכנים? מתחילים!
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border-2 border-fg/60 bg-surface">
            <table className="w-full min-w-[34rem] text-[14px]">
              <caption className="border-b-2 border-fg/60 bg-surface-2/60 px-4 py-2.5 text-center">
                <span className="block text-[17px] font-extrabold text-fg">מאזן ראשוני לפני התאמה</span>
                <span className="block text-[13px] text-muted">
                  {c.name} · {c.date} · {pool.length ? `נשארו ${pool.length} סכומים — גררו כל סכום לחובה או לזכות בשורה שלו (או לחצו על התא)` : "כל הסכומים במקום"}
                </span>
              </caption>
              <thead>
                <tr className="border-b-2 border-fg/60">
                  <th className="px-4 py-2 text-start text-[14px] font-bold text-fg">חשבון</th>
                  <th className="w-40 border-s-2 border-fg/60 bg-debit/[0.08] px-3 py-2 text-center text-[15px] font-bold text-debit">חובה</th>
                  <th className="w-40 border-s border-line bg-credit/[0.08] px-3 py-2 text-center text-[15px] font-bold text-credit">זכות</th>
                </tr>
              </thead>
              <tbody>
                {order.map((a) => {
                  const s = placed[a];
                  return (
                    <tr key={a} className={cn("border-t border-line/70", wrong.has(a) && "bg-danger/[0.07]", done && "bg-success/[0.04]")}>
                      <td className="px-4 py-1.5 align-top">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-fg">{label(a)}</span>
                          {!s && !done && chip(a)}
                        </span>
                        {wrong.has(a) && s && (
                          <span className="mt-1 block text-[12.5px] leading-snug text-fg">
                            {a === c.unknown ? (
                              s !== sideOf(c.preliminary[a]) ? (
                                <>
                                  <strong className="text-danger">לא {SIDE[s]}. </strong>
                                  סכמו את שתי העמודות בלי {a}: הצד הקטן הוא הצד שלו — שם חסר סכום כדי שהמאזן יתאזן.
                                </>
                              ) : (
                                <>
                                  <strong className="text-danger">הצד נכון, הסכום לא. </strong>
                                  הסכום החסר הוא ההפרש בין סך החובה לסך הזכות של כל שאר החשבונות.
                                </>
                              )
                            ) : (
                              <>
                                <strong className="text-danger">לא {SIDE[s]}. </strong>
                                {whySide(a, sideOf(c.preliminary[a]))}
                              </>
                            )}
                          </span>
                        )}
                      </td>
                      {(["dr", "cr"] as const).map((x) => (
                        <td
                          key={x}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={onDrop(x)}
                          className={cn("px-2 py-1 text-center align-middle", x === "dr" ? "border-s-2 border-fg/60" : "border-s border-line")}
                        >
                          {s === x && a === c.unknown ? (
                            <span className="inline-flex items-center gap-1">
                              <input
                                dir="ltr"
                                inputMode="decimal"
                                disabled={done}
                                value={done ? Math.abs(c.preliminary[a]).toLocaleString("en-US") : missing}
                                onChange={(e) => {
                                  setMissing(typedAmount(e));
                                  setWrong((w) => {
                                    const n = new Set(w);
                                    n.delete(a);
                                    return n;
                                  });
                                }}
                                placeholder="?"
                                aria-label={`הסכום החסר של ${a}`}
                                className={cn(inputClass, "num h-8 w-28 px-2 text-center text-[13.5px] font-semibold", wrong.has(a) && "border-danger")}
                              />
                              {!done && (
                                <button
                                  type="button"
                                  onClick={() => unplace(a)}
                                  aria-label={`להחזיר את ${a}`}
                                  className="grid h-7 w-7 place-items-center rounded-md text-subtle hover:bg-surface-2 hover:text-fg"
                                >
                                  <Shuffle className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              )}
                            </span>
                          ) : s === x ? (
                            <button
                              type="button"
                              draggable={!done}
                              onDragStart={(e) => e.dataTransfer.setData("text/plain", a)}
                              disabled={done}
                              onClick={() => (wrong.has(a) ? place(a, x === "dr" ? "cr" : "dr") : unplace(a))}
                              title={wrong.has(a) ? `להעביר ל${SIDE[x === "dr" ? "cr" : "dr"]}` : "להחזיר"}
                              className={cn(
                                "num inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold disabled:cursor-default",
                                wrong.has(a) ? "bg-danger/15 text-danger" : x === "dr" ? "text-debit" : "text-credit",
                                !done && "cursor-grab hover:bg-surface-2",
                              )}
                            >
                              <Money v={Math.abs(c.preliminary[a])} plain />
                              {wrong.has(a) && !done && <Shuffle className="h-3 w-3" aria-hidden />}
                            </button>
                          ) : (
                            !s &&
                            !done && (
                              <button
                                type="button"
                                onClick={() => place(a, x)}
                                aria-label={`${a} ל${SIDE[x]}`}
                                className={cn(
                                  "h-8 w-full rounded-md border border-dashed text-[12px] font-semibold opacity-60 transition hover:opacity-100",
                                  picked === a && "opacity-100",
                                  x === "dr" ? "border-debit/40 text-debit hover:bg-debit/10" : "border-credit/40 text-credit hover:bg-credit/10",
                                )}
                              >
                                {SIDE[x]}
                              </button>
                            )
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={cn("border-t-2 border-fg/60 font-bold", pool.length === 0 && total("dr") === total("cr") ? "text-success" : "text-fg")}>
                  <td className="px-4 py-2">סה״כ</td>
                  <td className="num border-s-2 border-fg/60 px-3 py-2 text-center">
                    <Money v={total("dr")} plain />
                  </td>
                  <td className="num border-s border-line px-3 py-2 text-center">
                    <Money v={total("cr")} plain />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!done ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={check} disabled={pool.length > 0 || (!!c.unknown && !missing.trim())}>
                <Scale className="h-4 w-4" aria-hidden /> בדיקה
              </Button>
              {pool.length > 0 ? (
                <span className="text-[13px] text-muted">כדי לבדוק, ממיינים את כל הכרטיסים.</span>
              ) : (
                c.unknown && !missing.trim() && <span className="text-[13px] text-muted">נשאר למלא את הסכום של ״{c.unknown}״.</span>
              )}
              {wrong.size > 0 && (
                <span className="text-[13.5px] font-semibold text-danger">
                  {wrong.size} {wrong.size === 1 ? "כרטיס בצד הלא נכון" : "כרטיסים בצד הלא נכון"} — קראו למה, ותקנו.
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border-2 border-success/50 bg-success/[0.07] p-4">
              <p className="flex items-center gap-2 text-[16px] font-bold text-success">
                <CircleCheck className="h-5 w-5" aria-hidden /> המאזן הראשוני מאוזן: חובה <Money v={total("dr")} plain /> = זכות <Money v={total("cr")} plain />
              </p>
              {start && (
                <p className="num flex flex-wrap items-center gap-2 text-[15px] text-fg">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1 font-bold text-accent">
                    {rating(elapsed / 1000, mistakes, accounts.length).icon} {rating(elapsed / 1000, mistakes, accounts.length).label}
                  </span>
                  זמן: <strong>{clock(elapsed)}</strong> · טעויות: <strong>{mistakes}</strong>
                  {record === elapsed && <span className="font-bold text-[#b77800]">— שיא חדש!</span>}
                </p>
              )}
              {!start && mistakes > 0 && <p className="text-[14.5px] text-fg">טעויות בדרך: {mistakes}. בפעם הבאה — נסו עם מדידת זמן.</p>}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onDone({ ms: start ? elapsed : undefined, mistakes })}>
                  לשלב הבא: פקודות ההתאמה <ArrowLeft className="h-4 w-4" aria-hidden />
                </Button>
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> שוב, מהר יותר
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage 2: each adjustment — the entry, then its amounts in the adjustments column, and the column balanced.

function AdjustStage({ c, onDone }: { c: WorksheetCase; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [results, setResults] = useState<Record<number, ExResult>>({});
  const [cells, setCells] = useState<Record<string, { dr: string; cr: string }>>({});
  const [wrong, setWrong] = useState<Set<string>>();
  const [placedOk, setPlacedOk] = useState(false);
  const item = c.items[i];
  const result = results[i];
  const entryDone = !!result?.done;
  // The rows: the trial balance's, and every account the entries so far opened.
  const rows = worksheetRows(c, entryDone ? i + 1 : i);
  const expected = new Map(worksheetRows(c, i + 1).map((r) => [r.account, r]));
  const current = new Set(item.entry.lines.map((l) => l.account));
  const val = (a: string, s: Side) => parse(cells[a]?.[s] ?? "");
  const dr = round2(rows.reduce((t, r) => t + val(r.account, "dr"), 0));
  const cr = round2(rows.reduce((t, r) => t + val(r.account, "cr"), 0));

  const ex: JournalExercise = { kind: "journal", id: `ws-${c.name}-${i}`, skill: item.title, entry: { ...item.entry, text: item.story }, accounts: item.accounts };
  const onCheck = (ok: boolean) =>
    setResults((r) => {
      const tries = (r[i]?.tries ?? 0) + 1;
      return { ...r, [i]: { tries, ok, done: ok || tries >= 2 } };
    });
  const set = (a: string, s: Side, v: string) => {
    setCells((x) => ({ ...x, [a]: { dr: x[a]?.dr ?? "", cr: x[a]?.cr ?? "", [s]: v } }));
    setWrong(undefined);
  };
  const checkPlace = () => {
    const bad = rows.filter((r) => {
      const e = expected.get(r.account);
      return Math.abs(val(r.account, "dr") - (e?.adjDr ?? 0)) > 0.005 || Math.abs(val(r.account, "cr") - (e?.adjCr ?? 0)) > 0.005;
    });
    setWrong(new Set(bad.map((r) => r.account)));
    setPlacedOk(bad.length === 0);
  };
  const next = () => {
    if (i + 1 >= c.items.length) return onDone();
    setI(i + 1);
    setPlacedOk(false);
    setWrong(undefined);
  };

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-1.5" aria-label="פקודות ההתאמה">
        {c.items.map((it, k) => (
          <li
            key={it.entry.id}
            className={cn(
              "num rounded-full px-3 py-1 text-[12.5px] font-semibold",
              k < i ? "bg-success/15 text-success" : k === i ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            {k + 1}. {it.title}
          </li>
        ))}
      </ol>

      <section className="space-y-2">
        <p className="text-[15px] font-bold text-fg">
          א. פקודת ההתאמה {i + 1} מתוך {c.items.length}
        </p>
        <JournalSimulator key={ex.id} ex={ex} result={result} onCheck={onCheck} />
      </section>

      {entryDone && (
        <section className="space-y-2">
          <p className="text-[15px] font-bold text-fg">ב. שבצו את הפקודה בעמודת ההתאמות</p>
          <p className="text-[14px] text-muted">
            הזינו את הסכומים בשורה של כל חשבון, בצד שלו. חשבון חדש כבר נפתח בשורה משלו. הסכומים בעמודה מצטברים — פקודות קודמות כבר בפנים.
          </p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[34rem] text-[13px]">
              <thead className="bg-surface-2/40">
                <tr>
                  <th rowSpan={2} className="px-3 py-1.5 text-start text-xs font-semibold text-fg">
                    חשבון
                  </th>
                  <th colSpan={2} className="border-s border-line/60 px-2 py-1.5 text-center text-xs font-semibold text-fg">
                    לפני התאמות
                  </th>
                  <th colSpan={2} className="border-s border-line/60 bg-accent-soft px-2 py-1.5 text-center text-xs font-semibold text-fg">
                    התאמות
                  </th>
                </tr>
                <tr>
                  {["b", "a"].flatMap((g) => [
                    <th key={`${g}d`} className="border-s border-line/60 px-2 py-1 text-end text-[11px] font-medium text-debit">
                      חובה
                    </th>,
                    <th key={`${g}c`} className="px-2 py-1 text-end text-[11px] font-medium text-credit">
                      זכות
                    </th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.account} className={cn("border-t border-line/60", current.has(r.account) && "bg-accent-soft/40", wrong?.has(r.account) && "bg-danger/[0.08]")}>
                    <td className="px-3 py-1 whitespace-nowrap text-fg">
                      {r.account}
                      {r.isNew && <span className="ms-1.5 rounded bg-accent px-1 text-[10px] font-bold text-accent-fg">חדש</span>}
                    </td>
                    <td className="border-s border-line/60 px-2 py-1 text-end">{r.before > 0 && <Money v={r.before} plain />}</td>
                    <td className="px-2 py-1 text-end">{r.before < 0 && <Money v={-r.before} plain />}</td>
                    {(["dr", "cr"] as const).map((s) => (
                      <td key={s} className={cn("px-1.5 py-1", s === "dr" && "border-s border-line/60")}>
                        <input
                          dir="ltr"
                          inputMode="decimal"
                          disabled={placedOk}
                          value={cells[r.account]?.[s] ?? ""}
                          onChange={(e) => set(r.account, s, typedAmount(e))}
                          aria-label={`${r.account} — התאמות ב${SIDE[s]}`}
                          className={cn(inputClass, "num h-8 w-24 px-2 text-end text-[13px]", s === "dr" ? "focus:border-debit" : "focus:border-credit")}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-semibold">
                <tr className="border-t-2 border-line-strong">
                  <td className="px-3 py-2 text-fg">סה״כ</td>
                  <td className="border-s border-line/60 px-2 py-2 text-end">
                    <Money v={round2(rows.reduce((t, r) => t + Math.max(r.before, 0), 0))} plain />
                  </td>
                  <td className="px-2 py-2 text-end">
                    <Money v={round2(rows.reduce((t, r) => t + Math.max(-r.before, 0), 0))} plain />
                  </td>
                  <td className={cn("border-s border-line/60 px-2 py-2 text-end", dr !== cr && "text-danger")}>
                    <Money v={dr} plain />
                  </td>
                  <td className={cn("px-2 py-2 text-end", dr !== cr && "text-danger")}>
                    <Money v={cr} plain />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!placedOk ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={checkPlace}>
                <Scale className="h-4 w-4" aria-hidden /> בדיקת השיבוץ והאיזון
              </Button>
              <span className={cn("num text-[13.5px] font-semibold", dr === cr ? "text-success" : "text-muted")}>
                עמודת ההתאמות: חובה <Money v={dr} plain /> {dr === cr ? "=" : "≠"} זכות <Money v={cr} plain />
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-success/[0.08] px-4 py-3">
              <p className="num flex items-center gap-1.5 font-bold text-success">
                <CircleCheck className="h-5 w-5" aria-hidden /> משובץ ומאוזן: חובה <Money v={dr} plain /> = זכות <Money v={cr} plain />
              </p>
              <Button onClick={next}>
                {i + 1 < c.items.length ? "לפקודה הבאה" : "לשלב הבא: מאזן בוחן סופי"} <ArrowLeft className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}
          {wrong && wrong.size > 0 && (
            <p className="flex items-start gap-1.5 rounded-lg bg-danger/[0.08] px-3 py-2 text-[13.5px] text-fg">
              <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
              <span>
                <strong className="text-danger">לא מדויק בשורות המסומנות. </strong>
                הפקודה הנוכחית: {item.entry.lines.map((l) => `${l.account} ב${l.dr ? "חובה" : "זכות"} ${(l.dr ?? l.cr)!.toLocaleString("en-US")}`).join(" · ")}. הסכום בעמודה הוא סך כל ההתאמות
                לחשבון עד עכשיו.
              </span>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage 3: the final trial balance, each account to profit or loss or the balance sheet, and the year's profit.

function ClassifyStage({ c, onDone }: { c: WorksheetCase; onDone: (profitTries: number) => void }) {
  const rows = worksheetRows(c);
  const result = worksheetResult(c);
  const [kind, setKind] = useState<Record<string, "bs" | "pl">>({});
  const [wrong, setWrong] = useState<Set<string>>();
  const [classified, setClassified] = useState(false);
  const [profit, setProfit] = useState("");
  const [tries, setTries] = useState(0);
  const [profitOk, setProfitOk] = useState<boolean>();
  const all = rows.every((r) => kind[r.account]);
  const sideCell = (v: number, s: Side) => (s === "dr" ? (v > 0 ? v : 0) : v < 0 ? -v : 0);
  const sum = (pick: (r: (typeof rows)[number]) => number) => round2(rows.reduce((t, r) => t + pick(r), 0));
  const plDr = sum((r) => (isBalanceSheet(r.account) ? 0 : sideCell(r.after, "dr")));
  const plCr = sum((r) => (isBalanceSheet(r.account) ? 0 : sideCell(r.after, "cr")));

  const check = () => {
    const bad = rows.filter((r) => (kind[r.account] === "bs") !== r.balanceSheet).map((r) => r.account);
    setWrong(new Set(bad));
    setClassified(bad.length === 0);
  };
  const checkProfit = () => {
    const ok = Math.abs(parse(profit) - result.profit) < 1;
    setTries((t) => t + 1);
    setProfitOk(ok);
  };
  const profitDone = profitOk || tries >= 2;
  const [retained, setRetained] = useState("");
  const [retainedTries, setRetainedTries] = useState(0);
  const [retainedOk, setRetainedOk] = useState<boolean>();
  const retainedDone = !c.askRetained || retainedOk || retainedTries >= 2;
  const checkRetained = () => {
    setRetainedTries((t) => t + 1);
    setRetainedOk(Math.abs(parse(retained) - Math.abs(result.closingRetained)) < 1);
  };

  return (
    <div className="space-y-4">
      <p className="text-[14.5px] text-fg">
        כל ההתאמות בפנים. <strong>מאזן הבוחן הסופי</strong>: לכל חשבון — היתרה שלפני ועוד ההתאמות. עכשיו סמנו לכל שורה: <strong>מאזני</strong> או <strong>תוצאתי</strong>.
      </p>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[44rem] text-[13px]">
          <thead className="bg-surface-2/40">
            <tr className="text-xs">
              <th className="px-3 py-2 text-start font-semibold text-fg">חשבון</th>
              <th className="border-s border-line/60 px-2 py-2 text-end font-medium text-debit">סופי · חובה</th>
              <th className="px-2 py-2 text-end font-medium text-credit">סופי · זכות</th>
              <th className="border-s border-line/60 bg-accent-soft px-2 py-2 text-center font-semibold text-fg">סיווג</th>
              {classified && (
                <>
                  <th className="border-s border-line/60 px-2 py-2 text-end font-medium text-debit">תוצאתי · ח׳</th>
                  <th className="px-2 py-2 text-end font-medium text-credit">תוצאתי · ז׳</th>
                  <th className="border-s border-line/60 px-2 py-2 text-end font-medium text-debit">מאזני · ח׳</th>
                  <th className="px-2 py-2 text-end font-medium text-credit">מאזני · ז׳</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account} className={cn("border-t border-line/60 align-top", wrong?.has(r.account) && "bg-danger/[0.07]")}>
                <td className="px-3 py-1.5 text-fg">
                  <span className="whitespace-nowrap">{r.account}</span>
                  {wrong?.has(r.account) && <span className="mt-0.5 block text-[12px] leading-snug text-danger">{whyKind(r.account)}</span>}
                </td>
                <td className="border-s border-line/60 px-2 py-1.5 text-end">{r.after > 0 && <Money v={r.after} plain />}</td>
                <td className="px-2 py-1.5 text-end">{r.after < 0 && <Money v={-r.after} plain />}</td>
                <td className="border-s border-line/60 px-2 py-1">
                  <div className="flex justify-center gap-1">
                    {(["bs", "pl"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        disabled={classified}
                        aria-pressed={kind[r.account] === k}
                        onClick={() => {
                          setKind((x) => ({ ...x, [r.account]: k }));
                          setWrong(undefined);
                        }}
                        className={cn(
                          "h-7 rounded-md px-2 text-[12px] font-bold ring-1 transition disabled:cursor-default",
                          kind[r.account] === k ? "bg-accent text-accent-fg ring-accent" : "bg-surface text-muted ring-line-strong hover:text-fg",
                        )}
                      >
                        {k === "bs" ? "מאזני" : "תוצאתי"}
                      </button>
                    ))}
                  </div>
                </td>
                {classified && (
                  <>
                    <td className="border-s border-line/60 px-2 py-1.5 text-end">{!r.balanceSheet && r.after > 0 && <Money v={r.after} plain />}</td>
                    <td className="px-2 py-1.5 text-end">{!r.balanceSheet && r.after < 0 && <Money v={-r.after} plain />}</td>
                    <td className="border-s border-line/60 px-2 py-1.5 text-end">{r.balanceSheet && r.after > 0 && <Money v={r.after} plain />}</td>
                    <td className="px-2 py-1.5 text-end">{r.balanceSheet && r.after < 0 && <Money v={-r.after} plain />}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          {classified && (
            <tfoot className="font-semibold">
              <tr className="border-t-2 border-line-strong">
                <td className="px-3 py-2 text-fg">סה״כ</td>
                <td className="border-s border-line/60 px-2 py-2 text-end">
                  <Money v={sum((r) => sideCell(r.after, "dr"))} plain />
                </td>
                <td className="px-2 py-2 text-end">
                  <Money v={sum((r) => sideCell(r.after, "cr"))} plain />
                </td>
                <td className="border-s border-line/60" />
                <td className="border-s border-line/60 px-2 py-2 text-end">
                  <Money v={plDr} plain />
                </td>
                <td className="px-2 py-2 text-end">
                  <Money v={plCr} plain />
                </td>
                <td className="border-s border-line/60 px-2 py-2 text-end text-danger">
                  <Money v={sum((r) => (r.balanceSheet ? sideCell(r.after, "dr") : 0))} plain />
                </td>
                <td className="px-2 py-2 text-end text-danger">
                  <Money v={sum((r) => (r.balanceSheet ? sideCell(r.after, "cr") : 0))} plain />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!classified ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={check} disabled={!all}>
            <Scale className="h-4 w-4" aria-hidden /> בדיקת הסיווג
          </Button>
          {!all && <span className="text-[13px] text-muted">כדי לבדוק, מסווגים את כל השורות.</span>}
          {wrong && wrong.size > 0 && <span className="text-[13.5px] font-semibold text-danger">{wrong.size} שורות בסיווג הלא נכון — ההסבר מתחת לכל אחת.</span>}
        </div>
      ) : (
        <section className="space-y-3 rounded-2xl border-2 border-accent/40 bg-accent-soft/40 p-4">
          <p className="text-[15px] font-bold text-fg">ג. מה רווח השנה?</p>
          <p className="text-[14px] text-muted">עמודות המאזני עוד לא מאוזנות — ההפרש הוא בדיוק הרווח, שעוד לא נכנס לעודפים. חשבו אותו מעמודות התוצאתי.</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              dir="ltr"
              inputMode="decimal"
              disabled={profitDone}
              value={profit}
              onChange={(e) => {
                setProfit(typedAmount(e));
                setProfitOk(undefined);
              }}
              onKeyDown={(e) => e.key === "Enter" && profit && checkProfit()}
              placeholder="רווח השנה"
              aria-label="רווח השנה"
              className={cn(inputClass, "num w-44 text-end")}
            />
            {!profitDone && (
              <Button onClick={checkProfit} disabled={!profit}>
                בדיקה
              </Button>
            )}
            {profitOk === false && !profitDone && <span className="text-[13.5px] font-semibold text-danger">לא מדויק — נותר עוד ניסיון. רמז: זכות תוצאתי פחות חובה תוצאתי.</span>}
          </div>
          {profitDone && (
            <div className={cn("space-y-2 rounded-xl px-4 py-3", profitOk ? "bg-success/[0.1]" : "bg-surface")}>
              <p className={cn("flex items-center gap-1.5 font-bold", profitOk ? "text-success" : "text-fg")}>
                {profitOk ? <CircleCheck className="h-5 w-5" aria-hidden /> : <CircleX className="h-5 w-5 text-danger" aria-hidden />}
                {profitOk ? "נכון!" : "זה החישוב:"} רווח השנה = <Money v={plCr} /> − <Money v={plDr} /> = <Money v={result.profit} />
              </p>
              {c.askRetained && !retainedDone && (
                <div className="space-y-2 border-t border-line pt-2">
                  <p className="font-bold text-fg">ד. ומה יתרת הסגירה של העודפים?</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      dir="ltr"
                      inputMode="decimal"
                      value={retained}
                      onChange={(e) => {
                        setRetained(typedAmount(e));
                        setRetainedOk(undefined);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && retained && checkRetained()}
                      placeholder="עודפי סגירה"
                      aria-label="עודפי הסגירה"
                      className={cn(inputClass, "num w-44 text-end")}
                    />
                    <Button onClick={checkRetained} disabled={!retained}>
                      בדיקה
                    </Button>
                    {retainedOk === false && <span className="text-[13.5px] font-semibold text-danger">לא מדויק — נותר עוד ניסיון. רמז: עודפי הפתיחה (מהמאזן הראשוני) ועוד הרווח.</span>}
                  </div>
                </div>
              )}
              {retainedDone && (
                <>
                  <p className={cn("text-[14.5px] text-fg", c.askRetained && "border-t border-line pt-2")}>
                    {c.askRetained && (
                      <strong className={retainedOk ? "text-success" : "text-fg"}>{retainedOk ? "נכון! " : "זה החישוב: "}</strong>
                    )}
                    עודפים: פתיחה <Money v={Math.abs(result.openingRetained)} /> {result.openingRetained < 0 ? "בחובה (הפסדים צבורים)" : "בזכות"} + רווח <Money v={result.profit} /> = סגירה{" "}
                    <Money v={Math.abs(result.closingRetained)} /> {result.closingRetained < 0 ? "בחובה" : "בזכות"}. עם יתרת הסגירה הזו — עמודות המאזני מתאזנות.
                  </p>
                  <Button onClick={() => onDone(tries)}>
                    לסיכום <ArrowLeft className="h-4 w-4" aria-hidden />
                  </Button>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const STAGES = ["מיון המאזן הראשוני", "פקודות התאמה ושיבוץ", "סיווג ורווח השנה"];

/**
 * The worksheet as a game, on a question of its own: sort the trial balance's
 * cards into debit and credit (against the clock, if you like), write each
 * adjustment and place it in the adjustments column — balanced every time —
 * then sort the final balances into profit or loss and the balance sheet, and
 * find the year's profit.
 */
export function WorksheetGame({ c }: { c: WorksheetCase }) {
  const [stage, setStage] = useState(0);
  const [sort, setSort] = useState<SortStats>();
  const [round, setRound] = useState(0);
  const result = worksheetResult(c);

  return (
    <div key={round} className="card space-y-4 p-4">
      <ol className="flex flex-wrap items-center gap-2" aria-label="שלבי המשחק">
        {STAGES.map((s, k) => (
          <li
            key={s}
            className={cn(
              "num flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold",
              k < stage ? "bg-success/15 text-success" : k === stage ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            {k < stage ? <CircleCheck className="h-4 w-4" aria-hidden /> : <span>{k + 1}</span>}
            {s}
          </li>
        ))}
      </ol>
      {stage === 0 && (
        <SortStage
          c={c}
          onDone={(s) => {
            setSort(s);
            setStage(1);
          }}
        />
      )}
      {stage === 1 && <AdjustStage c={c} onDone={() => setStage(2)} />}
      {stage === 2 && <ClassifyStage c={c} onDone={() => setStage(3)} />}
      {stage === 3 && (
        <div className="space-y-3 rounded-2xl border-2 border-success/50 bg-success/[0.07] p-5 text-center">
          <Trophy className="mx-auto h-10 w-10 text-[#eda100]" aria-hidden />
          <p className="text-[20px] font-extrabold text-fg">פתרתם את כל הגיליון של {c.name}!</p>
          <p className="text-[15px] text-fg">
            מאזן ראשוני ← {c.items.length} פקודות התאמה, כל אחת משובצת ומאוזנת ← מאזן בוחן סופי ← תוצאתי ומאזני ← רווח השנה <Money v={result.profit} />.
          </p>
          {sort?.ms !== undefined && (
            <p className="num text-[14.5px] text-muted">
              מיון המאזן: {clock(sort.ms)} · {sort.mistakes} טעויות
            </p>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setStage(0);
              setSort(undefined);
              setRound((r) => r + 1);
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> לשחק שוב
          </Button>
        </div>
      )}
    </div>
  );
}
