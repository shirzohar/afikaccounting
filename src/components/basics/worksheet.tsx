import { round2 } from "@/lib/learn/basics";
import { type WorksheetCase, worksheetResult, worksheetRows } from "@/lib/learn/worksheet";
import { cn } from "@/lib/utils";
import { JE, Money, type Step, Stepper } from "./ui";

const side = (v: number) => ({ dr: v > 0 ? v : 0, cr: v < 0 ? -v : 0 });

/** How far the sheet has come: how many adjustments are in, and which columns are open. */
type Stage = { upTo: number; adjustments: boolean; final: boolean; split: boolean; closed: boolean; hl?: string };

/**
 * The sheet at one stage: the trial balance before the adjustments, the
 * adjustments so far (the last one's accounts lit), the final trial balance,
 * then the profit-or-loss and balance-sheet columns — each group added to the
 * left of the last.
 */
function Sheet({ c, stage }: { c: WorksheetCase; stage: Stage }) {
  const rows = worksheetRows(c, stage.upTo);
  const lit = new Set(c.items.find((it) => it.entry.id === stage.hl)?.entry.lines.map((l) => l.account) ?? []);
  const result = worksheetResult(c);
  const sum = (pick: (r: (typeof rows)[number]) => number) => round2(rows.reduce((s, r) => s + pick(r), 0));
  const retainedShown = (r: (typeof rows)[number]) => (r.account === "עודפים" && stage.closed ? -result.closingRetained : r.after);
  const pl = (r: (typeof rows)[number]) => (r.balanceSheet ? { dr: 0, cr: 0 } : side(r.after));
  const bs = (r: (typeof rows)[number]) => (r.balanceSheet ? side(retainedShown(r)) : { dr: 0, cr: 0 });

  const cell = (v: number, hl?: boolean, key?: string) => (
    <td key={key} className="px-2 py-1.5 text-end">
      {v ? <Money v={v} plain className={cn(hl && "font-bold text-accent")} /> : null}
    </td>
  );
  const pair = (p: { dr: number; cr: number }, key: string, hl?: boolean) => [
    <td key={`${key}d`} className="border-s border-line/60 px-2 py-1.5 text-end">
      {p.dr ? <Money v={p.dr} plain className={cn(hl && "font-bold text-accent")} /> : null}
    </td>,
    cell(p.cr, hl, `${key}c`),
  ];
  const head = (title: string, key: string, now?: boolean) => (
    <th key={key} colSpan={2} className={cn("border-s border-line/60 px-2 py-1.5 text-center text-xs font-semibold text-fg", now && "bg-accent-soft")}>
      {title}
    </th>
  );
  const sub = (key: string) => [
    <th key={`${key}d`} className="border-s border-line/60 px-2 py-1 text-end text-[11px] font-medium text-debit">
      חובה
    </th>,
    <th key={`${key}c`} className="px-2 py-1 text-end text-[11px] font-medium text-credit">
      זכות
    </th>,
  ];
  const total = (dr: number, cr: number, key: string, warn?: boolean) => [
    <td key={`${key}d`} className={cn("border-s border-line/60 px-2 py-2 text-end", warn && "text-danger")}>
      <Money v={dr} plain />
    </td>,
    <td key={`${key}c`} className={cn("px-2 py-2 text-end", warn && "text-danger")}>
      <Money v={cr} plain />
    </td>,
  ];
  const bsDr = sum((r) => bs(r).dr);
  const bsCr = sum((r) => bs(r).cr);
  const now = stage.split ? "split" : stage.final ? "final" : stage.adjustments ? "adj" : "before";

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[40rem] text-[13px]">
        <thead className="bg-surface-2/40">
          <tr>
            <th rowSpan={2} className="px-3 py-1.5 text-start text-xs font-semibold text-fg">
              חשבון
            </th>
            {head("לפני התאמות", "h1", now === "before")}
            {stage.adjustments && head("התאמות", "h2", now === "adj")}
            {stage.final && head("מאזן בוחן סופי", "h3", now === "final")}
            {stage.split && head("תוצאתי", "h4", true)}
            {stage.split && head("מאזני", "h5", true)}
          </tr>
          <tr>
            {sub("s1")}
            {stage.adjustments && sub("s2")}
            {stage.final && sub("s3")}
            {stage.split && sub("s4")}
            {stage.split && sub("s5")}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.account} className={cn("border-t border-line/60", lit.has(r.account) && "bg-accent-soft/60", r.account === "עודפים" && stage.closed && "bg-success/[0.07]")}>
              <td className="px-3 py-1.5 whitespace-nowrap text-fg">
                {r.account}
                {r.isNew && <span className="ms-1.5 rounded bg-accent px-1 text-[10px] font-bold text-accent-fg">חדש</span>}
              </td>
              {r.isNew ? [<td key="b1" className="border-s border-line/60" />, <td key="b2" />] : pair(side(r.before), "b")}
              {stage.adjustments && pair({ dr: r.adjDr, cr: r.adjCr }, "a", lit.has(r.account))}
              {stage.final && pair(side(r.after), "f", now === "final")}
              {stage.split && pair(pl(r), "l")}
              {stage.split && pair(bs(r), "s", r.account === "עודפים" && stage.closed)}
            </tr>
          ))}
        </tbody>
        <tfoot className="font-semibold">
          <tr className="border-t-2 border-line-strong">
            <td className="px-3 py-2 text-fg">סה״כ</td>
            {total(sum((r) => side(r.before).dr), sum((r) => side(r.before).cr), "t1")}
            {stage.adjustments && total(sum((r) => r.adjDr), sum((r) => r.adjCr), "t2")}
            {stage.final && total(sum((r) => side(r.after).dr), sum((r) => side(r.after).cr), "t3")}
            {stage.split && total(sum((r) => pl(r).dr), sum((r) => pl(r).cr), "t4")}
            {stage.split && total(bsDr, bsCr, "t5", !stage.closed)}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** A company's worksheet, one stage at a time: the trial balance, each adjustment in its turn, the final balances, the split, and the profit. */
export function WorksheetWalk({ c }: { c: WorksheetCase }) {
  const n = c.items.length;
  const result = worksheetResult(c);
  const plIncome = result.totalIncome;
  const plExpense = result.totalExpenses;
  const steps: Step[] = [
    {
      title: "1. מעתיקים את מאזן הבוחן לפני ההתאמות",
      body: (
        <>
          <p>העמודה הראשונה היא נקודת הפתיחה: כל יתרה בצד שלה, כמו בשאלה. סך החובה = סך הזכות.</p>
          <Sheet c={c} stage={{ upTo: 0, adjustments: false, final: false, split: false, closed: false }} />
        </>
      ),
    },
    ...c.items.map((it, i) => ({
      title: `${i + 2}. פקודת התאמה ${it.entry.id} — ${it.title}`,
      body: (
        <>
          <p className="text-[14.5px] text-muted">{it.story}</p>
          <JE entry={it.entry} title={`${it.entry.id}. ${it.entry.text}`} />
          <p className="text-[14.5px]">
            את הפקודה רושמים בעמודת ההתאמות, בשורה של כל חשבון ובצד שלו. חשבון שלא היה במאזן הבוחן נפתח בשורה חדשה. אחרי כל פקודה — עמודת ההתאמות מאוזנת.
          </p>
          <Sheet c={c} stage={{ upTo: i + 1, adjustments: true, final: false, split: false, closed: false, hl: it.entry.id }} />
        </>
      ),
    })),
    {
      title: `${n + 2}. מאזן בוחן סופי`,
      body: (
        <>
          <p>לכל חשבון: היתרה שלפני ההתאמות, ועוד ההתאמות — בצד הנכון. חובה וחובה מתחברים; חובה מול זכות — מחסירים, והיתרה בצד הגדול.</p>
          <Sheet c={c} stage={{ upTo: n, adjustments: true, final: true, split: false, closed: false }} />
        </>
      ),
    },
    {
      title: `${n + 3}. פיצול: תוצאתי או מאזני`,
      body: (
        <>
          <p>
            כל יתרה סופית עוברת לאחת משתי קבוצות עמודות, באותו צד. <strong>תוצאתי</strong> — הכנסות והוצאות (גם מלאי פתיחה ומלאי הסגירה של רווח והפסד). <strong>מאזני</strong> — נכסים,
            התחייבויות והון.
          </p>
          <Sheet c={c} stage={{ upTo: n, adjustments: true, final: true, split: true, closed: false }} />
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[14.5px] text-fg">
            עמודות המאזני עוד לא מאוזנות: ההפרש הוא בדיוק רווח השנה, שעוד לא נכנס לעודפים.
          </p>
        </>
      ),
    },
    {
      title: `${n + 4}. רווח השנה, ועודפי הסגירה`,
      body: (
        <>
          <Sheet c={c} stage={{ upTo: n, adjustments: true, final: true, split: true, closed: true }} />
          <div className="grid gap-2 text-[14.5px] sm:grid-cols-2">
            <p className="rounded-lg bg-surface-2/70 px-3 py-2">
              רווח השנה = זכות תוצאתי <Money v={plIncome} /> − חובה תוצאתי <Money v={plExpense} /> = <strong className="text-success">{<Money v={result.profit} />}</strong>
            </p>
            <p className="rounded-lg bg-success/[0.08] px-3 py-2 text-fg">
              עודפים: פתיחה <Money v={Math.abs(result.openingRetained)} /> {result.openingRetained < 0 ? "(חובה)" : "(זכות)"} + רווח <Money v={result.profit} /> = סגירה{" "}
              <Money v={Math.abs(result.closingRetained)} /> {result.closingRetained < 0 ? "(חובה)" : "(זכות)"}. עכשיו עמודות המאזני מאוזנות.
            </p>
          </div>
        </>
      ),
    },
  ];
  return <Stepper label={`הגיליון הרב-טורי של ${c.name} · ${c.date}`} steps={steps} />;
}

