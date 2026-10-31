import type { ExamBlock, SolutionStep } from "./types";

/**
 * Untrusted solution data (from the admin editor, or a database row) to clean
 * blocks and steps: unknown kinds are dropped, text is trimmed and capped,
 * numbers are numbers. Never throws.
 */

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const s = String(v ?? "").replace(/[,\s₪]/g, "");
  if (!s) return undefined;
  const n = Number(s.replace(/^\((.*)\)$/, "-$1"));
  return Number.isFinite(n) ? n : undefined;
};
/** "31.12" or "1.1.2026": a day and a month, as dates are written in exams — text, not a number. */
const isDate = (s: string) => {
  const m = s.match(/^(\d{1,2})\.(\d{1,2})(\.\d{2,4})?$/);
  return !!m && +m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12;
};
/** A table cell: a number when it reads as one ("1,200", "(300)", "48.75"), else text — a date stays text. */
export const cell = (v: unknown): string | number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : "";
  const s = str(v, 200);
  return /^\(?-?[\d,]+(\.\d+)?\)?$/.test(s) && /\d/.test(s) && !isDate(s) ? (num(s) ?? s) : s;
};
const list = <T>(v: unknown, max: number, each: (x: Record<string, unknown>) => T | null): T[] =>
  (Array.isArray(v) ? v : [])
    .slice(0, max)
    .map((x) => (x && typeof x === "object" ? each(x as Record<string, unknown>) : null))
    .filter((x): x is T => x !== null);

export function parseBlock(b: Record<string, unknown>): ExamBlock | null {
  switch (b.kind) {
    case "text": {
      const text = str(b.text, 8000);
      return text ? { kind: "text", text } : null;
    }
    case "entry": {
      const lines = list(b.lines, 40, (l) => {
        const account = str(l.account, 120);
        const dr = num(l.dr);
        const cr = num(l.cr);
        if (!account || (dr === undefined && cr === undefined)) return null;
        return { account, ...(dr !== undefined ? { dr } : {}), ...(cr !== undefined ? { cr } : {}) };
      });
      if (!lines.length) return null;
      const date = str(b.date, 40);
      const note = str(b.note, 1000);
      return { kind: "entry", title: str(b.title, 200) || "פקודת יומן", ...(date ? { date } : {}), lines, ...(note ? { note } : {}) };
    }
    case "table": {
      const head = (Array.isArray(b.head) ? b.head : []).slice(0, 12).map((h) => str(h, 80));
      if (!head.length) return null;
      const row = (r: unknown) => (Array.isArray(r) ? r : []).slice(0, head.length).map(cell);
      const rows = (Array.isArray(b.rows) ? b.rows : []).slice(0, 100).map(row).filter((r) => r.some((c) => c !== ""));
      const foot = Array.isArray(b.foot) && b.foot.length ? row(b.foot) : undefined;
      const caption = str(b.caption, 200);
      return { kind: "table", ...(caption ? { caption } : {}), head, rows, ...(foot ? { foot } : {}) };
    }
    case "calc": {
      const text = str(b.text, 500);
      const result = str(b.result, 100);
      return text ? { kind: "calc", text, ...(result ? { result } : {}) } : null;
    }
    case "note": {
      const title = str(b.title, 200);
      const text = str(b.text, 2000);
      return title || text ? { kind: "note", tone: b.tone === "warn" ? "warn" : "tip", title: title || (b.tone === "warn" ? "שימו לב" : "טיפ"), text } : null;
    }
    default:
      return null;
  }
}

export const parseBlocks = (v: unknown) => list(v, 60, parseBlock);

export const parseSteps = (v: unknown): SolutionStep[] =>
  list(v, 40, (s) => {
    const step = { title: str(s.title, 200), explanation: str(s.explanation, 8000), blocks: parseBlocks(s.blocks) };
    return step.title || step.explanation || step.blocks.length ? { ...step, title: step.title || "שלב" } : null;
  });

/** Subjects as typed ("FIFO, שווי מימוש נטו"), to a clean list. */
export const parseSubjects = (v: unknown) =>
  [...new Set((Array.isArray(v) ? v : String(v ?? "").split(/[,،]/)).map((s) => str(s, 60)).filter(Boolean))].slice(0, 12);
