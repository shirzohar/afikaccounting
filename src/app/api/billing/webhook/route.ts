import { applyEvent, billingProvider } from "@/lib/billing";
import { handleWebhook } from "@/lib/billing/webhook";

/**
 * The payment provider's webhook. Reads the raw body (the signature is over
 * the exact bytes), verifies it, and applies the event once — see handleWebhook.
 * With payments off, it answers 404 and touches nothing.
 */
export async function POST(request: Request) {
  const provider = billingProvider();
  if (!provider) return Response.json({ ok: false, error: "billing is off" }, { status: 404 });
  const raw = await request.text();
  const { status, body } = await handleWebhook(raw, request.headers, { provider, apply: applyEvent });
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
