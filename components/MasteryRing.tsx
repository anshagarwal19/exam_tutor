"use client";
import { useEffect, useState } from "react";

// Animated circular progress. `value` is 0..1.
export default function MasteryRing({ value, label }: { value: number; label: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShown(value), 150);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="relative h-52 w-52">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#D9D3C4" strokeWidth="14" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="#1F5FBF"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          className="ring-track"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold">{Math.round(shown * 100)}%</span>
        <span className="text-xs uppercase tracking-wide text-graphite">{label}</span>
      </div>
    </div>
  );
}
