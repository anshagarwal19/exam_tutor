// Radar chart for chapter mastery. Colours come from CSS variables so day and night mode both work.
export default function RadarChart({ axes }: { axes: { label: string; value: number | null }[] }) {
  const size = 300;
  const c = size / 2;
  const R = 95;
  const n = axes.length;

  const pt = (i: number, scale: number): [number, number] => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [c + Math.cos(a) * R * scale, c + Math.sin(a) * R * scale];
  };

  const dataPoints = axes.map((ax, i) => pt(i, ax.value ?? 0).join(",")).join(" ");
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-sm" role="img" aria-label="Mastery by chapter, radar chart">
        {rings.map((r) => (
          <polygon
            key={r}
            points={axes.map((_, i) => pt(i, r).join(",")).join(" ")}
            style={{ fill: "none", stroke: "rgb(var(--rule))" }}
          />
        ))}
        {axes.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={c} y1={c} x2={x} y2={y} style={{ stroke: "rgb(var(--rule))" }} />;
        })}
        <polygon points={dataPoints} style={{ fill: "rgb(var(--accent) / 0.18)", stroke: "rgb(var(--accent))", strokeWidth: 2 }} />
      </svg>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {axes.map((axis) => (
          <li key={axis.label} className="min-w-0 rounded-lg border border-rule px-3 py-2 text-sm">
            <span className="block break-words">{axis.label}</span>
            <span className="font-mono text-graphite">
              {axis.value === null ? "Not tested" : `${Math.round(axis.value * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
