import { describe, it, expect } from "vitest";
import { scaleNutriments, scaleFactor } from "./portion";
import type { FoodItem } from "../types";

const per100g: FoodItem = {
  id: "x",
  name: "Oats",
  basis: "100g",
  servingGrams: 40,
  nutriments: { kcal: 380, protein: 13, carbs: 67, fat: 7 },
  source: "custom",
};

const perServing: FoodItem = {
  id: "y",
  name: "Protein bar",
  basis: "serving",
  servingGrams: 60,
  nutriments: { kcal: 200, protein: 20, carbs: 20, fat: 6 },
  source: "custom",
};

describe("scaleFactor", () => {
  it("per-100g by grams", () => {
    expect(scaleFactor(per100g, { grams: 50 })).toBeCloseTo(0.5);
  });
  it("per-100g by servings uses servingGrams", () => {
    expect(scaleFactor(per100g, { servings: 2 })).toBeCloseTo(0.8); // 2*40/100
  });
  it("per-serving by servings", () => {
    expect(scaleFactor(perServing, { servings: 1.5 })).toBeCloseTo(1.5);
  });
  it("per-serving by grams uses servingGrams", () => {
    expect(scaleFactor(perServing, { grams: 30 })).toBeCloseTo(0.5); // 30/60
  });
  it("returns null when amount is unusable", () => {
    expect(scaleFactor(per100g, {})).toBeNull();
    expect(scaleFactor({ ...per100g, servingGrams: undefined }, { servings: 2 })).toBeNull();
  });
});

describe("scaleNutriments", () => {
  it("scales all macros for 150 g of oats", () => {
    const n = scaleNutriments(per100g, { grams: 150 })!;
    expect(n.kcal).toBe(570); // 380*1.5
    expect(n.protein).toBeCloseTo(19.5);
    expect(n.carbs).toBeCloseTo(100.5);
    expect(n.fat).toBeCloseTo(10.5);
  });
  it("returns null for an unusable amount", () => {
    expect(scaleNutriments(per100g, {})).toBeNull();
  });
});
