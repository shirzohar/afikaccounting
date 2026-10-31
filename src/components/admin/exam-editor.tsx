"use client";

import { ArrowDown, ArrowUp, ExternalLink, FileUp, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert, inputClass } from "@/components/ui/form";
import { Badge } from "@/components/ui/primitives";
import { deleteExam, type ExamFileKind, type ExamInput, saveExam, saveSolution, setExamFile } from "@/lib/actions/admin-exams";
import { TOPICS } from "@/lib/catalog";
import type { AdminExam } from "@/lib/data/admin";
import type { ExamBlock } from "@/lib/exams/types";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Field } from "./modal";

/**
 * A block as edited: amounts and table cells are the text typed ("1,200",
 * "(300)"), turned into numbers on the server when the solution is saved.
 */
type Draft =
  | { kind: "text"; text: string }
  | { kind: "entry"; title: string; date: string; note: string; lines: { account: string; dr: string; cr: string }[] }
  | { kind: "table"; caption: string; head: string; rows: string; foot: string }
  | { kind: "calc"; text: string; result: string }
  | { kind: "note"; tone: "tip" | "warn"; title: string; text: string };
type StepDraft = { title: string; explanation: string; blocks: Draft[] };

const KINDS: { kind: Draft["kind"]; label: string }[] = [
  { kind: "text", label: "טקסט" },
  { kind: "entry", label: "פקודת יומן" },
  { kind: "table", label: "טבלה" },
  { kind: "calc", label: "חישוב" },
  { kind: "note", label: "טיפ / מלכודת" },
];

const blank = (kind: Draft["kind"]): Draft =>
  kind === "text"
    ? { kind, text: "" }
    : kind === "entry"
      ? { kind, title: "", date: "", note: "", lines: [{ account: "", dr: "", cr: "" }, { account: "", dr: "", cr: "" }] }
      : kind === "table"
        ? { kind, caption: "", head: "", rows: "", foot: "" }
        : kind === "calc"
          ? { kind, text: "", result: "" }
          : { kind, tone: "tip", title: "", text: "" };

const amount = (v?: number) => (v === undefined ? "" : String(v));
const cells = (r: (string | number)[]) => r.join(" | ");
const toDraft = (b: ExamBlock): Draft => {
  switch (b.kind) {
    case "entry":
      return { kind: "entry", title: b.title, date: b.date ?? "", note: b.note ?? "", lines: b.lines.map((l) => ({ account: l.account, dr: amount(l.dr), cr: amount(l.cr) })) };
    case "table":
      return { kind: "table", caption: b.caption ?? "", head: cells(b.head), rows: b.rows.map(cells).join("\n"), foot: b.foot ? cells(b.foot) : "" };
    case "calc":
      return { kind: "calc", text: b.text, result: b.result ?? "" };
    default:
      return b;
  }
};
const split = (line: string) => line.split("|").map((c) => c.trim());
/** What the server's parser takes: tables back to rows of cells. */
const toInput = (d: Draft) =>
  d.kind === "table" ? { kind: "table", caption: d.caption, head: split(d.head), rows: d.rows.split("\n").filter((l) => l.trim()).map(split), foot: d.foot.trim() ? split(d.foot) : undefined } : d;

const DETAILS = (e?: AdminExam): ExamInput => ({
  topic: e?.topic ?? "inventory",
  year: e?.year ?? new Date().getFullYear(),
  session: e?.session ?? "",
  title: e?.title ?? "",
  description: e?.description ?? "",
  subjects: e?.subjects ?? [],
  isSample: e?.isSample ?? false,
  published: e?.published ?? false,
});

export function ExamEditor({ exam }: { exam?: AdminExam }) {
  const router = useRouter();
  const [form, setForm] = useState<ExamInput>(() => DETAILS(exam));
  const [subjects, setSubjects] = useState((exam?.subjects ?? []).join(", "));
  const [question, setQuestion] = useState<Draft[]>(() => (exam?.solution.question ?? []).map(toDraft));
  const [steps, setSteps] = useState<StepDraft[]>(() => (exam?.solution.steps ?? []).map((s) => ({ ...s, blocks: s.blocks.map(toDraft) })));
  const [video, setVideo] = useState(exam?.solution.video ?? "");
  const [videoSeconds, setVideoSeconds] = useState(String(exam?.solution.videoSeconds || ""));
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<{ error?: string; ok?: string }>({});

  const set = <K extends keyof ExamInput>(k: K, v: ExamInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const run = async (what: string, fn: () => Promise<{ ok: boolean; error?: string; id?: string }>, ok: string) => {
    setBusy(what);
    setMessage({});
    const res = await fn();
    setBusy(undefined);
    setMessage(res.ok ? { ok } : { error: res.error });
    return res;
  };

  const saveDetails = async () => {
    const res = await run("details", () => saveExam({ ...form, subjects: subjects.split(/[,،]/) }, exam?.id), "הפרטים נשמרו.");
    if (!res.ok) return;
    if (!exam && res.id) router.replace(`/admin/exams/${res.id}`);
    else router.refresh();
  };
  const saveContent = () =>
    exam &&
    run(
      "solution",
      () => saveSolution(exam.id, { question: question.map(toInput), steps: steps.map((s) => ({ ...s, blocks: s.blocks.map(toInput) })), video, videoSeconds: Number(videoSeconds) || 0 }),
      "השאלה והפתרון נשמרו.",
    ).then(() => router.refresh());
  const remove = async () => {
    if (!exam || !confirm(`למחוק את ״${exam.title}״, את הפתרון שלו ואת כל הקבצים שלו לצמיתות?`)) return;
    const res = await run("delete", () => deleteExam(exam.id), "");
    if (res.ok) router.replace("/admin/exams");
  };

  return (
    <div className="space-y-6">
      <FormAlert error={message.error} message={message.ok} />

      <section className="card space-y-5 p-5">
        <h2 className="text-sm font-semibold text-fg">פרטים — גלויים לכולם ברשימת המבחנים</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="כותרת">
            <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="קורס">
            <select className={inputClass} value={form.topic} onChange={(e) => set("topic", e.target.value)}>
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.standard ? `${t.title} (${t.standard})` : t.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="שנה">
            <input type="number" dir="ltr" className={inputClass} value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
          </Field>
          <Field label="מועד" hint="למשל ״מועד א׳״. ריק לתרגיל ברמת מבחן.">
            <input className={inputClass} value={form.session} onChange={(e) => set("session", e.target.value)} />
          </Field>
          <Field label="נושאים" hint="מופרדים בפסיקים — לסינון בדף המבחנים">
            <input className={inputClass} value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="FIFO, שווי מימוש נטו" />
          </Field>
          <Field label="תיאור קצר">
            <textarea rows={2} className={cn(inputClass, "h-auto py-2.5")} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Check label="לדוגמה — פתוח לכולם, בלי מנוי" checked={form.isSample} onChange={(v) => set("isSample", v)} />
          <Check label="פורסם — מופיע באתר" checked={form.published} onChange={(v) => set("published", v)} />
          <div className="ms-auto flex gap-2">
            {exam?.published && (
              <a href={`/exams/${exam.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 px-2 text-sm text-muted hover:text-fg">
                <ExternalLink className="h-4 w-4" /> באתר
              </a>
            )}
            <Button onClick={saveDetails} disabled={!!busy}>
              {busy === "details" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {exam ? "שמירת הפרטים" : "יצירת המבחן"}
            </Button>
          </div>
        </div>
      </section>

      {!exam ? (
        <p className="text-sm text-muted">אחרי היצירה אפשר להעלות את השאלון ולכתוב את הפתרון.</p>
      ) : (
        <>
          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-fg">קבצים — בתיקייה פרטית, נפתחים רק למי שיש לו גישה</h2>
            <FileSlot examId={exam.id} kind="question" label="השאלון (PDF)" accept="application/pdf" path={exam.questionPath} onDone={() => router.refresh()} />
            <FileSlot examId={exam.id} kind="solution" label="הפתרון כקובץ (לא חובה)" accept=".pdf,.xlsx,.xls,.docx" path={exam.solution.solutionPath} onDone={() => router.refresh()} />
            <FileSlot
              examId={exam.id}
              kind="video"
              label="סרטון פתרון — קובץ (לא חובה)"
              accept="video/mp4,video/webm"
              path={exam.solution.video && !/^https?:\/\//.test(exam.solution.video) ? exam.solution.video : null}
              onDone={(p) => {
                // The editor's video follows the file, so saving the solution keeps it.
                setVideo(p ?? "");
                router.refresh();
              }}
            />
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-fg">השאלה כטקסט — לא חובה כשיש שאלון</h2>
            <BlocksEditor blocks={question} onChange={setQuestion} />
          </section>

          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex-1 text-sm font-semibold text-fg">הפתרון, שלב אחר שלב</h2>
              <Badge>{steps.length} שלבים</Badge>
            </div>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="rounded-2xl border border-line-strong p-4">
                  <div className="flex items-center gap-2">
                    <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{i + 1}</span>
                    <input className={cn(inputClass, "h-9 flex-1")} value={s.title} placeholder="כותרת השלב" onChange={(e) => setSteps(edit(steps, i, { ...s, title: e.target.value }))} />
                    <Order list={steps} i={i} onChange={setSteps} what="השלב" />
                  </div>
                  <textarea
                    rows={3}
                    className={cn(inputClass, "mt-3 h-auto py-2.5")}
                    value={s.explanation}
                    placeholder="ההסבר: מה עושים בשלב הזה ולמה. **מודגש**, $נוסחה$, שורות שמתחילות ב- ״- ״ לרשימה; שורה ריקה בין פסקאות."
                    onChange={(e) => setSteps(edit(steps, i, { ...s, explanation: e.target.value }))}
                  />
                  <div className="mt-3">
                    <BlocksEditor blocks={s.blocks} onChange={(blocks) => setSteps(edit(steps, i, { ...s, blocks }))} />
                  </div>
                </li>
              ))}
            </ol>
            <Button variant="secondary" onClick={() => setSteps([...steps, { title: "", explanation: "", blocks: [] }])}>
              <Plus className="h-4 w-4" /> הוספת שלב
            </Button>
            <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Field label="סרטון פתרון — קישור YouTube / Vimeo" hint="או העלאת קובץ למעלה. קישור כאן מחליף קובץ.">
                <input dir="ltr" className={inputClass} value={/^https?:\/\//.test(video) ? video : ""} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/…" />
              </Field>
              <Field label="אורך הסרטון (שניות)">
                <input type="number" dir="ltr" className={inputClass} value={videoSeconds} onChange={(e) => setVideoSeconds(e.target.value)} />
              </Field>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={saveContent} disabled={!!busy}>
              {busy === "solution" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} שמירת השאלה והפתרון
            </Button>
            <Link href="/admin/exams" className="px-2 text-sm text-muted hover:text-fg">
              חזרה לרשימה
            </Link>
            <Button variant="danger" onClick={remove} disabled={!!busy} className="ms-auto">
              <Trash2 className="h-4 w-4" /> מחיקת המבחן
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

const edit = <T,>(list: T[], i: number, v: T) => list.map((x, j) => (j === i ? v : x));

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

/** Up, down and delete for an item in a list. */
function Order<T>({ list, i, onChange, what }: { list: T[]; i: number; onChange: (l: T[]) => void; what: string }) {
  const swap = (j: number) => {
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const btn = "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30";
  return (
    <span className="flex shrink-0">
      <button type="button" className={btn} disabled={i === 0} onClick={() => swap(i - 1)} aria-label={`להזיז את ${what} למעלה`}>
        <ArrowUp className="h-4 w-4" />
      </button>
      <button type="button" className={btn} disabled={i === list.length - 1} onClick={() => swap(i + 1)} aria-label={`להזיז את ${what} למטה`}>
        <ArrowDown className="h-4 w-4" />
      </button>
      <button type="button" className={cn(btn, "hover:text-danger")} onClick={() => confirm(`למחוק את ${what}?`) && onChange(list.filter((_, j) => j !== i))} aria-label={`מחיקת ${what}`}>
        <Trash2 className="h-4 w-4" />
      </button>
    </span>
  );
}

function BlocksEditor({ blocks, onChange }: { blocks: Draft[]; onChange: (b: Draft[]) => void }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface-2/40 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="accent">{KINDS.find((k) => k.kind === b.kind)!.label}</Badge>
            <span className="flex-1" />
            <Order list={blocks} i={i} onChange={onChange} what="הבלוק" />
          </div>
          <BlockFields block={b} onChange={(v) => onChange(edit(blocks, i, v))} />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted">הוספה:</span>
        {KINDS.map((k) => (
          <button key={k.kind} type="button" onClick={() => onChange([...blocks, blank(k.kind)])} className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong px-2.5 text-xs font-medium text-fg hover:border-accent/50">
            <Plus className="h-3.5 w-3.5" /> {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockFields({ block: b, onChange }: { block: Draft; onChange: (b: Draft) => void }) {
  const area = (value: string, set: (v: string) => void, placeholder: string, rows = 3, ltr = false) => (
    <textarea rows={rows} dir={ltr ? "ltr" : undefined} className={cn(inputClass, "h-auto py-2", ltr && "font-mono text-xs")} value={value} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
  );
  const line = (value: string, set: (v: string) => void, placeholder: string, className?: string): ReactNode => (
    <input className={cn(inputClass, "h-9", className)} value={value} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
  );
  switch (b.kind) {
    case "text":
      return area(b.text, (text) => onChange({ ...b, text }), "פסקה. **מודגש**, $נוסחה$, ושורות שמתחילות ב- ״- ״ לרשימה.");
    case "calc":
      return (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {line(b.text, (text) => onChange({ ...b, text }), "מה מחשבים: 300 × 66")}
          {line(b.result, (result) => onChange({ ...b, result }), "התוצאה: 19,800 ₪")}
        </div>
      );
    case "note":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select className={cn(inputClass, "h-9 w-36")} value={b.tone} onChange={(e) => onChange({ ...b, tone: e.target.value as "tip" | "warn" })}>
              <option value="tip">טיפ</option>
              <option value="warn">מלכודת נפוצה</option>
            </select>
            {line(b.title, (title) => onChange({ ...b, title }), "כותרת", "flex-1")}
          </div>
          {area(b.text, (text) => onChange({ ...b, text }), "ההסבר", 2)}
        </div>
      );
    case "table":
      return (
        <div className="space-y-2">
          {line(b.caption, (caption) => onChange({ ...b, caption }), "כותרת הטבלה (לא חובה)")}
          {line(b.head, (head) => onChange({ ...b, head }), "עמודות, מופרדות ב-| :  שכבה | יחידות | עלות")}
          {area(b.rows, (rows) => onChange({ ...b, rows }), "שורה בכל שורה, תאים מופרדים ב-|\nמלאי פתיחה | 200 | 10,000", 4)}
          {line(b.foot, (foot) => onChange({ ...b, foot }), "שורת סיכום (לא חובה): סה״כ | 1,000 | 61,000")}
          <p className="text-xs text-muted">מספרים (״1,200״, ״(300)״ לשלילי) מיושרים ומעוצבים לבד.</p>
        </div>
      );
    case "entry":
      return (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {line(b.title, (title) => onChange({ ...b, title }), "כותרת הפקודה")}
            {line(b.date, (date) => onChange({ ...b, date }), "תאריך: 31.12.2026")}
          </div>
          <div className="space-y-1.5">
            {b.lines.map((l, i) => (
              <div key={i} className="flex gap-1.5">
                {line(l.account, (account) => onChange({ ...b, lines: edit(b.lines, i, { ...l, account }) }), "חשבון", "flex-1")}
                {line(l.dr, (dr) => onChange({ ...b, lines: edit(b.lines, i, { ...l, dr }) }), "חובה", "w-28")}
                {line(l.cr, (cr) => onChange({ ...b, lines: edit(b.lines, i, { ...l, cr }) }), "זכות", "w-28")}
                <button type="button" onClick={() => onChange({ ...b, lines: b.lines.filter((_, j) => j !== i) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:text-danger" aria-label="מחיקת השורה">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => onChange({ ...b, lines: [...b.lines, { account: "", dr: "", cr: "" }] })} className="text-xs font-medium text-accent hover:underline">
              + שורה
            </button>
          </div>
          {line(b.note, (note) => onChange({ ...b, note }), "הערה מתחת לפקודה (לא חובה)")}
        </div>
      );
  }
}

/** One file of the exam: upload straight to the private bucket from the browser, then attach it; or remove it. */
function FileSlot({ examId, kind, label, accept, path, onDone }: { examId: string; kind: ExamFileKind; label: string; accept: string; path: string | null; onDone: (path: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const upload = async (file: File) => {
    setBusy(true);
    setError(undefined);
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const target = `${examId}/${kind}-${Date.now()}.${ext}`;
    const supabase = createBrowserSupabase();
    const up = await supabase.storage.from("exams").upload(target, file, { contentType: file.type || undefined, upsert: false });
    if (up.error) {
      setBusy(false);
      return setError(up.error.message);
    }
    const res = await setExamFile(examId, kind, target);
    setBusy(false);
    if (!res.ok) {
      await supabase.storage.from("exams").remove([target]);
      return setError(res.error);
    }
    onDone(target);
  };
  const detach = async () => {
    if (!confirm("להסיר את הקובץ?")) return;
    setBusy(true);
    const res = await setExamFile(examId, kind, null);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else onDone(null);
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3.5 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span dir="ltr" className="block truncate text-start font-mono text-[11px] text-subtle">
          {path ?? "—"}
        </span>
        {error && <span className="block text-xs text-danger">{error}</span>}
      </span>
      {path && (
        <a href={`/exams/${examId}/file/${kind}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-fg">
          פתיחה
        </a>
      )}
      <label className={cn("inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong px-3 text-xs font-medium text-fg hover:border-accent/50", busy && "pointer-events-none opacity-50")}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />} {path ? "החלפה" : "העלאה"}
        <input type="file" accept={accept} className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      {path && (
        <button type="button" onClick={detach} disabled={busy} className="text-xs text-muted hover:text-danger">
          הסרה
        </button>
      )}
    </div>
  );
}
