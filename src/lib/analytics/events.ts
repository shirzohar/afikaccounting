/**
 * Usage events: what the site records, shared by the browser tracker and the
 * /api/track route that validates and stores them. Events are anonymous: a
 * random per-tab session id, never the account, unless the visitor is signed in.
 */

export const EVENT_KINDS = [
  "page_view",
  "calc_run",
  "calc_invalid",
  "download",
  "video_play",
  "preset_load",
  // The funnel: home page → lesson 1 → sign-up → free course done → paywall → pricing → a plan.
  "landing_view",
  "lesson_start",
  "signup",
  "course_complete",
  "paywall_view",
  "pricing_view",
  "plan_click",
  // Payments: a checkout started, a payment that went through, a subscription cancelled.
  "checkout_start",
  "payment_success",
  "subscription_cancel",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const VIDEO_SOURCES = ["upload", "youtube", "vimeo", "demo", "external"] as const;
export type VideoSource = (typeof VIDEO_SOURCES)[number];

export type TrackEvent = {
  kind: EventKind;
  path?: string;
  calculator?: string;
  mode?: "regular" | "solve";
  ok?: boolean;
  durationMs?: number;
  presetId?: string;
  /** The download URL or the video's content slug. */
  target?: string;
  /** A human name for the target: the file or video title. */
  label?: string;
  source?: VideoSource;
  meta?: Record<string, string | number | boolean>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** The database row for an untrusted event body, or null if it isn't one. */
export function toRow(body: unknown, sessionId: unknown) {
  if (!body || typeof body !== "object") return null;
  const e = body as Record<string, unknown>;
  if (!EVENT_KINDS.includes(e.kind as EventKind)) return null;
  const session = text(sessionId, 64);
  if (!session || session.length < 8) return null;

  const meta: Record<string, string | number | boolean> = {};
  if (e.meta && typeof e.meta === "object") {
    for (const [k, v] of Object.entries(e.meta).slice(0, 12)) {
      if (typeof v === "number" || typeof v === "boolean") meta[k.slice(0, 40)] = v;
      else if (typeof v === "string") meta[k.slice(0, 40)] = v.slice(0, 120);
    }
  }
  const ms = typeof e.durationMs === "number" && Number.isFinite(e.durationMs) ? Math.round(Math.min(Math.max(e.durationMs, 0), 600000)) : null;
  return {
    kind: e.kind as EventKind,
    session_id: session,
    path: text(e.path, 300) ?? "",
    calculator: text(e.calculator, 80),
    mode: e.mode === "regular" || e.mode === "solve" ? e.mode : null,
    ok: typeof e.ok === "boolean" ? e.ok : null,
    duration_ms: ms,
    preset_id: typeof e.presetId === "string" && UUID.test(e.presetId) ? e.presetId : null,
    target: text(e.target, 500),
    label: text(e.label, 200),
    source: VIDEO_SOURCES.includes(e.source as VideoSource) ? (e.source as VideoSource) : null,
    meta,
  };
}
