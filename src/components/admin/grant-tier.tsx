"use client";

import { Loader2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { grantTier, revokeTier } from "@/lib/actions/admin-subscriptions";
import { PLANS } from "@/lib/pricing";
import { Field } from "./modal";

/** Give an account a plan by its email: which plan, and until when (empty: open-ended). */
export function GrantTier() {
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("courses");
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const run = async () => {
    setBusy(true);
    const res = await grantTier({ email, tier, until });
    setBusy(false);
    setMessage(res.ok ? { ok: true, text: `המסלול הוענק ל-${email}.` } : { ok: false, text: res.error });
    if (res.ok) setEmail("");
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Field label="אימייל המשתמש">
          <input type="email" dir="ltr" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </Field>
        <Field label="מסלול">
          <select className={inputClass} value={tier} onChange={(e) => setTier(e.target.value)}>
            {PLANS.filter((p) => p.tier !== "free").map((p) => (
              <option key={p.tier} value={p.tier}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="עד תאריך" hint="ריק: ללא הגבלה">
          <input type="date" className={inputClass} value={until} onChange={(e) => setUntil(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={busy || !email}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} הענקת מסלול
        </Button>
        {message && <p className={message.ok ? "text-sm text-success" : "text-sm text-danger"}>{message.text}</p>}
      </div>
    </div>
  );
}

/** Take a plan away; the account goes back to free. */
export function RevokeTier({ userId, email }: { userId: string; email: string }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!confirm(`להסיר את המסלול של ${email}? המשתמש יחזור לחינם.`)) return;
    setBusy(true);
    const res = await revokeTier(userId);
    setBusy(false);
    if (!res.ok) alert(res.error);
  };
  return (
    <Button variant="danger" size="sm" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} הסרה
    </Button>
  );
}
