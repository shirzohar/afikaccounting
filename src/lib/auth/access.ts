import "server-only";
import { cache } from "react";
import { type Access, canAccessWith, resolveAccess } from "@/lib/access";
import { TOPICS } from "@/lib/catalog";
import { ACCESS_PREVIEW_TIER, isSupabaseConfigured } from "@/lib/env";
import { isTier } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "./dal";

/**
 * The reader's effective plan, decided on the server: a guest or an account
 * without a live subscription is on "free"; an admin sees everything. In demo
 * mode (no Supabase) nothing is locked and no cookie is read, so pages stay
 * prerendered. Deduplicated per request.
 */
export const getAccess = cache(async (): Promise<Access> => {
  const previewTier = isTier(ACCESS_PREVIEW_TIER) ? ACCESS_PREVIEW_TIER : undefined;
  if (!isSupabaseConfigured) return resolveAccess({ configured: false, previewTier });
  const user = await getCurrentUser();
  if (!user) return resolveAccess({ configured: true });
  const supabase = await createClient();
  const [admin, { data }] = await Promise.all([isAdmin(), supabase.from("subscriptions").select("tier, status, current_period_end").eq("user_id", user.id)]);
  // Before the subscriptions migration runs, `data` is null: the account is on "free".
  return resolveAccess({ configured: true, userId: user.id, admin, rows: data ?? [] });
});

/** Whether the reader may open a topic (by id), or one of its lessons or chapters. An unknown topic is closed. */
export async function canAccess(topicId: string, item?: string) {
  const topic = TOPICS.find((t) => t.id === topicId);
  return !!topic && canAccessWith(await getAccess(), topic, item);
}
