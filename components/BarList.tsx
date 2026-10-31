// Horizontal bars per concept. Colour follows mastery: rust weak, amber learning, green mastered.
function colorFor(v: number | null) {
  if (v === null) return "rgb(var(--rule))";
  if (v < 0.55) return "rgb(var(--rust))";
  if (v < 0.85) return "rgb(var(--amber))";
  return "rgb(var(--moss))";
}

export default function BarList({ items }: { items: { label: string; value: number | null }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{it.label}</span>
            <span className="font-mono text-graphite">{it.value === null ? "not tested" : `${Math.round(it.value * 100)}%`}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-rule/60">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round((it.value ?? 0) * 100)}%`, background: colorFor(it.value) }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
