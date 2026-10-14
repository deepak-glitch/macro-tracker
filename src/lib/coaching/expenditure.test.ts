import { describe, it, expect } from "vitest";
import {
  mifflinBMR,
  formulaTDEE,
  estimateExpenditure,
  shiftDate,
  daysBetween,
} from "./expenditure";
import { DEFAULT_PROFILE, type WeightEntry } from "../types";

const profile = { ...DEFAULT_PROFILE, sex: "male" as const, age: 30, heightCm: 180, activity: 1.45 };

describe("mifflinBMR", () => {
  it("matches the published formula for a known case", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(mifflinBMR("male", 80, 180, 30)).toBe(1780);
    // female: same base - 161
    expect(mifflinBMR("female", 80, 180, 30)).toBe(1780 - 5 - 161);
  });
});

describe("formulaTDEE", () => {
  it("applies the activity multiplier", () => {
    expect(formulaTDEE(profile, 80)).toBeCloseTo(1780 * 1.45, 5);
  });
});

describe("date helpers", () => {
  it("shiftDate and daysBetween are consistent", () => {
    expect(shiftDate("2026-01-01", 20)).toBe("2026-01-21");
    expect(daysBetween("2026-01-01", "2026-01-21")).toBe(20);
    expect(shiftDate("2026-02-28", 1)).toBe("2026-03-01");
  });
});

function makeDays(n: number, startKg: number, perDayKg: number) {
  const weights: WeightEntry[] = [];
  const intake: Array<{ date: string; kcal: number }> = [];
  for (let i = 0; i < n; i++) {
    const date = shiftDate("2026-01-01", i);
    weights.push({ date, kg: startKg + perDayKg * i });
    intake.push({ date, kcal: 2000 });
  }
  return { weights, intake };
}

describe("estimateExpenditure", () => {
  it("falls back to the formula prior with no data", () => {
    const est = estimateExpenditure({ profile, weights: [], intake: [] });
    expect(est.confidence).toBe(0);
    expect(est.dataDriven).toBeUndefined();
    expect(est.tdee).toBe(est.prior);
  });

  it("estimates expenditure ABOVE intake when weight is falling", () => {
    // Eat 2000/day, lose ~1 kg over 21 days -> expenditure should exceed 2000.
    const { weights, intake } = makeDays(21, 80, -1 / 20);
    const est = estimateExpenditure({ profile, weights, intake });
    expect(est.dataDriven).toBeDefined();
    expect(est.dataDriven!).toBeGreaterThan(2000);
    expect(est.tdee).toBeGreaterThan(2000);
    expect(est.confidence).toBeGreaterThan(0.6);
  });

  it("estimates expenditure BELOW intake when weight is rising", () => {
    const { weights, intake } = makeDays(21, 80, 1 / 20); // gaining
    const est = estimateExpenditure({ profile, weights, intake });
    expect(est.dataDriven!).toBeLessThan(2000);
  });

  it("ignores the data-driven path when logging is too sparse", () => {
    const { weights } = makeDays(21, 80, -1 / 20);
    // Only 2 of 21 days have intake logged -> below completeness threshold.
    const intake = [
      { date: "2026-01-01", kcal: 2000 },
      { date: "2026-01-21", kcal: 2000 },
    ];
    const est = estimateExpenditure({ profile, weights, intake });
    expect(est.confidence).toBe(0);
    expect(est.tdee).toBe(est.prior);
  });
});
