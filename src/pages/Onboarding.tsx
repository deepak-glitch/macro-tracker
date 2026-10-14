import { useMemo, useState } from "react";
import { useStore } from "../state/store";
import type { Profile, Sex, Units } from "../lib/types";
import { formulaTDEE } from "../lib/coaching/expenditure";
import { computeTargets } from "../lib/coaching/macros";
import { todayISO } from "../lib/dates";

const LB_PER_KG = 2.2046226218;

const ACTIVITY = [
  { v: 1.2, label: "Not active / don't train yet" },
  { v: 1.375, label: "Light (train 1–3×/wk)" },
  { v: 1.45, label: "Moderate (3–5×/wk)" },
  { v: 1.6, label: "Active (6–7×/wk)" },
  { v: 1.725, label: "Very active / physical job" },
];

const GOALS: Array<{ label: string; rate: number; note: string }> = [
  { label: "Lose fat", rate: -0.5, note: "~0.5%/wk down" },
  { label: "Maintain", rate: 0, note: "stay the same" },
  { label: "Lean bulk", rate: 0.25, note: "slow, lean gain" },
  { label: "Standard bulk", rate: 0.5, note: "steady muscle gain" },
  { label: "Massive bulk", rate: 0.9, note: "fast, aggressive gain" },
];

export function Onboarding() {
  const updateProfile = useStore((s) => s.updateProfile);
  const setWeight = useStore((s) => s.setWeight);
  const setOnboarded = useStore((s) => s.setOnboarded);

  const [units, setUnits] = useState<Units>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("25");
  const [heightCm, setHeightCm] = useState("178"); // metric input
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("10");
  const [weight, setWeight_] = useState(""); // in display units
  const [activity, setActivity] = useState(1.2);
  const [goalRate, setGoalRate] = useState(0.5);

  const imperial = units === "imperial";

  const resolvedHeightCm = imperial
    ? (parseFloat(ft) || 0) * 30.48 + (parseFloat(inch) || 0) * 2.54
    : parseFloat(heightCm) || 0;
  const resolvedWeightKg = (() => {
    const w = parseFloat(weight) || 0;
    return imperial ? w / LB_PER_KG : w;
  })();

  const ready = resolvedHeightCm > 50 && resolvedWeightKg > 20 && (parseFloat(age) || 0) > 0;

  const preview = useMemo(() => {
    if (!ready) return null;
    const p: Profile = {
      sex,
      age: parseFloat(age),
      heightCm: Math.round(resolvedHeightCm),
      activity,
      goalRatePctPerWeek: goalRate,
      proteinPerKg: 2.2,
      fatPerKg: goalRate > 0 ? 1.2 : 0.8,
      units,
      photoAiEnabled: false,
    };
    const tdee = formulaTDEE(p, resolvedWeightKg);
    const targets = computeTargets(p, tdee, resolvedWeightKg);
    return { tdee: Math.round(tdee), targets, p };
  }, [ready, sex, age, resolvedHeightCm, activity, goalRate, resolvedWeightKg, units]);

  function finish() {
    if (!preview) return;
    updateProfile(preview.p);
    setWeight({ date: todayISO(), kg: round2(resolvedWeightKg) });
    setOnboarded(true);
  }

  return (
    <div className="app">
      <main className="main">
        <h1>Welcome 👋</h1>
        <p className="muted" style={{ marginTop: -4 }}>
          A few details so your calorie &amp; macro targets are right from day one.
        </p>

        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <button className={!imperial ? "primary" : ""} onClick={() => setUnits("metric")}>
              Metric (kg/cm)
            </button>
            <button className={imperial ? "primary" : ""} onClick={() => setUnits("imperial")}>
              Imperial (lb/ft)
            </button>
          </div>

          <div className="grid2">
            <label className="field">
              <span>Sex</span>
              <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="field">
              <span>Age</span>
              <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
            </label>
          </div>

          {imperial ? (
            <div className="grid2">
              <label className="field">
                <span>Height (ft)</span>
                <input type="number" inputMode="numeric" value={ft} onChange={(e) => setFt(e.target.value)} />
              </label>
              <label className="field">
                <span>Height (in)</span>
                <input type="number" inputMode="numeric" value={inch} onChange={(e) => setInch(e.target.value)} />
              </label>
            </div>
          ) : (
            <label className="field">
              <span>Height (cm)</span>
              <input type="number" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </label>
          )}

          <label className="field">
            <span>Current weight ({imperial ? "lb" : "kg"})</span>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight_(e.target.value)}
              placeholder={imperial ? "e.g. 132" : "e.g. 60"}
            />
          </label>

          <label className="field">
            <span>How active are you?</span>
            <select value={activity} onChange={(e) => setActivity(+e.target.value)}>
              {ACTIVITY.map((a) => (
                <option key={a.v} value={a.v}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field" style={{ marginBottom: 6 }}>
            <span>Your goal</span>
          </label>
          <div className="row wrap" style={{ gap: 6 }}>
            {GOALS.map((g) => (
              <button
                key={g.label}
                className={goalRate === g.rate ? "primary" : ""}
                onClick={() => setGoalRate(g.rate)}
                title={g.note}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {preview && (
          <div className="card" style={{ background: "var(--surface-2)" }}>
            <div className="small muted">Your starting daily targets</div>
            <div className="row between" style={{ marginTop: 4 }}>
              <strong style={{ fontSize: "1.4rem" }}>{preview.targets.kcal} kcal</strong>
              <span className="muted small">maintenance ~{preview.tdee}</span>
            </div>
            <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
              <span className="pill" style={{ color: "var(--protein)", borderColor: "var(--protein)" }}>
                P {preview.targets.protein} g
              </span>
              <span className="pill" style={{ color: "var(--carbs)", borderColor: "var(--carbs)" }}>
                C {preview.targets.carbs} g
              </span>
              <span className="pill" style={{ color: "var(--fat)", borderColor: "var(--fat)" }}>
                F {preview.targets.fat} g
              </span>
              <span className="pill accent">
                {preview.targets.dailyDelta === 0
                  ? "maintain"
                  : preview.targets.dailyDelta > 0
                    ? `+${preview.targets.dailyDelta} surplus`
                    : `${preview.targets.dailyDelta} deficit`}
              </span>
            </div>
          </div>
        )}

        <button className="primary" style={{ width: "100%" }} onClick={finish} disabled={!ready}>
          {ready ? "Start tracking →" : "Enter your details to continue"}
        </button>
        <p className="small muted" style={{ textAlign: "center" }}>
          You can change any of this later in Settings.
        </p>
      </main>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
