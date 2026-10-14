import { useRef } from "react";
import { useStore, type AppState } from "../state/store";
import type { Profile } from "../lib/types";

const ACTIVITY = [
  { v: 1.2, label: "Sedentary" },
  { v: 1.375, label: "Light (1–3 d/wk)" },
  { v: 1.45, label: "Moderate (3–5 d/wk)" },
  { v: 1.6, label: "Active (6–7 d/wk)" },
  { v: 1.725, label: "Very active" },
];

export function Settings() {
  const state = useStore();
  const { profile } = state;
  const updateProfile = useStore((s) => s.updateProfile);
  const setUsdaApiKey = useStore((s) => s.setUsdaApiKey);
  const importState = useStore((s) => s.importState);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    updateProfile({ [key]: value });
  }

  function exportData() {
    const payload = {
      profile: state.profile,
      entries: state.entries,
      weights: state.weights,
      foods: state.foods,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `macro-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Partial<AppState>;
      importState(data);
      alert("Data imported.");
    } catch {
      alert("Couldn't read that file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <h1>Settings</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>About you</h2>
        <div className="grid2">
          <label className="field">
            <span>Sex</span>
            <select value={profile.sex} onChange={(e) => set("sex", e.target.value as Profile["sex"])}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="field">
            <span>Age</span>
            <input type="number" value={profile.age} onChange={(e) => set("age", +e.target.value)} />
          </label>
          <label className="field">
            <span>Height (cm)</span>
            <input type="number" value={profile.heightCm} onChange={(e) => set("heightCm", +e.target.value)} />
          </label>
          <label className="field">
            <span>Units</span>
            <select value={profile.units} onChange={(e) => set("units", e.target.value as Profile["units"])}>
              <option value="metric">Metric (kg)</option>
              <option value="imperial">Imperial (lb)</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Activity level</span>
          <select value={profile.activity} onChange={(e) => set("activity", +e.target.value)}>
            {ACTIVITY.map((a) => (
              <option key={a.v} value={a.v}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Activity only seeds the initial estimate. Once you log food and weight,
          the app learns your real expenditure and this matters less.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Goal</h2>
        <label className="field">
          <span>Weekly rate: {fmtRate(profile.goalRatePctPerWeek)}</span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.1}
            value={profile.goalRatePctPerWeek}
            onChange={(e) => set("goalRatePctPerWeek", +e.target.value)}
          />
        </label>
        <div className="grid2">
          <label className="field">
            <span>Protein (g/kg)</span>
            <input
              type="number"
              step={0.1}
              value={profile.proteinPerKg}
              onChange={(e) => set("proteinPerKg", +e.target.value)}
            />
          </label>
          <label className="field">
            <span>Fat (g/kg)</span>
            <input
              type="number"
              step={0.1}
              value={profile.fatPerKg}
              onChange={(e) => set("fatPerKg", +e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <div>
            <strong>Photo → calories</strong>
            <div className="small muted">Reveal the (not-yet-connected) photo logging feature.</div>
          </div>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={profile.photoAiEnabled}
            onChange={(e) => set("photoAiEnabled", e.target.checked)}
          />
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>USDA FoodData Central key (optional)</h2>
        <p className="small muted" style={{ marginTop: 0 }}>
          Adds generic/whole foods to search. Get a free key from fdc.nal.usda.gov. Stored only on this device.
        </p>
        <input
          placeholder="API key"
          defaultValue={state.usdaApiKey}
          onBlur={(e) => setUsdaApiKey(e.target.value)}
        />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Your data</h2>
        <p className="small muted" style={{ marginTop: 0 }}>
          Everything is stored locally in this browser. Export to back up or move devices.
        </p>
        <div className="row">
          <button onClick={exportData} style={{ flex: 1 }}>
            ⬇ Export
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ flex: 1 }}>
            ⬆ Import
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
        </div>
      </div>

      <p className="small muted" style={{ textAlign: "center" }}>
        Estimates are first-order approximations for personal use, not medical advice.
      </p>
    </div>
  );
}

function fmtRate(pct: number): string {
  if (pct === 0) return "maintain";
  const dir = pct < 0 ? "lose" : "gain";
  return `${dir} ${Math.abs(pct).toFixed(1)}%/wk`;
}
