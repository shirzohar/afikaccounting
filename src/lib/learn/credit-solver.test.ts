import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALON, DOR, GILBOA, SCENARIO_A, SCENARIO_B, SCENARIO_C, SELF } from "./credit-losses";
import { type CreditValues, missingFor, solveCredit, stepsFor } from "./credit-solver";

const near = (a: number | undefined, b: number, msg?: string) => assert.ok(a !== undefined && Math.abs(a - b) < 0.01, `${msg ?? ""} expected ${b}, got ${a}`);
/** No specific customer and no recovered debt, as most questions give them. */
const plain: CreditValues = { specificDebt: 0, specificRate: 0, recovered: 0 };

describe("the credit-loss solver: the lesson's examples, from the figures each one gives", () => {
  it("Alon: the expense, the closing balances and net", () => {
    const s = solveCredit({ ...plain, openingGross: 700_000, openingAllowance: 30_000, creditSales: 2_000_000, collections: 1_888_000, writeOffs: 12_000, generalRate: 0.05 });
    near(s.values.closingGross, ALON.result.gross);
    near(s.values.closingAllowance, ALON.required);
    near(s.values.expense, ALON.result.expense);
    near(s.values.closingNet, ALON.result.net);
    assert.deepEqual(s.conflicts, []);
  });

  it("scenario A: the opening gross and allowance from the net and the rate — two unknowns together", () => {
    const s = solveCredit(
      { ...plain, openingNet: SCENARIO_A.openingNet, openingRate: SCENARIO_A.rate, creditSales: 1_500_000, collections: 1_420_000, writeOffs: 10_000 },
      { sameRate: true },
    );
    near(s.values.openingGross, SCENARIO_A.openingAR);
    near(s.values.openingAllowance, SCENARIO_A.openingAllowance);
    near(s.values.expense, SCENARIO_A.result.expense);
  });

  it("scenario B: the rate from last year's balances, then the expense", () => {
    const s = solveCredit({ ...plain, openingGross: 900_000, openingAllowance: 45_000, creditSales: 3_000_000, collections: 2_832_000, writeOffs: 28_000 }, { sameRate: true });
    near(s.values.generalRate, SCENARIO_B.rate);
    near(s.values.expense, SCENARIO_B.result.expense);
  });

  it("scenario C: collections balance the customers' card", () => {
    const s = solveCredit(
      { ...plain, openingGross: SCENARIO_C.openingAR, closingGross: SCENARIO_C.closingAR, creditSales: 1_250_000, writeOffs: 14_000, openingRate: SCENARIO_C.rate },
      { sameRate: true },
    );
    near(s.values.collections, SCENARIO_C.collections!);
    near(s.values.expense, SCENARIO_C.result.expense);
  });

  it("Dor: a specific customer beside the general rate", () => {
    const s = solveCredit({ recovered: 0, openingGross: 820_000, openingAllowance: 50_000, creditSales: 2_600_000, collections: 2_520_000, writeOffs: 0, specificDebt: DOR.specificDebt, specificRate: DOR.specificRate, generalRate: DOR.generalRate });
    near(s.values.closingAllowance, DOR.required);
    near(s.values.expense, DOR.result.expense);
  });

  it("the opening allowance, when the expense is given", () => {
    const s = solveCredit({ specificDebt: 0, specificRate: 0, openingGross: 860_000, creditSales: 2_000_000, collections: 1_951_000, writeOffs: 9_000, recovered: 2_000, generalRate: 0.06, expense: SELF[1].result.expense });
    near(s.values.openingAllowance, SELF[1].openingAllowance);
  });

  it("a reversal comes out as a negative expense", () => {
    const s = solveCredit({ recovered: 0, writeOffs: 0, openingGross: 380_000, openingAllowance: 60_000, creditSales: 1_000_000, collections: 980_000, specificDebt: 50_000, specificRate: 0.8, generalRate: 0.03 });
    near(s.values.expense, SELF[2].result.expense);
    assert.ok(s.values.expense! < 0);
  });

  it("Gilboa, the exam question: net at the start, a bankruptcy, a recovered debt and a specific customer", () => {
    const s = solveCredit({
      openingNet: GILBOA.openingNet,
      openingRate: GILBOA.openingRate,
      creditSales: GILBOA.creditSales,
      collections: GILBOA.collections,
      writeOffs: GILBOA.bankruptDebt,
      recovered: GILBOA.recovered,
      specificDebt: GILBOA.specificDebt,
      specificRate: GILBOA.specificRate,
      generalRate: GILBOA.generalRate,
    });
    near(s.values.openingGross, GILBOA.openingGross);
    near(s.values.closingAllowance, GILBOA.required);
    near(s.values.expense, GILBOA.result.expense);
    near(s.values.closingNet, GILBOA.net);
  });
});

describe("the credit-loss solver: what it says when it cannot", () => {
  it("names what is missing", () => {
    const s = solveCredit({ ...plain, openingGross: 700_000, openingAllowance: 30_000, writeOffs: 12_000, generalRate: 0.05 });
    assert.equal(s.values.expense, undefined);
    const missing = missingFor("expense", s);
    assert.ok(missing.includes("closingAllowance"), missing.join());
  });

  it("flags figures that do not agree", () => {
    const s = solveCredit({ ...plain, openingGross: 700_000, creditSales: 2_000_000, collections: 1_888_000, writeOffs: 12_000, closingGross: 900_000 });
    assert.equal(s.conflicts.length, 1);
  });

  it("shows only the steps that lead to the answer, in order", () => {
    const s = solveCredit({ ...plain, openingGross: 700_000, openingAllowance: 30_000, creditSales: 2_000_000, collections: 1_888_000, writeOffs: 12_000, generalRate: 0.05 });
    assert.deepEqual(
      stepsFor("expense", s).map((x) => x.key),
      ["closingGross", "closingAllowance", "expense"],
    );
  });
});
