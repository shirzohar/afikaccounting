import { maxXp, move, type Place, PRACTICE_GROUPS, practiceAt, practiceId, practiceOf, STEPS, type TopicProgress, xpOf } from "./score";
import type { StudyModule } from "./types";

/**
 * A lesson as the reader moves through it: what each place is called (for
 * "previous" and "next", which name where they go), and the lesson's outline
 * — its concepts, its practice by kind of question, its summary — for the
 * course bar beside it.
 */

/** A place's name: the concept's title, the move into practice, a question, or the summary. */
export function placeLabel(m: StudyModule, place: Place): string {
  const id = STEPS[place.step].id;
  if (id === "learn") return m.screens[place.sub]?.title ?? "";
  if (id === "summary") return "סיכום וטיפים זהב";
  const it = practiceAt(m, place.sub);
  if (!it) return `עוברים לתרגול (${practiceOf(m).length} שאלות)`;
  return `שאלה ${place.sub} · ${it.group.label}`;
}

/** Where "previous" and "next" go from a place, and their names; none at either end. The opening is before the first screen. */
export function neighbours(m: StudyModule, place: Place, opening: boolean) {
  if (opening) return { prev: undefined, next: { place: { step: 0, sub: 0 }, label: placeLabel(m, { step: 0, sub: 0 }) } };
  const back = move(m, place, -1);
  const fwd = move(m, place, 1);
  const first = place.step === 0 && place.sub === 0;
  return {
    prev: first ? { place: undefined, label: "על השיעור" } : { place: back, label: placeLabel(m, back) },
    next: fwd.step === place.step && fwd.sub === place.sub ? undefined : { place: fwd, label: placeLabel(m, fwd) },
  };
}

export type PracticeGroupOutline = { id: string; label: string; n: number; answered: number; place: Place };

/** The practice, by kind of question: how many, how many answered, and where each kind starts. */
export function practiceGroups(m: StudyModule, p: TopicProgress): PracticeGroupOutline[] {
  const items = practiceOf(m);
  const step = STEPS.findIndex((s) => s.id === "practice");
  return PRACTICE_GROUPS.map((g) => {
    const mine = items.map((it, i) => ({ it, sub: i + 1 })).filter((x) => x.it.group === g);
    const answered = mine.filter(({ it }) => (it.kind === "exercise" ? p.exercises[practiceId(it)]?.done : p.traps[practiceId(it)])).length;
    return { id: g.id, label: g.label, n: mine.length, answered, place: { step, sub: mine[0]?.sub ?? 0 } };
  }).filter((g) => g.n > 0);
}

/** How far through the lesson, by XP, in whole percent. */
export const percentOf = (m: StudyModule, p: TopicProgress) => Math.round((xpOf(m, p) / maxXp(m)) * 100);
