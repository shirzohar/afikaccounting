"use client";

import Link from "next/link";
import { createContext, type ReactNode, useContext } from "react";
import { findScreen } from "@/lib/study";
import { lessonHref } from "@/lib/study/paths";

/** The open lesson, so a link to one of its own screens moves there instead of reloading. */
export const LessonContext = createContext<{ slug: string; jump: (screen: string) => void } | null>(null);

/** A link to a concept screen of the course, named by its title (or by `children`). */
export function ScreenLink({ id, children }: { id: string; children?: ReactNode }) {
  const lesson = useContext(LessonContext);
  const hit = findScreen(id);
  if (!hit) throw new Error(`Unknown screen ${id}`);
  const label = children ?? <>״{hit.title}״</>;
  const className = "font-medium text-accent hover:underline";
  if (lesson?.slug === hit.module.slug)
    return (
      <button type="button" onClick={() => lesson.jump(id)} className={className}>
        {label}
      </button>
    );
  return (
    <Link href={lessonHref(hit.module.slug, id)} className={className}>
      {label}
    </Link>
  );
}
