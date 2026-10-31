/**
 * The site's quick search (Ctrl+K): one list of everything a reader may want
 * to reach — courses, lessons, the concepts inside them, calculators, exams,
 * videos and articles — and how a query ranks it. Pure, so it is tested; the
 * list itself is built on the server (/api/search) and fetched once.
 */

export const SEARCH_KINDS = [
  { kind: "course", label: "קורסים" },
  { kind: "lesson", label: "שיעורים" },
  { kind: "concept", label: "מושגים בשיעורים" },
  { kind: "tool", label: "מחשבונים וכלים" },
  { kind: "exam", label: "מבחנים" },
  { kind: "content", label: "וידאו ומאמרים" },
  { kind: "page", label: "דפים" },
] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number]["kind"];

export type SearchItem = {
  kind: SearchKind;
  title: string;
  /** Where it is ("חשבונאות מאפס · שיעור 2"), shown under the title and searched too. */
  hint: string;
  href: string;
  /** A plan that opens it, when not free — shown as a tag; access is still checked on its page. */
  tier?: "courses" | "exams";
};

/** Lower case, no niqqud, no geresh or quotes, punctuation as spaces: "ז׳" and "ז", "IAS-16" and "ias 16" meet. */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "")
    .replace(/[׳״'"`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** How well an item matches; 0 is no match. A title beats its hint, a start beats a middle. */
export function scoreItem(item: SearchItem, query: string) {
  const q = normalize(query);
  if (!q) return 0;
  const title = normalize(item.title);
  const all = `${title} ${normalize(item.hint)}`;
  const words = q.split(" ");
  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.split(" ").some((w) => w.startsWith(q))) return 80;
  if (title.includes(q)) return 70;
  if (words.every((w) => title.includes(w))) return 60;
  if (words.every((w) => all.includes(w))) return 40;
  return 0;
}

/** The best matches, best first (ties: in the order of SEARCH_KINDS, then shorter titles). */
export function search(items: SearchItem[], query: string, limit = 24) {
  const order = (k: SearchKind) => SEARCH_KINDS.findIndex((x) => x.kind === k);
  return items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || order(a.item.kind) - order(b.item.kind) || a.item.title.length - b.item.title.length)
    .slice(0, limit)
    .map((x) => x.item);
}
