"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth/dal";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { isTier } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_RE, type FormState, passwordProblem } from "./types";

const NOT_CONFIGURED: FormState = {
  error: "ההתחברות אינה מוגדרת. יש להוסיף את כתובת ה-Supabase והמפתח לקובץ .env.local ולהפעיל מחדש את השרת.",
};

const field = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();

export async function signUp(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const fullName = field(fd, "fullName");
  const email = field(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  // The plan chosen on the pricing page, if they came from there: kept on the account until payment opens.
  const plan = fd.get("plan");
  // Where to go once signed up: back into the checkout they started, if they came from one.
  const next = safeNext(fd.get("next"), "");
  const values = { fullName, email };

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.fullName = "יש להזין שם.";
  if (fullName.length > 120) fieldErrors.fullName = "עד 120 תווים.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "יש להזין כתובת אימייל תקינה.";
  const pw = passwordProblem(password);
  if (pw) fieldErrors.password = pw;
  if (password !== String(fd.get("confirm") ?? "")) fieldErrors.confirm = "הסיסמאות אינן תואמות.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, ...(isTier(plan) && plan !== "free" ? { plan } : {}) },
      emailRedirectTo: `${SITE_URL}/auth/confirm?next=${encodeURIComponent(next || "/dashboard")}`,
    },
  });
  if (error) return { error: error.message, values };

  // With email confirmation off, Supabase returns a session immediately.
  if (data.session) redirect(next ? `${next}${next.includes("?") ? "&" : "?"}welcome=1` : "/dashboard?welcome=1");
  return { ok: true, message: `שלחנו קישור אימות לכתובת ${email}. יש לפתוח אותו כדי להפעיל את החשבון.` };
}

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const email = field(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!EMAIL_RE.test(email) || !password) {
    return { error: "יש להזין אימייל וסיסמה.", values: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Do not reveal whether the account exists.
    const unconfirmed = error.code === "email_not_confirmed";
    return {
      error: unconfirmed ? "יש לאמת קודם את כתובת האימייל — בדקו את תיבת הדואר." : "אימייל או סיסמה שגויים.",
      values: { email },
    };
  }
  redirect(safeNext(fd.get("next")));
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const email = field(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { fieldErrors: { email: "יש להזין כתובת אימייל תקינה." }, values: { email } };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/reset-password`,
  });
  // Same answer whether or not the account exists.
  return { ok: true, message: `אם קיים חשבון עבור ${email}, קישור לאיפוס הסיסמה בדרך אליך.` };
}

export async function updatePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const user = await getCurrentUser();
  if (!user) return { error: "תוקף קישור האיפוס פג. יש לבקש קישור חדש." };

  const password = String(fd.get("password") ?? "");
  const pw = passwordProblem(password);
  if (pw) return { fieldErrors: { password: pw } };
  if (password !== String(fd.get("confirm") ?? "")) return { fieldErrors: { confirm: "הסיסמאות אינן תואמות." } };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: true, message: "הסיסמה עודכנה." };
}
