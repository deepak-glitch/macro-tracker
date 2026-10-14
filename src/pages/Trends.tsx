import { useState } from "react";
import { useStore } from "../state/store";
import { computeTrend } from "../lib/coaching/trend";
import { computeCoaching, dailyIntake } from "../state/selectors";
import { LineChart, type Series } from "../components/LineChart";
import { todayISO, prettyDate } from "../lib/dates";

const LB_PER_KG = 2.2046226218;

export function Trends() {
  const { profile, entries, weights } = useStore();
  const setWeight = useStore((s) => s.setWeight);
  const removeWeight = useStore((s) => s.removeWeight);

  const imperial = profile.units === "imperial";
  const unit = imperial ? "lb" : "kg";
  const toDisplay = (kg: number) => (imperial ? kg * LB_PER_KG : kg);
  const toKg = (v: number) => (imperial ? v / LB_PER_KG : v);

  const [date, setDate] = useState(todayISO());
  const [val, setVal] = useState("");

  function logWeight() {
    const v = parseFloat(val);
    if (!Number.isFinite(v) || v <= 0) return;
    setWeight({ date, kg: round2(toKg(v)) });
    setVal("");
  }

  const trend = computeTrend(weights);
  const coaching = computeCoaching(profile, entries, weights);

  // Weight chart: raw + smoothed, x = index.
  const weightSeries: Series[] = [
    {
      label: `Weight (${unit})`,
      color: "var(--text-dim)",
      points: trend.map((p, i) => ({ x: i, y: round1(toDisplay(p.kg)) })),
    },
    {
      label: "Trend",
      color: "var(--accent)",
      points: trend.map((p, i) => ({ x: i, y: round1(toDisplay(p.trendKg)) })),
    },
  ];

  // Intake vs expenditure: x = day offset from first logged day.
  const intake = dailyIntake(entries);
  const intakeSeries: Series[] = [];
  if (intake.length > 0) {
    const base = intake[0].date;
    const idx = (d: string) => dayOffset(base, d);
    intakeSeries.push({
      label: "Daily intake",
      color: "var(--carbs)",
      points: intake.map((d) => ({ x: idx(d.date), y: d.kcal })),
    });
    const tdee = coaching.expenditure.tdee;
    intakeSeries.push({
      label: "Est. expenditure",
      color: "var(--accent)",
      dashed: true,
      points: [
        { x: idx(intake[0].date), y: tdee },
        { x: idx(intake[intake.length - 1].date), y: tdee },
      ],
    });
  }

  return (
    <div>
      <h1>Trends</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Log weight</h2>
        <div className="grid2">
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Weight ({unit})</span>
            <input
              type="number"
              inputMode="decimal"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={imperial ? "e.g. 176.5" : "e.g. 80.0"}
            />
          </label>
        </div>
        <button className="primary" style={{ width: "100%" }} onClick={logWeight} disabled={!val}>
          Save weigh-in
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Weight &amp; trend</h2>
        <LineChart series={weightSeries} yUnit={unit} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Intake vs. expenditure</h2>
        <LineChart series={intakeSeries} yUnit="kcal" />
        <p className="small muted" style={{ marginBottom: 0 }}>
          Expenditure is back-calculated from your logged intake and weight trend.
          The gap between the two lines is roughly your daily surplus or deficit.
        </p>
      </div>

      {weights.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Weigh-in history</h2>
          <ul className="list-reset">
            {[...weights].reverse().slice(0, 30).map((w) => (
              <li key={w.date} className="entry">
                <span className="info">{prettyDate(w.date)}</span>
                <span className="kcal">
                  {round1(toDisplay(w.kg))} {unit}
                </span>
                <button className="icon ghost" onClick={() => removeWeight(w.date)} aria-label="Remove">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function dayOffset(base: string, d: string): number {
  const ms = new Date(d).getTime() - new Date(base).getTime();
  return Math.round(ms / 86_400_000);
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
