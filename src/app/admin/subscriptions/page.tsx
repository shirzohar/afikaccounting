import type { Metadata } from "next";
import { Suspense } from "react";
import { GrantTier, RevokeTier } from "@/components/admin/grant-tier";
import { AdminHeader, AdminSkeleton, Panel, SetupRequired } from "@/components/admin/ui";
import { TierBadge } from "@/components/pricing/tier-badge";
import { requireAdmin } from "@/lib/auth/dal";
import { listSubscriptions, unlessSetupRequired } from "@/lib/data/admin";
import { shortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "מנויים" };

const STATUS: Record<string, string> = { active: "פעיל", trialing: "ניסיון", past_due: "בפיגור תשלום", canceled: "בוטל" };

export default function AdminSubscriptionsPage() {
  return (
    <>
      <AdminHeader
        title="מנויים"
        description="עד שיחובר ספק תשלומים, מסלול ניתן כאן ידנית. משתמש בלי מסלול פעיל — או אורח — נמצא בחינם: הקורס החינמי והשיעור הראשון בכל קורס."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <Subscriptions />
      </Suspense>
    </>
  );
}

async function Subscriptions() {
  await requireAdmin("/admin/subscriptions");
  const data = await unlessSetupRequired(listSubscriptions());
  if (!data) return <SetupRequired />;

  return (
    <div className="space-y-6">
      <Panel title="הענקת מסלול" description="המשתמש צריך להיות רשום לאתר. הענקה למשתמש שכבר יש לו מסלול מחליפה אותו.">
        <GrantTier />
      </Panel>

      <Panel title="מסלולים" description={`${data.subscriptions.length} משתמשים`}>
        {data.subscriptions.length ? (
          <ul className="divide-y divide-line">
            {data.subscriptions.map((s) => {
              const { ended } = s;
              return (
                <li key={s.userId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
                  <span className="min-w-0 flex-[1_1_14rem]">
                    <span className="block font-medium text-fg" dir="ltr">
                      {s.email}
                    </span>
                    <span className="block text-xs text-muted">{s.fullName || "ללא שם"}</span>
                  </span>
                  <TierBadge tier={s.tier} />
                  <span className={ended ? "text-xs text-danger" : "text-xs text-muted"}>
                    {ended ? "הסתיים" : (STATUS[s.status] ?? s.status)} · {s.periodEnd ? `עד ${shortDate(s.periodEnd)}` : "ללא הגבלה"} · {s.provider === "manual" ? "ידני" : s.provider}
                  </span>
                  <RevokeTier userId={s.userId} email={s.email} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">עדיין אין מסלולים. הענקה ידנית מופיעה כאן מיד.</p>
        )}
      </Panel>

      <Panel title="נרשמו דרך מסלול בתשלום" description="בחרו מסלול בדף המחירים ונרשמו, לפני שהתשלום נפתח. אפשר להעניק להם את המסלול למעלה.">
        {data.interested.length ? (
          <ul className="divide-y divide-line">
            {data.interested.map((i) => (
              <li key={i.userId} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1 text-fg" dir="ltr">
                  {i.email}
                </span>
                <TierBadge tier={i.plan} />
                <span className="text-xs text-muted">נרשם {shortDate(i.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">אין עדיין.</p>
        )}
      </Panel>

      <Panel title="רשימת עדכונים" description="מי שביקש הודעה כשמתחם המבחנים (או התשלום) נפתח.">
        {data.waitlist.length ? (
          <ul className="divide-y divide-line">
            {data.waitlist.map((w) => (
              <li key={`${w.email}-${w.topic}`} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1 text-fg" dir="ltr">
                  {w.email}
                </span>
                <TierBadge tier={w.topic === "exams" ? "exams" : "courses"} label={w.topic === "exams" ? "מתחם מבחנים" : "קורסים"} />
                <span className="text-xs text-muted">{shortDate(w.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">אין עדיין.</p>
        )}
      </Panel>
    </div>
  );
}
