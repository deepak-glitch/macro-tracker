import type { FoodItem, Nutriments } from "../types";

const BASE = "https://world.openfoodfacts.org";
const FIELDS =
  "code,product_name,brands,serving_quantity,serving_size,nutriments";

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

function num(v: number | string | undefined): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : undefined;
}

/** Read per-100g nutriments from an OFF product, with kJ→kcal fallback. */
function readNutriments(n: Record<string, number | string | undefined>): Nutriments | null {
  let kcal = num(n["energy-kcal_100g"]);
  if (kcal == null) {
    const kj = num(n["energy_100g"]) ?? num(n["energy-kj_100g"]);
    if (kj != null) kcal = kj / 4.184;
  }
  const protein = num(n["proteins_100g"]) ?? 0;
  const carbs = num(n["carbohydrates_100g"]) ?? 0;
  const fat = num(n["fat_100g"]) ?? 0;
  const fiber = num(n["fiber_100g"]);
  if (kcal == null) return null;
  return {
    kcal: Math.round(kcal),
    protein: round1(protein),
    carbs: round1(carbs),
    fat: round1(fat),
    fiber: fiber != null ? round1(fiber) : undefined,
  };
}

function toFoodItem(p: OffProduct): FoodItem | null {
  const nmap = p.nutriments;
  if (!nmap) return null;
  const nutriments = readNutriments(nmap);
  if (!nutriments) return null;
  const servingGrams = num(p.serving_quantity);
  return {
    id: `off:${p.code ?? crypto.randomUUID()}`,
    name: (p.product_name || "Unnamed product").trim(),
    brand: p.brands?.split(",")[0]?.trim() || undefined,
    barcode: p.code,
    basis: "100g",
    servingGrams: servingGrams && servingGrams > 0 ? servingGrams : undefined,
    nutriments,
    source: "off",
  };
}

/** Look up a single product by barcode (EAN/UPC). */
export async function lookupBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<FoodItem | null> {
  const url = `${BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) return null;
  return toFoodItem({ ...data.product, code: data.product.code ?? barcode });
}

/** Free-text search across the Open Food Facts catalog. */
export async function searchFoods(
  query: string,
  signal?: AbortSignal,
  pageSize = 20,
): Promise<FoodItem[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=${FIELDS}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: OffProduct[] };
  return (data.products ?? [])
    .map(toFoodItem)
    .filter((f): f is FoodItem => f != null && f.nutriments.kcal > 0);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
