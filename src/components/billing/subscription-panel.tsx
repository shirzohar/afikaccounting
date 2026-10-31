"use client";

import { FileText, FlaskConical, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TierBadge } from "@/components/pricing/tier-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormAlert, inputClass } from "@/components/ui/form";
import { cancelSubscription, changePlan, sandboxSimulate } from "@/lib/actions/billing";
import { track } from "@/lib/analytics/track";
import type { MyInvoice, MySubscription } from "@/lib/data/billing";
import { PLANS } from "@/lib/pricing";
import { shortDate } from "@/lib/utils";

type Props = {
  sub: MySubscription | null;
  invoices: MyInvoice[];
  /** Payments are on, with this provider: the subscription can be changed or cancelled here. */
  provider: string | null;
};

/**
 * The profile's subscription section: the plan, its state and its next date;
 * change plan and cancel (at the end of the period paid for) for a
 * subscription with the provider; the invoices. A manual grant is shown, not
 * changed — that's the admin's.
 */
export function SubscriptionPanel({ sub, invoices, provider }: Props) {
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<{ error?: string; ok?: string }>({});
  const managed = !!(sub?.providerRef && provider && sub.provider === provider && sub.status !== "canceled");
  const [target, setTarget] = useState(() => (sub?.tier === "exams" ? "courses" : "exams") + ":" + (sub?.interval ?? "month"));

  const run = async (what: string, fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => {
    setBusy(what);
    setMessage({});
    const res = await fn();
    setBusy(undefined);
    setMessage(res.ok ? { ok } : { error: res.error });
    return res.ok;
  };
  const cancel = async () => {
    if (!sub || !confirm(`לבטל את המנוי? הוא יישאר פתוח עד ${sub.periodEnd ? shortDate(sub.periodEnd) : "סוף התקופה"}, ולא יחודש.`)) return;
    if (await run("cancel", cancelSubscription, "המנוי בוטל. הוא פתוח עד סוף התקופה ששולמה, ולא יחודש.")) track({ kind: "subscription_cancel", target: sub.tier });
  };
  const change = () => {
    const [tier, interval] = target.split(":");
    return run("change", () => changePlan({ tier, interval }), "המסלול עודכן.");
  };

  return (
    <section id="subscription" className="card scroll-mt-24 p-6 sm:p-8" aria-labelledby="subscription-title">
      <h2 id="subscription-title" className="text-base font-semibold text-fg">
        המנוי שלי
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <TierBadge tier={sub && sub.status !== "canceled" ? sub.tier : "free"} />
        <p className="min-w-0 flex-1 text-sm text-muted">{describe(sub)}</p>
        {!managed && (
          <ButtonLink href="/pricing" size="sm" variant={sub ? "secondary" : "primary"}>
            {sub && sub.status !== "canceled" ? "למסלולים" : "שדרוג"}
          </ButtonLink>
        )}
      </div>

      <div className="mt-4">
        <FormAlert error={message.error} message={message.ok} />
      </div>

      {managed && sub && (
        <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-fg">שינוי מסלול</p>
            <div className="mt-2 flex gap-2">
              <select className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)} aria-label="המסלול החדש">
                {PLANS.filter((p) => p.tier !== "free").flatMap((p) => [
                  <option key={`${p.tier}:month`} value={`${p.tier}:month`}>
                    {p.name} — ₪{p.monthly} לחודש
                  </option>,
                  ...(p.yearly
                    ? [
                        <option key={`${p.tier}:year`} value={`${p.tier}:year`}>
                          {p.name} — ₪{p.yearly} לשנה
                        </option>,
                      ]
                    : []),
                ])}
              </select>
              <Button variant="secondary" onClick={change} disabled={!!busy}>
                {busy === "change" && <Loader2 className="h-4 w-4 animate-spin" />} שינוי
              </Button>
            </div>
          </div>
          {!sub.cancelAtPeriodEnd && (
            <div>
              <p className="text-sm font-medium text-fg">ביטול</p>
              <p className="mt-1 text-xs text-muted">המנוי נשאר פתוח עד סוף התקופה ששולמה, ולא מתחדש.</p>
              <Button variant="danger" size="sm" className="mt-2" onClick={cancel} disabled={!!busy}>
                {busy === "cancel" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} ביטול המנוי
              </Button>
            </div>
          )}
        </div>
      )}

      {invoices.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="text-sm font-medium text-fg">חשבוניות</p>
          <ul className="mt-2 divide-y divide-line">
            {invoices.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-muted" aria-hidden />
                <span className="num min-w-0 flex-1 text-fg">
                  {shortDate(i.issuedAt)} · {i.number || "חשבונית"}
                </span>
                <span className="num text-muted">₪{i.amount.toFixed(2)}</span>
                <a href={i.url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
                  צפייה
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {provider === "sandbox" && managed && (
        <div className="mt-6 rounded-xl border border-dashed border-amber-500/50 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <FlaskConical className="h-4 w-4" aria-hidden /> סביבת בדיקות: מה שהספק היה שולח בהמשך
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["renewed", "חידוש החודש הבא"],
                ["payment_failed", "חיוב שנכשל"],
                ["refunded", "החזר כספי"],
                ["canceled", "סוף התקופה (ביטול)"],
              ] as const
            ).map(([kind, label]) => (
              <Button key={kind} variant="secondary" size="sm" disabled={!!busy} onClick={() => run(kind, () => sandboxSimulate(kind), `נשלח: ${label}`)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
      {!sub && (
        <p className="mt-3 text-xs text-muted">
          הקורס החינמי והשיעור הראשון בכל קורס פתוחים לכם.{" "}
          <Link href="/pricing" className="text-accent hover:underline">
            מה יש במסלולים
          </Link>
        </p>
      )}
    </section>
  );
}

/** The subscription's state, in a sentence. */
function describe(sub: MySubscription | null) {
  if (!sub) return "חינם — בלי מנוי.";
  const until = sub.periodEnd ? shortDate(sub.periodEnd) : null;
  const plan = PLANS.find((p) => p.tier === sub.tier)!.name;
  if (sub.provider === "manual") return `${plan} — ניתן על ידי צוות האתר${until ? `, עד ${until}` : ", ללא הגבלת זמן"}.`;
  if (sub.status === "canceled") return `המנוי הסתיים${until ? ` ב-${until}` : ""}.`;
  if (sub.status === "past_due") return `${plan} — החיוב האחרון נכשל. עדכנו את אמצעי התשלום אצל ספק הסליקה כדי להמשיך.`;
  if (sub.cancelAtPeriodEnd) return `${plan} — בוטל, ופתוח עד ${until ?? "סוף התקופה"}. לא יחודש.`;
  return `${plan}, ${sub.interval === "year" ? "שנתי" : "חודשי"} — מתחדש ב-${until ?? "—"}.`;
}
