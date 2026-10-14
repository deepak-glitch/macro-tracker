import { useMemo, useState } from "react";
import type { FoodItem, LogEntry, Meal } from "../lib/types";
import { scaleNutriments } from "../lib/nutrition/portion";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

export function PortionSheet({
  food,
  date,
  defaultMeal = "snack",
  onConfirm,
  onClose,
}: {
  food: FoodItem;
  date: string;
  defaultMeal?: Meal;
  onConfirm: (entry: LogEntry) => void;
  onClose: () => void;
}) {
  // Choose a sensible default amount mode for the food's basis.
  const canServe = food.basis === "serving" || food.servingGrams != null;
  const [mode, setMode] = useState<"grams" | "servings">(
    food.basis === "serving" ? "servings" : "grams",
  );
  const [grams, setGrams] = useState<string>(
    food.servingGrams ? String(food.servingGrams) : "100",
  );
  const [servings, setServings] = useState<string>("1");
  const [meal, setMeal] = useState<Meal>(defaultMeal);

  const amount =
    mode === "grams"
      ? { grams: parseFloat(grams) || 0 }
      : { servings: parseFloat(servings) || 0 };

  const preview = useMemo(() => scaleNutriments(food, amount), [food, grams, servings, mode]);

  function confirm() {
    if (!preview) return;
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      date,
      name: food.name,
      brand: food.brand,
      foodId: food.id,
      meal,
      grams: mode === "grams" ? amount.grams : undefined,
      servings: mode === "servings" ? amount.servings : undefined,
      nutriments: preview,
      loggedAt: new Date().toISOString(),
    };
    onConfirm(entry);
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{food.name}</h2>
        {food.brand && <p className="muted small" style={{ marginTop: -6 }}>{food.brand}</p>}

        <div className="row" style={{ marginBottom: 12 }}>
          <button
            className={mode === "grams" ? "primary" : ""}
            onClick={() => setMode("grams")}
          >
            Grams
          </button>
          <button
            className={mode === "servings" ? "primary" : ""}
            onClick={() => setMode("servings")}
            disabled={!canServe}
            title={canServe ? "" : "No serving size known for this food"}
          >
            Servings
          </button>
        </div>

        {mode === "grams" ? (
          <label className="field">
            <span>Amount (grams)</span>
            <input
              type="number"
              inputMode="decimal"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
            />
          </label>
        ) : (
          <label className="field">
            <span>
              Servings{food.servingGrams ? ` (${food.servingGrams} g each)` : ""}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span>Meal</span>
          <select value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {m[0].toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <div className="card" style={{ background: "var(--surface-2)" }}>
          {preview ? (
            <div className="row between">
              <strong>{preview.kcal} kcal</strong>
              <span className="muted small">
                P {preview.protein} · C {preview.carbs} · F {preview.fat}
              </span>
            </div>
          ) : (
            <span className="muted small">Enter an amount to see the totals.</span>
          )}
        </div>

        <div className="row">
          <button className="ghost" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="primary" onClick={confirm} disabled={!preview} style={{ flex: 2 }}>
            Log it
          </button>
        </div>
      </div>
    </div>
  );
}
