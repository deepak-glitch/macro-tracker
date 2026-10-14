import { useStore } from "../state/store";
import { computeCoaching, dayTotals, entriesForDate } from "../state/selectors";
import { MacroSummary } from "../components/MacroSummary";
import { addDaysISO, isToday, prettyDate, todayISO } from "../lib/dates";
import type { LogEntry, Meal } from "../lib/types";

const MEAL_ORDER: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

export function Today({
  date,
  setDate,
  onAdd,
}: {
  date: string;
  setDate: (d: string) => void;
  onAdd: () => void;
}) {
  const { profile, entries, weights } = useStore();
  const removeEntry = useStore((s) => s.removeEntry);

  const coaching = computeCoaching(profile, entries, weights);
  const totals = dayTotals(entries, date);
  const dayEntries = entriesForDate(entries, date);
  const { expenditure, targets } = coaching;

  return (
    <div>
      <div className="date-nav">
        <button className="icon ghost" onClick={() => setDate(addDaysISO(date, -1))} aria-label="Previous day">
          ‹
        </button>
        <button className="ghost today" onClick={() => setDate(todayISO())}>
          {isToday(date) ? "Today" : prettyDate(date)}
        </button>
        <button
          className="icon ghost"
          onClick={() => setDate(addDaysISO(date, 1))}
          aria-label="Next day"
          disabled={isToday(date)}
        >
          ›
        </button>
      </div>

      <div className="card">
        <MacroSummary totals={totals} targets={targets} />
      </div>

      <div className="card">
        <div className="row between">
          <div>
            <div className="small muted">Estimated expenditure</div>
            <strong style={{ fontSize: "1.15rem" }}>{expenditure.tdee} kcal/day</strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="small muted">Calorie target</div>
            <strong style={{ fontSize: "1.15rem" }}>{targets.kcal} kcal</strong>
          </div>
        </div>
        <div className="row wrap" style={{ marginTop: 10, gap: 6 }}>
          <span className="pill">
            {expenditure.confidence > 0
              ? `${Math.round(expenditure.confidence * 100)}% data-driven`
              : "Formula estimate"}
          </span>
          {expenditure.windowDays > 0 && (
            <span className="pill">{expenditure.windowDays} days logged</span>
          )}
          <span className="pill accent">
            {targets.dailyDelta === 0
              ? "Maintain"
              : targets.dailyDelta < 0
                ? `${targets.dailyDelta} kcal deficit`
                : `+${targets.dailyDelta} kcal surplus`}
          </span>
        </div>
        {expenditure.confidence < 0.5 && (
          <p className="small muted" style={{ marginBottom: 0 }}>
            Keep logging food and weigh in regularly — the estimate sharpens over ~2–3 weeks.
          </p>
        )}
      </div>

      <div className="row between">
        <h2 style={{ margin: 0 }}>Diary</h2>
        <button className="primary" onClick={onAdd}>
          ＋ Add food
        </button>
      </div>

      {dayEntries.length === 0 ? (
        <div className="center-col">
          <span className="muted">Nothing logged yet.</span>
          <button className="primary" onClick={onAdd}>
            Log your first item
          </button>
        </div>
      ) : (
        MEAL_ORDER.map((meal) => {
          const items = dayEntries.filter((e) => e.meal === meal);
          if (items.length === 0) return null;
          return (
            <div key={meal} className="card">
              <div className="meal-head">{meal}</div>
              {items.map((e) => (
                <EntryRow key={e.id} entry={e} onRemove={() => removeEntry(e.id)} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

function EntryRow({ entry, onRemove }: { entry: LogEntry; onRemove: () => void }) {
  const amount =
    entry.grams != null
      ? `${trim(entry.grams)} g`
      : entry.servings != null
        ? `${trim(entry.servings)} serving${entry.servings === 1 ? "" : "s"}`
        : "";
  return (
    <div className="entry">
      <div className="info">
        <div className="name">{entry.name}</div>
        <div className="small muted">
          {amount} · P {entry.nutriments.protein} · C {entry.nutriments.carbs} · F {entry.nutriments.fat}
        </div>
      </div>
      <span className="kcal">{entry.nutriments.kcal}</span>
      <button className="icon ghost" onClick={onRemove} aria-label="Remove">
        ✕
      </button>
    </div>
  );
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
