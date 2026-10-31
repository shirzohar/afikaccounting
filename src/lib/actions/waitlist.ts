"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_RE, type FormState } from "./types";

/** Join the updates list for something not open yet: the exams area, or paid plans until payment opens. */
export async function joinWaitlist(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const topic = fd.get("topic") === "courses" ? "courses" : "exams";
  if (!EMAIL_RE.test(email)) return { fieldErrors: { email: "יש להזין כתובת אימייל תקינה." }, values: { email } };
  if (!isSupabaseConfigured) return { error: "ההרשמה לעדכונים עדיין לא פעילה באתר הזה.", values: { email } };
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({ email, topic, user_id: user?.id ?? null });
  // Already on the list (unique email and topic) is a success too.
  if (error && error.code !== "23505") return { error: "לא הצלחנו לשמור את ההרשמה. נסו שוב בעוד רגע.", values: { email } };
  return { ok: true, message: `נרשמתם! נשלח ל-${email} הודעה כש${topic === "exams" ? "מתחם המבחנים ייפתח" : "התשלום ייפתח"}.` };
}
