import { ADJUST } from "./adjust";
import { BOOKS } from "./books";
import { CREDIT } from "./credit";
import { DOUBLE_ENTRY } from "./double-entry";
import { FINAL } from "./final";
import { INTRO } from "./intro";
import { findScreenIn, lessonHref, screenHrefIn } from "../paths";

/** The basics course: six lessons, in order. */
export const BASICS_LESSONS = [INTRO, DOUBLE_ENTRY, BOOKS, ADJUST, CREDIT, FINAL];

export { lessonHref };

/** The lesson and index of a concept screen of the course, by its id. */
export const findScreen = (id: string) => findScreenIn(BASICS_LESSONS, id);

/** Where a concept screen of the course lives. Throws on an unknown id, so a broken link fails the build, not the reader. */
export const screenHref = (id: string) => screenHrefIn(BASICS_LESSONS, id);

/**
 * The former long page's chapter anchors (/basics#id), and where each now lives.
 * Concept chapters keep their id as a screen; practice moved to the closing
 * lesson's practice step, and the summary to the course page's reference section.
 */
export const LEGACY_CHAPTERS = [
  "what", "entity", "types", "equation", "expense", "double", "lab", "credit", "loan", "taccounts",
  "trial", "retained", "reports", "accrual", "inventory", "worksheet", "practice", "summary",
] as const;

export function legacyHref(id: string): string | undefined {
  if (id === "practice") return `/study/${BASICS_LESSONS.at(-1)!.slug}?step=2`;
  if (id === "summary" || id === "cheatsheet") return "#reference";
  return findScreen(id) ? screenHref(id) : undefined;
}
