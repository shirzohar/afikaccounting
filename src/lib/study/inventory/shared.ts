import type { Entry } from "@/lib/learn/basics";
import type { JournalExercise, QuestionExercise } from "../types";

/** What every lesson of the inventory course shares: its name and its page. */
export const COURSE = "מלאי (IAS 2)";
export const COURSE_HREF = "/basics/inventory";

/** Amounts in prompts, as the basics course writes them. */
export const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** A journal-entry question: the event, the answer's lines, why, and the accounts offered (the answer's and some that tempt). */
export const journal = (id: string, skill: string, text: string, lines: Entry["lines"], why: string, accounts: string[]): JournalExercise => ({
  kind: "journal",
  id,
  skill,
  entry: { id: "1", text, lines, why },
  accounts,
});

/** A multiple-choice question with one right option and the reason it is right. */
export const choice = (id: string, skill: string, prompt: string, options: string[], answer: number, why: string): QuestionExercise => ({
  kind: "choice",
  id,
  skill,
  prompt,
  options,
  answer,
  steps: [why],
});

/** A calculation: the answer, and the worked solution step by step. */
export const calc = (id: string, skill: string, prompt: string, answer: number, steps: string[]): QuestionExercise => ({
  kind: "number",
  id,
  skill,
  prompt,
  answer,
  steps,
});
