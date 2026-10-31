import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ENGINE_TOOLS, EXAMS_HUB, LEARN_HUB, LEARNING_TOOLS, PRICING_HUB, TOPICS } from "@/lib/catalog";
import { listContent } from "@/lib/data/content";
import { listExams } from "@/lib/data/exams";
import type { SearchItem } from "@/lib/search";
import { STUDY_MODULES } from "@/lib/study";
import { lessonHref } from "@/lib/study/paths";

const topicName = (id: string) => {
  const t = TOPICS.find((x) => x.id === id);
  return t ? (t.standard ? `${t.title} (${t.standard})` : t.title) : "";
};

/**
 * Everything the quick search can reach, from the same sources the site is
 * built from: the catalog, the lessons and their concept screens (each opens
 * straight on its screen), the calculators, the published exams and the
 * content hub. Titles and addresses only — nothing locked. Cached; refreshed
 * with the exams and the content.
 */
export async function searchIndex(): Promise<SearchItem[]> {
  "use cache";
  cacheTag("exams", "content");
  cacheLife("hours");
  const items: SearchItem[] = [];

  for (const t of TOPICS) {
    items.push({ kind: "course", title: topicName(t.id), hint: t.covers.join(" · "), href: t.href, tier: t.tier === "free" ? undefined : "courses" });
  }
  for (const m of Object.values(STUDY_MODULES).sort((a, b) => a.backHref.localeCompare(b.backHref) || a.n - b.n)) {
    const topic = TOPICS.find((t) => t.href === m.backHref);
    const paid = topic && topic.tier !== "free" && !topic.preview.includes(m.slug) ? ("courses" as const) : undefined;
    items.push({ kind: "lesson", title: m.title, hint: `${m.course} · שיעור ${m.n}`, href: lessonHref(m.slug), tier: paid });
    for (const s of m.screens) items.push({ kind: "concept", title: s.title, hint: `${m.course} · שיעור ${m.n}: ${m.title}`, href: lessonHref(m.slug, s.id), tier: paid });
  }
  for (const c of LEARNING_TOOLS) items.push({ kind: "tool", title: c.label, hint: c.topic, href: c.href });
  for (const c of ENGINE_TOOLS) items.push({ kind: "tool", title: `${c.standard} · ${c.label}`, hint: `מנוע הפתרונות · ${c.description ?? ""}`, href: c.href });
  for (const e of await listExams()) items.push({ kind: "exam", title: e.title, hint: `${EXAMS_HUB.label} · ${topicName(e.topic)} · ${e.subjects.join(" · ")}`, href: `/exams/${e.id}`, tier: e.isSample ? undefined : "exams" });
  for (const c of await listContent()) items.push({ kind: "content", title: c.title, hint: `${c.kind === "video" ? "וידאו" : "מאמר"} · ${c.standard} · ${c.category}`, href: `/content/${c.slug}` });
  items.push(
    { kind: "page", title: LEARN_HUB.label, hint: "כל הקורסים לפי הסדר", href: LEARN_HUB.href },
    { kind: "page", title: EXAMS_HUB.label, hint: "תרגילים ברמת מבחן עם פתרון מלא", href: EXAMS_HUB.href },
    { kind: "page", title: PRICING_HUB.label, hint: "מסלולים ומנוי", href: PRICING_HUB.href },
    { kind: "page", title: "הלוח האישי", hint: "השיעור הבא שלי", href: "/dashboard" },
    { kind: "page", title: "פרופיל ומנוי", hint: "המנוי, החשבוניות והפרטים", href: "/profile" },
  );
  return items;
}
