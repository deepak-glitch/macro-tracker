import type { Nutriments, Profile } from "../types";
import { KCAL_PER_KG } from "./expenditure";

export interface MacroTargets {
  kcal: number;
  protein: number; // g
  fat: number; // g
  carbs: number; // g
  /** Daily energy delta vs. expenditure (negative = deficit). */
  dailyDelta: number;
}

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/**
 * Turn an expenditure estimate + goal into daily calorie and macro targets.
 *
 *   dailyDelta = (goalRate%/wk × bodyWeight × KCAL_PER_KG) / 7
 *   calories   = expenditure + dailyDelta
 *   protein/fat = per-kg rules; carbs fill the remainder.
 */
export function computeTargets(
  profile: Profile,
  expenditureKcal: number,
  bodyWeightKg: number,
): MacroTargets {
  const weeklyWeightChangeKg = (profile.goalRatePctPerWeek / 100) * bodyWeightKg;
  const dailyDelta = Math.round((weeklyWeightChangeKg * KCAL_PER_KG) / 7);

  // Never prescribe below BMR-ish floors; keep a sane minimum.
  const kcal = Math.max(1200, Math.round(expenditureKcal + dailyDelta));

  const protein = Math.round(profile.proteinPerKg * bodyWeightKg);
  const fat = Math.round(profile.fatPerKg * bodyWeightKg);

  const proteinKcal = protein * KCAL_PER_G.protein;
  const fatKcal = fat * KCAL_PER_G.fat;
  const carbsKcal = Math.max(0, kcal - proteinKcal - fatKcal);
  const carbs = Math.round(carbsKcal / KCAL_PER_G.carbs);

  return { kcal, protein, fat, carbs, dailyDelta };
}

/** Sum a set of log entries' absolute nutriments. */
export function sumNutriments(items: Array<{ nutriments: Nutriments }>): Nutriments {
  return items.reduce<Nutriments>(
    (acc, it) => ({
      kcal: acc.kcal + it.nutriments.kcal,
      protein: acc.protein + it.nutriments.protein,
      carbs: acc.carbs + it.nutriments.carbs,
      fat: acc.fat + it.nutriments.fat,
      fiber: (acc.fiber ?? 0) + (it.nutriments.fiber ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}
