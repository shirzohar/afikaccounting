import "server-only";
import { getCurrentUser } from "@/lib/auth/dal";
import type { Interval, PaidTier } from "@/lib/billing/types";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type MySubscription = {
  tier: PaidTier;
  status: "active" | "trialing" | "past_due" | "canceled";
  periodEnd: string | null;
  provider: string;
  providerRef: string | null;
  interval: Interval | null;
  cancelAtPeriodEnd: boolean;
};
export type MyInvoice = { id: string; number: string; amount: number; currency: string; url: string; issuedAt: string };

/** The signed-in reader's own subscription row, read with their session (RLS: only their own). */
export async function getMySubscription(): Promise<MySubscription | null> {
  if (!isSupabaseConfigured || !(await getCurrentUser())) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, provider, provider_ref, billing_interval, cancel_at_period_end")
    .maybeSingle();
  if (!data) return null;
  return {
    tier: data.tier,
    status: data.status,
    periodEnd: data.current_period_end,
    provider: data.provider,
    providerRef: data.provider_ref,
    interval: data.billing_interval ?? null,
    cancelAtPeriodEnd: !!data.cancel_at_period_end,
  };
}

export async function listMyInvoices(): Promise<MyInvoice[]> {
  if (!isSupabaseConfigured || !(await getCurrentUser())) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("id, number, amount, currency, url, issued_at").order("issued_at", { ascending: false }).limit(50);
  return (data ?? []).map((r) => ({ id: r.id, number: r.number, amount: Number(r.amount), currency: r.currency, url: r.url, issuedAt: r.issued_at }));
}
