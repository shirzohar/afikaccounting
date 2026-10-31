export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Without Supabase credentials the site runs in demo mode: content comes from
 * the bundled seed data, the engine works fully, and sign-in is disabled.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Optional stand-in video used for lessons that have no recording uploaded yet. */
export const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "";

/**
 * Demo mode only: act as a reader on this plan ("free" or "courses"), to see
 * the locks and paywalls without Supabase. Unset, demo mode opens everything.
 * Ignored once Supabase is configured.
 */
export const ACCESS_PREVIEW_TIER = process.env.ACCESS_PREVIEW_TIER ?? "";
