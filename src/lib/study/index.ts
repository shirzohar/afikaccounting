import { BASICS_LESSONS } from "./basics";
import { INVENTORY_LESSONS } from "./inventory";
import { findScreenIn } from "./paths";
import type { StudyModule } from "./types";

/** Every interactive lesson, by slug: /study/[slug]. */
export const STUDY_MODULES: Record<string, StudyModule> = Object.fromEntries([...BASICS_LESSONS, ...INVENTORY_LESSONS].map((m) => [m.slug, m]));

export const studyHref = (slug: string) => `/study/${slug}`;

/** The lesson and index of a concept screen, by its id, in any course. */
export const findScreen = (id: string) => findScreenIn(Object.values(STUDY_MODULES), id);
