import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEvent } from "./events";
import { SIGNATURE_HEADER, SandboxProvider } from "./providers/sandbox";
import { signPayload, TOLERANCE_SECONDS, verifySignature } from "./signature";
import { EVENT_TYPES, type BillingEvent } from "./types";
import { type ApplyOutcome, handleWebhook } from "./webhook";

const SECRET = "whsec_test_0123456789";
const NOW = Date.parse("2026-11-02T10:00:00Z");
const USER = "00000000-0000-4000-8000-0000000000aa";
const event = (over: Partial<BillingEvent> = {}): BillingEvent => ({
  id: "evt_1",
  type: "activated",
  userId: USER,
  occurredAt: new Date(NOW).toISOString(),
  subscriptionRef: "sub_1",
  tier: "courses",
  interval: "month",
  periodEnd: "2026-12-02T10:00:00.000Z",
  ...over,
});

describe("webhook signatures", () => {
  const body = JSON.stringify(event());
  it("accepts the signature of the exact body", () => assert.deepEqual(verifySignature(body, signPayload(body, SECRET, NOW), SECRET, NOW), { ok: true }));
  it("refuses a missing, malformed or foreign signature", () => {
    assert.deepEqual(verifySignature(body, null, SECRET, NOW), { ok: false, error: "missing" });
    assert.deepEqual(verifySignature(body, "v1=abc", SECRET, NOW), { ok: false, error: "malformed" });
    assert.deepEqual(verifySignature(body, signPayload(body, "another-secret", NOW), SECRET, NOW), { ok: false, error: "mismatch" });
  });
  it("refuses a body changed after signing", () => {
    const sig = signPayload(body, SECRET, NOW);
    assert.deepEqual(verifySignature(body.replace("courses", "exams"), sig, SECRET, NOW), { ok: false, error: "mismatch" });
  });
  it("refuses an old signature replayed later", () => {
    const sig = signPayload(body, SECRET, NOW);
    assert.equal(verifySignature(body, sig, SECRET, NOW + (TOLERANCE_SECONDS - 5) * 1000).ok, true);
    assert.deepEqual(verifySignature(body, sig, SECRET, NOW + (TOLERANCE_SECONDS + 5) * 1000), { ok: false, error: "expired" });
  });
});

describe("events", () => {
  it("parses every type, with what it needs", () => {
    for (const type of EVENT_TYPES) {
      const parsed = parseEvent(event({ type }));
      assert.ok("event" in parsed, type);
      assert.equal(parsed.event.type, type);
    }
  });
  it("refuses an event without what its type needs", () => {
    assert.deepEqual(parseEvent(event({ tier: undefined })), { error: "activated needs tier" });
    assert.deepEqual(parseEvent(event({ type: "renewed", periodEnd: undefined })), { error: "renewed needs periodEnd" });
    assert.deepEqual(parseEvent(event({ type: "canceled", subscriptionRef: undefined })), { error: "canceled needs subscriptionRef" });
    assert.deepEqual(parseEvent({ ...event(), userId: "not-a-uuid" }), { error: "missing or bad userId" });
    assert.deepEqual(parseEvent({ ...event(), type: "chargeback" }), { error: "unknown type chargeback" });
  });
  it("keeps a well-formed invoice and drops a broken one", () => {
    const ok = parseEvent(event({ invoice: { ref: "ch_1", number: "1001", amount: 49, currency: "ILS", url: "https://provider.example/inv/1", issuedAt: event().occurredAt } }));
    assert.ok("event" in ok && ok.event.invoice?.amount === 49);
    const bad = parseEvent({ ...event(), invoice: { ref: "ch_1", amount: 49, url: "javascript:alert(1)" } });
    assert.ok("event" in bad && bad.event.invoice === undefined);
  });
});

describe("the sandbox provider", () => {
  const sent: { body: string; signature: string }[] = [];
  const p = new SandboxProvider({ baseUrl: "http://localhost:3000", secret: SECRET, now: () => new Date(NOW), send: async (body, signature) => void sent.push({ body, signature }) });
  const checkout = { userId: USER, email: "s@example.com", name: "סטודנט", tier: "courses" as const, interval: "month" as const, amount: 49, description: "x", successUrl: "/checkout/thanks", cancelUrl: "/pricing" };

  it("hands out a payment page whose token can't be forged", async () => {
    const { url } = await p.createCheckout(checkout);
    const token = new URL(url).searchParams.get("token")!;
    assert.equal(p.readCheckout(token)?.amount, 49);
    const [body, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), amount: 1 })).toString("base64url");
    assert.equal(p.readCheckout(`${forged}.${mac}`), null);
  });
  it("declines the test card, and charges any other with a signed activation and an invoice", async () => {
    const c = p.readCheckout(new URL((await p.createCheckout(checkout)).url).searchParams.get("token"))!;
    assert.deepEqual(await p.pay(c, "4580 0000 0000 0002"), { ok: false, error: "הכרטיס סורב (כרטיס בדיקה לסירוב)." });
    assert.equal(sent.length, 0, "a declined card sends nothing");
    const paid = await p.pay(c, "4580 0000 0000 0001");
    assert.ok(paid.ok);
    const e = JSON.parse(sent[0].body) as BillingEvent;
    assert.deepEqual([e.type, e.tier, e.periodEnd, e.invoice?.amount], ["activated", "courses", "2026-12-02T10:00:00.000Z", 49]);
    assert.deepEqual(verifySignature(sent[0].body, sent[0].signature, SECRET, NOW), { ok: true });
  });
});

describe("the webhook", () => {
  const provider = new SandboxProvider({ baseUrl: "http://localhost:3000", secret: SECRET, now: () => new Date(NOW) });
  const headers = (body: string, secret = SECRET) => new Headers({ [SIGNATURE_HEADER]: signPayload(body, secret, NOW) });
  /** A stand-in for the database: applies each event id once, like public.apply_billing_event. */
  const fakeDb = () => {
    const seen = new Set<string>();
    const calls: BillingEvent[] = [];
    const apply = async (name: string, e: BillingEvent): Promise<ApplyOutcome> => {
      calls.push(e);
      if (seen.has(`${name}:${e.id}`)) return "duplicate";
      seen.add(`${name}:${e.id}`);
      return "applied";
    };
    return { calls, apply };
  };

  it("applies a correctly signed event, for every type", async () => {
    for (const type of EVENT_TYPES) {
      const db = fakeDb();
      const body = JSON.stringify(event({ type, id: `evt_${type}` }));
      const res = await handleWebhook(body, headers(body), { provider, apply: db.apply });
      assert.deepEqual(res, { status: 200, body: { ok: true, outcome: "applied" } }, type);
      assert.equal(db.calls[0].type, type);
    }
  });
  it("refuses a bad signature with 400 and touches nothing", async () => {
    const db = fakeDb();
    const body = JSON.stringify(event());
    const res = await handleWebhook(body, headers(body, "wrong-secret"), { provider, apply: db.apply });
    assert.equal(res.status, 400);
    assert.equal(db.calls.length, 0);
    const unsigned = await handleWebhook(body, new Headers(), { provider, apply: db.apply });
    assert.deepEqual([unsigned.status, db.calls.length], [400, 0]);
  });
  it("answers a repeated delivery 200, as a duplicate — the provider stops retrying, nothing is applied twice", async () => {
    const db = fakeDb();
    const body = JSON.stringify(event());
    const first = await handleWebhook(body, headers(body), { provider, apply: db.apply });
    const again = await handleWebhook(body, headers(body), { provider, apply: db.apply });
    assert.deepEqual([first.body.outcome, again.status, again.body.outcome], ["applied", 200, "duplicate"]);
  });
  it("refuses a signed but malformed event with 400, and answers 500 when storing fails (so the provider retries)", async () => {
    const db = fakeDb();
    const bad = JSON.stringify({ ...event(), type: "chargeback" });
    assert.equal((await handleWebhook(bad, headers(bad), { provider, apply: db.apply })).status, 400);
    const body = JSON.stringify(event());
    const res = await handleWebhook(body, headers(body), { provider, apply: async () => Promise.reject(new Error("db down")) });
    assert.deepEqual(res, { status: 500, body: { ok: false, error: "db down" } });
  });
  it("refuses an oversized body before reading it", async () => {
    const res = await handleWebhook("x".repeat(70_000), new Headers(), { provider, apply: fakeDb().apply });
    assert.equal(res.status, 413);
  });
});
