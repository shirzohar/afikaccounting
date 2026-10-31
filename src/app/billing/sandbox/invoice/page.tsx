import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container, Skeleton } from "@/components/ui/primitives";
import { billingProvider } from "@/lib/billing";
import { type SandboxInvoice, SandboxProvider } from "@/lib/billing/providers/sandbox";
import { shortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "חשבונית בדיקה", robots: { index: false } };

/** The sandbox's stand-in for the provider's invoice document — marked as a test, not a tax invoice. */
export default function SandboxInvoicePage({ searchParams }: PageProps<"/billing/sandbox/invoice">) {
  return (
    <Container className="max-w-xl pt-16 pb-24">
      <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
        <Invoice searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Invoice({ searchParams }: Pick<PageProps<"/billing/sandbox/invoice">, "searchParams">) {
  const provider = billingProvider();
  if (!(provider instanceof SandboxProvider)) notFound();
  const d = (await searchParams).d;
  const inv = provider.read<SandboxInvoice>(typeof d === "string" ? d : null);
  if (!inv) notFound();
  const vat = Math.round((inv.amount - inv.amount / 1.18) * 100) / 100;
  return (
    <article className="card p-6 sm:p-8">
      <p className="rounded-lg bg-amber-400/15 px-3 py-2 text-center text-sm font-semibold text-amber-800 dark:text-amber-200">מסמך בדיקה — אינו חשבונית מס</p>
      <h1 className="mt-5 text-xl font-semibold text-fg">חשבונית מס / קבלה (דוגמה)</h1>
      <p className="num mt-1 text-sm text-muted">
        מס׳ {inv.number} · {shortDate(inv.issuedAt)}
      </p>
      <dl className="mt-6 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="text-muted">לכבוד</dt>
        <dd className="text-fg">{inv.name || "—"}</dd>
        <dt className="text-muted">פירוט</dt>
        <dd className="text-fg">{inv.description}</dd>
        <dt className="text-muted">מתוכו מע״מ (18%)</dt>
        <dd className="num text-fg">₪{vat.toFixed(2)}</dd>
        <dt className="font-semibold text-fg">סה״כ</dt>
        <dd className="num font-semibold text-fg">₪{inv.amount.toFixed(2)}</dd>
      </dl>
    </article>
  );
}
