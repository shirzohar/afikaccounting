"use client";

import { useEffect } from "react";
import type { TrackEvent as Event } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * Records one usage event when it mounts. With `once`, at most once per
 * browser (kept in storage under that key), for milestones such as finishing
 * the free course. Renders nothing.
 */
export function TrackEvent({ event, once }: { event: Event; once?: string }) {
  const key = JSON.stringify(event);
  useEffect(() => {
    const e = JSON.parse(key) as Event;
    if (once) {
      try {
        const k = `afik.tracked.${once}`;
        if (localStorage.getItem(k)) return;
        localStorage.setItem(k, "1");
      } catch {
        // Storage blocked: count it anyway.
      }
    }
    track(e);
  }, [key, once]);
  return null;
}
