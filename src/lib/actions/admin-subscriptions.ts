"use server";

import { refresh } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { AdminResult } from "./admin-media";
import { EMAIL_RE } from "./types";

const DENIED: AdminResult = { ok: false, error: "אין הרשאת מנהל." };

/**
 * Give an account a plan by hand, until there is a payment provider: by the
 * email it signed up with, open-ended or until a date. Replaces the account's
 * current plan, if it has one. The database checks the admin role again.
 */
export async function grantTier(input: { email: string; tier: string; until?: string }): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "כתובת אימייל לא תקינה." };
  if (input.tier !== "courses" && input.tier !== "exams") return { ok: false, error: "מסלול לא מוכר." };
  let until: string | null = null;
  if (input.until) {
    const d = new Date(`${input.until}T23:59:59`);
    if (Number.isNaN(d.getTime()) || d.getTime() < Date.now()) return { ok: false, error: "תאריך הסיום צריך להיות בעתיד." };
    until = d.toISOString();
  }

  const supabase = await createClient();
  const { data: userId, error: findError } = await supabase.rpc("admin_user_by_email", { p_email: email });
  if (findError) return { ok: false, error: findError.message };
  if (!userId) return { ok: false, error: "אין משתמש רשום עם האימייל הזה. המשתמש צריך להירשם לאתר קודם." };

  const { error } = await supabase
    .from("subscriptions")
    .upsert({ user_id: userId, tier: input.tier, status: "active", current_period_end: until, provider: "manual", provider_ref: null }, { onConflict: "user_id" });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: String(userId) };
}

/** Take an account's plan away: it goes back to free. */
export async function revokeTier(userId: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
