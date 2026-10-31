import "server-only";
import type { ScreenContent } from "@/components/study-mode/shell";
import type { StudyModule } from "@/lib/study/types";
import { ADJUST_SCREENS } from "./adjust";
import { BOOKS_SCREENS } from "./books";
import { CREDIT_SCREENS } from "./credit";
import { ENTRIES_SCREENS } from "./entries";
import { FINAL_SCREENS } from "./final";
import { INTRO_SCREENS } from "./intro";
import { INVENTORY_SCREENS } from "./inventory";
import { EXAM_SCREENS } from "./inventory-exam";
import { METHOD_SCREENS } from "./inventory-methods";
import { LAB_SCREENS } from "./lab-chapter";

/** Every concept screen of every course, by id: the basics course, then inventory. */
const SCREENS: Record<string, ScreenContent> = {
  ...INTRO_SCREENS,
  ...ENTRIES_SCREENS,
  ...LAB_SCREENS,
  ...BOOKS_SCREENS,
  ...ADJUST_SCREENS,
  ...CREDIT_SCREENS,
  ...FINAL_SCREENS,
  ...INVENTORY_SCREENS,
  ...METHOD_SCREENS,
  ...EXAM_SCREENS,
};

/** A lesson's concept screens, in its order. A screen listed in the lesson but missing here fails the build. */
export function screensFor(m: StudyModule): ScreenContent[] {
  return m.screens.map((s) => {
    const c = SCREENS[s.id];
    if (!c) throw new Error(`${m.slug}: no content for screen ${s.id}`);
    return c;
  });
}

/** Screens with content that no lesson lists — kept honest by the build. */
export function orphanScreens(modules: StudyModule[]) {
  const listed = new Set(modules.flatMap((m) => m.screens.map((s) => s.id)));
  return Object.keys(SCREENS).filter((id) => !listed.has(id));
}
