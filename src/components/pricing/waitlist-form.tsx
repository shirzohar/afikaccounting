"use client";

import { useActionState } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/ui/form";
import { joinWaitlist } from "@/lib/actions/waitlist";
import type { FormState } from "@/lib/actions/types";

const initial: FormState = {};

/** An email field and a button: the updates list for something not open yet. */
export function WaitlistForm({ topic, email = "" }: { topic: "exams" | "courses"; email?: string }) {
  const [state, action] = useActionState(joinWaitlist, initial);
  if (state.ok) return <FormAlert message={state.message} />;
  return (
    <form action={action} className="space-y-3" noValidate>
      <FormAlert error={state.error} />
      <input type="hidden" name="topic" value={topic} />
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-[1_1_14rem]">
          <TextField label="אימייל" name="email" type="email" autoComplete="email" dir="ltr" required defaultValue={state.values?.email ?? email} error={state.fieldErrors?.email} />
        </div>
        <SubmitButton className="h-11 sm:mt-[25px]">עדכנו אותי</SubmitButton>
      </div>
    </form>
  );
}
