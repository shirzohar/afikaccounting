import type { StudyModule } from "./types";

/** A lesson's address; with a screen id, the address that opens that concept screen. */
export const lessonHref = (slug: string, screen?: string) => `/study/${slug}${screen ? `?screen=${screen}` : ""}`;

/** The lesson and index of a concept screen, by its id, among these lessons. */
export function findScreenIn(lessons: StudyModule[], id: string) {
  for (const m of lessons) {
    const i = m.screens.findIndex((s) => s.id === id);
    if (i >= 0) return { module: m, index: i, title: m.screens[i].title };
  }
  return undefined;
}

/** Where a concept screen lives. Throws on an unknown id, so a broken link fails the build, not the reader. */
export function screenHrefIn(lessons: StudyModule[], id: string) {
  const hit = findScreenIn(lessons, id);
  if (!hit) throw new Error(`Unknown screen ${id}`);
  return lessonHref(hit.module.slug, id);
}
