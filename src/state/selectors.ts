import type { LogEntry, Profile, WeightEntry } from "../lib/types";
import {
  estimateExpenditure,
  formulaTDEE,
  type ExpenditureEstimate,
} from "../lib/coaching/expenditure";
import { computeTargets, sumNutriments, type MacroTargets } from "../lib/coaching/macros";
import { latestTrendKg } from "../lib/coaching/trend";
import type { Nutriments } from "../lib/types";

export function entriesForDate(entries: LogEntry[], date: string): LogEntry[] {
  return entries
    .filter((e) => e.date === date)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}

export function dayTotals(entries: LogEntry[], date: string): Nutriments {
  return sumNutriments(entriesForDate(entries, date));
}

/** Aggregate logged calories per day, for the expenditure model. */
export function dailyIntake(entries: LogEntry[]): Array<{ date: string; kcal: number }> {
  const byDate = new Map<string, number>();
  for (const e of entries) {
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.nutriments.kcal);
  }
  return [...byDate.entries()]
    .map(([date, kcal]) => ({ date, kcal }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface Coaching {
  expenditure: ExpenditureEstimate;
  targets: MacroTargets;
  bodyWeightKg: number;
}

export function computeCoaching(
  profile: Profile,
  entries: LogEntry[],
  weights: WeightEntry[],
): Coaching {
  const expenditure = estimateExpenditure({
    profile,
    weights,
    intake: dailyIntake(entries),
  });
  const trendKg = latestTrendKg(weights);
  const bodyWeightKg = trendKg ?? fallbackWeight(profile);
  const targets = computeTargets(profile, expenditure.tdee, bodyWeightKg);
  return { expenditure, targets, bodyWeightKg };
}

function fallbackWeight(profile: Profile): number {
  // Only used until the first weigh-in exists; mirrors the prior's seed.
  return formulaTDEE(profile, 70) > 0
    ? Math.round((profile.heightCm - 100) * (profile.sex === "male" ? 1.0 : 0.95))
    : 70;
}
