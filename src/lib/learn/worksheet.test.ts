import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, trialBalance, tbBalanced, typeOf } from "./basics";
import { GEFEN, SHAKED, TAMAR, worksheetResult, worksheetRows } from "./worksheet";

describe("the worksheet questions", () => {
  for (const c of [SHAKED, TAMAR, GEFEN])
    it(`${c.name}: balanced before, every adjustment balanced, every account typed, the answers among the accounts offered`, () => {
      assert.ok(tbBalanced(trialBalance(c.preliminary)), "the trial balance before the adjustments");
      for (const it of c.items) {
        assert.ok(isBalanced(it.entry), it.title);
        for (const l of it.entry.lines) assert.ok(it.accounts.includes(l.account), `${it.title}: ${l.account}`);
        it.accounts.forEach(typeOf);
      }
      Object.keys(c.preliminary).forEach(typeOf);
      const rows = worksheetRows(c);
      const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + pick(r), 0);
      assert.equal(sum((r) => r.adjDr), sum((r) => r.adjCr), "the adjustments column balances");
      assert.equal(Math.round(sum((r) => r.after)), 0, "the final trial balance balances");
    });

  it("Shaked: worked out by hand — profit 122,000, retained earnings from 70,000 to 192,000", () => {
    // Income 620,000 + 30,000 + 3,000 + closing stock 52,000 = 705,000; expenses 45,000 + 310,000 + 180,000 + 12,000 + 18,000 + 12,000 + 6,000 = 583,000.
    const r = worksheetResult(SHAKED);
    assert.equal(r.totalIncome, 705_000);
    assert.equal(r.totalExpenses, 583_000);
    assert.equal(r.profit, 122_000);
    assert.equal(r.closingRetained, 192_000);
  });

  it("Tamar: worked out by hand — profit 155,900, from accumulated losses of 40,000 to retained earnings of 115,900", () => {
    // Income 880,000 + 9,000 + 75,000 = 964,000; expenses 60,000 + 420,000 + 230,000 + 20,000 + 22,000 + 30,000 + 12,000 + 12,000 + 2,100 = 808,100.
    const r = worksheetResult(TAMAR);
    assert.equal(r.profit, 155_900);
    assert.equal(r.openingRetained, -40_000);
    assert.equal(r.closingRetained, 115_900);
  });

  it("Gefen, the harder game: worked out by hand — profit 278,300, retained earnings from 95,000 to 373,300", () => {
    // Income: 1,350,000 + management fees 44,000 (48,000 − 8,000 + 4,000) + closing stock at NRV 104,000 = 1,498,000.
    // Expenses: 85,000 + 690,000 + 310,000 + rent 45,000 + insurance 15,000 + maintenance 10,000 + interest 16,000 + 40,000 + credit losses 8,700 = 1,219,700.
    const r = worksheetResult(GEFEN);
    assert.equal(r.totalIncome, 1_498_000);
    assert.equal(r.totalExpenses, 1_219_700);
    assert.equal(r.profit, 278_300);
    assert.equal(r.closingRetained, 373_300);
    assert.equal(GEFEN.unknown, "עודפים");
    assert.ok(GEFEN.items.some((it) => it.entry.lines.length > 2), "a compound entry among them");
  });

  it("Tamar's sorting deck: more than twenty cards, with the traps among them", () => {
    const accounts = Object.keys(TAMAR.preliminary);
    assert.ok(accounts.length >= 20, `${accounts.length} cards`);
    for (const a of ["הפרשה להפסדי אשראי חזויים", "מקדמות לספקים", "מקדמות מלקוחות", "עודפים", "הוצאות ביטוח מראש"]) assert.ok(accounts.includes(a), a);
    assert.ok(TAMAR.preliminary["עודפים"] > 0, "retained earnings in debit: accumulated losses");
  });
});
