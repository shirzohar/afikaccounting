"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert, inputClass } from "@/components/ui/form";
import { sandboxPay } from "@/lib/actions/billing";

/** The sandbox payment page's form: a card number, and pay — success redirects as the provider would. */
export function SandboxPay({ token, amount }: { token: string; amount: number }) {
  const [card, setCard] = useState("4580 0000 0000 0001");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const pay = async () => {
    setBusy(true);
    setError(undefined);
    const res = await sandboxPay(token, card);
    if (res.ok && res.url) return window.location.assign(res.url);
    setBusy(false);
    setError(res.ok ? "שגיאה" : res.error);
  };
  return (
    <div className="space-y-3">
      <FormAlert error={error} />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-fg">מספר כרטיס (בדיקה)</span>
        <input dir="ltr" className={inputClass} value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" autoComplete="off" />
        <span className="mt-1 block text-xs text-muted">כל כרטיס מצליח, חוץ מכרטיס שמסתיים ב-0002 — שנדחה.</span>
      </label>
      <Button onClick={pay} disabled={busy} size="lg" className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} תשלום <span className="num">₪{amount}</span>
      </Button>
    </div>
  );
}
