import { lazy, Suspense, useRef, useState } from "react";
import { useStore } from "../state/store";
import { PortionSheet } from "../components/PortionSheet";

// Code-split the camera/ZXing bundle: it only loads when the user scans.
const BarcodeScanner = lazy(() =>
  import("../components/BarcodeScanner").then((m) => ({ default: m.BarcodeScanner })),
);
import { lookupBarcode, searchFoods } from "../lib/nutrition/openFoodFacts";
import { searchUsda } from "../lib/nutrition/usda";
import { estimateFromPhoto, PHOTO_FEATURE_READY } from "../lib/photo/photoEstimate";
import type { FoodItem, LogEntry } from "../lib/types";
import { prettyDate } from "../lib/dates";

export function Add({ date, onLogged }: { date: string; onLogged: () => void }) {
  const profile = useStore((s) => s.profile);
  const usdaApiKey = useStore((s) => s.usdaApiKey);
  const foods = useStore((s) => s.foods);
  const addEntry = useStore((s) => s.addEntry);
  const rememberFood = useStore((s) => s.rememberFood);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const [off, usda] = await Promise.all([
        searchFoods(q, ctrl.signal),
        usdaApiKey ? searchUsda(q, usdaApiKey, ctrl.signal) : Promise.resolve([]),
      ]);
      const merged = [...off, ...usda];
      setResults(merged);
      if (merged.length === 0) setError("No matches. Try another term or add a custom food.");
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError("Search failed — check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onBarcode(code: string) {
    setScanning(false);
    setLoading(true);
    setError(null);
    try {
      const food = await lookupBarcode(code);
      if (food) {
        setSelected(food);
      } else {
        setError(`No product found for barcode ${code}. Add it as a custom food.`);
        setShowCustom(true);
      }
    } catch {
      setError("Barcode lookup failed — check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function onConfirm(entry: LogEntry) {
    addEntry(entry);
    if (selected) rememberFood(selected);
    setSelected(null);
    onLogged();
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await estimateFromPhoto(file);
    setPhotoNote(res.note);
  }

  return (
    <div>
      <h1>Add food</h1>
      <p className="muted small" style={{ marginTop: -6 }}>
        Logging to {prettyDate(date)}
      </p>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className="primary" style={{ flex: 1 }} onClick={() => setScanning(true)}>
          📷 Scan barcode
        </button>
        <button className="ghost" style={{ flex: 1 }} onClick={() => setShowCustom((v) => !v)}>
          ✎ Custom food
        </button>
      </div>

      <form onSubmit={runSearch} className="row" style={{ marginBottom: 6 }}>
        <input
          placeholder="Search foods…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "…" : "Go"}
        </button>
      </form>

      {error && <p className="err small">{error}</p>}

      {showCustom && (
        <CustomFood
          onCreate={(food) => {
            setShowCustom(false);
            setSelected(food);
          }}
        />
      )}

      {/* Photo → calories (stubbed behind the Settings toggle) */}
      <div className="card">
        <div className="row between">
          <strong>📸 Photo → calories</strong>
          <span className="pill">beta</span>
        </div>
        {profile.photoAiEnabled && PHOTO_FEATURE_READY ? (
          <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
        ) : (
          <p className="small muted" style={{ marginBottom: 0 }}>
            {profile.photoAiEnabled
              ? "Enabled, but the vision model isn't connected yet in this build."
              : "Turn this on in Settings once a vision model is connected."}
          </p>
        )}
        {photoNote && <p className="small muted">{photoNote}</p>}
      </div>

      {results.length > 0 && (
        <>
          <h2>Results</h2>
          {results.map((f) => (
            <FoodResult key={f.id} food={f} onPick={() => setSelected(f)} />
          ))}
        </>
      )}

      {results.length === 0 && foods.length > 0 && (
        <>
          <h2>Recent</h2>
          {foods.slice(0, 12).map((f) => (
            <FoodResult key={f.id} food={f} onPick={() => setSelected(f)} />
          ))}
        </>
      )}

      {scanning && (
        <div className="sheet-backdrop" onClick={() => setScanning(false)}>
          <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
            <h2>Scan barcode</h2>
            <Suspense fallback={<p className="muted small">Loading camera…</p>}>
              <BarcodeScanner onDetected={onBarcode} onClose={() => setScanning(false)} />
            </Suspense>
          </div>
        </div>
      )}

      {selected && (
        <PortionSheet
          food={selected}
          date={date}
          onConfirm={onConfirm}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function FoodResult({ food, onPick }: { food: FoodItem; onPick: () => void }) {
  return (
    <button className="result card" onClick={onPick}>
      <div className="name">{food.name}</div>
      <div className="small muted">
        {food.brand ? `${food.brand} · ` : ""}
        {food.nutriments.kcal} kcal / {food.basis === "100g" ? "100 g" : "serving"}
        {" · "}P {food.nutriments.protein} C {food.nutriments.carbs} F {food.nutriments.fat}
        {food.source !== "custom" && <span className="pill" style={{ marginLeft: 8 }}>{food.source.toUpperCase()}</span>}
      </div>
    </button>
  );
}

function CustomFood({ onCreate }: { onCreate: (food: FoodItem) => void }) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  function create() {
    if (!name.trim() || !kcal) return;
    onCreate({
      id: `custom:${crypto.randomUUID()}`,
      name: name.trim(),
      basis: "serving",
      servingGrams: undefined,
      nutriments: {
        kcal: Math.round(parseFloat(kcal) || 0),
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      },
      source: "custom",
    });
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Custom food (per serving)</h2>
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Homemade smoothie" />
      </label>
      <div className="grid2">
        <label className="field">
          <span>Calories</span>
          <input type="number" inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </label>
        <label className="field">
          <span>Protein (g)</span>
          <input type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </label>
        <label className="field">
          <span>Carbs (g)</span>
          <input type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </label>
        <label className="field">
          <span>Fat (g)</span>
          <input type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
        </label>
      </div>
      <button className="primary" onClick={create} style={{ width: "100%" }} disabled={!name.trim() || !kcal}>
        Continue
      </button>
    </div>
  );
}
