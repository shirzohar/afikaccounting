/**
 * The exams area: exams (public metadata) and their worked solutions (gated).
 * Plain data, as stored in the database (exams, exam_solutions) and in the
 * demo seed; the solution page renders each block with the lessons' own components.
 */

export type ExamMeta = {
  id: string;
  /** A topic id from the catalog ("inventory", "ias16"…). */
  topic: string;
  year: number;
  /** "מועד א׳" — or empty for an exam-level exercise. */
  session: string;
  title: string;
  description: string;
  /** What it covers, for the filter. */
  subjects: string[];
  /** Has a question paper file (in the private bucket). */
  hasPaper: boolean;
  /** Open to everyone, as a taste. */
  isSample: boolean;
  published: boolean;
};

/** One piece of a solution step (or of the question), each shown with the lessons' component for it. */
export type ExamBlock =
  /** A paragraph in the light markup of articles: **bold**, *italic*, $formula$, "- " lists. */
  | { kind: "text"; text: string }
  /** A journal entry (JournalEntry). */
  | { kind: "entry"; title: string; date?: string; lines: { account: string; dr?: number; cr?: number }[]; note?: string }
  /** A table (DataTable): numbers are formatted and aligned. */
  | { kind: "table"; caption?: string; head: string[]; rows: (string | number)[][]; foot?: (string | number)[] }
  /** A sum written out (Calc). */
  | { kind: "calc"; text: string; result?: string }
  /** A tip or a trap (Callout). */
  | { kind: "note"; tone: "tip" | "warn"; title: string; text: string };

export type SolutionStep = { title: string; explanation: string; blocks: ExamBlock[] };

/** What only a reader who may open the exam gets. */
export type ExamContent = {
  question: ExamBlock[];
  steps: SolutionStep[];
  /** A YouTube/Vimeo link, or a path in the private bucket (served through a signed link). */
  video: string | null;
  videoSeconds: number;
  hasSolutionFile: boolean;
};

export type ExamFilters = { topic?: string; subject?: string; year?: string };

/** "2026 · מועד א׳", or the year alone. */
export const examWhen = (e: Pick<ExamMeta, "year" | "session">) => (e.session ? `${e.year} · ${e.session}` : String(e.year));

export function matchesExam(e: ExamMeta, f: ExamFilters) {
  return (!f.topic || e.topic === f.topic) && (!f.subject || e.subjects.includes(f.subject)) && (!f.year || String(e.year) === f.year);
}

/** Samples first, then newest, then by title. */
export const examOrder = (a: ExamMeta, b: ExamMeta) => Number(b.isSample) - Number(a.isSample) || b.year - a.year || a.title.localeCompare(b.title, "he");
