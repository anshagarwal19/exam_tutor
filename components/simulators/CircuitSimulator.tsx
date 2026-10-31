"use client";
import { useState } from "react";

// Electricity: change V and resistances, and watch current, power, and the lamp respond.
export default function CircuitSimulator() {
  const [V, setV] = useState(6);
  const [R1, setR1] = useState(4);
  const [R2, setR2] = useState(6);
  const [mode, setMode] = useState<"series" | "parallel">("series");

  const Req = mode === "series" ? R1 + R2 : (R1 * R2) / (R1 + R2);
  const I = V / Req;
  const P = V * I;
  const glow = Math.min(1, I / 3);
  const fmt = (x: number) => (Math.round(x * 100) / 100).toString();

  const wire = { stroke: "rgb(var(--ink))", strokeWidth: 2, fill: "none" } as const;
  const resistor = { fill: "rgb(var(--surface))", stroke: "rgb(var(--ink))", strokeWidth: 2 } as const;
  const label = { fill: "rgb(var(--ink))", fontSize: 12 } as const;

  return (
    <div className="notebook-card space-y-5">
      <svg viewBox="0 0 420 220" className="w-full" role="img" aria-label={`${mode} circuit with a lamp`}>
        {/* battery on the left */}
        <line x1="40" y1="92" x2="40" y2="128" style={{ stroke: "rgb(var(--ink))", strokeWidth: 4 }} />
        <line x1="50" y1="100" x2="50" y2="120" style={{ stroke: "rgb(var(--ink))", strokeWidth: 2 }} />
        <text x="22" y="112" style={label}>{fmt(V)} V</text>

        {mode === "series" ? (
          <>
            <path d="M40 40 H380 V180 H40 V92 M40 128 V180" style={wire} />
            <rect x="150" y="28" width="60" height="24" style={resistor} />
            <rect x="250" y="28" width="60" height="24" style={resistor} />
            <text x="165" y="22" style={label}>R1 {R1}Ω</text>
            <text x="265" y="22" style={label}>R2 {R2}Ω</text>
          </>
        ) : (
          <>
            <path d="M40 40 H130 M290 40 H380 V180 H290 M130 180 H40 M40 128 V180 M40 92 V40" style={wire} />
            <path d="M130 40 V180 M290 40 V180" style={wire} />
            <path d="M130 80 H185 M245 80 H290 M130 150 H185 M245 150 H290" style={wire} />
            <rect x="185" y="68" width="60" height="24" style={resistor} />
            <rect x="185" y="138" width="60" height="24" style={resistor} />
            <text x="150" y="62" style={label}>R1 {R1}Ω</text>
            <text x="150" y="132" style={label}>R2 {R2}Ω</text>
          </>
        )}

        {/* lamp: brightness follows the current */}
        <circle cx="380" cy="110" r="16" style={{ fill: "rgb(var(--amber))", opacity: glow, stroke: "rgb(var(--ink))", strokeWidth: 2 }} />
        <text x="352" y="150" style={label}>lamp</text>
      </svg>

      <div className="flex gap-2">
        {(["series", "parallel"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`chip capitalize ${mode === m ? "border-accent bg-accent/10 text-accent" : "text-graphite"}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Voltage V" unit="V" value={V} min={1} max={12} onChange={setV} />
        <Slider label="R1" unit="Ω" value={R1} min={1} max={20} onChange={setR1} />
        <Slider label="R2" unit="Ω" value={R2} min={1} max={20} onChange={setR2} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric name="Equivalent R" value={`${fmt(Req)} Ω`} />
        <Metric name="Current I" value={`${fmt(I)} A`} />
        <Metric name="Power P" value={`${fmt(P)} W`} />
      </div>
      <p className="rounded-lg border border-rule p-3 font-mono text-sm">
        V = I × R → {fmt(V)} = {fmt(I)} × {fmt(Req)}
      </p>
    </div>
  );
}

function Slider({ label, unit, value, min, max, onChange }: { label: string; unit: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <label className="space-y-1">
      <span className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono">{value} {unit}</span>
      </span>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
    </label>
  );
}

function Metric({ name, value }: { name: string; value: string }) {
  return (
    <div className="rounded-lg bg-rule/30 p-3">
      <p className="text-xs text-graphite">{name}</p>
      <p className="font-display text-xl">{value}</p>
    </div>
  );
}
