import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthSwitchLink, LoginForm } from "@/components/auth/auth-forms";
import { Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "התחברות" };

export default function LoginPage() {
  return (
    <AuthCard
      title="ברוכים השבים"
      description="התחברו כדי לגשת לפתרונות השמורים ולהיסטוריית הצפייה."
      footer={
        <>
          חדשים כאן?{" "}
          <Suspense
            fallback={
              <Link href="/register" className="font-medium text-accent hover:underline">
                יצירת חשבון
              </Link>
            }
          >
            <AuthSwitchLink to="/register">יצירת חשבון</AuthSwitchLink>
          </Suspense>
        </>
      }
    >
      {/* The form reads ?next= from the URL. */}
      <Suspense fallback={<Skeleton className="h-64" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
