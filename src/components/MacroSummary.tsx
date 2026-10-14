import type { Nutriments } from "../lib/types";
import type { MacroTargets } from "../lib/coaching/macros";

function Ring({ consumed, target }: { consumed: number; target: number }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const remaining = Math.round(target - consumed);
  return (
    <div className="ring">
      <svg viewBox="0 0 108 108" width="108" height="108">
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke="var(--kcal)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="center">
        <span className="big">{Math.round(consumed)}</span>
        <span className="sub">
          {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
        </span>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  color,
  consumed,
  target,
  unit = "g",
}: {
  label: string;
  color: string;
  consumed: number;
  target: number;
  unit?: string;
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  return (
    <div className="macro">
      <div className="labels">
        <span>
          <span className="dot" style={{ background: color }} />
          {label}
        </span>
        <span className="muted">
          {Math.round(consumed)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="bar">
        <span style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function MacroSummary({
  totals,
  targets,
}: {
  totals: Nutriments;
  targets: MacroTargets;
}) {
  return (
    <div className="ring-wrap">
      <Ring consumed={totals.kcal} target={targets.kcal} />
      <div className="macros">
        <MacroBar label="Protein" color="var(--protein)" consumed={totals.protein} target={targets.protein} />
        <MacroBar label="Carbs" color="var(--carbs)" consumed={totals.carbs} target={targets.carbs} />
        <MacroBar label="Fat" color="var(--fat)" consumed={totals.fat} target={targets.fat} />
      </div>
    </div>
  );
}
