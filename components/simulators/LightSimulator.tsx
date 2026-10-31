"use client";
import { useMemo, useState } from "react";

// Light: a convex lens ray diagram. Drag the sliders; the rays and the lens formula stay in sync.
// New Cartesian convention: object distance u is negative (object in front of the lens).
export default function LightSimulator() {
  const [f, setF] = useState(10); // cm, convex when positive
  const [uAbs, setUAbs] = useState(20); // cm

  const W = 420;
  const H = 240;
  const cx = W / 2;
  const cy = H / 2;
  const scale = 6;
  const objectH = 40;

  const { v, m } = useMemo(() => {
    const u = -uAbs;
    const invV = 1 / f + 1 / u; // 1/v - 1/u = 1/f  ->  1/v = 1/f + 1/u
    const vv = Math.abs(invV) < 1e-6 ? Infinity : 1 / invV;
    return { v: vv, m: vv / u };
  }, [f, uAbs]);

  const objX = cx - uAbs * scale;
  const imgX = Number.isFinite(v) ? cx + v * scale : null;
  const imgH = m * objectH;
  const imgY = cy - imgH;

  const nature = !Number.isFinite(v) ? "at infinity" : v > 0 ? "real and inverted" : "virtual and erect";
  const size = !Number.isFinite(m) ? "" : Math.abs(m) > 1 ? ", enlarged" : Math.abs(m) === 1 ? ", same size" : ", diminished";

  return (
    <div className="notebook-card space-y-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Convex lens ray diagram">
        <line x1="0" y1={cy} x2={W} y2={cy} style={{ stroke: "rgb(var(--graphite))", strokeDasharray: "4 4" }} />
        <line x1={cx} y1="20" x2={cx} y2={H - 20} style={{ stroke: "rgb(var(--accent))", strokeWidth: 3 }} />
        {[cx - f * scale, cx + f * scale].map((x, i) => (
          <circle key={i} cx={x} cy={cy} r="3" style={{ fill: "rgb(var(--ember))" }} />
        ))}
        <line x1={objX} y1={cy} x2={objX} y2={cy - objectH} style={{ stroke: "rgb(var(--ink))", strokeWidth: 3 }} />
        {imgX !== null && (
          <>
            <line x1={objX} y1={cy - objectH} x2={cx} y2={cy - objectH} style={{ stroke: "rgb(var(--moss))", strokeWidth: 2 }} />
            <line x1={cx} y1={cy - objectH} x2={imgX} y2={cy} style={{ stroke: "rgb(var(--moss))", strokeWidth: 2 }} />
            <line x1={objX} y1={cy - objectH} x2={cx} y2={cy - objectH} style={{ stroke: "rgb(var(--amber))", strokeWidth: 0 }} />
            <line x1={imgX} y1={cy} x2={imgX} y2={imgY} style={{ stroke: "rgb(var(--rust))", strokeWidth: 3 }} />
          </>
        )}
      </svg>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="flex justify-between text-sm"><span>Focal length f</span><span className="font-mono">{f} cm</span></span>
          <input type="range" min={5} max={20} value={f} onChange={(e) => setF(Number(e.target.value))} className="w-full accent-accent" />
        </label>
        <label className="space-y-1">
          <span className="flex justify-between text-sm"><span>Object distance |u|</span><span className="font-mono">{uAbs} cm</span></span>
          <input type="range" min={5} max={40} value={uAbs} onChange={(e) => setUAbs(Number(e.target.value))} className="w-full accent-accent" />
        </label>
      </div>

      <div className="rounded-lg border border-rule p-4 font-mono text-sm">
        <p>1/v − 1/u = 1/f → v = {Number.isFinite(v) ? `${v.toFixed(1)} cm` : "∞"}</p>
        <p>m = v/u = {Number.isFinite(m) ? m.toFixed(2) : "–"}</p>
        <p className="annotation mt-1">Image is {nature}{size}.</p>
      </div>
    </div>
  );
}
