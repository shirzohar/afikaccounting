import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SandboxPay } from "@/components/billing/sandbox-pay";
import { Container, Skeleton } from "@/components/ui/primitives";
import { billingProvider } from "@/lib/billing";
import { SandboxProvider } from "@/lib/billing/providers/sandbox";

export const metadata: Metadata = { title: "סביבת בדיקות — תשלום", robots: { index: false } };

/**
 * The sandbox provider's "hosted payment page". It exists only while
 * BILLING_PROVIDER=sandbox, on a local site; a real provider's page replaces it.
 */
export default function SandboxPaymentPage({ searchParams }: PageProps<"/billing/sandbox">) {
  return (
    <Container className="max-w-md pt-16 pb-24">
      <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
        <Payment searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Payment({ searchParams }: Pick<PageProps<"/billing/sandbox">, "searchParams">) {
  const provider = billingProvider();
  if (!(provider instanceof SandboxProvider)) notFound();
  const token = (await searchParams).token;
  const c = provider.readCheckout(typeof token === "string" ? token : null);
  return (
    <div className="card overflow-hidden">
      <p className="flex items-center gap-2 bg-amber-400/15 px-5 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
        <FlaskConical className="h-4 w-4" aria-hidden /> סביבת בדיקות — אין כאן חיוב אמיתי
      </p>
      <div className="p-6">
        {c ? (
          <>
            <p className="text-xs text-muted">ספק סליקה (בדיקה)</p>
            <h1 className="mt-1 text-lg font-semibold text-fg">{c.description}</h1>
            <p className="num mt-1 text-sm text-muted">
              ₪{c.amount} · {c.email}
            </p>
            <div className="mt-6">
              <SandboxPay token={String(token)} amount={c.amount} />
            </div>
            <a href={c.cancelUrl} className="mt-4 block text-center text-sm text-muted hover:text-fg">
              ביטול וחזרה לאתר
            </a>
          </>
        ) : (
          <p className="text-sm text-muted">דף התשלום פג תוקף או אינו תקין. חזרו לדף המחירים ונסו שוב.</p>
        )}
      </div>
    </div>
  );
}
