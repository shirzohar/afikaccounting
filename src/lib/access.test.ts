import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAccessWith, effectiveTier, lockedOf, resolveAccess } from "./access";
import { TOPICS } from "./catalog";
import { PLANS, TIER_ORDER, tierAllows } from "./pricing";

const NOW = new Date("2026-10-31T12:00:00Z");
const topic = (id: string) => TOPICS.find((t) => t.id === id)!;
const sub = (tier: string, status = "active", end: string | null = null) => ({ tier, status, current_period_end: end });

describe("plans", () => {
  it("one plan per tier, in order, each including the one below", () => {
    assert.deepEqual(
      PLANS.map((p) => p.tier),
      TIER_ORDER,
    );
    assert.ok(tierAllows("exams", "courses") && tierAllows("courses", "free") && !tierAllows("free", "courses") && !tierAllows("courses", "exams"));
    assert.equal(PLANS.filter((p) => p.featured).length, 1);
    assert.equal(PLANS[0].monthly, 0);
  });
});

describe("effectiveTier", () => {
  it("is free without a subscription", () => assert.equal(effectiveTier([], NOW), "free"));
  it("counts active and trialing plans, open-ended or not yet ended", () => {
    assert.equal(effectiveTier([sub("courses")], NOW), "courses");
    assert.equal(effectiveTier([sub("exams", "trialing", "2026-11-30T00:00:00Z")], NOW), "exams");
  });
  it("ignores ended, canceled, unpaid and unknown plans", () => {
    assert.equal(effectiveTier([sub("courses", "active", "2026-10-01T00:00:00Z")], NOW), "free");
    assert.equal(effectiveTier([sub("courses", "canceled")], NOW), "free");
    assert.equal(effectiveTier([sub("courses", "past_due")], NOW), "free");
    assert.equal(effectiveTier([sub("platinum")], NOW), "free");
  });
  it("takes the best live plan", () => assert.equal(effectiveTier([sub("exams", "canceled"), sub("courses"), sub("exams", "active", "2027-01-01T00:00:00Z")], NOW), "exams"));
});

describe("resolveAccess (getAccess)", () => {
  it("opens everything in demo mode, unless a preview plan is set", () => {
    assert.deepEqual(resolveAccess({ configured: false }), { tier: "exams", demo: true, signedIn: false });
    assert.deepEqual(resolveAccess({ configured: false, previewTier: "free" }), { tier: "free", demo: false, signedIn: false });
  });
  it("puts a guest on free, even with rows passed", () => assert.deepEqual(resolveAccess({ configured: true, rows: [sub("exams")] }), { tier: "free", demo: false, signedIn: false }));
  it("reads a signed-in account's subscriptions", () => {
    assert.equal(resolveAccess({ configured: true, userId: "u", rows: [] }).tier, "free");
    assert.equal(resolveAccess({ configured: true, userId: "u", rows: [sub("courses")], now: NOW }).tier, "courses");
  });
  it("opens everything to an admin", () => assert.equal(resolveAccess({ configured: true, userId: "u", admin: true }).tier, "exams"));
});

describe("canAccess", () => {
  const free = resolveAccess({ configured: true });
  const courses = resolveAccess({ configured: true, userId: "u", rows: [sub("courses")], now: NOW });
  it("opens the free course whole to everyone", () => {
    assert.ok(canAccessWith(free, topic("basics")));
    assert.ok(canAccessWith(free, topic("basics"), "basics-final"));
  });
  it("opens only the taste of a paid course on free", () => {
    assert.ok(canAccessWith(free, topic("inventory"), "inventory-intro"));
    assert.ok(!canAccessWith(free, topic("inventory"), "inventory-cost"));
    assert.ok(!canAccessWith(free, topic("inventory")), "the topic as a whole is closed");
    assert.ok(canAccessWith(free, topic("ias16"), "what"));
    assert.ok(!canAccessWith(free, topic("ias16"), "revaluation"));
  });
  it("opens every paid course whole on courses and up", () => {
    for (const t of TOPICS) assert.ok(canAccessWith(courses, t), t.id);
    assert.deepEqual(lockedOf(courses, topic("inventory"), ["inventory-intro", "inventory-cost"]), []);
  });
  it("lists what is locked", () => assert.deepEqual(lockedOf(free, topic("inventory"), ["inventory-intro", "inventory-cost", "inventory-exam"]), ["inventory-cost", "inventory-exam"]));
});

describe("a locked lesson's outline", () => {
  it("keeps what the course path counts, and none of the content", async () => {
    const { outlineOf } = await import("./study/paths");
    const { INVENTORY_LESSONS } = await import("./study/inventory");
    const { maxXp } = await import("./study/score");
    const m = INVENTORY_LESSONS[1];
    const o = outlineOf(m);
    assert.equal(maxXp(o), maxXp(m));
    assert.deepEqual(o.exercises.map((x) => x.id), m.exercises.map((x) => x.id));
    const text = JSON.stringify({ exercises: o.exercises, traps: o.traps, tips: o.tips });
    for (const t of m.traps) assert.ok(!text.includes(t.prompt), t.id);
  });
});
