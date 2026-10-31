"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Until the provider's webhook opens the plan: check again every 2 seconds, for about half a minute. */
export function WaitForAccess() {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  const giveUp = tries >= 15;
  useEffect(() => {
    if (giveUp) return;
    const id = setTimeout(() => {
      setTries((t) => t + 1);
      router.refresh();
    }, 2000);
    return () => clearTimeout(id);
  }, [tries, giveUp, router]);
  return giveUp ? (
    <p className="text-sm text-muted">
      התשלום עדיין מאושר אצל ספק הסליקה. רעננו את הדף בעוד דקה; אם המנוי לא נפתח, הוא יופיע בפרופיל ברגע שהאישור יגיע — ולא תחויבו פעמיים.
    </p>
  ) : (
    <p className="flex items-center gap-2 text-sm text-muted" role="status">
      <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden /> מאשרים את התשלום…
    </p>
  );
}
