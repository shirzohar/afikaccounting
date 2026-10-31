import { Suspense } from "react";
import { CoursePath } from "@/components/study-mode/course";
import { lockedOf } from "@/lib/access";
import { getAccess } from "@/lib/auth/access";
import { topicByHref } from "@/lib/catalog";
import { outlineOf } from "@/lib/study/paths";
import type { StudyModule } from "@/lib/study/types";

/**
 * A course page's path, with the reader's locks. A free course is the plain
 * path. A paid one reads the session, so it streams in behind a boundary
 * whose fallback is the plain path: a reader with the plan never sees a lock,
 * and one without sees them as soon as the session is read. The fallback is
 * in the prerendered page that everyone gets, so past the free taste it holds
 * the lessons' outlines only — it looks the same.
 */
export function GatedCoursePath({ lessons }: { lessons: StudyModule[] }) {
  const topic = topicByHref(lessons[0].backHref);
  if (!topic || topic.tier === "free") return <CoursePath lessons={lessons} />;
  return (
    <Suspense fallback={<CoursePath lessons={lessons.map((m) => (topic.preview.includes(m.slug) ? m : outlineOf(m)))} />}>
      <WithAccess lessons={lessons} />
    </Suspense>
  );
}

async function WithAccess({ lessons }: { lessons: StudyModule[] }) {
  const topic = topicByHref(lessons[0].backHref)!;
  const locked = lockedOf(await getAccess(), topic, lessons.map((m) => m.slug));
  // With the plan, nothing is locked and nothing is tagged: the path is the same as everyone's.
  if (!locked.length) return <CoursePath lessons={lessons} />;
  // A locked lesson goes to the browser as its outline only: its questions stay on the server.
  return <CoursePath lessons={lessons.map((m) => (locked.includes(m.slug) ? outlineOf(m) : m))} locked={locked} previews={topic.preview} />;
}
