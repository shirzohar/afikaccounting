/**
 * Payments, end to end against the real database rules: the sandbox provider's
 * checkout and payment, its signed webhook through the real handler, applied
 * by public.apply_billing_event in Postgres (PGlite) — and then what the reader
 * can open, through the same resolveAccess/canAccessWith the site uses.
 * Everything but the HTTP hop and Supabase's API.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { canAccessWith, canOpenExam, resolveAccess, type SubscriptionRow } from "../../src/lib/access";
import { addPeriod, SandboxProvider, SIGNATURE_HEADER } from "../../src/lib/billing/providers/sandbox";
import type { BillingEvent } from "../../src/lib/billing/types";
import { type ApplyOutcome, applyArgs, handleWebhook } from "../../src/lib/billing/webhook";
import { TOPICS } from "../../src/lib/catalog";
import { type Db, startDb } from "./pg";

const SECRET = "whsec_e2e";
const STUDENT = "00000000-0000-4000-8000-0000000000b1";
const OTHER = "00000000-0000-4000-8000-0000000000b2";
const GRANTED = "00000000-0000-4000-8000-0000000000b3";
const INVENTORY = TOPICS.find((t) => t.id === "inventory")!;

let db: Db;
let clock = new Date("2026-11-02T10:00:00Z");
const tick = (ms: number) => (clock = new Date(clock.getTime() + ms));
/** The provider's deliveries, as they arrive at the webhook: kept, so a test can deliver one again. */
const delivered: { body: string; signature: string; outcome?: ApplyOutcome; status?: number }[] = [];

const apply = async (provider: string, e: BillingEvent, raw: unknown) => {
  const a = applyArgs(provider, e, raw);
  const rows = await db.as<{ r: ApplyOutcome }>(
    "service",
    "select public.apply_billing_event($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) as r",
    [a.p_id, a.p_provider, a.p_type, a.p_user, a.p_occurred_at, a.p_provider_ref, a.p_tier, a.p_interval, a.p_period_end, a.p_invoice, a.p_payload],
  );
  return rows[0].r;
};
const provider = new SandboxProvider({
  baseUrl: "http://localhost:3000",
  secret: SECRET,
  now: () => clock,
  // The webhook route's work, without the HTTP hop: verify, then apply once.
  send: async (body, signature) => {
    const res = await handleWebhook(body, new Headers({ [SIGNATURE_HEADER]: signature }), { provider, apply });
    delivered.push({ body, signature, status: res.status, outcome: res.body.outcome as ApplyOutcome });
    if (res.status !== 200) throw new Error(res.body.error);
  },
});

/** The reader's subscription row (as they may read it), and what it opens right now. */
async function reader(user = STUDENT) {
  const rows = await db.as<SubscriptionRow & { tier: string; cancel_at_period_end: boolean; provider_ref: string | null }>(
    user,
    "select tier, status, current_period_end::text, cancel_at_period_end, provider_ref from public.subscriptions",
  );
  const access = resolveAccess({ configured: true, userId: user, rows, now: clock });
  return { row: rows[0], tier: access.tier, lesson: canAccessWith(access, INVENTORY, "inventory-cost"), exam: canOpenExam(access, { isSample: false }) };
}
const invoices = (user = STUDENT) => db.as<{ amount: string }>(user, "select amount from public.invoices order by issued_at");
const last = () => delivered.at(-1)!;

before(async () => {
  db = await startDb();
  await db.exec(`insert into auth.users (id, email) values ('${STUDENT}', 'student@example.com'), ('${OTHER}', 'other@example.com'), ('${GRANTED}', 'granted@example.com');`);
});
after(() => db.close());

describe("payments, end to end (sandbox provider → webhook → database → access)", () => {
  let ref = "";
  let periodEnd = "";

  it("a guest on free: the first inventory lesson is open, the second is not", async () => {
    const r = await reader();
    assert.deepEqual([r.tier, r.lesson, canAccessWith(resolveAccess({ configured: true }), INVENTORY, "inventory-intro")], ["free", false, true]);
  });

  it("pays for courses: the subscription opens, the locked lesson opens, and an invoice is kept", async () => {
    const { url } = await provider.createCheckout({ userId: STUDENT, email: "student@example.com", name: "סטודנט", tier: "courses", interval: "month", amount: 49, description: "קורסים", successUrl: "/checkout/thanks", cancelUrl: "/pricing" });
    const checkout = provider.readCheckout(new URL(url).searchParams.get("token"))!;
    const paid = await provider.pay(checkout, "4580 0000 0000 0001");
    assert.ok(paid.ok);
    ref = paid.subscriptionRef;
    assert.equal(last().outcome, "applied");
    const r = await reader();
    periodEnd = addPeriod(clock, "month").toISOString();
    assert.deepEqual([r.tier, r.lesson, r.exam, r.row.provider_ref], ["courses", true, false, ref]);
    assert.deepEqual((await invoices()).map((i) => Number(i.amount)), [49]);
    assert.deepEqual(await invoices(OTHER), [], "another reader sees no one else's invoice");
  });

  it("a delivery that arrives again is applied once: same subscription, still one invoice", async () => {
    const again = last();
    await provider.deliver(again.body).catch(() => {});
    // The re-sent body has a fresh signature but the same event id.
    assert.equal(last().outcome, "duplicate");
    assert.equal((await invoices()).length, 1);
  });

  it("renews: a new period and a second invoice", async () => {
    tick(30 * 86_400_000);
    await provider.simulate("renewed", { userId: STUDENT, subscriptionRef: ref, tier: "courses", interval: "month", amount: 49, periodEnd });
    const r = await reader();
    assert.equal(r.row.current_period_end?.slice(0, 10), addPeriod(new Date(periodEnd), "month").toISOString().slice(0, 10));
    assert.equal((await invoices()).length, 2);
  });

  it("ignores an older event that arrives late, and one about another subscription", async () => {
    const late = JSON.stringify({ id: "evt_late", type: "payment_failed", userId: STUDENT, subscriptionRef: ref, occurredAt: "2026-11-01T00:00:00Z" });
    await provider.deliver(late);
    assert.equal(last().outcome, "stale");
    const foreign = JSON.stringify({ id: "evt_old_sub", type: "canceled", userId: STUDENT, subscriptionRef: "sbx_sub_an_older_one", occurredAt: clock.toISOString() });
    await provider.deliver(foreign);
    assert.equal(last().outcome, "ignored");
    assert.equal((await reader()).lesson, true);
  });

  it("a failed charge closes access; the next renewal opens it again", async () => {
    tick(60_000);
    await provider.simulate("payment_failed", { userId: STUDENT, subscriptionRef: ref, tier: "courses", interval: "month", amount: 49, periodEnd: null });
    assert.deepEqual([(await reader()).row.status, (await reader()).lesson], ["past_due", false]);
    tick(60_000);
    await provider.simulate("renewed", { userId: STUDENT, subscriptionRef: ref, tier: "courses", interval: "month", amount: 49, periodEnd: clock.toISOString() });
    assert.equal((await reader()).lesson, true);
  });

  it("changes plan to exams: the exams area opens", async () => {
    tick(60_000);
    await provider.changePlan(ref, STUDENT, { tier: "exams", interval: "year", amount: 690 });
    const r = await reader();
    assert.deepEqual([r.tier, r.exam, r.lesson], ["exams", true, true]);
    periodEnd = r.row.current_period_end!;
  });

  it("cancels: stays open until the end of the period paid for, then closes", async () => {
    tick(60_000);
    await provider.cancelAtPeriodEnd(ref, STUDENT);
    let r = await reader();
    assert.deepEqual([r.row.cancel_at_period_end, r.lesson], [true, true], "still open after cancelling");
    clock = new Date(new Date(periodEnd).getTime() + 1000);
    r = await reader();
    assert.equal(r.lesson, false, "closed once the period ends");
    await provider.simulate("canceled", { userId: STUDENT, subscriptionRef: ref, tier: "exams", interval: "year", amount: 690, periodEnd });
    assert.equal((await reader()).row.status, "canceled");
  });

  it("a refund closes access at once", async () => {
    const { url } = await provider.createCheckout({ userId: OTHER, email: "o@example.com", name: "", tier: "courses", interval: "month", amount: 49, description: "", successUrl: "/", cancelUrl: "/" });
    const paid = await provider.pay(provider.readCheckout(new URL(url).searchParams.get("token"))!, "4580000000000001");
    assert.ok(paid.ok);
    assert.equal((await reader(OTHER)).lesson, true);
    tick(60_000);
    await provider.simulate("refunded", { userId: OTHER, subscriptionRef: paid.subscriptionRef, tier: "courses", interval: "month", amount: 49, periodEnd: null });
    assert.equal((await reader(OTHER)).lesson, false);
  });

  it("a purchase replaces a manual grant", async () => {
    await db.exec(`insert into public.subscriptions (user_id, tier, status, provider) values ('${GRANTED}', 'exams', 'active', 'manual')`);
    const { url } = await provider.createCheckout({ userId: GRANTED, email: "g@example.com", name: "", tier: "courses", interval: "month", amount: 49, description: "", successUrl: "/", cancelUrl: "/" });
    assert.ok((await provider.pay(provider.readCheckout(new URL(url).searchParams.get("token"))!, "4580000000000001")).ok);
    const r = await reader(GRANTED);
    assert.deepEqual([r.tier, r.row.provider_ref?.startsWith("sbx_sub_")], ["courses", true]);
  });
});

describe("payments: who may do what in the database", () => {
  it("no reader can apply an event, read the event log, or write an invoice", async () => {
    const a = applyArgs("sandbox", { id: "evt_x", type: "activated", userId: STUDENT, occurredAt: clock.toISOString(), subscriptionRef: "s", tier: "exams", periodEnd: clock.toISOString() }, {});
    const call = "select public.apply_billing_event($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)";
    const params = [a.p_id, a.p_provider, a.p_type, a.p_user, a.p_occurred_at, a.p_provider_ref, a.p_tier, a.p_interval, a.p_period_end, a.p_invoice, a.p_payload];
    assert.ok(!(await db.can(STUDENT, call, params)), "a reader gives themselves a plan");
    assert.ok(!(await db.can("guest", call, params)));
    assert.deepEqual(await db.as(STUDENT, "select id from public.billing_events"), []);
    assert.ok(!(await db.can(STUDENT, `insert into public.invoices (user_id, provider, provider_ref, amount, url, issued_at) values ('${STUDENT}', 'x', 'y', 0, '/x', now())`)));
  });
});
