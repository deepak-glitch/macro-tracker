export type Tab = "today" | "add" | "trends" | "settings";

const TABS: Array<{ id: Tab; label: string; glyph: string }> = [
  { id: "today", label: "Today", glyph: "☀" },
  { id: "add", label: "Add", glyph: "＋" },
  { id: "trends", label: "Trends", glyph: "📈" },
  { id: "settings", label: "Settings", glyph: "⚙" },
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      <div className="inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${active === t.id ? "active" : ""}`}
            onClick={() => onChange(t.id)}
            aria-current={active === t.id}
          >
            <span className="glyph" aria-hidden>
              {t.glyph}
            </span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
