export interface Series {
  label: string;
  color: string;
  points: Array<{ x: number; y: number }>; // x = day index, y = value
  dashed?: boolean;
}

/**
 * Minimal responsive SVG line chart. x values are arbitrary numeric (day
 * index); y auto-scales across all series. No external dependency so it stays
 * light and themes cleanly.
 */
export function LineChart({
  series,
  height = 180,
  yUnit = "",
}: {
  series: Series[];
  height?: number;
  yUnit?: string;
}) {
  const W = 320;
  const H = height;
  const pad = { l: 38, r: 8, t: 10, b: 20 };

  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  if (allY.length === 0) {
    return <p className="muted small">Not enough data yet.</p>;
  }

  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const yLo = minY === maxY ? minY - 1 : minY - (maxY - minY) * 0.1;
  const yHi = minY === maxY ? maxY + 1 : maxY + (maxY - minY) * 0.1;
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);

  const sx = (x: number) =>
    maxX === minX ? pad.l : pad.l + ((x - minX) / (maxX - minX)) * (W - pad.l - pad.r);
  const sy = (y: number) =>
    H - pad.b - ((y - yLo) / (yHi - yLo)) * (H - pad.t - pad.b);

  const yTicks = [yLo, (yLo + yHi) / 2, yHi];

  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} y1={sy(t)} x2={W - pad.r} y2={sy(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.l - 5} y={sy(t) + 3} textAnchor="end" fontSize="9" fill="var(--text-dim)">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {series.map((s, si) =>
          s.points.length === 0 ? null : (
            <polyline
              key={si}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "4 4" : undefined}
              points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
            />
          ),
        )}
      </svg>
      <div className="legend">
        {series.map((s) => (
          <span key={s.label}>
            <span className="dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        {yUnit && <span className="spacer" />}
        {yUnit && <span>{yUnit}</span>}
      </div>
    </div>
  );
}
