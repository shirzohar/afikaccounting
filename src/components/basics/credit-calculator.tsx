"use client";

import { CheckCircle2, CircleHelp, Eraser, TriangleAlert, XCircle } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { typedAmount } from "@/lib/amount";
import { round2 } from "@/lib/learn/basics";
import { ALLOW, ALON, EXPENSE, GILBOA } from "@/lib/learn/credit-losses";
import { CREDIT_LABEL, type CreditKey, type CreditValues, missingFor, RATE_KEYS, solveCredit, stepsFor } from "@/lib/learn/credit-solver";
import { cn } from "@/lib/utils";
import { JE, Money } from "./ui";

/** What a question can ask for, in the order questions usually ask. */
const TARGETS: CreditKey[] = [
  "expense",
  "closingAllowance",
  "closingNet",
  "closingGross",
  "openingGross",
  "openingAllowance",
  "openingNet",
  "collections",
  "creditSales",
  "writeOffs",
  "generalRate",
  "openingRate",
  "specificDebt",
];

type Form = Record<CreditKey, string>;
type Setup = { form: Partial<Form>; recovered: boolean; specific: boolean; sameRate: boolean; target: CreditKey };

const EMPTY = Object.fromEntries(Object.keys(CREDIT_LABEL).map((k) => [k, ""])) as Form;
const n = (v: number) => v.toLocaleString("en-US");

/** The lesson's own questions, to start from. */
const EXAMPLES: { name: string; setup: Setup }[] = [
  {
    name: "אלון",
    setup: {
      target: "expense",
      recovered: false,
      specific: false,
      sameRate: false,
      form: { openingGross: n(ALON.openingAR), openingAllowance: n(ALON.openingAllowance), creditSales: n(ALON.creditSales!), collections: n(ALON.collections!), writeOffs: n(ALON.writeOffs!), generalRate: "5" },
    },
  },
  {
    name: "גלבוע (שאלת הבחינה)",
    setup: {
      target: "expense",
      recovered: true,
      specific: true,
      sameRate: false,
      form: {
        openingNet: n(GILBOA.openingNet),
        openingRate: String(GILBOA.openingRate * 100),
        creditSales: n(GILBOA.creditSales),
        collections: n(GILBOA.collections),
        writeOffs: n(GILBOA.bankruptDebt),
        recovered: n(GILBOA.recovered),
        specificDebt: n(GILBOA.specificDebt),
        specificRate: String(GILBOA.specificRate * 100),
        generalRate: String(GILBOA.generalRate * 100),
      },
    },
  },
];

const parse = (raw: string) => {
  const x = Number(raw.replace(/,/g, "").trim());
  return raw.trim() === "" || !Number.isFinite(x) ? undefined : x;
};
const show = (k: CreditKey, v: number) => (RATE_KEYS.includes(k) ? `${round2(v * 100)}%` : n(round2(v)));

/**
 * The credit-loss calculator: the student enters what the question gives — and
 * leaves blank what it does not — answering the course's questions in order,
 * and the calculator finds the rest with the method's relations, shows each
 * step, and checks the student's own answer.
 */
export function CreditLossCalculator() {
  const id = useId();
  const [setup, setSetup] = useState<Setup>(EXAMPLES[0].setup);
  const [mine, setMine] = useState("");
  const form = { ...EMPTY, ...setup.form };
  const { target } = setup;
  const isRate = RATE_KEYS.includes(target);

  // What the question gives: every filled field but the one asked for; no recovered debt or specific customer means 0.
  const given: CreditValues = {};
  for (const k of Object.keys(CREDIT_LABEL) as CreditKey[]) {
    if (k === target) continue;
    if (k === "recovered" && !setup.recovered) continue;
    if ((k === "specificDebt" || k === "specificRate") && !setup.specific) continue;
    const v = parse(form[k]);
    if (v !== undefined) given[k] = RATE_KEYS.includes(k) ? v / 100 : v;
  }
  if (!setup.recovered) given.recovered = 0;
  if (!setup.specific) {
    given.specificDebt = 0;
    given.specificRate = 0;
  }
  const solution = solveCredit(given, { sameRate: setup.sameRate });
  const answer = solution.values[target];
  const steps = answer === undefined ? [] : stepsFor(target, solution);
  const missing = answer === undefined ? missingFor(target, solution, { sameRate: setup.sameRate }) : [];

  // The student's answer: an expense is checked by its size, a reversal entered as a positive amount too.
  const mineValue = parse(mine);
  const right =
    answer === undefined || mineValue === undefined
      ? undefined
      : isRate
        ? Math.abs(mineValue / 100 - answer) < 0.0001
        : Math.abs(Math.abs(mineValue) - Math.abs(answer)) < 1 && (target !== "expense" || mineValue >= 0 || answer < 0);

  const set = (k: CreditKey, v: string) => setSetup((s) => ({ ...s, form: { ...s.form, [k]: v } }));
  const field = (k: CreditKey, hint?: string) => {
    const asked = k === target;
    const rate = RATE_KEYS.includes(k);
    return (
      <label key={k} htmlFor={`${id}-${k}`} className="block min-w-0 text-[13px] font-medium text-fg">
        <span className="flex items-center gap-1.5">
          {CREDIT_LABEL[k]}
          {rate && <span className="text-subtle">(%)</span>}
          {asked && <span className="rounded bg-amber-400 px-1.5 text-[10.5px] font-bold text-amber-950">זה מה שמחפשים</span>}
        </span>
        <input
          id={`${id}-${k}`}
          inputMode="decimal"
          dir="ltr"
          disabled={asked}
          value={asked ? "" : form[k]}
          placeholder={asked ? "?" : "לא ידוע — השאירו ריק"}
          onChange={(e) => set(k, rate ? e.target.value : typedAmount(e))}
          className={cn(inputClass, "mt-1 text-end placeholder:text-start", asked && "border-amber-500/60 bg-amber-500/10")}
        />
        {hint && <span className="mt-0.5 block text-[11.5px] text-muted">{hint}</span>}
      </label>
    );
  };
  const yesNo = (label: string, on: boolean, flip: (v: boolean) => void) => (
    <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-fg">
      {label}
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={on === v}
          onClick={() => flip(v)}
          className={cn("h-8 rounded-lg px-3 text-[13px] font-semibold ring-1 transition", on === v ? "bg-accent text-accent-fg ring-accent" : "bg-surface text-muted ring-line-strong hover:text-fg")}
        >
          {v ? "כן" : "לא"}
        </button>
      ))}
    </div>
  );
  const question = (n: number, title: string, children: ReactNode, note?: ReactNode) => (
    <fieldset className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <legend className="flex items-center gap-2 px-1 text-[15px] font-bold text-fg">
        <span className="num grid h-6 w-6 place-items-center rounded-full bg-accent text-[12px] text-accent-fg">{n}</span>
        {title}
      </legend>
      {note && <p className="-mt-1 text-[12.5px] text-muted">{note}</p>}
      {children}
    </fieldset>
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3 text-[13.5px]">
        <span className="font-semibold text-fg">מתחילים מדוגמה מהשיעור:</span>
        {EXAMPLES.map((x) => (
          <button
            key={x.name}
            type="button"
            onClick={() => {
              setSetup(x.setup);
              setMine("");
            }}
            className="h-8 rounded-lg bg-surface px-3 font-semibold text-accent ring-1 ring-accent/40 hover:bg-accent-soft"
          >
            {x.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setSetup((s) => ({ ...s, form: {} }));
            setMine("");
          }}
          className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface px-3 font-semibold text-muted ring-1 ring-line-strong hover:text-fg"
        >
          <Eraser className="h-3.5 w-3.5" aria-hidden /> שאלה חדשה — לנקות הכול
        </button>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          {question(
            1,
            "מה מבקשים למצוא?",
            <select
              aria-label="מה מבקשים למצוא"
              value={target}
              onChange={(e) => setSetup((s) => ({ ...s, target: e.target.value as CreditKey }))}
              className={cn(inputClass, "font-semibold")}
            >
              {TARGETS.map((k) => (
                <option key={k} value={k}>
                  {CREDIT_LABEL[k]}
                  {k === "expense" ? " (ופקודת ההתאמה)" : ""}
                </option>
              ))}
            </select>,
          )}
          {question(
            2,
            "מה ידוע על תחילת השנה?",
            <div className="grid gap-3 sm:grid-cols-2">
              {field("openingGross")}
              {field("openingAllowance")}
              {field("openingNet", "נתון רק נטו? מלאו נטו ואחוז — המחשבון יפרק לברוטו ולהפרשה.")}
              {field("openingRate")}
            </div>,
            "מה שנתון במאזן של סוף השנה הקודמת. מלאו מה שיש — את השאר השאירו ריק.",
          )}
          {question(
            3,
            "מה קרה במהלך השנה?",
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {field("creditSales")}
                {field("collections")}
                {field("writeOffs", "כולל לקוח שפשט רגל השנה.")}
              </div>
              {yesNo("נגבה השנה חוב שנמחק בשנה קודמת?", setup.recovered, (v) => setSetup((s) => ({ ...s, recovered: v })))}
              {setup.recovered && <div className="grid gap-3 sm:grid-cols-2">{field("recovered")}</div>}
            </>,
            "קניות, מכירות במזומן ותשלומים לספקים — לא מזינים: הם לא נכנסים לשני הכרטיסים.",
          )}
          {question(
            4,
            "מה ידוע על סוף השנה?",
            <>
              <div className="grid gap-3 sm:grid-cols-2">{field("generalRate")}</div>
              <label className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
                <input type="checkbox" checked={setup.sameRate} onChange={(e) => setSetup((s) => ({ ...s, sameRate: e.target.checked }))} className="h-4 w-4 accent-[var(--accent)]" />
                ההפרשה באותו אחוז כמו בשנה הקודמת
              </label>
              {yesNo("יש לקוח ספציפי בקשיים בסוף השנה?", setup.specific, (v) => setSetup((s) => ({ ...s, specific: v })))}
              {setup.specific && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {field("specificDebt")}
                  {field("specificRate")}
                </div>
              )}
              <details className="group rounded-lg bg-surface-2/50 px-3 py-2">
                <summary className="cursor-pointer text-[13px] font-semibold text-accent">נתונים נוספים על סוף השנה — רק אם הם בשאלה</summary>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {field("closingGross")}
                  {field("closingAllowance")}
                  {field("closingNet")}
                  {field("expense", "למשל כשמבקשים את יתרת הפתיחה.")}
                </div>
              </details>
            </>,
          )}
        </div>

        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start" aria-live="polite">
          {solution.conflicts.length > 0 && (
            <div className="rounded-xl border border-danger/40 bg-danger/[0.08] p-3 text-[13.5px] text-fg">
              <p className="flex items-center gap-1.5 font-bold text-danger">
                <TriangleAlert className="h-4 w-4" aria-hidden /> הנתונים לא מתיישבים
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {solution.conflicts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="mt-1 text-muted">בדקו שוב את הנתונים שהזנתם — או השאירו ריק נתון שהשאלה לא נותנת.</p>
            </div>
          )}

          {answer === undefined ? (
            <div className="rounded-xl border-2 border-dashed border-line-strong p-4 text-[14px] text-fg">
              <p className="flex items-center gap-1.5 font-bold">
                <CircleHelp className="h-4 w-4 text-accent" aria-hidden /> עוד אי אפשר למצוא את {CREDIT_LABEL[target]}
              </p>
              <p className="mt-1 text-muted">חסר נתון. חפשו בשאלה אחד מאלה, והזינו אותו:</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {missing.map((k) => (
                  <li key={k} className="rounded-md bg-surface-2 px-2 py-0.5 text-[13px] font-semibold">
                    {CREDIT_LABEL[k]}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className="rounded-xl border-2 border-accent bg-accent-soft/50 p-4">
                <p className="text-[13px] font-semibold text-muted">{CREDIT_LABEL[target]}</p>
                <p className="num mt-0.5 text-[26px] font-extrabold text-fg">
                  {target === "expense" ? (
                    <>
                      {n(Math.abs(answer))}{" "}
                      <span className="text-[15px] font-bold text-muted">{answer >= 0 ? "— גידול בהפרשה" : answer < 0 ? "— ביטול הפרשה" : ""}</span>
                    </>
                  ) : (
                    show(target, answer)
                  )}
                </p>
                <label htmlFor={`${id}-mine`} className="mt-3 block text-[13px] font-medium text-fg">
                  התשובה שלכם — לבדיקה {isRate && <span className="text-subtle">(%)</span>}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id={`${id}-mine`}
                    inputMode="decimal"
                    dir="ltr"
                    value={mine}
                    onChange={(e) => setMine(isRate ? e.target.value : typedAmount(e))}
                    placeholder="מה יצא לכם?"
                    className={cn(inputClass, "text-end placeholder:text-start")}
                  />
                  {right !== undefined &&
                    (right ? (
                      <span className="flex shrink-0 items-center gap-1 font-bold text-success">
                        <CheckCircle2 className="h-5 w-5" aria-hidden /> צדקתם
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 font-bold text-danger">
                        <XCircle className="h-5 w-5" aria-hidden /> לא מדויק
                      </span>
                    ))}
                </div>
                {right === false && <p className="mt-1 text-[12.5px] text-muted">השוו את הדרך שלכם לשלבים שלמטה — איפה נפרדתם?</p>}
              </div>

              <div className="rounded-xl border border-line bg-surface p-3">
                <p className="text-[14px] font-bold text-fg">איך מגיעים לזה — שלב אחר שלב</p>
                <ol className="mt-2 space-y-2">
                  {steps.map((s, i) => (
                    <li key={s.key} className="flex gap-2 text-[13.5px]">
                      <span className="num grid h-5 w-5 shrink-0 place-items-center rounded-full bg-fg text-[10.5px] font-bold text-surface">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="text-muted">{s.equation}</span>
                        <span className="mt-0.5 block font-semibold text-fg">
                          {CREDIT_LABEL[s.key]} = <span className="num">{show(s.key, s.value)}</span>
                          {s.with && <span className="font-normal text-muted"> (יחד עם {CREDIT_LABEL[s.with]})</span>}
                        </span>
                      </span>
                    </li>
                  ))}
                  {steps.length === 0 && <li className="text-[13.5px] text-muted">הנתון הזה הוזן כבר בשאלה.</li>}
                </ol>
              </div>

              {target === "expense" && answer !== 0 && (
                <JE
                  entry={{
                    id: "התאמה",
                    date: "31.12",
                    text: answer > 0 ? "השלמת ההפרשה לגובה הנדרש" : "ביטול הפרשה עודפת",
                    lines:
                      answer > 0
                        ? [
                            { account: EXPENSE, dr: round2(answer) },
                            { account: ALLOW, cr: round2(answer) },
                          ]
                        : [
                            { account: ALLOW, dr: round2(-answer) },
                            { account: EXPENSE, cr: round2(-answer) },
                          ],
                  }}
                  title="פקודת היומן — על הנעלם, הוצאות הפסדי אשראי"
                  note={null}
                />
              )}

              {solution.values.closingGross !== undefined && solution.values.closingAllowance !== undefined && (
                <div className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line text-[13.5px]">
                  <p className="bg-surface-2/60 px-3 py-1.5 font-semibold text-fg">המאזן בסוף השנה — סעיף הלקוחות</p>
                  <p className="flex justify-between px-3 py-1.5">
                    <span>לקוחות (ברוטו)</span>
                    <Money v={solution.values.closingGross} plain />
                  </p>
                  <p className="flex justify-between px-3 py-1.5">
                    <span>בניכוי: הפרשה להפסדי אשראי</span>
                    <Money v={-solution.values.closingAllowance} plain className="text-danger" />
                  </p>
                  <p className="flex justify-between px-3 py-1.5 font-bold text-fg">
                    <span>לקוחות, נטו</span>
                    <Money v={round2(solution.values.closingGross - solution.values.closingAllowance)} plain />
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
