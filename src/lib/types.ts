// Shared domain model for the tracker.

/** Macronutrient + energy figures. Energy in kcal, macros in grams. */
export interface Nutriments {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export type FoodSource = "off" | "usda" | "custom";

/**
 * A food as stored in the catalog. Nutriments are expressed on a basis of
 * either one serving or 100 g, recorded in `basis`.
 */
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  basis: "serving" | "100g";
  /** Grams in one serving, when known (lets us convert between bases). */
  servingGrams?: number;
  nutriments: Nutriments;
  source: FoodSource;
}

export type Meal = "breakfast" | "lunch" | "dinner" | "snack";

/** A single logged amount of food on a given day. */
export interface LogEntry {
  id: string;
  date: string; // YYYY-MM-DD (local day)
  name: string;
  brand?: string;
  foodId?: string;
  meal: Meal;
  /** How much was eaten, in grams (weight-based entries). */
  grams?: number;
  /** How much was eaten, in servings (serving-based entries). */
  servings?: number;
  /** Absolute nutriments for this entry (already scaled by amount). */
  nutriments: Nutriments;
  loggedAt: string; // ISO timestamp
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  kg: number;
}

export type Sex = "male" | "female";
export type Units = "metric" | "imperial";

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  /** Activity multiplier applied to BMR for the formula prior (1.2–1.9). */
  activity: number;
  /** Goal weight-change rate as % of body weight per week. Negative = cut. */
  goalRatePctPerWeek: number;
  /** Protein target per kg of body weight. */
  proteinPerKg: number;
  /** Fat target per kg of body weight. */
  fatPerKg: number;
  units: Units;
  /** Toggle for the (stubbed) photo→calories feature. */
  photoAiEnabled: boolean;
}

export const DEFAULT_PROFILE: Profile = {
  sex: "male",
  age: 30,
  heightCm: 178,
  activity: 1.45,
  goalRatePctPerWeek: -0.5,
  proteinPerKg: 2.0,
  fatPerKg: 0.8,
  units: "metric",
  photoAiEnabled: false,
};
