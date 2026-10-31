"use client";
import { useState } from "react";

// Magnetism: a straight current-carrying wire. Change the current and the direction and watch the field rings.
export default function MagnetSimulator() {
  const [I, setI] = useState(3);
  const [upward, setUpward] = useState(true);

  const cx = 210;
  const cy = 120;
  const radii = [40, 70, 100];
  const visible = Math.min(radii.length, Math.max(1, Math.ceil(I / 3)));
  const s = upward ? -1 : 1; // arrow direction on screen at the rightmost point

  return (
    <div className="notebook-card space-y-5">
      <svg viewBox="0 0 420 240" className="w-full" role="img" aria-label="Magnetic field rings around a current-carrying wire">
        {radii.slice(0, visible).map((r, i) => (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r} style={{ fill: "none", stroke: "rgb(var(--accent))", strokeWidth: 2, opacity: 1 - i * 0.25 }} />
            {/* arrowhead on the rightmost point of each ring */}
            <polygon
              points={`${cx + r},${cy + s * 10} ${cx + r - 5},${cy} ${cx + r + 5},${cy}`}
              style={{ fill: "rgb(var(--accent))", opacity: 1 - i * 0.25 }}
            />
          </g>
        ))}

        {/* the wire: dot = current toward you, cross = current away */}
        <circle cx={cx} cy={cy} r="9" style={{ fill: "rgb(var(--surface))", stroke: "rgb(var(--ink))", strokeWidth: 2 }} />
        {upward ? (
          <circle cx={cx} cy={cy} r="3" style={{ fill: "rgb(var(--ink))" }} />
        ) : (
          <>
            <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} style={{ stroke: "rgb(var(--ink))", strokeWidth: 2 }} />
            <line x1={cx - 5} y1={cy + 5} x2={cx + 5} y2={cy - 5} style={{ stroke: "rgb(var(--ink))", strokeWidth: 2 }} />
          </>
        )}

        <text x="20" y="225" style={{ fill: "rgb(var(--ink))", fontSize: 12 }}>
          {upward ? "Current up (towards you). Field: anticlockwise." : "Current down (away). Field: clockwise."}
        </text>
      </svg>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setUpward(true)} className={`chip ${upward ? "border-accent bg-accent/10 text-accent" : "text-graphite"}`}>Current up</button>
        <button onClick={() => setUpward(false)} className={`chip ${!upward ? "border-accent bg-accent/10 text-accent" : "text-graphite"}`}>Current down</button>
      </div>

      <label className="block space-y-1">
        <span className="flex justify-between text-sm">
          <span>Current I</span>
          <span className="font-mono">{I} A</span>
        </span>
        <input type="range" min={1} max={10} step={1} value={I} onChange={(e) => setI(Number(e.target.value))} className="w-full accent-accent" />
      </label>

      <p className="annotation">Stronger current, wider field. Try the thumb rule on the picture.</p>
    </div>
  );
}
