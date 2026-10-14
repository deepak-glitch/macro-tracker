import { describe, it, expect } from "vitest";
import { computeTrend, normalizeWeights, latestTrendKg } from "./trend";

describe("normalizeWeights", () => {
  it("sorts ascending and keeps the last reading per day", () => {
    const out = normalizeWeights([
      { date: "2026-01-03", kg: 80 },
      { date: "2026-01-01", kg: 81 },
      { date: "2026-01-01", kg: 82 }, // later duplicate wins
    ]);
    expect(out).toEqual([
      { date: "2026-01-01", kg: 82 },
      { date: "2026-01-03", kg: 80 },
    ]);
  });
});

describe("computeTrend", () => {
  it("seeds the trend with the first reading", () => {
    const t = computeTrend([{ date: "2026-01-01", kg: 80 }]);
    expect(t[0].trendKg).toBe(80);
  });

  it("smooths spikes toward the trend (EWMA lags raw)", () => {
    const t = computeTrend(
      [
        { date: "2026-01-01", kg: 80 },
        { date: "2026-01-02", kg: 90 }, // big spike
      ],
      0.1,
    );
    // Trend moves only 10% of the way to the spike.
    expect(t[1].trendKg).toBeCloseTo(81, 5);
    expect(t[1].kg).toBe(90);
  });

  it("follows a sustained decline downward but slower than raw", () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      kg: 80 - i * 0.2,
    }));
    const t = computeTrend(entries, 0.1);
    const last = t[t.length - 1];
    expect(last.trendKg).toBeGreaterThan(last.kg); // trend lags the decline
    expect(last.trendKg).toBeLessThan(80); // but is clearly trending down
  });
});

describe("latestTrendKg", () => {
  it("returns undefined with no data", () => {
    expect(latestTrendKg([])).toBeUndefined();
  });
});
