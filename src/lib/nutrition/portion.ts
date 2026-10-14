import type { FoodItem, Nutriments } from "../types";

export interface Amount {
  grams?: number;
  servings?: number;
}

/**
 * Scale a food's reference nutriments to an eaten amount.
 *
 * Handles both reference bases (per-100g and per-serving) and both amount
 * kinds (grams and servings), converting through `servingGrams` when needed.
 * Returns null when the amount can't be resolved (e.g. servings asked for a
 * food with no known serving weight on a 100g basis... actually that's fine;
 * null only when no usable amount was given).
 */
export function scaleNutriments(food: FoodItem, amount: Amount): Nutriments | null {
  const factor = scaleFactor(food, amount);
  if (factor == null) return null;
  const n = food.nutriments;
  return {
    kcal: Math.round(n.kcal * factor),
    protein: round1(n.protein * factor),
    carbs: round1(n.carbs * factor),
    fat: round1(n.fat * factor),
    fiber: n.fiber != null ? round1(n.fiber * factor) : undefined,
  };
}

/** Multiplier to apply to the food's reference nutriments. */
export function scaleFactor(food: FoodItem, amount: Amount): number | null {
  const { grams, servings } = amount;

  if (food.basis === "100g") {
    if (grams != null && grams > 0) return grams / 100;
    if (servings != null && servings > 0 && food.servingGrams) {
      return (servings * food.servingGrams) / 100;
    }
    return null;
  }

  // basis === "serving"
  if (servings != null && servings > 0) return servings;
  if (grams != null && grams > 0 && food.servingGrams) {
    return grams / food.servingGrams;
  }
  return null;
}

/** Human-readable amount label, e.g. "150 g" or "1.5 servings". */
export function amountLabel(amount: Amount): string {
  if (amount.grams != null) return `${trim(amount.grams)} g`;
  if (amount.servings != null) {
    return `${trim(amount.servings)} serving${amount.servings === 1 ? "" : "s"}`;
  }
  return "";
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
