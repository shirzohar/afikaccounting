import { findScreenIn, lessonHref, screenHrefIn } from "../paths";
import { COST } from "./cost";
import { EXAM } from "./exam";
import { FORMULAS } from "./formulas";
import { INTRO } from "./intro";
import { NRV_LESSON } from "./nrv";
import { UNKNOWNS } from "./unknowns";

/** The inventory course: six lessons, in order. */
export const INVENTORY_LESSONS = [INTRO, COST, FORMULAS, NRV_LESSON, UNKNOWNS, EXAM];

/** The lesson and index of a concept screen of the course, by its id. */
export const findInventoryScreen = (id: string) => findScreenIn(INVENTORY_LESSONS, id);

/** Where a concept screen of the course lives. Throws on an unknown id. */
export const inventoryScreenHref = (id: string) => screenHrefIn(INVENTORY_LESSONS, id);

/** The calculator's screen: where "try it in the calculator" goes. */
export const INVENTORY_CALC = "inv-calc";

/**
 * The former long page's chapter anchors (/basics/inventory#id), and where
 * each now lives. Every chapter kept its id as the first screen of its
 * content; the closing chapter of tools, and the calculator inside it, open
 * the calculator's screen.
 */
export const INVENTORY_LEGACY_CHAPTERS = [
  "inv-idea", "inv-terms", "inv-systems", "inv-cogs", "inv-cost", "inv-formulas", "inv-fifo", "inv-wa",
  "inv-ma", "inv-nrv", "inv-count", "inv-unknowns", "inv-exam", "inv-fullexam", "inv-tools", "inv-calc",
] as const;

export function inventoryLegacyHref(id: string): string | undefined {
  if (id === "inv-tools") return inventoryScreenHref(INVENTORY_CALC);
  const hit = findInventoryScreen(id);
  return hit && lessonHref(hit.module.slug, id);
}
