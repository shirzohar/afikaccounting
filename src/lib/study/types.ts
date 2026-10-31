import type { Choice, Entry, EntryQ, NumberQ, Question } from "@/lib/learn/basics";

/**
 * One interactive lesson, in three steps: concept screens, practice (its
 * exercises and traps together, by kind of question) and a summary. Plain data, so it can be tested and handed to the client shell;
 * the concept screens' content (JSX) is looked up by screen id on the server.
 */
export type StudyModule = {
  slug: string;
  /** The course this lesson belongs to, as the header shows it. */
  course: string;
  /** The lesson's number in its course. */
  n: number;
  title: string;
  /** One line on what the lesson covers, for the course page. */
  description: string;
  /** The course page this lesson belongs to, and where "exit" goes. */
  backHref: string;
  /** The concept screens, in order. The first screen of a former chapter keeps its id. */
  screens: { id: string; title: string }[];
  /** The practice at the end of the lesson. */
  exercises: Exercise[];
  traps: Trap[];
  /** The golden tips on the summary card. */
  tips: string[];
  /** Concept screens that are tools of their own (a calculator), reachable straight from the course page and the lesson's opening. */
  tools?: { screen: string; label: string }[];
};

/** Build a whole journal entry for a transaction, from the accounts offered (the answer's, plus distractors). */
export type JournalExercise = { kind: "journal"; id: string; skill: string; entry: Entry; accounts: string[] };

/** A question with one right answer, in the practice set's shape (choice, number, pick debit and credit), without its level. */
/**
 * Amounts the learner sorts to debit or credit, and one thing left to find:
 * a trial balance with one account's balance missing (debit positive, credit
 * negative), or a T-account's movements, whose closing balance is the answer.
 */
export type BalanceGap =
  | { kind: "trial"; balances: Record<string, number>; missing: string }
  | { kind: "card"; account: string; items: { label: string; amount: number; side: "dr" | "cr" }[] };

export type QuestionExercise = Pick<Question, "id" | "skill" | "prompt" | "steps"> &
  (Choice | NumberQ | EntryQ) & {
    /** A number question answered by completing this trial balance, rather than in a bare field. */
    table?: BalanceGap;
  };

/** A practice item: a question, or a full journal entry. */
export type Exercise = QuestionExercise | JournalExercise;

/** A multiple-choice question that explains each wrong option: why it is tempting and why it is wrong. Practised with the other multiple-choice questions. */
export type Trap = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  /** Why the right answer is right. */
  why: string;
  /** One per option; the right option's is empty. */
  traps: string[];
};
