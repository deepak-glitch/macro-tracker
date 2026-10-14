import type { Profile, WeightEntry } from "../types";
import { computeTrend, type TrendPoint } from "./trend";

/**
 * Energy density of body-mass change. ~7700 kcal per kg is the classic
 * first-order approximation (≈3500 kcal/lb). Real body-composition change
 * varies, so treat the resulting expenditure as an estimate, not truth.
 */
export const KCAL_PER_KG = 7700;

/** Mifflin–St Jeor resting metabolic rate (kcal/day). */
export function mifflinBMR(
  sex: Profile["sex"],
  kg: number,
  cm: number,
  age: number,
): number {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/** Formula-based TDEE prior, used before enough logged data accumulates. */
export function formulaTDEE(profile: Profile, weightKg: number): number {
  return mifflinBMR(profile.sex, weightKg, profile.heightCm, profile.age) * profile.activity;
}

export interface DailyIntake {
  date: string; // YYYY-MM-DD
  kcal: number;
}

export interface ExpenditureEstimate {
  /** Blended estimate actually used for targets. */
  tdee: number;
  /** Pure energy-balance estimate from intake + weight trend (if available). */
  dataDriven?: number;
  /** Formula prior (Mifflin × activity). */
  prior: number;
  /** 0–1 weighting given to the data-driven estimate. */
  confidence: number;
  /** Days of usable overlap between logging and weight trend. */
  windowDays: number;
}

interface EstimateInput {
  profile: Profile;
  weights: WeightEntry[];
  intake: DailyIntake[];
  /** Analysis window length in days (default 21). */
  windowDays?: number;
  /** Minimum fraction of window days that must have intake logged. */
  minLoggingCompleteness?: number;
  alpha?: number;
}

/**
 * Adaptive expenditure via rearranged energy balance:
 *
 *   intake − Δstored energy = expenditure
 *   TDEE = meanDailyIntake − (ΔtrendKg × KCAL_PER_KG) / days
 *
 * Seeds with the Mifflin prior and blends toward the data-driven estimate as
 * logged data accumulates, so a brand-new user still gets a sane number.
 */
export function estimateExpenditure(input: EstimateInput): ExpenditureEstimate {
  const {
    profile,
    weights,
    intake,
    windowDays = 21,
    minLoggingCompleteness = 0.6,
    alpha,
  } = input;

  const trend = computeTrend(weights, alpha);
  const latestKg = trend.length ? trend[trend.length - 1].trendKg : undefined;
  const prior = formulaTDEE(profile, latestKg ?? seedWeight(profile));

  const dataDriven = computeDataDriven(trend, intake, windowDays, minLoggingCompleteness);

  if (dataDriven == null) {
    return { tdee: Math.round(prior), prior: Math.round(prior), confidence: 0, windowDays: 0 };
  }

  const confidence = clamp(dataDriven.usableDays / windowDays, 0, 1);
  const tdee = confidence * dataDriven.kcal + (1 - confidence) * prior;

  return {
    tdee: Math.round(tdee),
    dataDriven: Math.round(dataDriven.kcal),
    prior: Math.round(prior),
    confidence: round2(confidence),
    windowDays: dataDriven.usableDays,
  };
}

function computeDataDriven(
  trend: TrendPoint[],
  intake: DailyIntake[],
  windowDays: number,
  minLoggingCompleteness: number,
): { kcal: number; usableDays: number } | null {
  if (trend.length < 2) return null;

  const end = trend[trend.length - 1];
  const windowStartDate = shiftDate(end.date, -(windowDays - 1));

  // Earliest trend point that falls within the window.
  const start = trend.find((p) => p.date >= windowStartDate);
  if (!start || start.date === end.date) return null;

  const spanDays = daysBetween(start.date, end.date);
  if (spanDays < 1) return null;

  const loggedInWindow = intake.filter(
    (d) => d.date >= start.date && d.date <= end.date && d.kcal > 0,
  );
  const completeness = loggedInWindow.length / (spanDays + 1);
  if (completeness < minLoggingCompleteness || loggedInWindow.length === 0) {
    return null;
  }

  const meanIntake =
    loggedInWindow.reduce((s, d) => s + d.kcal, 0) / loggedInWindow.length;
  const trendDeltaKg = end.trendKg - start.trendKg;
  const kcal = meanIntake - (trendDeltaKg * KCAL_PER_KG) / spanDays;

  return { kcal, usableDays: loggedInWindow.length };
}

/** Fallback body weight for the prior when no weigh-ins exist yet. */
function seedWeight(profile: Profile): number {
  // Rough mid-range weight from height; only used until a weigh-in exists.
  return Math.round((profile.heightCm - 100) * (profile.sex === "male" ? 1.0 : 0.95));
}

export function shiftDate(date: string, deltaDays: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
