import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthSwitchLink, RegisterForm } from "@/components/auth/auth-forms";
import { TierBadge } from "@/components/pricing/tier-badge";
import { Skeleton } from "@/components/ui/primitives";
import { billingEnabled } from "@/lib/billing";
import { isTier, planOf } from "@/lib/pricing";

export const metadata: Metadata = { title: "יצירת חשבון" };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <AuthCard
      title="יצירת חשבון"
      description="חשבון חינמי: לוח אישי עם השיעור הבא שלכם, ועדכון כשנפתחים קורסים ומבחנים חדשים."
      footer={
        <>
          כבר יש לכם חשבון?{" "}
          <Suspense
            fallback={
              <Link href="/login" className="font-medium text-accent hover:underline">
                התחברות
              </Link>
            }
          >
            <AuthSwitchLink to="/login">התחברות</AuthSwitchLink>
          </Suspense>
        </>
      }
    >
      <Suspense fallback={null}>
        <ChosenPlan searchParams={searchParams} />
      </Suspense>
      {/* The form reads ?plan= from the URL. */}
      <Suspense fallback={<Skeleton className="h-80" />}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}

/** Came from a paid plan's "choose" button: payment isn't open yet, so say what happens instead. */
async function ChosenPlan({ searchParams }: Pick<PageProps<"/register">, "searchParams">) {
  const plan = (await searchParams).plan;
  if (!isTier(plan) || plan === "free") return null;
  return (
    <div className="mb-5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-fg">
      <p className="flex flex-wrap items-center gap-2 font-semibold">
        בחרתם במסלול <TierBadge tier={plan} />
      </p>
      <p className="mt-1 leading-relaxed text-muted">
        {billingEnabled() ? "פתחו חשבון — ומיד אחר כך עוברים לדף התשלום המאובטח." : (
          <>
        התשלום ייפתח בקרוב. בינתיים פתחו חשבון חינמי — נשמור שבחרתם ב{planOf(plan).name} ונעדכן אתכם ברגע שהמסלול נפתח. הקורס החינמי פתוח לכם כבר עכשיו.
          </>
        )}
      </p>
    </div>
  );
}
