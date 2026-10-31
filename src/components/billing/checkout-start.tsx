"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import { startCheckout } from "@/lib/actions/billing";
import { track } from "@/lib/analytics/track";

/** Opens the provider's payment page as soon as it mounts; on a failure, says why and offers to try again. */
export function CheckoutStart({ tier, interval, from }: { tier: string; interval: string; from?: string }) {
  const [error, setError] = useState<string>();
  const started = useRef(false);
  const go = async () => {
    setError(undefined);
    const res = await startCheckout({ tier, interval, from });
    if (!res.ok || !res.url) return setError(res.ok ? "לא התקבל דף תשלום." : res.error);
    track({ kind: "checkout_start", target: tier, meta: { interval } });
    window.location.assign(res.url);
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (error)
    return (
      <div className="space-y-3">
        <FormAlert error={error} />
        <Button onClick={go}>לנסות שוב</Button>
      </div>
    );
  return (
    <p className="flex items-center gap-2 text-sm text-muted" role="status">
      <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden /> מעבירים לדף התשלום המאובטח…
      <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
    </p>
  );
}
