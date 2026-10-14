import { describe, it, expect } from "vitest";
import { computeTargets, sumNutriments } from "./macros";
import { DEFAULT_PROFILE } from "../types";

describe("computeTargets", () => {
  it("computes a deficit from a cut goal", () => {
    const profile = { ...DEFAULT_PROFILE, goalRatePctPerWeek: -0.5, proteinPerKg: 2, fatPerKg: 0.8 };
    const t = computeTargets(profile, 2500, 80);
    // -0.5%/wk of 80kg = -0.4 kg/wk -> -0.4*7700/7 ≈ -440 kcal/day
    expect(t.dailyDelta).toBe(Math.round((-0.4 * 7700) / 7));
    expect(t.kcal).toBe(2500 + t.dailyDelta);
    expect(t.protein).toBe(160);
    expect(t.fat).toBe(64);
  });

  it("carbs fill the remaining calories", () => {
    const profile = { ...DEFAULT_PROFILE, goalRatePctPerWeek: 0, proteinPerKg: 2, fatPerKg: 0.8 };
    const t = computeTargets(profile, 2000, 80);
    const fromMacros = t.protein * 4 + t.carbs * 4 + t.fat * 9;
    expect(fromMacros).toBeGreaterThanOrEqual(t.kcal - 4);
    expect(fromMacros).toBeLessThanOrEqual(t.kcal + 4);
  });

  it("never prescribes below the 1200 kcal floor", () => {
    const profile = { ...DEFAULT_PROFILE, goalRatePctPerWeek: -1 };
    const t = computeTargets(profile, 1300, 60);
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
  });
});

describe("sumNutriments", () => {
  it("adds up entries", () => {
    const s = sumNutriments([
      { nutriments: { kcal: 100, protein: 10, carbs: 5, fat: 2, fiber: 1 } },
      { nutriments: { kcal: 250, protein: 5, carbs: 30, fat: 8 } },
    ]);
    expect(s.kcal).toBe(350);
    expect(s.protein).toBe(15);
    expect(s.carbs).toBe(35);
    expect(s.fat).toBe(10);
    expect(s.fiber).toBe(1);
  });
});
