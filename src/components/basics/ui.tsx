import type { ReactNode } from "react";
import { JournalEntry } from "@/components/study/blocks";
import { type Entry, isBalanced, isBalanceSheet, normalSide, round2, type Statements, type TAccount, type TrialBalance, typeOf, TYPE_LABEL } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

/** An amount in he-IL format; negatives in parentheses, as accountants write them. */
export const fmt = (v: number) => (v < 0 ? `(${nf.format(-v)})` : nf.format(v));

/** A shekel amount that stays left to right inside Hebrew text. */
export function Money({ v, plain, className }: { v: number; plain?: boolean; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("num whitespace-nowrap", className)}>
      {fmt(v)}
      {!plain && " ₪"}
    </bdi>
  );
}

/** A term on its first appearance, in bold. */
export function Term({ he }: { he: string }) {
  return <strong className="font-semibold text-fg">{he}</strong>;
}

export { type Step, Stepper } from "./stepper";

/** One chapter of a guide page. */
export function Chapter({ n, id, title, lead, children }: { n: number; id: string; title: string; lead: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 lg:scroll-mt-24" data-chapter={id}>
      <div className="flex items-start gap-4">
        <span className="num grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]">
          {n}
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-fg">
            {title}
          </h2>
          <p className="mt-1 text-[15px] text-muted">{lead}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-fg/90 [&>p]:max-w-3xl">{children}</div>
    </section>
  );
}

/** A highlighted statement that stands on its own: the one sentence to remember. */
export function KeyCard({ icon, children, className }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border-2 border-accent bg-surface px-4 py-4 shadow-[0_10px_30px_-18px_var(--accent)] sm:px-5", className)}>
      {icon && <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg">{icon}</span>}
      <p className="min-w-0 text-[17px] font-bold leading-snug text-fg">{children}</p>
    </div>
  );
}

/** "ח׳" or "ז׳" as a coloured tag, the same everywhere on the page. */
export function SideChip({ side, className }: { side: "dr" | "cr"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid h-6 min-w-6 shrink-0 place-items-center rounded-md px-1 text-[12px] font-bold text-surface",
        side === "dr" ? "bg-debit" : "bg-credit",
        className,
      )}
    >
      {side === "dr" ? "ח׳" : "ז׳"}
    </span>
  );
}

/**
 * A journal entry: one row per line, debits first and credits indented under
 * them, each in its side's colour; at most one line of explanation. With `hl`,
 * the lines of other accounts fade, to point at part of a compound entry.
 */
export function JE({ entry, title, note, hl, className }: { entry: Entry; title?: ReactNode; note?: ReactNode | null; hl?: string[]; className?: string }) {
  if (!isBalanced(entry)) throw new Error(`Unbalanced entry ${entry.id}`);
  const text = note === null ? null : (note ?? entry.why);
  const total = entry.lines.reduce((s, l) => s + (l.dr ?? 0), 0);
  const lines = [...entry.lines.filter((l) => l.dr), ...entry.lines.filter((l) => l.cr)];
  return (
    <figure className={cn("min-w-0 overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <figcaption className="flex items-start gap-2 border-b border-line bg-surface-2/60 px-3 py-2">
        <span className="num mt-px grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-fg px-1.5 text-[11px] font-bold text-surface">{entry.id}</span>
        <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-fg">{title ?? entry.text}</span>
        {entry.date && <span className="num shrink-0 pt-0.5 text-[11px] text-muted">{entry.date}</span>}
      </figcaption>
      <ul className="space-y-1 p-2">
        {lines.map((l, k) => {
          const side = l.dr ? "dr" : "cr";
          return (
            <li
              key={k}
              className={cn(
                "flex items-center gap-2 rounded-lg border-s-[3px] px-2 py-1.5 text-[14.5px] transition-opacity",
                side === "dr" ? "border-debit bg-debit/[0.07]" : "ms-5 border-credit bg-credit/[0.07] sm:ms-8",
                hl && !hl.includes(l.account) && "opacity-40",
              )}
            >
              <SideChip side={side} />
              <span className="min-w-0 flex-1 font-medium text-fg">{l.account}</span>
              <Money v={(l.dr ?? l.cr)!} plain className={cn("font-semibold", side === "dr" ? "text-debit" : "text-credit")} />
            </li>
          );
        })}
      </ul>
      <p className="flex items-center gap-1.5 px-3 pb-2 text-[11px] text-subtle">
        <span className="text-success">✓</span> סך החובה = סך הזכות = <Money v={total} plain />
      </p>
      {text && <p className="border-t border-line px-3 py-2 text-[13.5px] leading-snug text-muted">{text}</p>}
    </figure>
  );
}

/** One sum written out: the parts and the result, as a single block. */
export function Calc({ children, result, className }: { children: ReactNode; result?: ReactNode; className?: string }) {
  return (
    <p className={cn("rounded-xl bg-surface-2/80 px-3.5 py-2.5 text-[15px] text-fg ring-1 ring-line", className)}>
      <span className="me-1.5 text-xs font-bold text-accent">חישוב</span>
      {children}
      {result !== undefined && (
        <>
          {" "}
          = <strong className="font-bold text-fg">{result}</strong>
        </>
      )}
    </p>
  );
}

/** A plain content card. */
export function Card({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("card min-w-0 p-5", className)}>
      {title && <p className="mb-2 text-[16px] font-semibold text-fg">{title}</p>}
      <div className="space-y-3 text-[15px] leading-relaxed text-fg/90">{children}</div>
    </div>
  );
}

/** Whether an account lands in the balance sheet (carried forward) or in profit or loss (reset each year). */
export function ReportTag({ account }: { account: string }) {
  const sheet = isBalanceSheet(account);
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2 py-px text-[10.5px] font-semibold ring-1",
        sheet ? "bg-accent-soft text-accent ring-accent/30" : "bg-surface-2 text-fg/80 ring-line-strong",
      )}
    >
      {sheet ? "מאזני" : "תוצאתי"}
    </span>
  );
}

/** A journal entry from the model, through the shared journal-entry view, with what it does to each report. */
export function EntryView({ entry, title, note, effect = true }: { entry: Entry; title?: string; note?: ReactNode; effect?: boolean }) {
  if (!isBalanced(entry)) throw new Error(`Unbalanced entry ${entry.id}`);
  const text = note === null ? null : (note ?? entry.why);
  return (
    <JournalEntry
      title={title ?? entry.text}
      date={entry.date || undefined}
      lines={entry.lines.map((l) => ({ account: l.account, dr: l.dr, cr: l.cr, tag: <ReportTag account={l.account} /> }))}
      note={
        effect || text ? (
          <div className="space-y-2.5">
            {effect && <EntryEffect entry={entry} />}
            {text && <div>{text}</div>}
          </div>
        ) : undefined
      }
    />
  );
}

type Effect = { account: string; amount: number; up: boolean };

/** Each account's net movement in an entry, as a rise or fall of its own balance. */
function effectsOf(entry: Entry): Effect[] {
  const net = new Map<string, number>();
  for (const l of entry.lines) net.set(l.account, round2((net.get(l.account) ?? 0) + (l.dr ?? 0) - (l.cr ?? 0)));
  return [...net]
    .filter(([, v]) => Math.abs(v) > 0.005)
    .map(([account, v]) => ({ account, amount: Math.abs(v), up: normalSide(account) === "dr" ? v > 0 : v < 0 }));
}

/** The entry split by report: what moved in the balance sheet, and what moved in profit or loss. */
export function EntryEffect({ entry }: { entry: Entry }) {
  const all = effectsOf(entry);
  const sheet = all.filter((x) => isBalanceSheet(x.account));
  const pl = all.filter((x) => !isBalanceSheet(x.account));
  const group = (label: string, items: Effect[], empty: string, tone: string) => (
    <div className="min-w-0 rounded-lg border border-line bg-surface p-2">
      <p className={cn("mb-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold", tone)}>{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-subtle">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((x) => (
            <li key={x.account} className="flex items-center justify-between gap-2 text-[13px] text-fg">
              <span className="min-w-0">
                {x.account} <span className="text-[11px] text-subtle">· {TYPE_LABEL[typeOf(x.account)]}</span>
              </span>
              <span className={cn("shrink-0 font-semibold", x.up ? "text-success" : "text-danger")}>
                {x.up ? "▲" : "▼"} <Money v={x.amount} plain />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <div className="grid gap-2 sm:grid-cols-2" aria-label="השפעת הפקודה על הדוחות">
      {group("השפעה על המאזן", sheet, "אין שינוי במאזן", "bg-accent text-accent-fg")}
      {group("השפעה על רווח והפסד", pl, "אין שינוי ברווח והפסד", "bg-fg text-surface")}
    </div>
  );
}

/** A T-account: debits on the right, credits on the left, as in the course (right-to-left). */
export function TCard({ t, highlight }: { t: TAccount; highlight?: string }) {
  const rows = Math.max(t.dr.length, t.cr.length);
  const drTotal = t.opening > 0 ? t.opening : 0;
  const crTotal = t.opening < 0 ? -t.opening : 0;
  return (
    <figure className="min-w-0 rounded-xl border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-2 border-b-2 border-fg/70 px-3 py-2 text-sm font-semibold text-fg">
        <span>{t.account}</span>
        <span className="text-[11px] font-normal text-subtle">{TYPE_LABEL[typeOf(t.account)]}</span>
      </figcaption>
      <div className="grid grid-cols-2 text-[13px]">
        <div className="border-e-2 border-fg/70">
          <p className="px-2 pt-1 text-[11px] font-semibold text-debit">חובה</p>
          {t.opening > 0 && <Cell label="י.פ" v={drTotal} />}
          {Array.from({ length: rows }, (_, i) => (t.dr[i] ? <Cell key={i} label={t.dr[i].ref} v={t.dr[i].amount} on={t.dr[i].ref === highlight} /> : <Empty key={i} />))}
        </div>
        <div>
          <p className="px-2 pt-1 text-[11px] font-semibold text-credit">זכות</p>
          {t.opening < 0 && <Cell label="י.פ" v={crTotal} />}
          {Array.from({ length: rows }, (_, i) => (t.cr[i] ? <Cell key={i} label={t.cr[i].ref} v={t.cr[i].amount} on={t.cr[i].ref === highlight} /> : <Empty key={i} />))}
        </div>
      </div>
      <p
        className={cn(
          "flex items-center justify-between border-t border-line px-3 py-1.5 text-[13px] font-semibold",
          t.balance > 0 ? "text-debit" : t.balance < 0 ? "text-credit" : "text-muted",
        )}
      >
        <span>יתרת סגירה</span>
        <span>
          {t.balance === 0 ? "0" : <Money v={Math.abs(t.balance)} plain />} {t.balance > 0 ? "חובה" : t.balance < 0 ? "זכות" : ""}
        </span>
      </p>
    </figure>
  );
}

function Cell({ label, v, on }: { label: string; v: number; on?: boolean }) {
  return (
    <p className={cn("flex items-center justify-between gap-2 px-2 py-0.5", on && "rounded bg-accent-soft font-semibold text-fg")}>
      <span className="text-[11px] text-subtle">{label}</span>
      <Money v={v} plain />
    </p>
  );
}
const Empty = () => <p className="px-2 py-0.5">&nbsp;</p>;

/** A trial balance: every balance on its side, and the two totals. */
export function TBTable({ tb, caption, kind, changed }: { tb: TrialBalance; caption?: ReactNode; kind?: boolean; changed?: Set<string> }) {
  const balanced = Math.abs(tb.dr - tb.cr) < 0.005;
  return (
    <Scroller caption={caption}>
      <table className="w-full min-w-[26rem] text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="px-4 py-2 text-start font-medium">חשבון</th>
            {kind && <th className="px-4 py-2 text-start font-medium">סוג</th>}
            <th className="px-4 py-2 text-end font-medium text-debit">חובה</th>
            <th className="px-4 py-2 text-end font-medium text-credit">זכות</th>
          </tr>
        </thead>
        <tbody>
          {tb.rows.map((r) => (
            <tr key={r.account} className={cn("border-t border-line/70", changed?.has(r.account) && "bg-accent-soft/70 font-semibold")}>
              <td className="px-4 py-2 text-fg">{r.account}</td>
              {kind && (
                <td className="px-4 py-2 text-xs text-muted">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {TYPE_LABEL[typeOf(r.account)]} <ReportTag account={r.account} />
                  </span>
                </td>
              )}
              <td className="px-4 py-2 text-end">{r.dr ? <Money v={r.dr} plain /> : ""}</td>
              <td className="px-4 py-2 text-end">{r.cr ? <Money v={r.cr} plain /> : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line-strong font-semibold">
            <td className="px-4 py-2 text-fg">
              סה״כ <span className={cn("ms-1 text-xs font-medium", balanced ? "text-success" : "text-danger")}>{balanced ? "✓ חובה = זכות" : "✗ לא מאוזן"}</span>
            </td>
            {kind && <td />}
            <td className="px-4 py-2 text-end text-debit">
              <Money v={tb.dr} plain />
            </td>
            <td className="px-4 py-2 text-end text-credit">
              <Money v={tb.cr} plain />
            </td>
          </tr>
        </tfoot>
      </table>
    </Scroller>
  );
}

/** A wide table's frame: it scrolls inside itself, never the page. */
export function Scroller({ caption, children }: { caption?: ReactNode; children: ReactNode }) {
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line bg-surface">
      {caption && <p className="border-b border-line bg-surface-2/70 px-4 py-2.5 text-sm font-semibold text-fg">{caption}</p>}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** Profit or loss beside the balance sheet. */
export function StatementsView({ s, year }: { s: Statements; year: string }) {
  const block = (title: string, rows: [string, number][], total: string, value: number) => (
    <>
      <tr className="bg-surface-2/60">
        <td colSpan={2} className="px-4 py-1.5 text-xs font-semibold text-muted">
          {title}
        </td>
      </tr>
      {rows.map(([a, v]) => (
        <tr key={a} className="border-t border-line/60">
          <td className="px-4 py-1.5 ps-6 text-fg">{a}</td>
          <td className="px-4 py-1.5 text-end">
            <Money v={v} plain />
          </td>
        </tr>
      ))}
      <tr className="border-t border-line font-semibold">
        <td className="px-4 py-1.5 text-fg">{total}</td>
        <td className="px-4 py-1.5 text-end">
          <Money v={value} plain />
        </td>
      </tr>
    </>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Scroller caption={`דוח רווח או הפסד לשנת ${year}`}>
        <table className="w-full min-w-[18rem] text-sm">
          <tbody>
            {block("הכנסות", s.income, "סך ההכנסות", s.totalIncome)}
            {block("הוצאות", s.expenses, "סך ההוצאות", s.totalExpenses)}
            <tr className="border-t-2 border-line-strong font-semibold">
              <td className={cn("px-4 py-2", s.profit >= 0 ? "text-success" : "text-danger")}>{s.profit >= 0 ? "רווח השנה" : "הפסד השנה"}</td>
              <td className={cn("px-4 py-2 text-end", s.profit >= 0 ? "text-success" : "text-danger")}>
                <Money v={s.profit} />
              </td>
            </tr>
          </tbody>
        </table>
      </Scroller>
      <Scroller caption={`מאזן ליום 31.12.${year}`}>
        <table className="w-full min-w-[18rem] text-sm">
          <tbody>
            {block("נכסים", s.assets, "סך הנכסים", s.totalAssets)}
            {block("התחייבויות", s.liabilities, "סך ההתחייבויות", s.totalLiabilities)}
            {block("הון", s.equity, "סך ההון", s.totalEquity)}
            <tr className="border-t-2 border-line-strong font-semibold">
              <td className="px-4 py-2 text-fg">התחייבויות והון</td>
              <td className="px-4 py-2 text-end">
                <Money v={s.totalLiabilities + s.totalEquity} />
              </td>
            </tr>
          </tbody>
        </table>
      </Scroller>
    </div>
  );
}

/**
 * A balance sheet as accountants draw it: assets on the right, liabilities and
 * equity on the left, a total under each side. With `prev`, the rows that moved
 * are marked with their change.
 */
export function BalanceSheetT({ s, prev, title }: { s: Statements; prev?: Statements; title: ReactNode }) {
  const before = prev ? new Map([...prev.assets, ...prev.liabilities, ...prev.equity]) : null;
  const ok = Math.abs(s.totalAssets - (s.totalLiabilities + s.totalEquity)) < 0.005;
  const rows = (items: [string, number][]) =>
    items.map(([a, v]) => {
      const delta = before ? round2(v - (before.get(a) ?? 0)) : 0;
      return (
        <li key={a} className={cn("flex items-center justify-between gap-2 px-3 py-1.5 text-[13.5px]", delta !== 0 && "bg-accent-soft/70 font-semibold")}>
          <span className="min-w-0 text-fg">{a}</span>
          <span className="flex shrink-0 items-center gap-2">
            {delta !== 0 && (
              <span className={cn("text-[11px]", delta > 0 ? "text-success" : "text-danger")}>
                {delta > 0 ? "▲" : "▼"} <Money v={Math.abs(delta)} plain />
              </span>
            )}
            <Money v={v} plain className="text-fg" />
          </span>
        </li>
      );
    });
  const section = (label: string, items: [string, number][]) => (
    <>
      <li className="bg-surface-2/60 px-3 py-1 text-[11px] font-bold text-muted">{label}</li>
      {items.length ? rows(items) : <li className="px-3 py-1.5 text-[13px] text-subtle">—</li>}
    </>
  );
  const total = (label: string, v: number) => (
    <p className="mt-auto flex items-center justify-between gap-2 border-t-2 border-fg/70 px-3 py-2 text-sm font-bold text-fg">
      <span>{label}</span>
      <Money v={v} plain />
    </p>
  );
  return (
    <figure className="my-3 overflow-hidden rounded-xl border-2 border-accent/40 bg-surface">
      <figcaption className="flex flex-wrap items-center gap-2 bg-accent px-4 py-2 text-accent-fg">
        <span className="me-auto text-[15px] font-bold">{title}</span>
        <span className="rounded-md bg-accent-fg/15 px-2 py-0.5 text-xs font-semibold">{ok ? "✓ מאוזן" : "✗ לא מאוזן"}</span>
      </figcaption>
      <div className="grid sm:grid-cols-2">
        <div className="flex min-w-0 flex-col sm:border-e-2 sm:border-fg/70">
          <ul className="divide-y divide-line/60">{section("נכסים", s.assets)}</ul>
          {total("סך הנכסים", s.totalAssets)}
        </div>
        <div className="flex min-w-0 flex-col max-sm:mt-2 max-sm:border-t-2 max-sm:border-fg/70">
          <ul className="divide-y divide-line/60">
            {section("התחייבויות", s.liabilities)}
            {section("הון", s.equity)}
          </ul>
          {total("סך ההתחייבויות וההון", s.totalLiabilities + s.totalEquity)}
        </div>
      </div>
    </figure>
  );
}

/** A block of a concept screen too wide for one column (a table, a walkthrough): on a wide screen it spans both. */
export function Wide({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("[column-span:all]", className)}>{children}</div>;
}

/** A short highlighted rule. */
export function Rule({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border-s-4 border-accent bg-accent-soft px-4 py-3 text-[15.5px] font-medium text-fg">{children}</p>;
}
