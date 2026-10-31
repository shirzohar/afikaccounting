"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { TrackEvent } from "@/components/layout/track-event";
import { FormAlert, SubmitButton, TextField } from "@/components/ui/form";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/types";

const initial: FormState = {};

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  // Set by /auth/confirm when an email link fails.
  const linkError = params.get("error")?.slice(0, 200);
  const [state, action] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormAlert error={state.error ?? linkError} />
      <TextField
        label="אימייל"
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        defaultValue={state.values?.email}
        autoFocus
      />
      <div>
        <TextField label="סיסמה" name="password" type="password" autoComplete="current-password" dir="ltr" required />
        <Link href="/forgot-password" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
          שכחתם את הסיסמה?
        </Link>
      </div>
      <SubmitButton className="w-full" size="lg">
        התחברות
      </SubmitButton>
    </form>
  );
}

/** Reads ?plan= from the URL: the plan chosen on the pricing page, kept on the new account. */
export function RegisterForm() {
  const plan = useSearchParams().get("plan") ?? "";
  const [state, action] = useActionState(signUp, initial);
  if (state.ok)
    return (
      <>
        {/* Signed up, waiting on the email link. (Signed straight in, the dashboard records it.) */}
        <TrackEvent event={{ kind: "signup", meta: { plan: plan || "free", confirm: true } }} />
        <FormAlert message={state.message} />
      </>
    );
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="plan" value={plan} />
      <FormAlert error={state.error} />
      <TextField
        label="שם מלא"
        name="fullName"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName}
        error={err.fullName}
        autoFocus
      />
      <TextField
        label="אימייל"
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        defaultValue={state.values?.email}
        error={err.email}
      />
      <TextField
        label="סיסמה"
        name="password"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        error={err.password}
        hint="לפחות 8 תווים, כולל אות וספרה."
      />
      <TextField label="אימות סיסמה" name="confirm" type="password" autoComplete="new-password" dir="ltr" required error={err.confirm} />
      <SubmitButton className="w-full" size="lg">
        יצירת חשבון
      </SubmitButton>
      <p className="text-center text-xs leading-relaxed text-subtle">
        ביצירת החשבון אתם מאשרים שהתכנים הם לצורכי לימוד ואינם מהווים ייעוץ מקצועי.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  if (state.ok) return <FormAlert message={state.message} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert error={state.error} />
      <TextField
        label="אימייל"
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
        autoFocus
      />
      <SubmitButton className="w-full" size="lg">
        שליחת קישור לאיפוס
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initial);
  if (state.ok) {
    return (
      <div className="space-y-4">
        <FormAlert message={state.message} />
        <Link href="/dashboard" className="block text-center text-sm font-medium text-accent hover:underline">
          המשך ללוח האישי
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert error={state.error} />
      <TextField
        label="סיסמה חדשה"
        name="password"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        error={state.fieldErrors?.password}
        hint="לפחות 8 תווים, כולל אות וספרה."
        autoFocus
      />
      <TextField
        label="אימות הסיסמה החדשה"
        name="confirm"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        error={state.fieldErrors?.confirm}
      />
      <SubmitButton className="w-full" size="lg">
        עדכון הסיסמה
      </SubmitButton>
    </form>
  );
}
