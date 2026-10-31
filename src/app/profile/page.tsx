import { KeyRound, LogOut, Mail } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SubscriptionPanel } from "@/components/billing/subscription-panel";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container, Skeleton } from "@/components/ui/primitives";
import { signOut } from "@/lib/actions/auth";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { billingProvider } from "@/lib/billing";
import { getMySubscription, listMyInvoices } from "@/lib/data/billing";
import { CALCULATORS } from "@/lib/engine/registry";
import { shortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "פרופיל" };

export default function ProfilePage() {
  return (
    <Container className="max-w-3xl pt-10 sm:pt-14">
      <p className="text-xs font-semibold text-accent">חשבון</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">פרופיל</h1>
      <Suspense fallback={<Skeleton className="mt-8 h-[480px] rounded-2xl" />}>
        <ProfileContent />
      </Suspense>
    </Container>
  );
}

async function ProfileContent() {
  const user = await requireUser("/profile");
  const [profile, sub, invoices] = await Promise.all([getProfile(), getMySubscription(), listMyInvoices()]);
  const standards = [...new Set(CALCULATORS.map((c) => c.standard.split(" · ")[0]))];

  return (
    <div className="mt-8 space-y-6">
      <section className="card p-6 sm:p-8">
        <h2 className="text-base font-semibold text-fg">פרטים אישיים</h2>
        <p className="mt-1 mb-6 text-sm text-muted">
          {profile ? `חבר/ה מאז ${shortDate(profile.createdAt)}.` : "השלימו את הפרופיל."}
        </p>
        <ProfileForm profile={profile} standards={standards} />
      </section>

      <SubscriptionPanel sub={sub} invoices={invoices} provider={billingProvider()?.name ?? null} />

      <section className="card divide-y divide-line">
        <div className="flex flex-wrap items-center gap-4 p-6">
          <Mail className="h-5 w-5 text-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">אימייל</p>
            <p className="truncate text-sm text-muted" dir="ltr">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 p-6">
          <KeyRound className="h-5 w-5 text-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">סיסמה</p>
            <p className="text-sm text-muted">בחירת סיסמה חדשה לחשבון.</p>
          </div>
          <ButtonLink href="/reset-password" variant="secondary" size="sm">
            שינוי סיסמה
          </ButtonLink>
        </div>
        <div className="flex flex-wrap items-center gap-4 p-6">
          <LogOut className="h-5 w-5 text-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">התנתקות</p>
            <p className="text-sm text-muted">סיום ההתחברות במכשיר זה.</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="danger" size="sm">
              התנתקות
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
