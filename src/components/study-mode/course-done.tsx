"use client";

import { TrackEvent } from "@/components/layout/track-event";
import { statusOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { useTopic } from "./progress-store";

/** Records, once per browser, finishing a course: its last lesson done. Renders nothing else. */
export function CourseDone({ module: m, course }: { module: StudyModule; course: string }) {
  const done = statusOf(m, useTopic(m.slug)) === "done";
  return done ? <TrackEvent event={{ kind: "course_complete", target: course }} once={`course-done-${course}`} /> : null;
}
