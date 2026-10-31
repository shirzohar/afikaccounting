import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canOpenExam, resolveAccess } from "../access";
import { TOPICS } from "../catalog";
import { cell, parseBlocks, parseSteps, parseSubjects } from "./parse";
import { SEED_EXAMS } from "./seed";
import { matchesExam } from "./types";

const NOW = new Date("2026-11-01T12:00:00Z");
const sub = (tier: string, end: string | null = null) => ({ tier, status: "active", current_period_end: end });
const READERS = {
  guest: resolveAccess({ configured: true }),
  free: resolveAccess({ configured: true, userId: "u", rows: [] }),
  courses: resolveAccess({ configured: true, userId: "u", rows: [sub("courses")], now: NOW }),
  exams: resolveAccess({ configured: true, userId: "u", rows: [sub("exams")], now: NOW }),
  expired: resolveAccess({ configured: true, userId: "u", rows: [sub("exams", "2026-10-01T00:00:00Z")], now: NOW }),
  admin: resolveAccess({ configured: true, userId: "u", admin: true }),
  demo: resolveAccess({ configured: false }),
};

describe("who opens an exam", () => {
  const locked = { isSample: false };
  const sample = { isSample: true };
  it("opens a locked exam on the exams plan only (and to admins, and in demo mode)", () => {
    const open = Object.entries(READERS)
      .filter(([, a]) => canOpenExam(a, locked))
      .map(([k]) => k);
    assert.deepEqual(open, ["exams", "admin", "demo"]);
  });
  it("opens a sample to everyone", () => {
    for (const [who, a] of Object.entries(READERS)) assert.ok(canOpenExam(a, sample), who);
  });
});

describe("solution data from the editor", () => {
  it("reads typed amounts and cells as numbers", () => {
    assert.equal(cell("1,200"), 1200);
    assert.equal(cell("(300)"), -300);
    assert.equal(cell("48.75"), 48.75);
    assert.equal(cell("מלאי פתיחה"), "מלאי פתיחה");
    assert.equal(cell("31.12"), "31.12", "a date stays text");
    assert.equal(cell("10.3"), "10.3");
    assert.equal(cell("1.1.2026"), "1.1.2026");
  });
  it("keeps journal lines with an account and an amount, and drops the rest", () => {
    const [b] = parseBlocks([{ kind: "entry", title: "", lines: [{ account: "מלאי", dr: "1,000" }, { account: "ספקים", cr: "1000" }, { account: "", dr: 5 }, { account: "ריק" }] }]);
    assert.deepEqual(b, { kind: "entry", title: "פקודת יומן", lines: [{ account: "מלאי", dr: 1000 }, { account: "ספקים", cr: 1000 }] });
  });
  it("drops unknown or empty blocks, and caps text", () => {
    assert.deepEqual(parseBlocks([{ kind: "script", text: "x" }, { kind: "text", text: "  " }, null, "x", { kind: "text", text: "a".repeat(9000) }]).map((b) => b.kind === "text" && b.text.length), [8000]);
  });
  it("cuts table rows to the columns, and keeps a step with only a title", () => {
    const [t] = parseBlocks([{ kind: "table", head: ["א", "ב"], rows: [["x", "1", "extra"], ["", ""]] }]);
    assert.deepEqual(t, { kind: "table", head: ["א", "ב"], rows: [["x", 1]] });
    assert.deepEqual(parseSteps([{ title: "רק כותרת" }, {}]), [{ title: "רק כותרת", explanation: "", blocks: [] }]);
  });
  it("splits subjects by commas, once each", () => assert.deepEqual(parseSubjects("FIFO, שווי מימוש נטו,FIFO, "), ["FIFO", "שווי מימוש נטו"]));
});

describe("the demo exams", () => {
  it("belong to topics on the learning path, have unique ids, and one sample", () => {
    for (const e of SEED_EXAMS) assert.ok(TOPICS.some((t) => t.id === e.topic), e.topic);
    assert.equal(new Set(SEED_EXAMS.map((e) => e.id)).size, SEED_EXAMS.length);
    assert.equal(SEED_EXAMS.filter((e) => e.isSample).length, 1);
  });
  it("survive the parser unchanged (what an admin saves is what they wrote)", () => {
    for (const e of SEED_EXAMS) {
      assert.deepEqual(parseBlocks(e.content.question), e.content.question, e.id);
      assert.deepEqual(parseSteps(e.content.steps), e.content.steps, e.id);
    }
  });
  it("balance every journal entry", () => {
    for (const e of SEED_EXAMS)
      for (const s of e.content.steps)
        for (const b of s.blocks)
          if (b.kind === "entry") {
            const dr = b.lines.reduce((a, l) => a + (l.dr ?? 0), 0);
            const cr = b.lines.reduce((a, l) => a + (l.cr ?? 0), 0);
            assert.equal(dr, cr, `${e.title}: ${b.title}`);
          }
  });
  it("add up: inventory by FIFO and average, and the write-down", () => {
    const layers = [[200, 50], [300, 60], [500, 66]];
    const units = layers.reduce((a, [u]) => a + u, 0);
    const cost = layers.reduce((a, [u, p]) => a + u * p, 0);
    assert.deepEqual([units, cost], [1000, 61_000]);
    const left = units - 700;
    const fifo = left * 66;
    const avg = (cost / units) * left;
    const nrv = left * (70 - 5);
    assert.deepEqual([fifo, cost - fifo, avg, cost - avg, nrv], [19_800, 41_200, 18_300, 42_700, 19_500]);
    assert.deepEqual([Math.max(0, fifo - nrv), Math.max(0, avg - nrv)], [300, 0]);
    assert.deepEqual([70_000 - (cost - fifo) - (fifo - nrv), 70_000 - (cost - avg)], [28_500, 27_300]);
  });
  it("add up: the fire, the revaluation and the profit or loss", () => {
    const atFire = 40_000 + 260_000 - (350_000 * 70) / 100;
    assert.deepEqual([atFire, atFire - 12_000, atFire - 12_000 - 35_000], [55_000, 43_000, 8_000]);
    const carrying = 500_000 - 2 * (500_000 / 10);
    assert.deepEqual([carrying, 480_000 - carrying, 480_000 / 8, 480_000 / 8 - 500_000 / 10], [400_000, 80_000, 60_000, 10_000]);
    const operating = 900 - 540 - 90 - 70;
    const beforeTax = operating + 15 - 20;
    assert.deepEqual([operating, operating + 15, beforeTax, beforeTax * 0.75], [200, 215, 195, 146.25]);
  });
  it("filter by topic, subject and year", () => {
    const all = SEED_EXAMS;
    assert.equal(all.filter((e) => matchesExam(e, { topic: "inventory" })).length, 2);
    assert.equal(all.filter((e) => matchesExam(e, { subject: "FIFO" })).length, 1);
    assert.equal(all.filter((e) => matchesExam(e, { year: "2025" })).length, 0);
  });
});
