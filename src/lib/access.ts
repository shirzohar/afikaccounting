import type { Topic } from "./catalog";
import { type Tier, tierAllows } from "./pricing";

/**
 * Who may open what. Pure, so it is tested and shared by the server (which
 * decides what to render) and the course path (which marks what is locked);
 * the session and the database are read in lib/auth/access.ts.
 */

export type Access = {
  /** The reader's effective plan: a guest, or an account without a live subscription, is on "free". */
  tier: Tier;
  /** Demo mode (no Supabase): everything is open, as it always was. */
  demo: boolean;
  signedIn: boolean;
};

export type SubscriptionRow = { tier: string; status: string; current_period_end: string | null };

/** Statuses that keep a subscription open; a manual grant is "active". */
const LIVE = new Set(["active", "trialing"]);

/** The best plan among a reader's subscriptions that are live at `now`. */
export function effectiveTier(rows: SubscriptionRow[], now = new Date()): Tier {
  let best: Tier = "free";
  for (const r of rows) {
    if (!LIVE.has(r.status)) continue;
    if (r.current_period_end && new Date(r.current_period_end) <= now) continue;
    if ((r.tier === "courses" || r.tier === "exams") && tierAllows(r.tier, best)) best = r.tier;
  }
  return best;
}

/** The reader's access, from what the server knows: whether Supabase is set up, the user, admin, and their subscriptions. */
export function resolveAccess({
  configured,
  userId,
  admin = false,
  rows = [],
  now,
  previewTier,
}: {
  configured: boolean;
  userId?: string | null;
  admin?: boolean;
  rows?: SubscriptionRow[];
  /** Defaults to the current time — read only for a signed-in account, so a guest's page can still prerender. */
  now?: Date;
  /** Demo mode only: act as a reader on this plan, to see the locks without Supabase. */
  previewTier?: Tier;
}): Access {
  if (!configured) return { tier: previewTier ?? "exams", demo: !previewTier, signedIn: false };
  if (!userId) return { tier: "free", demo: false, signedIn: false };
  return { tier: admin ? "exams" : effectiveTier(rows, now ?? new Date()), demo: false, signedIn: true };
}

/**
 * Whether the reader may open a topic, or one lesson or chapter of it: the
 * whole of a topic their plan includes, and the preview of every other.
 */
export function canAccessWith(access: Access, topic: Pick<Topic, "tier" | "preview">, item?: string) {
  if (tierAllows(access.tier, topic.tier)) return true;
  return item !== undefined && topic.preview.includes(item);
}

/** The lessons or chapters of a topic the reader can't open, out of `items`. */
export const lockedOf = (access: Access, topic: Pick<Topic, "tier" | "preview">, items: string[]) => items.filter((i) => !canAccessWith(access, topic, i));

/**
 * Whether the reader may open an exam's paper and solution: a sample is open
 * to everyone; any other needs the exams plan (an admin has it). The database
 * applies the same rule (public.can_open_exam), so the two always agree.
 */
export const canOpenExam = (access: Access, exam: { isSample: boolean }) => exam.isSample || tierAllows(access.tier, "exams");
