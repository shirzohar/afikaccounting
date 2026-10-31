import { Factory, Flame, Package, Ship } from "lucide-react";
import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { Callout, DataTable } from "@/components/study/blocks";
import { type Entry } from "@/lib/learn/basics";
import { entriesFor, purchaseCost, statement, valuatePeriod } from "@/lib/learn/inventory";
import { DAF, DISCOUNT_EXCESS, DISCOUNT_WHOLE, FINANCING, LEHAVA, SHEMESH } from "@/lib/learn/inventory-examples";
import { ROW_LABEL, solveTable, TABLE_ROWS } from "@/lib/learn/inventory-solver";
import { cn } from "@/lib/utils";
import { type FillData, FormulaLab, SoldSlider, SortQuiz, SystemSwitch, TableFill, TryInCalc } from "./inventory-interactive";
import { MoreDialog, Sorted, Story } from "./inventory-teach";
import { GrossProfitStatementView } from "./inventory-trace";
import { Card, KeyCard, Money, Rule, type Step, Stepper, Term, Wide } from "./ui";

const LEH = valuatePeriod(LEHAVA, "fifo");
const LEH_P = valuatePeriod(LEHAVA, "fifo", { system: "periodic" });
const LEH_T = valuatePeriod(LEHAVA, "fifo", { system: "perpetual" });
const cash = { payable: "מזומן", receivable: "מזומן" } as const;
const SYSTEMS: Record<"periodic" | "perpetual", { entries: Entry[]; groups: number[][] }> = {
  periodic: { entries: entriesFor(LEHAVA, LEH_P, "periodic", cash), groups: [[0], [1], [2]] },
  perpetual: { entries: entriesFor(LEHAVA, LEH_T, "perpetual", cash), groups: [[0], [1, 2], []] },
};

const DAF_R = solveTable(DAF);
const DAF_ROWS = TABLE_ROWS.filter((r) => r !== "gpPct" || DAF.years.some((y) => y.cells.gpPct !== undefined));
const DAF_FILL: FillData = {
  years: DAF.years.map((y) => y.label),
  rows: DAF_ROWS.map((r) => ({ key: r, label: ROW_LABEL[r], pct: r === "gpPct" })),
  // Everything that wasn't asked for and isn't reached by a step is given (a blank discount is a zero).
  given: DAF.years.map((y, t) => DAF_ROWS.map((r) => y.cells[r] !== "?" && !DAF_R.steps.some((s) => s.year === t && s.row === r))),
  values: DAF.years.map((_, t) => DAF_ROWS.map((r) => DAF_R.values[t][r] ?? null)),
  steps: DAF_R.steps.map((s) => ({ year: s.year, row: s.row, equation: s.equation, substitution: s.substitution, why: s.why })),
  rolls: DAF.years.slice(1).map((_, i) => ({ from: i, to: i + 1 })),
};

const SHEMESH_COST = valuatePeriod(SHEMESH, "fifo").costs[0];
const WHOLE = purchaseCost(DISCOUNT_WHOLE);
const EXCESS = purchaseCost(DISCOUNT_EXCESS);
const FIN = purchaseCost(FINANCING);

type TermCard = { term: string; def: string; ex: ReactNode; home: "מאזן" | "רווח או הפסד" | "—" };

/** The vocabulary in three small groups, so it is met a few words at a time. */
const TERM_GROUPS: { title: string; terms: TermCard[] }[] = [
  {
    title: "מה יש במחסן",
    terms: [
      { term: "מלאי", def: "נכס שמוחזק למכירה, בתהליך ייצור למכירה, או חומרים שייצרכו בייצור.", ex: "הערכות שעל המדף.", home: "מאזן" },
      { term: "מלאי פתיחה", def: "המלאי בתחילת השנה — הסגירה של השנה הקודמת.", ex: "החנות נפתחה השנה: אפס.", home: "רווח או הפסד" },
      { term: "קניות", def: "עלות הסחורה שנקנתה השנה (בשיטה תקופתית).", ex: <>10 ערכות × 50 = <Money v={LEH.purchasesCost} /></>, home: "רווח או הפסד" },
      { term: "מלאי סגירה", def: "מה שנשאר בסוף השנה, לפי ספירה והערכה כספית.", ex: <>4 ערכות × 50 = <Money v={LEH.closingCarrying} /></>, home: "מאזן" },
    ],
  },
  {
    title: "מה נמכר, וכמה הרווחנו",
    terms: [
      { term: "עלות המכר", def: "העלות של מה שנמכר בלבד: פתיחה + קניות − סגירה.", ex: <><Money v={LEH.cogs} /> — 6 ערכות</>, home: "רווח או הפסד" },
      { term: "מכירות נטו", def: "מכירות פחות הנחות והחזרות ללקוחות.", ex: <>6 × 150 = <Money v={LEH.netSales} /></>, home: "רווח או הפסד" },
      { term: "רווח גולמי", def: "מכירות נטו פחות עלות המכר.", ex: <Money v={LEH.grossProfit} />, home: "רווח או הפסד" },
      {
        term: "שיעור רווח גולמי",
        def: "רווח גולמי ÷ מכירות נטו — על המכירות, לא על העלות.",
        ex: <><Money v={LEH.grossProfit} plain /> ÷ <Money v={LEH.netSales} plain /> = {Math.round(LEH.gpPct * 10000) / 100}%</>,
        home: "—",
      },
    ],
  },
  {
    title: "כמה זה שווה",
    terms: [
      { term: "עלות", def: "מחיר רכישה, ועוד מה שהביא את המלאי למיקומו ולמצבו, פחות הנחות.", ex: "מחיר + מכס + הובלה פנימה − הנחה.", home: "—" },
      { term: "שווי מימוש נטו", def: "מחיר המכירה הצפוי, פחות עלויות השלמה ועלויות המכירה.", ex: "נתון בשאלה — למשל 142 ₪ ליחידה.", home: "—" },
      { term: "שווי הוגן", def: "המחיר בעסקה רגילה בין משתתפי שוק — מושג אחר, לא שווי מימוש נטו.", ex: "מופיע לפעמים בשאלה כמסיח.", home: "—" },
    ],
  },
];

const termSteps: Step[] = TERM_GROUPS.map((g) => ({
  title: g.title,
  body: (
    <ul className="grid gap-2 sm:grid-cols-2">
      {g.terms.map((t) => (
        <li key={t.term} className="rounded-xl border border-line bg-surface p-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-fg">{t.term}</p>
            {t.home !== "—" && (
              <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold", t.home === "מאזן" ? "bg-accent text-accent-fg" : "bg-fg text-surface")}>{t.home}</span>
            )}
          </div>
          <p className="mt-1 text-[14px] text-fg/85">{t.def}</p>
          <p className="mt-1.5 text-[13px] text-muted">בלהבה: {t.ex}</p>
        </li>
      ))}
    </ul>
  ),
}));

const COST_ITEMS = [
  { text: "מחיר הרכישה מהספק", answer: "in", why: "הבסיס של עלות הרכישה.", ref: "IAS 2.11" },
  { text: "מכס על יבוא, שלא ניתן לקבל בחזרה", answer: "in", why: "מס שאינו ניתן להחזר — חלק מהעלות.", ref: "IAS 2.11" },
  { text: 'מע"מ ששולם לספק וניתן לקיזוז', answer: "out", why: "מס שמוחזר — לא עלות.", ref: "IAS 2.11" },
  { text: "הובלה מהנמל למחסן החברה", answer: "in", why: "הובלה פנימה — מביאה את המלאי למיקומו.", ref: "IAS 2.11" },
  { text: "הובלה מהמחסן ללקוח שקנה", answer: "out", why: "עלות מכירה — הוצאה בתקופה.", ref: "IAS 2.16(ד)" },
  { text: "הנחת כמות שקיבלנו באותה רכישה", answer: "less", why: "הנחות מסחריות מנוכות מהעלות.", ref: "IAS 2.11" },
  { text: "אחסון רגיל של מוצרים גמורים במחסן", answer: "out", why: "אחסון שאינו נחוץ לשלב נוסף — הוצאה.", ref: "IAS 2.16(ב)" },
  { text: "אחסון בנמל המוצא, שחובה בגלל לוח משלוחים", answer: "in", why: "נחוץ בתהליך לפני השלב הבא.", ref: "IAS 2.16(ב)" },
  { text: "בזבוז חריג של חומרים בייצור", answer: "out", why: "בזבוז חריג — הוצאה בתקופה.", ref: "IAS 2.16(א)" },
  { text: "שכר הנהלת החשבונות של החברה", answer: "out", why: "תקורה מנהלתית שלא מביאה את המלאי למצבו.", ref: "IAS 2.16(ג)" },
  { text: "פרסום של המוצר בעיתון", answer: "out", why: "עלות מכירה ושיווק — הוצאה.", ref: "IAS 2.16(ד)" },
  { text: "תוספת המחיר על תשלום דחוי בתנאי אשראי חריגים", answer: "out", why: "רכיב מימון — הוצאות מימון, לא עלות מלאי.", ref: "IAS 2.18" },
];

/** Kits on a shelf: the sold ones taken away, the rest still there — the whole idea in one picture. */
function Shelf({ bought, sold }: { bought: number; sold: number }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="img" aria-label={`${bought} ערכות: ${sold} נמכרו, ${bought - sold} על המדף`}>
      {Array.from({ length: bought }, (_, i) => (
        <span
          key={i}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg text-[11px] font-bold",
            i < sold ? "border-2 border-dashed border-line-strong text-subtle" : "bg-accent text-accent-fg shadow-[0_6px_14px_-8px_var(--accent)]",
          )}
        >
          {i < sold ? "נמכר" : <Package className="h-4 w-4" aria-hidden />}
        </span>
      ))}
    </div>
  );
}

/** One purchase's cost built line by line: each step adds a line to the bill, or sets it aside, with the reason. */
const costSteps: Step[] = SHEMESH_COST.lines.map((l, i) => {
  const so = SHEMESH_COST.lines.slice(0, i + 1);
  const total = so.filter((x) => x.included).reduce((s, x) => s + x.amount, 0);
  const out = so.filter((x) => !x.included);
  return {
    title: (
      <span className="flex flex-wrap items-center gap-2">
        {l.label}
        <span className={cn("rounded-full px-2.5 py-0.5 text-[12.5px] font-bold", l.included ? (l.amount < 0 ? "bg-accent-soft text-accent" : "bg-success/15 text-success") : "bg-danger/10 text-danger")}>
          {l.included ? (l.amount < 0 ? "מנוכה" : "נכנס לעלות") : "בחוץ"}
        </span>
      </span>
    ),
    body: (
      <>
        <p>
          <Money v={Math.abs(l.amount)} /> — {l.reason ?? "הבסיס: כמות × מחיר."}
        </p>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
          <div className="rounded-xl border border-line bg-surface p-3">
            <p className="mb-1.5 text-[13px] font-semibold text-muted">העלות עד עכשיו</p>
            <ul className="space-y-1 text-[14px]">
              {so
                .filter((x) => x.included)
                .map((x) => (
                  <li key={x.label} className="flex justify-between gap-3">
                    <span className="min-w-0">{x.label}</span>
                    <Money v={x.amount} plain />
                  </li>
                ))}
            </ul>
            <p className="mt-2 flex justify-between gap-3 border-t-2 border-fg/70 pt-1.5 text-[14.5px] font-bold">
              <span>סה״כ</span>
              <Money v={total} plain />
            </p>
          </div>
          {out.length > 0 && (
            <div className="rounded-xl border-2 border-dashed border-danger/30 p-3">
              <p className="mb-1.5 text-[13px] font-semibold text-danger">נשאר בחוץ</p>
              <ul className="space-y-1 text-[14px]">
                {out.map((x) => (
                  <li key={x.label}>{x.label}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {i === SHEMESH_COST.lines.length - 1 && (
          <Rule>
            עלות המאווררים: <Money v={SHEMESH_COST.total} /> — <Money v={SHEMESH_COST.perUnit} /> ליחידה.
          </Rule>
        )}
      </>
    ),
  };
});

const discountSteps: Step[] = [
  {
    title: "א. על כל הרכישה",
    body: (
      <>
        <p>&quot;5% הנחה ברכישה של מעל 800 יחידות&quot; — וקנינו 1,000 יח׳ ב-20 ₪. עברנו את הסף, אז ההנחה חלה על <strong>כל</strong> היחידות:</p>
        <Rule>
          הנחה: <Money v={WHOLE.discount} /> · עלות: <Money v={WHOLE.total} />
        </Rule>
      </>
    ),
  },
  {
    title: "ב. רק על העודף",
    body: (
      <>
        <p>&quot;5% על כל יחידה מעבר ל-800&quot; — אותה רכישה. הפעם ההנחה רק על 200 היחידות שמעל הסף:</p>
        <Rule>
          הנחה: <Money v={EXCESS.discount} /> · עלות: <Money v={EXCESS.total} />
        </Rule>
      </>
    ),
  },
  {
    title: "ג. הנחת יעד — שלוש שאלות, לפי הסדר",
    body: (
      <ol className="space-y-2">
        {[
          ["היעד כבר הושג?", "מכירים בהנחה."],
          ["לא — אבל הוא בשליטה הבלעדית של החברה (למשל יעד רכישות), והיא צופה לעמוד בו?", "מכירים בהנחה."],
          ["אחרת — למשל יעד מכירות, שתלוי בלקוחות", "לא מכירים, עד שהיעד הושג."],
        ].map(([q, a], i) => (
          <li key={q} className="flex items-start gap-2 rounded-lg bg-surface-2/70 px-3 py-2">
            <span className="num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">{i + 1}</span>
            <span>
              {q} ← <strong>{a}</strong>
            </span>
          </li>
        ))}
      </ol>
    ),
  },
];

/** The concept screens of lessons 1 and 2 (the idea, the systems, the statement; the cost of inventory) and the overview of lesson 3. */
export const INVENTORY_SCREENS: Record<string, ScreenContent> = {
  "inv-idea": {
    lead: "מה שלא נמכר — לא הוצאה של השנה. רק העלות של מה שנמכר נרשמת כהוצאה; מה שנשאר על המדף הוא נכס: מלאי.",
    body: (
      <>
        <Story icon={<Flame />} title="חנות הנרות ״להבה״">
          <p>קנתה 10 ערכות נרות ב-50 ₪ ומכרה 6 מהן ב-150 ₪. ארבע עדיין על המדף.</p>
          <Shelf bought={10} sold={6} />
          <p className="font-semibold">כמה הרוויחה השנה?</p>
        </Story>
        <Wide className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="✗ כל הקניות כהוצאה" className="border-danger/40">
            <p>
              <Money v={LEH.netSales} /> − <Money v={LEH.purchasesCost} /> ={" "}
              <strong className="text-danger">
                <Money v={LEH.netSales - LEH.purchasesCost} />
              </strong>
            </p>
            <p className="text-sm text-muted">ארבע ערכות על המדף — והעלות שלהן ״נשרפה״ כבר השנה.</p>
          </Card>
          <Card title="✓ רק מה שנמכר" className="border-success/40">
            <p>
              <Money v={LEH.netSales} /> − 6 × 50 ={" "}
              <strong className="text-success">
                <Money v={LEH.grossProfit} />
              </strong>
            </p>
            <p className="text-sm text-muted">
              ארבע הערכות (<Money v={LEH.closingCarrying} />) הן נכס. ההוצאה שלהן — בשנה שבה יימכרו.
            </p>
          </Card>
        </Wide>
        <KeyCard>
          הוצאה נרשמת יחד עם ההכנסה שהיא יצרה. זה <Term he="עיקרון ההקבלה" />.
        </KeyCard>
        <p>הזיזו את הסליידר — אותן קניות, ומה שזז הוא רק החלוקה בין הוצאה לנכס:</p>
        <Wide>
          <SoldSlider />
        </Wide>
      </>
    ),
  },
  "inv-ias2": {
    lead: "התקן IAS 2 עונה על ארבע שאלות — וכל אחת מהן נלמדת בקורס בשיעור משלה.",
    body: (
      <>
        <Wide className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["מה נחשב מלאי?", "סחורה שמחזיקים כדי למכור.", "inv-count"],
              ["באיזו עלות רושמים?", "מחיר, ועוד מה שהביא את הסחורה למחסן.", "inv-cost"],
              ["כמה הוא שווה בסוף השנה?", "הנמוך מבין העלות לשווי המימוש נטו.", "inv-nrv"],
              ["מתי העלות הופכת להוצאה?", "כשהסחורה נמכרת — בעלות המכר.", "inv-cogs"],
            ] as const
          ).map(([q, a, screen], i) => (
            <div key={q} className="rounded-xl border border-line bg-surface p-3.5">
              <p className="flex items-center gap-2 font-semibold text-fg">
                <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
                {q}
              </p>
              <p className="mt-1 text-[14.5px] text-fg/85">{a}</p>
              <p className="mt-1.5 text-[13px] text-muted">
                לומדים ב<ScreenLink id={screen} />
              </p>
            </div>
          ))}
        </Wide>
        <KeyCard icon={<Package className="h-5 w-5" />}>בשאלות המבחן החברה כמעט תמיד קמעונאית: קונה סחורה מוכנה ומוכרת אותה כמו שהיא.</KeyCard>
        <MoreDialog label="ומה עם חברה יצרנית?">
          <p>
            לעלות הרכישה מתווספות <Term he="עלויות המרה" /> — עבודה ישירה ו<Term he="תקורות ייצור" />.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              תקורה <strong>משתנה</strong> (חשמל של המכונות) — לפי הייצור בפועל.
            </li>
            <li>
              תקורה <strong>קבועה</strong> (שכירות המפעל) — לפי <strong>רמת ייצור רגילה</strong>. ייצרו פחות מהרגיל? החלק שלא הוקצה הוא הוצאה של התקופה (IAS 2.12–13).
            </li>
            <li>תקורות הנהלה כלליות ועלויות מכירה — אף פעם לא בעלות.</li>
          </ul>
          <p className="flex items-center gap-2 text-muted">
            <Factory className="h-4 w-4" aria-hidden /> מופיע בעיקר בשאלות תיאורטיות.
          </p>
        </MoreDialog>
      </>
    ),
  },
  "inv-terms": {
    lead: "לפני החישובים — המילים. אחת-עשרה מילים, בשלוש קבוצות קטנות.",
    body: <Stepper label="אוצר המילים של המלאי" steps={termSteps} />,
  },
  "inv-homes": {
    lead: "בשיטה תקופתית יש למלאי הסגירה שני בתים: נכס במאזן, ובאותו סכום — הקטנה של עלות המכר ברווח או הפסד.",
    body: (
      <>
        <Wide className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-xl border-2 border-accent/50 bg-accent-soft p-4">
            <p className="text-xs font-bold text-accent">מאזן — נכס</p>
            <p className="mt-2 font-semibold text-fg">מלאי סגירה מאזני</p>
            <p className="mt-1 text-sm text-fg/85">מה שבמחסן ב-31.12 — עובר לשנה הבאה.</p>
          </div>
          <div className="grid place-items-center text-center text-sm text-muted">
            <span aria-hidden className="text-2xl">⇄</span>
            <span>אותו סכום</span>
          </div>
          <div className="rounded-xl border-2 border-fg/30 bg-surface-2 p-4">
            <p className="text-xs font-bold text-fg">רווח או הפסד — עלות המכר</p>
            <p className="mt-2 font-semibold text-fg">מלאי סגירה רווח או הפסד</p>
            <p className="mt-1 text-sm text-fg/85">בזכות — מקטין את עלות המכר.</p>
          </div>
        </Wide>
        <KeyCard>רק ״מלאי סגירה מאזני״ הוא נכס. ״מלאי סגירה רווח או הפסד״ ו״מלאי פתיחה״ — תוצאתיים.</KeyCard>
        <MoreDialog label="ומה קורה בשנה הבאה?">
          <p>&quot;מלאי סגירה רווח או הפסד&quot; מתאפס, כמו כל חשבון תוצאתי.</p>
          <p>
            &quot;מלאי סגירה מאזני&quot; עובר לשנה הבאה ומשנה שם וסיווג ל&quot;מלאי פתיחה&quot; — חשבון תוצאתי בחובה, כמו הקניות. בסוף השנה הבאה סופרים שוב, ורושמים
            סגירה חדשה.
          </p>
        </MoreDialog>
      </>
    ),
  },
  "inv-systems": {
    lead: "בשיטה תקופתית מעדכנים את המלאי פעם בשנה, לפי ספירה. בשיטה תמידית — בכל קנייה ובכל מכירה.",
    body: (
      <>
        <Wide className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-line-strong bg-surface p-4">
            <p className="font-bold text-fg">תקופתי — פעם בשנה</p>
            <p className="mt-1 text-[14.5px] text-fg/85">במהלך השנה: ״קניות״. בסוף השנה: סופרים, ורושמים מלאי סגירה.</p>
          </div>
          <div className="rounded-xl border-2 border-accent/50 bg-accent-soft/50 p-4">
            <p className="font-bold text-fg">תמידי — בכל תנועה</p>
            <p className="mt-1 text-[14.5px] text-fg/85">בקנייה: ״מלאי״. בכל מכירה: גם ח׳ עלות המכר / ז׳ מלאי.</p>
          </div>
        </Wide>
        <p>אותם שלושה אירועים של להבה. החליפו שיטה, ועברו בין האירועים:</p>
        <Wide>
          <SystemSwitch data={SYSTEMS} />
        </Wide>
        <KeyCard>השיטה משנה את הפקודות. ב-FIFO המספרים בסוף יוצאים זהים בשתיהן.</KeyCard>
        <MoreDialog label="טבלת השוואה מלאה">
          <DataTable
            head={["", "מלאי תקופתי", "מלאי תמידי"]}
            rows={[
              ["מתי מתעדכן המלאי", "בסוף השנה, אחרי ספירה", "בכל קנייה ומכירה"],
              ["בקנייה", "ח' קניות / ז' ספקים (או מזומן)", "ח' מלאי / ז' ספקים (או מזומן)"],
              ["במכירה", "ח' לקוחות / ז' מכירות", "ח' לקוחות / ז' מכירות, ובמקביל ח' עלות המכר / ז' מלאי"],
              ["בסוף השנה", "ח' מלאי סגירה מאזני / ז' מלאי סגירה רווח או הפסד", "אין פקודת התאמה (מלבד הורדת ערך לשווי מימוש נטו)"],
              ["יתרון", "פשוט לרישום", "ערך המלאי ידוע בכל רגע"],
              ["חיסרון", "אין מעקב שוטף; עלות המכר ידועה רק בסוף השנה", "צריך לחשב עלות בכל מכירה"],
            ]}
          />
        </MoreDialog>
      </>
    ),
  },
  "inv-cogs": {
    lead: "התבנית שמופיעה בכל שאלה: מכירות נטו, פחות עלות המכר — רווח גולמי.",
    body: (
      <>
        <Wide>
          <GrossProfitStatementView s={statement(LEH)} caption="חנות להבה — הדוח עד הרווח הגולמי" />
        </Wide>
        <Sorted
          columns={[
            { title: "מקטין את המכירות", tone: "neutral", items: ["הנחות ללקוחות", "החזרות מלקוחות"] },
            { title: "מקטין את הקניות", tone: "neutral", items: ["הנחות מספקים", "החזרות לספקים"] },
          ]}
        />
        <KeyCard>
          שיעור רווח גולמי = רווח גולמי ÷ מכירות נטו — לא ÷ עלות המכר. בלהבה: <Money v={LEH.grossProfit} plain /> ÷ <Money v={LEH.netSales} plain /> ={" "}
          {Math.round(LEH.gpPct * 10000) / 100}%.
        </KeyCard>
      </>
    ),
  },
  "inv-daf": {
    lead: "דוח עם סימני שאלה: שנה אחרי שנה, ובכל צעד — משוואה אחת עם נעלם אחד.",
    body: (
      <>
        <p>חברת &quot;דף&quot; הוקמה ב-2024 (פתיחה אפס), וחסרים לה תאים בשתי שנים. לחצו &quot;צעד הבא&quot; — ליד כל צעד כתוב למה הוא הבא בתור:</p>
        <Wide>
          <TableFill data={DAF_FILL} />
        </Wide>
        <KeyCard>כשהשנה גמורה — מגלגלים: מלאי הסגירה של 2024 הוא מלאי הפתיחה של 2025.</KeyCard>
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="daf" label="פתחו את הטבלה במחשבון" />
        </div>
      </>
    ),
  },

  "inv-cost": {
    lead: "עלות המלאי היא כל מה שהביא את הסחורה למקומה ולמצבה — ולא יותר.",
    body: (
      <>
        <KeyCard>לכל הוצאה שואלים: האם היא הביאה את הסחורה לכאן, ולמצב הזה?</KeyCard>
        <Wide>
          <Sorted
            columns={[
              { title: "נכנס לעלות", tone: "good", items: ["מחיר הרכישה", "מכס שלא מוחזר", "הובלה פנימה וטיפול", "אחסון הכרחי לפני שלב נוסף"] },
              { title: "מנוכה מהעלות", tone: "neutral", items: ["הנחות מסחריות והנחות כמות", "החזרים מהספק"] },
              { title: "בחוץ — הוצאה", tone: "bad", items: ["מע״מ בר-קיזוז", "אחסון רגיל", "הובלה ללקוח, פרסום", "בזבוז חריג, תקורה מנהלית", "רכיב מימון באשראי חריג"] },
            ]}
          />
        </Wide>
        <MoreDialog label="עם סעיפי התקן">
          <DataTable
            head={["פריט", "בעלות?", "סעיף"]}
            rows={[
              ["מחיר רכישה", "✓ נכלל", "11"],
              ["מכס ומסים שאינם ניתנים להחזר", "✓ נכלל", "11"],
              ["הובלה פנימה וטיפול", "✓ נכלל", "11"],
              ['מע"מ בר-קיזוז', "✗ לא", "11"],
              ["הנחות מסחריות, הנחות כמות, החזרים", "✂ מנוכה", "11"],
              ["אחסון הכרחי לפני שלב נוסף", "✓ נכלל", "16(ב)"],
              ["אחסון רגיל", "✗ הוצאה", "16(ב)"],
              ["בזבוז חריג", "✗ הוצאה", "16(א)"],
              ["תקורה מנהלתית", "✗ הוצאה", "16(ג)"],
              ["עלויות מכירה, הובלה ללקוח, פרסום", "✗ הוצאה", "16(ד)"],
              ["רכיב מימון באשראי חריג", "✗ הוצאות מימון", "18"],
            ]}
          />
        </MoreDialog>
      </>
    ),
  },
  "inv-shemesh": {
    lead: "בונים עלות של רכישה שורה אחר שורה: כל שורה בחשבונית — נכנסת, מנוכה, או נשארת בחוץ.",
    body: (
      <>
        <Story icon={<Ship />} title="חברת ״שמש״ מייבאת 2,000 מאווררים ב-80 ₪">
          <p>על השולחן: הנחת כמות, מכס, שתי הובלות, אחסון בחנות ומע״מ. נעבור עליהם אחד-אחד:</p>
        </Story>
        <Stepper label="שמש · בניית העלות" steps={costSteps} />
        <Callout kind="warn" title="מכס — על המחיר נטו">
          <p>&quot;מכס X% מהמחיר נטו&quot; — על המחיר אחרי ההנחה, בלי ההובלה.</p>
        </Callout>
      </>
    ),
  },
  "inv-discounts": {
    lead: "הנחה מנוכה מהעלות — אבל קודם קוראים את הניסוח: על כל הרכישה, רק על העודף, או מותנית ביעד.",
    body: <Stepper label="שלושה סוגי הנחה" steps={discountSteps} />,
  },
  "inv-financing": {
    lead: "בתנאי אשראי חריגים לענף, העלות היא מחיר המזומן. ההפרש הוא הוצאות מימון — לא מלאי.",
    body: (
      <>
        <Wide className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-xl border-2 border-line-strong bg-surface p-4 text-center">
            <p className="text-[13px] text-muted">המחיר באשראי ״שוטף + 150״</p>
            <p className="text-2xl font-bold text-fg">
              <Money v={FIN.total + FIN.financing} />
            </p>
          </div>
          <span className="text-center text-xl text-muted" aria-hidden>
            =
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border-2 border-success/50 bg-success/5 p-3 text-center">
              <p className="text-[13px] text-muted">עלות המלאי</p>
              <p className="text-xl font-bold text-success">
                <Money v={FIN.total} />
              </p>
            </div>
            <div className="rounded-xl border-2 border-danger/40 bg-danger/5 p-3 text-center">
              <p className="text-[13px] text-muted">הוצאות מימון</p>
              <p className="text-xl font-bold text-danger">
                <Money v={FIN.financing} />
              </p>
            </div>
          </div>
        </Wide>
        <KeyCard>במזומן המחיר היה נמוך ב-4% — וזו העלות. ההפרש הוא מחיר הכסף, לאורך תקופת האשראי.</KeyCard>
        <p className="text-[14.5px] text-muted">ואם תנאי האשראי רגילים בענף? אין פיצול: העלות היא המחיר המלא.</p>
      </>
    ),
  },
  "inv-cost-sort": {
    lead: "לפני התרגול של השיעור — בודקים שההבנה יושבת: לכל עלות, האם היא נכנסת למלאי, נשארת בחוץ, או מנוכה ממנו.",
    body: (
      <Wide>
        <SortQuiz
          id="cost-sort"
          title="נכלל בעלות, הוצאה, או מנוכה?"
          options={[
            ["in", "נכלל בעלות"],
            ["out", "הוצאה / לא עלות"],
            ["less", "מנוכה מהעלות"],
          ]}
          items={COST_ITEMS}
        />
      </Wide>
    ),
  },

  "inv-formulas": {
    lead: "כשהמחירים משתנים, צריך כלל שאומר מה נמכר ומה נשאר על המדף: FIFO או ממוצע משוקלל.",
    body: (
      <>
        <Wide className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-accent/50 bg-accent-soft/50 p-4">
            <p className="font-bold text-fg">FIFO — נכנס ראשון, יוצא ראשון</p>
            <p className="mt-1 text-[14.5px] text-fg/85">הוותיקות נמכרות קודם; על המדף נשארות האחרונות.</p>
          </div>
          <div className="rounded-xl border-2 border-line-strong bg-surface p-4">
            <p className="font-bold text-fg">ממוצע משוקלל</p>
            <p className="mt-1 text-[14.5px] text-fg/85">כל יחידה שווה לממוצע: תקופתי (אחד לשנה) או נע (חדש אחרי כל קנייה).</p>
          </div>
        </Wide>
        <KeyCard>LIFO אסור. ולמלאי דומה באופיו ובשימוש — אותה נוסחה.</KeyCard>
        <p>חנות האוזניות &quot;צליל&quot;: שלוש קניות ושתי מכירות. שנו את מחירי הרכישה, או הפכו את המגמה — ותראו את השיטות נפרדות:</p>
        <Wide>
          <FormulaLab />
        </Wide>
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="tzlil" label="פתחו את צליל במחשבון" />
        </div>
      </>
    ),
  },
};
