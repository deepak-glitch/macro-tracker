import type { FoodItem, Nutriments } from "../types";

// USDA FoodData Central. Optional: needs a free API key
// (https://fdc.nal.usda.gov/api-key-signup.html). Good for generic/whole
// foods that lack a barcode. Without a key this provider is skipped.

const BASE = "https://api.nal.usda.gov/fdc/v1";

// FDC nutrient numbers.
const NUT = { kcal: "208", protein: "203", fat: "204", carbs: "205", fiber: "291" };

interface FdcNutrient {
  nutrientNumber?: string;
  value?: number;
}
interface FdcFood {
  fdcId: number;
  description?: string;
  brandOwner?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: FdcNutrient[];
}

function pick(nutrients: FdcNutrient[], number: string): number | undefined {
  return nutrients.find((n) => n.nutrientNumber === number)?.value;
}

function toFoodItem(f: FdcFood): FoodItem | null {
  const ns = f.foodNutrients ?? [];
  const kcal = pick(ns, NUT.kcal);
  if (kcal == null) return null;
  // FDC nutrient values are per 100 g for most data types.
  const nutriments: Nutriments = {
    kcal: Math.round(kcal),
    protein: round1(pick(ns, NUT.protein) ?? 0),
    carbs: round1(pick(ns, NUT.carbs) ?? 0),
    fat: round1(pick(ns, NUT.fat) ?? 0),
    fiber: pick(ns, NUT.fiber) != null ? round1(pick(ns, NUT.fiber)!) : undefined,
  };
  const servingGrams =
    f.servingSizeUnit?.toLowerCase() === "g" ? f.servingSize : undefined;
  return {
    id: `usda:${f.fdcId}`,
    name: (f.description || "USDA food").trim(),
    brand: f.brandOwner?.trim() || undefined,
    barcode: f.gtinUpc?.trim() || undefined,
    basis: "100g",
    servingGrams: servingGrams && servingGrams > 0 ? servingGrams : undefined,
    nutriments,
    source: "usda",
  };
}

export async function searchUsda(
  query: string,
  apiKey: string,
  signal?: AbortSignal,
  pageSize = 15,
): Promise<FoodItem[]> {
  const q = query.trim();
  if (!q || !apiKey) return [];
  const url = `${BASE}/foods/search?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: q, pageSize, dataType: ["Foundation", "SR Legacy", "Branded"] }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { foods?: FdcFood[] };
  return (data.foods ?? [])
    .map(toFoodItem)
    .filter((f): f is FoodItem => f != null && f.nutriments.kcal > 0);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
