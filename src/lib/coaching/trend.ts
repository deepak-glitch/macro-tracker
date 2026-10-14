import type { WeightEntry } from "../types";

/**
 * Exponentially-weighted moving average over weigh-ins.
 *
 * Daily scale weight is noisy (sodium, glycogen, gut contents), so coaching
 * works from a smoothed *trend* rather than raw readings. `alpha` is the
 * weighting of each new reading; smaller = smoother but slower to react.
 * alpha ≈ 0.10 behaves like a ~10–20 day effective window, which is the
 * stability/responsiveness trade-off the methodology calls out.
 */
export const DEFAULT_ALPHA = 0.1;

export interface TrendPoint {
  date: string;
  /** Raw logged weight for that day. */
  kg: number;
  /** Smoothed trend value. */
  trendKg: number;
}

/** Sort weigh-ins ascending by date and drop duplicate days (keep last). */
export function normalizeWeights(entries: WeightEntry[]): WeightEntry[] {
  const byDate = new Map<string, number>();
  for (const e of entries) byDate.set(e.date, e.kg);
  return [...byDate.entries()]
    .map(([date, kg]) => ({ date, kg }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeTrend(
  entries: WeightEntry[],
  alpha: number = DEFAULT_ALPHA,
): TrendPoint[] {
  const sorted = normalizeWeights(entries);
  const out: TrendPoint[] = [];
  let trend = Number.NaN;
  for (const { date, kg } of sorted) {
    trend = Number.isNaN(trend) ? kg : trend + alpha * (kg - trend);
    out.push({ date, kg, trendKg: round1(trend) });
  }
  return out;
}

/** Latest smoothed trend weight, or undefined with no data. */
export function latestTrendKg(
  entries: WeightEntry[],
  alpha: number = DEFAULT_ALPHA,
): number | undefined {
  const t = computeTrend(entries, alpha);
  return t.length ? t[t.length - 1].trendKg : undefined;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
