"use client";

import { useState } from "react";
import { CONCEPT_BY_ID } from "@/lib/concepts";

type Props = { conceptId: string; questionId: string; questionText: string };
type Variable = "x" | "y" | "z";

const ELECTRICITY = [
  "electric_current", "potential_difference", "circuit_components", "resistance",
  "resistance_factors", "ohms_law", "series_parallel", "electric_power",
  "heating_effect", "domestic_circuits",
];
const MAGNETISM = [
  "magnetic_field", "field_around_current", "solenoid", "force_on_conductor",
  "fleming_left_hand", "electric_motor", "electromagnetic_induction",
  "electric_generator", "ac_dc",
];
const MIRRORS = ["spherical_mirrors", "sign_convention", "mirror_formula", "mirror_magnification"];
const LENSES = ["spherical_lenses", "lens_formula", "lens_magnification", "lens_power"];
const DEFAULTS: Record<string, [number, number, number]> = {
  electric_current: [10, 2, 4],
  potential_difference: [6, 2, 4],
  resistance: [12, 3, 4],
  resistance_factors: [2, 1, 4],
  ohms_law: [2, 4, 4],
  series_parallel: [4, 6, 4],
  electric_power: [230, 2, 4],
  heating_effect: [2, 5, 10],
  domestic_circuits: [230, 100, 200],
  force_on_conductor: [3, 2, 90],
  fleming_left_hand: [3, 2, 90],
  refraction: [45, 15, 4],
  refractive_index: [10, 15, 4],
  magnetic_field: [5, 30, 4],
  field_around_current: [5, 30, 4],
  solenoid: [3, 10, 4],
  electric_motor: [5, 30, 4],
  electromagnetic_induction: [5, 30, 4],
  electric_generator: [5, 30, 4],
  spherical_mirrors: [10, 30, 4],
  sign_convention: [10, 30, 4],
  mirror_formula: [10, 30, 4],
  mirror_magnification: [10, 30, 4],
  spherical_lenses: [10, 30, 4],
  lens_formula: [10, 30, 4],
  lens_magnification: [10, 30, 4],
  lens_power: [10, 30, 4],
  human_eye: [50, 30, 4],
  atmospheric_refraction: [5, 30, 4],
  dispersion: [8, 30, 4],
  scattering: [4, 30, 4],
};
const QUESTION_DEFAULTS: Record<string, [number, number, number, boolean?]> = {
  q_current_1: [10, 2, 4],
  q_current_2: [0.5, 20, 4],
  q_current_3: [2, 15, 4],
  q_potential_1: [6, 2, 4],
  q_potential_2: [120, 24, 4],
  q_resistance_1: [12, 3, 4],
  q_resistance_2: [6, 0.5, 4],
  q_resistance_factors_1: [2, 1, 4],
  q_resistance_factors_2: [2, 0.5, 4],
  q_ohm_1: [2, 4, 4],
  q_ohm_2: [12, 4, 4],
  q_ohm_3: [12, 20, 4],
  q_series_1: [6, 6, 4, true],
  q_series_2: [4, 4, 4],
  q_series_3: [2, 3, 4, true],
  q_power_1: [230, 2, 4],
  q_power_2: [2, 5, 4],
  q_heating_1: [1, 5, 10],
  q_heating_2: [2, 3, 10],
  q_force_conductor_1: [3, 2, 0],
  q_force_conductor_2: [3, 2, 90],
  q_reflection_1: [35, 30, 4],
  q_reflection_2: [30, 30, 4],
  q_mirror_1: [20, 30, 4],
  q_mirror_formula_1: [15, 30, 4],
  q_mirror_formula_2: [15, 30, 4],
  q_mirror_magnification_1: [4, 2, 4],
  q_mirror_magnification_2: [15, 2, 4],
  q_sign_convention_2: [10, 30, 4],
  q_refraction_1: [45, 15, 4],
  q_refraction_2: [30, 15, 4, true],
  q_refractive_index_1: [2, 3, 4],
  q_refractive_index_2: [10, 15, 4],
  q_lens_formula_1: [10, 20, 4],
  q_lens_formula_2: [15, 30, 4],
  q_lens_magnification_1: [10, 15, 4],
  q_lens_magnification_2: [10, 30, 4, true],
  q_lens_power_1: [50, 30, 4],
  q_lens_power_2: [25, 30, 4, true],
  q_acdc_2: [50, 30, 4, true],
  q_induction_1: [0, 30, 4],
  q_induction_2: [5, 30, 4],
  q_eye_defect_1: [50, 30, 4, true],
  q_eye_defect_2: [50, 30, 4],
};

function Slider({
  label,
  value,
  min,
  max,
  unit,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-mono">{value}{unit ? ` ${unit}` : ""}</span>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-rule/30 p-3">
      <p className="text-xs text-graphite">{label}</p>
      <p className="font-display text-lg">{value}</p>
    </div>
  );
}

function Diagram({ conceptId, questionId, x, y, z, reverse }: {
  conceptId: string;
  questionId: string;
  x: number;
  y: number;
  z: number;
  reverse: boolean;
}) {
  const ink = "rgb(var(--ink))";
  const accent = "rgb(var(--accent))";
  const amber = "rgb(var(--amber))";
  const moss = "rgb(var(--moss))";
  const rust = "rgb(var(--rust))";
  const ray = (x1: number, y1: number, x2: number, y2: number, color = amber) =>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" markerEnd="url(#arrow)" />;
  const base = (
    <>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0 0 L0 6 L7 3Z" fill={accent} />
        </marker>
      </defs>
    </>
  );

  if (ELECTRICITY.includes(conceptId)) {
    if (conceptId === "domestic_circuits") {
      return (
        <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Household appliances connected in parallel with a live-wire fuse">
          {base}
          <path d="M55 35 H365 V155 H55 V110 M55 80 V35" fill="none" stroke={ink} strokeWidth="3" />
          <path d="M48 82 V108 M62 75 V115" stroke={ink} strokeWidth="3" />
          <path d="M130 35 V155 M130 65 H330 M130 125 H330" fill="none" stroke={accent} strokeWidth="2" />
          <circle cx="225" cy="65" r="15" fill={amber} stroke={ink} strokeWidth="2" />
          <circle cx="225" cy="125" r="15" fill={amber} stroke={ink} strokeWidth="2" />
          <path d="M85 35 L95 28 L105 42 L115 28 L125 35" fill="none" stroke={rust} strokeWidth="3" />
          <text x="72" y="20" fill={ink} fontSize="12">live wire + fuse</text>
          <text x="250" y="70" fill={ink} fontSize="12">appliance 1</text>
          <text x="250" y="130" fill={ink} fontSize="12">appliance 2</text>
        </svg>
      );
    }
    const parallel = conceptId === "series_parallel" && reverse;
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label={`${CONCEPT_BY_ID[conceptId].label} circuit simulator`}>
        {base}
        <path d="M55 35 H365 V155 H55 V110 M55 80 V35" fill="none" stroke={ink} strokeWidth="3" />
        <path d="M48 82 V108 M62 75 V115" stroke={ink} strokeWidth="3" />
        <text x="20" y="100" fill={ink} fontSize="13">V</text>
        {(conceptId === "series_parallel" && parallel) ? (
          <>
            <path d="M145 35 V155 M275 35 V155" fill="none" stroke={ink} strokeWidth="2" />
            <rect x="177" y="53" width="65" height="23" fill="rgb(var(--surface))" stroke={accent} strokeWidth="2" />
            <rect x="177" y="112" width="65" height="23" fill="rgb(var(--surface))" stroke={accent} strokeWidth="2" />
            <text x="194" y="70" fill={ink} fontSize="12">R1</text>
            <text x="194" y="129" fill={ink} fontSize="12">R2</text>
            <text x="157" y="174" fill={ink} fontSize="12">parallel branches</text>
          </>
        ) : (
          <>
            <rect x="150" y="24" width="68" height="23" fill="rgb(var(--surface))" stroke={accent} strokeWidth="2" />
            <text x="170" y="41" fill={ink} fontSize="12">R1</text>
            {["series_parallel", "domestic_circuits"].includes(conceptId) && (
              <>
                <rect x="245" y="24" width="68" height="23" fill="rgb(var(--surface))" stroke={accent} strokeWidth="2" />
                <text x="265" y="41" fill={ink} fontSize="12">R2</text>
              </>
            )}
          </>
        )}
        {conceptId === "circuit_components" && (
          <>
            <circle cx="185" cy="35" r="13" fill="rgb(var(--surface))" stroke={rust} strokeWidth="2" />
            <text x="180" y="40" fill={ink} fontSize="12">A</text>
            <path d="M150 80 H260 V110 H150 Z" fill="none" stroke={moss} strokeWidth="2" strokeDasharray="5 4" />
            <circle cx="205" cy="95" r="12" fill="rgb(var(--surface))" stroke={moss} strokeWidth="2" />
            <text x="200" y="100" fill={ink} fontSize="12">V</text>
          </>
        )}
        {conceptId === "heating_effect" && <text x="155" y="100" fill={rust} fontSize="13">heat ∝ I² R t</text>}
        {conceptId === "electric_current" && <text x="145" y="100" fill={ink} fontSize="13">charge flow →</text>}
        {conceptId === "potential_difference" && <text x="145" y="100" fill={ink} fontSize="13">energy per charge</text>}
        {conceptId === "resistance_factors" && <text x="145" y="100" fill={ink} fontSize="13">length / cross-section</text>}
      </svg>
    );
  }

  if (conceptId === "magnetic_field") {
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Closed magnetic field lines around a bar magnet">
        {base}
        {Array.from({ length: Math.min(8, Math.max(2, Math.ceil(x / 1.5))) }, (_, i) => (
          <path key={i} d={`M${155 - i * 14} 95 C${115 - i * 24} ${15 - i * 3}, ${305 + i * 22} ${15 - i * 3}, ${265 + i * 14} 95 C${305 + i * 22} ${175 + i * 3}, ${115 - i * 24} ${175 + i * 3}, ${155 - i * 14} 95`}
            fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#arrow)" />
        ))}
        <rect x="155" y="78" width="110" height="34" rx="4" fill="rgb(var(--surface))" stroke={ink} strokeWidth="2" />
        <path d="M210 78 V112" stroke={ink} strokeWidth="2" />
        <text x="175" y="100" fill={rust} fontSize="15">N</text>
        <text x="235" y="100" fill={accent} fontSize="15">S</text>
      </svg>
    );
  }

  if (conceptId === "field_around_current") {
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Right-hand thumb rule magnetic field around a wire">
        {base}
        {[28, 48, 68].map((radius) => (
        <circle key={radius} cx="210" cy="90" r={radius} fill="none" stroke={accent} strokeWidth={Math.max(1, x / 5)} />
        ))}
        <circle cx="210" cy="90" r="13" fill={reverse ? "rgb(var(--surface))" : amber} stroke={ink} strokeWidth="2" />
        <text x="206" y="95" fill={ink} fontSize="14">{reverse ? "×" : "•"}</text>
        <text x="115" y="176" fill={ink} fontSize="12">Current {reverse ? "into" : "out of"} page · concentric field</text>
      </svg>
    );
  }

  if (conceptId === "solenoid") {
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Solenoid coil and bar-magnet-like field">
        {base}
        {Array.from({ length: Math.min(12, Math.max(3, Math.round(y / 2))) }, (_, i) => (
          <ellipse key={i} cx={100 + i * 20} cy="76" rx="10" ry="38" fill="none" stroke={accent} strokeWidth="3" />
        ))}
        {[0, 1, 2].map((i) => <path key={i} d={`M${100 + i * 12} ${115 - i * 8} H${320 - i * 12}`} fill="none" stroke={moss} strokeWidth={Math.max(1, x / 3)} markerEnd="url(#arrow)" />)}
        <text x="95" y="150" fill={ink} fontSize="13">coil turns: {y} · current: {x} A</text>
      </svg>
    );
  }

  if (conceptId === "force_on_conductor" || conceptId === "fleming_left_hand") {
    const forceLength = 100 * Math.sin(z * Math.PI / 180);
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label={conceptId === "fleming_left_hand" ? "Fleming left hand rule directions" : "Force on a current-carrying conductor"}>
        {base}
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M${65 + i * 75} 145 V45`} stroke={accent} strokeWidth="2" markerEnd="url(#arrow)" />)}
        <path d={reverse ? `M${210 + forceLength} 95 H210` : `M210 95 H${210 + forceLength}`} stroke={rust} strokeWidth="4" markerEnd="url(#arrow)" />
        <path d="M210 150 V35" stroke={moss} strokeWidth="4" markerEnd="url(#arrow)" />
        <text x="70" y="172" fill={accent} fontSize="12">Field (first finger)</text>
        <text x="215" y="172" fill={rust} fontSize="12">Current (middle finger)</text>
        <text x="165" y="28" fill={moss} fontSize="12">Force (thumb)</text>
      </svg>
    );
  }

  if (conceptId === "electric_motor") {
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Electric motor coil and split-ring commutator">
        {base}
        <text x="70" y="45" fill={rust} fontSize="18">N</text><text x="340" y="45" fill={accent} fontSize="18">S</text>
        {[0, 1, 2].map((i) => <path key={i} d={`M${105 + i * 65} 55 V145`} stroke={accent} strokeWidth="2" markerEnd="url(#arrow)" />)}
        <rect x="150" y="65" width="120" height="68" fill="none" stroke={ink} strokeWidth="3" transform={`rotate(${(reverse ? -1 : 1) * (x * 9)} 210 99)`} />
        <path d="M175 145 Q210 165 245 145 M183 147 V165 M237 147 V165" fill="none" stroke={rust} strokeWidth="3" />
        <text x="130" y="184" fill={ink} fontSize="12">coil rotates; split-ring reverses current each half-turn</text>
      </svg>
    );
  }

  if (conceptId === "electromagnetic_induction") {
    const magnetX = Math.max(35, Math.min(185, 140 + (reverse ? -1 : 1) * x * 10));
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Moving magnet induces current in a coil">
        {base}
        <rect x={magnetX} y="67" width="90" height="42" rx="4" fill="rgb(var(--surface))" stroke={ink} strokeWidth="2" />
        <path d={`M${magnetX} 67 V109`} stroke={rust} strokeWidth="4" />
        <path d={`M${magnetX + 45} 67 V109`} stroke={accent} strokeWidth="4" />
        <text x={magnetX + 10} y="94" fill={ink} fontSize="13">N</text><text x={magnetX + 55} y="94" fill={ink} fontSize="13">S</text>
        {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx="260" cy="88" rx="10" ry={48 - i * 7} fill="none" stroke={moss} strokeWidth="2" />)}
        <path d="M315 88 H360 V145 H250" fill="none" stroke={ink} strokeWidth="2" />
        <circle cx="350" cy="88" r="15" fill="rgb(var(--surface))" stroke={rust} strokeWidth="2" />
        <text x="345" y="93" fill={ink} fontSize="12">G</text>
        <text x="150" y="177" fill={ink} fontSize="12">Move magnet → changing flux → induced current</text>
      </svg>
    );
  }

  if (conceptId === "electric_generator") {
    const points = Array.from({ length: 25 }, (_, i) => `${40 + i * 14},${92 - Math.sin((i / 24) * Math.PI * 2 * (x / 10)) * 30}`).join(" ");
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Rotating generator coil produces alternating current">
        {base}
        <text x="55" y="42" fill={rust} fontSize="18">N</text><text x="245" y="42" fill={accent} fontSize="18">S</text>
        <rect x="105" y="52" width="90" height="70" fill="none" stroke={ink} strokeWidth="3" transform={`rotate(${x * 9} 150 87)`} />
        <path d="M150 122 V145 M175 122 V145 M150 145 Q160 158 170 145 M175 145 Q185 158 195 145" fill="none" stroke={rust} strokeWidth="2" />
        <polyline points={points} fill="none" stroke={moss} strokeWidth="2" />
        <text x="42" y="145" fill={ink} fontSize="11">induced AC output</text>
      </svg>
    );
  }

  if (conceptId === "ac_dc") {
    const points = Array.from({ length: 25 }, (_, i) => `${35 + i * 14},${reverse ? 90 : 90 - Math.sin((i / 24) * Math.PI * 2) * 42}`).join(" ");
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label={reverse ? "Alternating current waveform" : "Direct current waveform"}>
        {base}
        <path d="M30 90 H390 M35 30 V155" stroke={ink} strokeWidth="1" />
        <polyline points={points} fill="none" stroke={accent} strokeWidth="4" />
        <text x="140" y="175" fill={ink} fontSize="13">{reverse ? "AC reverses direction periodically" : "DC flows in one direction"}</text>
      </svg>
    );
  }

  if (conceptId === "light_reflection") {
    const angle = x * Math.PI / 180;
    const dx = Math.sin(angle) * 115;
    const dy = Math.cos(angle) * 115;
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Plane mirror reflection with equal incidence and reflection angles">
        {base}
        <path d="M210 28 V162" stroke={ink} strokeWidth="5" />
        <path d="M218 32 V158" stroke={accent} strokeWidth="2" />
        {ray(210 - dx, 95 - dy, 210, 95)}
        {ray(210, 95, 210 + dx, 95 - dy, moss)}
        <path d="M210 95 H340" stroke={ink} strokeDasharray="5 5" />
        <text x="42" y="28" fill={ink} fontSize="13">i = {x}°</text><text x="304" y="28" fill={ink} fontSize="13">r = {x}°</text>
        <text x="225" y="178" fill={ink} fontSize="12">normal</text>
      </svg>
    );
  }

  if (MIRRORS.includes(conceptId) && questionId !== "q_sign_convention_2") {
    const focalLength = reverse ? x : -x;
    const imageDistance = questionId === "q_mirror_magnification_2"
      ? -x * y
      : 1 / (1 / focalLength + 1 / y);
    const imageX = Math.max(35, Math.min(365, 210 + (Number.isFinite(imageDistance) ? imageDistance : 0) * 2));
    const objectDistance = questionId === "q_mirror_magnification_2" ? x : y;
    const imageHeight = Math.max(12, Math.min(65, Math.abs(imageDistance / objectDistance) * 25));
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label={`${CONCEPT_BY_ID[conceptId].label} ${reverse ? "convex" : "concave"} mirror ray diagram`}>
        {base}
        <path d={reverse ? "M300 35 Q250 95 300 155" : "M300 35 Q350 95 300 155"} fill="none" stroke={ink} strokeWidth="5" />
        <path d="M70 95 H380" stroke={ink} strokeDasharray="5 5" />
        {[220, 240].map((p) => <circle key={p} cx={p} cy="95" r="3" fill={rust} />)}
        <path d={`M100 95 V45 M100 45 L300 45 M300 45 L${imageX} ${95 + imageHeight}`} fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#arrow)" />
        <path d={`M100 45 L240 95 M240 95 L300 45`} fill="none" stroke={moss} strokeWidth="2" />
        <path d={`M${imageX} 95 V${95 + imageHeight}`} stroke={rust} strokeWidth="4" />
        <text x="77" y="38" fill={ink} fontSize="12">object</text><text x="305" y="174" fill={ink} fontSize="12">{reverse ? "convex mirror" : "concave mirror"}</text>
        {conceptId === "sign_convention" && <text x="95" y="178" fill={ink} fontSize="12">u = −{y} cm · left of pole is negative</text>}
      </svg>
    );
  }

  if (conceptId === "refraction" || conceptId === "refractive_index") {
    const n = y / 10;
    const angle1 = x * Math.PI / 180;
    const relativeIndex = reverse ? 1 / n : n;
    const angle2 = Math.asin(Math.min(1, Math.sin(angle1) / relativeIndex));
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Ray refracting at a boundary between two media">
        {base}
        <path d="M30 95 H390" stroke={ink} strokeWidth="3" />
        <path d="M210 20 V170" stroke={ink} strokeDasharray="5 5" />
        <path d={reverse ? "M30 20 H390 V95 H30Z" : "M30 95 H390 V175 H30Z"} fill="rgb(var(--accent))" opacity="0.08" />
        {ray(210 - Math.sin(angle1) * 130, reverse ? 95 + Math.cos(angle1) * 130 : 95 - Math.cos(angle1) * 130, 210, 95)}
        {ray(210, 95, 210 + Math.sin(angle2) * 130, reverse ? 95 - Math.cos(angle2) * 130 : 95 + Math.cos(angle2) * 130, moss)}
        <text x="44" y={reverse ? "155" : "28"} fill={ink} fontSize="13">{reverse ? `glass n = ${n.toFixed(1)}` : "air n₁ = 1"}</text>
        <text x="45" y={reverse ? "28" : "155"} fill={ink} fontSize="13">{reverse ? "air n = 1" : `glass n₂ = ${n.toFixed(1)}`}</text>
        <text x="255" y="65" fill={ink} fontSize="12">i {x}° → r {Math.round(angle2 * 180 / Math.PI)}°</text>
      </svg>
    );
  }

  if (LENSES.includes(conceptId) || questionId === "q_sign_convention_2") {
    const convex = !reverse;
    const focal = convex ? x : -x;
    const objectDistance = Math.max(focal + 2, y);
    const imageDistance = 1 / (1 / focal - 1 / objectDistance);
    const imageX = Math.max(25, Math.min(390, 210 + imageDistance * 2));
    const imageHeight = Math.max(10, Math.min(70, Math.abs(imageDistance / objectDistance) * 30));
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label={`${convex ? "Convex" : "Concave"} lens ray diagram`}>
        {base}
        <path d={convex ? "M210 25 Q180 95 210 165 Q240 95 210 25" : "M195 25 Q220 95 195 165 M225 25 Q200 95 225 165"} fill="none" stroke={accent} strokeWidth="3" />
        <path d="M30 95 H390" stroke={ink} strokeDasharray="5 5" />
        <circle cx={210 - Math.abs(focal) * 2} cy="95" r="4" fill={rust} /><circle cx={210 + Math.abs(focal) * 2} cy="95" r="4" fill={rust} />
        <path d={`M${Math.max(30, 210 - objectDistance * 2)} 95 V55`} stroke={ink} strokeWidth="3" />
        {convex ? (
          <path d={`M${Math.max(30, 210 - objectDistance * 2)} 55 H210 L${imageX} ${95 + imageHeight}`} fill="none" stroke={moss} strokeWidth="2" markerEnd="url(#arrow)" />
        ) : (
          <>
            <path d={`M${Math.max(30, 210 - objectDistance * 2)} 55 H210 L390 30`} fill="none" stroke={moss} strokeWidth="2" markerEnd="url(#arrow)" />
            <path d={`M210 55 L${imageX} ${95 - imageHeight}`} fill="none" stroke={rust} strokeWidth="2" strokeDasharray="5 4" />
          </>
        )}
        <path d={`M${imageX} 95 V${95 + imageHeight}`} stroke={rust} strokeWidth="4" />
        <text x="170" y="180" fill={ink} fontSize="12">{convex ? "convex lens converges rays" : "concave lens diverges rays"}</text>
      </svg>
    );
  }

  if (conceptId === "human_eye" || conceptId === "eye_defects") {
    const corrected = reverse;
    const focusX = conceptId === "human_eye" ? 205 + Math.min(40, x / 5) : corrected ? 285 : 325;
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label={conceptId === "eye_defects" ? "Vision defect and corrective lens ray diagram" : "Accommodation focuses an image on the retina"}>
        {base}
        <path d="M105 95 Q180 25 300 95 Q180 165 105 95Z" fill="none" stroke={ink} strokeWidth="3" />
        <path d="M195 65 Q180 95 195 125 Q210 95 195 65" fill="none" stroke={accent} strokeWidth="4" />
        <path d="M285 55 V135" stroke={rust} strokeWidth="4" />
        {conceptId === "eye_defects" && (
          <>
            <path d={corrected ? "M100 55 Q90 95 100 135" : "M100 55 Q120 95 100 135"} fill="none" stroke={moss} strokeWidth="3" />
            <text x="30" y="30" fill={ink} fontSize="12">{corrected ? "correcting lens inserted" : "select correction lens"}</text>
          </>
        )}
        {[0, 1, 2].map((i) => <path key={i} d={`M25 ${65 + i * 30} L195 ${65 + i * 15} L${focusX} 95`} fill="none" stroke={amber} strokeWidth="2" />)}
        <text x="270" y="155" fill={ink} fontSize="12">retina</text>
        <text x="135" y="180" fill={ink} fontSize="12">{conceptId === "eye_defects" ? "focus the image on the retina" : `accommodation setting: ${x}`}</text>
      </svg>
    );
  }

  if (conceptId === "dispersion") {
    const colors = ["#7C3AED", "#2563EB", "#16A34A", "#EAB308", "#F97316", "#DC2626"];
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="White light dispersing into a spectrum through a prism">
        {base}
        <path d="M190 40 L130 145 H250 Z" fill="rgb(var(--accent))" opacity="0.12" stroke={ink} strokeWidth="2" />
        <path d="M35 92 H160" stroke={amber} strokeWidth="4" />
        {colors.map((color, i) => <path key={color} d={`M220 92 L390 ${92 + (i - 2.5) * x}`} stroke={color} strokeWidth="3" />)}
        <text x="20" y="75" fill={ink} fontSize="12">white light</text><text x="350" y="165" fill={ink} fontSize="12">spectrum</text>
      </svg>
    );
  }

  if (conceptId === "atmospheric_refraction") {
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Starlight bends through layers of Earth's atmosphere">
        {base}
        {Array.from({ length: Math.min(10, Math.max(1, x)) }, (_, i) => (
          <path key={i} d={`M35 ${50 + i * 10} Q210 ${35 + i * 12} 385 ${50 + i * 10}`} fill="none" stroke={accent} strokeWidth="2" opacity={0.35 + i * 0.05} />
        ))}
        <circle cx="355" cy="25" r="8" fill={amber} />
        <path d="M355 25 Q300 55 245 90 Q185 130 105 150" fill="none" stroke={moss} strokeWidth="3" markerEnd="url(#arrow)" />
        <path d="M355 25 L105 150" stroke={rust} strokeWidth="2" strokeDasharray="6 5" />
        <text x="35" y="178" fill={ink} fontSize="12">apparent star position shifts as light bends through air</text>
      </svg>
    );
  }

  if (conceptId === "scattering") {
    const rayLength = Math.max(20, 120 - x * 3);
    return (
      <svg viewBox="0 0 420 190" className="w-full" role="img" aria-label="Short wavelengths scatter more than long wavelengths">
        {base}
        <path d="M35 95 H190" stroke="#DC2626" strokeWidth="4" />
        <circle cx="195" cy="95" r="9" fill={amber} stroke={ink} />
        {[-1, -0.5, 0.5, 1].map((s, i) => <path key={i} d={`M195 95 L${195 + rayLength} ${95 + s * rayLength * 0.45}`} stroke={i % 2 ? "#2563EB" : "#DC2626"} strokeWidth={i % 2 ? "3" : "1"} opacity="0.75" />)}
        <text x="35" y="145" fill={ink} fontSize="13">blue (short λ) scatters more than red (long λ)</text>
      </svg>
    );
  }

  return null;
}

export default function QuestionSimulator({ conceptId, questionId, questionText }: Props) {
  const concept = CONCEPT_BY_ID[conceptId];
  const questionDefaults = QUESTION_DEFAULTS[questionId];
  const [x, setX] = useState(questionDefaults?.[0] ?? DEFAULTS[conceptId]?.[0] ?? 10);
  const [y, setY] = useState(questionDefaults?.[1] ?? DEFAULTS[conceptId]?.[1] ?? 30);
  const [z, setZ] = useState(questionDefaults?.[2] ?? DEFAULTS[conceptId]?.[2] ?? 4);
  const [reverse, setReverse] = useState(questionDefaults?.[3] ?? false);

  if (!concept) return null;

  const change = (variable: Variable) => (value: number) => {
    if (variable === "x") setX(value);
    if (variable === "y") setY(value);
    if (variable === "z") setZ(value);
  };
  const sliders: Array<{ key: Variable; label: string; min: number; max: number; unit: string }> = [];
  let title = `${concept.label} simulator`;
  let description = concept.remediation;
  let metricLabel = "Observation";
  let metric = "Explore the controls";
  let toggleLabel: string | null = null;

  if (conceptId === "electric_current") {
    title = "Charge flow and current";
    const chargeFromCurrent = questionId === "q_current_2" || questionId === "q_current_3";
    description = chargeFromCurrent
      ? "Rearrange I = Q/t to Q = It; the sliders show the values from this question."
      : "Current is the charge passing a point each second: I = Q/t; the sliders show the values from this question.";
    sliders.push(
      { key: "x", label: chargeFromCurrent ? "Current I" : "Charge Q", min: chargeFromCurrent && questionId === "q_current_2" ? 0.1 : 1, max: chargeFromCurrent ? 10 : 30, unit: chargeFromCurrent ? "A" : "C", ...(questionId === "q_current_2" ? { step: 0.1 } : {}) },
      { key: "y", label: "Time t", min: 1, max: 30, unit: "s" },
    );
    metricLabel = chargeFromCurrent ? "Charge" : "Current";
    metric = chargeFromCurrent ? `${(x * y).toFixed(2)} C` : `${(x / y).toFixed(2)} A`;
  } else if (conceptId === "potential_difference") {
    title = "Work per unit charge";
    description = "Potential difference is energy transferred per unit charge: V = W/Q.";
    sliders.push(
      { key: "x", label: "Work W", min: 1, max: questionId === "q_potential_2" ? 200 : 60, unit: "J" },
      { key: "y", label: "Charge Q", min: 1, max: questionId === "q_potential_2" ? 30 : 20, unit: "C" },
    );
    metricLabel = "Potential difference"; metric = `${(x / y).toFixed(2)} V`;
  } else if (conceptId === "circuit_components") {
    title = "Ammeter and voltmeter connections";
    description = "An ammeter is in series with the component; a voltmeter is in parallel across it.";
    sliders.push({ key: "x", label: "Supply voltage", min: 1, max: 24, unit: "V" }, { key: "y", label: "Resistance", min: 1, max: 20, unit: "Ω" });
    metricLabel = "Circuit current"; metric = `${(x / y).toFixed(2)} A`;
  } else if (conceptId === "resistance") {
    title = "Measure resistance";
    description = "Resistance is potential difference divided by current: R = V/I.";
    sliders.push(
      { key: "x", label: "Potential difference V", min: 1, max: 24, unit: "V" },
      { key: "y", label: "Current I", min: questionId === "q_resistance_2" ? 0.1 : 1, max: 12, unit: "A", ...(questionId === "q_resistance_2" ? { step: 0.1 } : {}) },
    );
    metricLabel = "Resistance"; metric = `${(x / y).toFixed(2)} Ω`;
  } else if (conceptId === "resistance_factors") {
    title = "Wire length and cross-section";
    description = "For the same material, R = ρL/A: longer wire means more resistance; larger area means less.";
    sliders.push(
      { key: "x", label: "Wire length L", min: 1, max: 20, unit: "relative units" },
      { key: "y", label: "Cross-sectional area A", min: questionId === "q_resistance_factors_2" ? 0.5 : 1, max: 20, unit: "relative units", ...(questionId === "q_resistance_factors_2" ? { step: 0.5 } : {}) },
    );
    metricLabel = "Relative resistance"; metric = `${(x / y).toFixed(2)} × ρ`;
  } else if (conceptId === "ohms_law") {
    title = "Ohm's law";
    const currentQuestion = questionId === "q_ohm_2" || questionId === "q_ohm_3";
    description = currentQuestion
      ? "At constant temperature, R stays fixed and I = V/R. The simulator uses this question's voltage and resistance."
      : "At constant temperature, V = IR. The simulator uses this question's current and resistance.";
    sliders.push(
      { key: "x", label: currentQuestion ? "Voltage V" : "Current I", min: 1, max: 24, unit: currentQuestion ? "V" : "A" },
      { key: "y", label: currentQuestion ? "Resistance R" : "Resistance R", min: 1, max: 20, unit: "Ω" },
    );
    metricLabel = currentQuestion ? "Current" : "Voltage";
    metric = currentQuestion ? `${(x / y).toFixed(2)} A` : `${(x * y).toFixed(2)} V`;
  } else if (conceptId === "series_parallel") {
    title = "Series and parallel resistors";
    description = reverse ? "Parallel: 1/Rₑq = 1/R₁ + 1/R₂." : "Series: Rₑq = R₁ + R₂.";
    sliders.push({ key: "x", label: "Resistor R₁", min: 1, max: 30, unit: "Ω" }, { key: "y", label: "Resistor R₂", min: 1, max: 30, unit: "Ω" });
    toggleLabel = `Switch to ${reverse ? "series" : "parallel"}`;
    metricLabel = "Equivalent resistance"; metric = `${(reverse ? (x * y) / (x + y) : x + y).toFixed(2)} Ω`;
  } else if (conceptId === "electric_power") {
    title = "Electrical power";
    const viaResistance = questionId === "q_power_2";
    description = viaResistance ? "Using P = I²R, the current and resistance from the question give the power." : "Power is the rate of electrical energy transfer: P = VI.";
    sliders.push(
      { key: "x", label: viaResistance ? "Current I" : "Voltage V", min: 1, max: viaResistance ? 20 : 240, unit: viaResistance ? "A" : "V" },
      { key: "y", label: viaResistance ? "Resistance R" : "Current I", min: 1, max: viaResistance ? 30 : 20, unit: viaResistance ? "Ω" : "A" },
    );
    metricLabel = "Power";
    metric = `${(viaResistance ? x * x * y : x * y).toLocaleString()} W`;
  } else if (conceptId === "heating_effect") {
    title = "Joule heating";
    description = "Heat produced is H = I²Rt. Doubling current produces four times the heat.";
    sliders.push({ key: "x", label: "Current I", min: 1, max: 10, unit: "A" }, { key: "y", label: "Resistance R", min: 1, max: 30, unit: "Ω" }, { key: "z", label: "Time t", min: 1, max: 60, unit: "s" });
    metricLabel = questionId === "q_heating_1" ? "Heat when current doubles" : "Heat produced";
    metric = questionId === "q_heating_1" ? "4× the original heat" : `${(x * x * y * z).toLocaleString()} J`;
  } else if (conceptId === "domestic_circuits") {
    title = "Household parallel circuit";
    description = "Appliances are connected in parallel so each gets the supply voltage and works independently; the fuse is in the live wire.";
    sliders.push({ key: "x", label: "Supply voltage", min: 100, max: 250, unit: "V" }, { key: "y", label: "Appliance 1 power", min: 20, max: 2000, unit: "W" }, { key: "z", label: "Appliance 2 power", min: 20, max: 2000, unit: "W" });
    metricLabel = "Total supply current"; metric = `${((y + z) / x).toFixed(2)} A`;
  } else if (conceptId === "magnetic_field") {
    title = "Bar magnet field lines";
    description = "Field lines leave the north pole, enter the south pole, and form closed curves. They never cross.";
    sliders.push({ key: "x", label: "Field strength", min: 1, max: 10, unit: "units" });
    metricLabel = "Field pattern"; metric = "Closed loops · N → S outside";
  } else if (conceptId === "field_around_current") {
    title = "Field around a current-carrying wire";
    description = "The right-hand thumb rule gives the circular magnetic-field direction around a straight wire.";
    sliders.push({ key: "x", label: "Current I", min: 1, max: 20, unit: "A" });
    toggleLabel = `Reverse current (${reverse ? "into" : "out of"} page)`;
    metricLabel = "Field direction"; metric = reverse ? "Clockwise" : "Anticlockwise";
  } else if (conceptId === "solenoid") {
    title = "Solenoid electromagnet";
    description = "A current-carrying coil behaves like a bar magnet; more turns or current strengthen its field.";
    sliders.push({ key: "x", label: "Current I", min: 1, max: 10, unit: "A" }, { key: "y", label: "Number of turns", min: 1, max: 30, unit: "turns" });
    metricLabel = "Relative field strength"; metric = `${x * y} units`;
  } else if (conceptId === "force_on_conductor" || conceptId === "fleming_left_hand") {
    title = conceptId === "fleming_left_hand" ? "Fleming's left-hand rule" : "Force on a current-carrying wire";
    description = conceptId === "fleming_left_hand"
      ? "First finger = magnetic field, middle finger = conventional current, thumb = force. The three directions are mutually perpendicular."
      : "A wire in a magnetic field feels force F = BIL sin θ; force is zero when current is parallel to the field.";
    sliders.push({ key: "x", label: "Current I", min: 1, max: 10, unit: "A" }, { key: "y", label: "Field B", min: 1, max: 10, unit: "T" }, { key: "z", label: "Angle θ", min: 0, max: 180, unit: "°" });
    toggleLabel = "Reverse current direction";
    metricLabel = "Relative magnetic force"; metric = `${(x * y * Math.sin(z * Math.PI / 180)).toFixed(2)} units`;
  } else if (conceptId === "electric_motor") {
    title = "Electric motor";
    description = "Opposite forces on the coil create rotation; the split-ring commutator reverses current every half-turn.";
    sliders.push({ key: "x", label: "Coil rotation", min: 0, max: 20, unit: "steps" });
    toggleLabel = "Reverse current";
    metricLabel = "Rotation"; metric = `${x * 18}°`;
  } else if (conceptId === "electromagnetic_induction") {
    title = "Electromagnetic induction";
    description = "Changing magnetic flux through a coil induces current. Faster relative motion produces a larger induced effect.";
    sliders.push({ key: "x", label: "Magnet speed", min: 0, max: 10, unit: "units/s" });
    toggleLabel = "Reverse magnet motion";
    metricLabel = "Induced effect"; metric = `${x === 0 ? 0 : x * 2} relative units`;
  } else if (conceptId === "electric_generator") {
    title = "Electric generator";
    description = "A rotating coil in a magnetic field induces current; a generator converts mechanical energy into electrical energy.";
    sliders.push({ key: "x", label: "Rotation speed", min: 1, max: 10, unit: "turns/s" });
    metricLabel = "Output"; metric = "Alternating current (AC)";
  } else if (conceptId === "ac_dc") {
    title = "Alternating and direct current";
    description = questionId === "q_acdc_2"
      ? "For this 50 Hz AC supply, period T = 1/f. The waveform reverses direction every half-cycle."
      : reverse ? "AC periodically reverses direction." : "DC flows in one direction only.";
    toggleLabel = questionId === "q_acdc_2" ? "Toggle AC waveform" : `Show ${reverse ? "DC" : "AC"} waveform`;
    if (questionId === "q_acdc_2") sliders.push({ key: "x", label: "AC frequency", min: 1, max: 100, unit: "Hz" });
    metricLabel = questionId === "q_acdc_2" ? "Time period" : "Current";
    metric = questionId === "q_acdc_2" ? `${(1 / x).toFixed(3)} s` : reverse ? "Alternating" : "One direction";
  } else if (conceptId === "light_reflection") {
    title = "Plane-mirror reflection";
    description = "The angle of reflection equals the angle of incidence; both are measured from the normal.";
    sliders.push({ key: "x", label: "Angle of incidence", min: 5, max: 85, unit: "°" });
    metricLabel = questionId === "q_reflection_2" ? "Angle between the rays" : "Angle of reflection";
    metric = questionId === "q_reflection_2" ? `${2 * x}°` : `${x}°`;
  } else if (MIRRORS.includes(conceptId)) {
    const focalLength = reverse ? x : -x;
    const v = 1 / (1 / focalLength + 1 / y);
    title = conceptId === "sign_convention" ? "Cartesian sign convention" : conceptId === "mirror_magnification" ? "Mirror magnification" : "Spherical-mirror ray diagram";
    description = questionId === "q_mirror_1"
      ? "A concave mirror focus is in front of the mirror, so f is negative under the New Cartesian convention."
      : questionId === "q_mirror_formula_1" || questionId === "q_mirror_formula_2"
        ? `Using 1/f = 1/v + 1/u with u = −${y} cm and f = ${reverse ? "+" : "−"}${x} cm.`
        : conceptId === "mirror_magnification"
          ? "Mirror magnification m = −v/u. A negative value means an inverted image."
      : conceptId === "sign_convention"
        ? "For the usual incident-light direction, object distance u is negative; use signed distances in mirror equations."
        : `For a spherical mirror, 1/f = 1/v + 1/u. The ${reverse ? "convex" : "concave"} mirror uses its correct signed focal length.`;
    sliders.push(
      {
        key: "x",
        label: questionId === "q_mirror_magnification_1"
          ? "Image height magnitude"
          : questionId === "q_mirror_magnification_2"
            ? "Object distance magnitude |u|"
            : "Focal length magnitude |f|",
        min: 1,
        max: 60,
        unit: "cm",
      },
      {
        key: "y",
        label: questionId === "q_mirror_magnification_1"
          ? "Object height"
          : questionId === "q_mirror_magnification_2"
            ? "Magnification magnitude |m|"
            : "Object distance magnitude |u|",
        min: 1,
        max: questionId === "q_mirror_magnification_2" ? 6 : 60,
        unit: questionId === "q_mirror_magnification_2" ? "" : "cm",
      },
    );
    toggleLabel = `Switch to ${reverse ? "concave" : "convex"} mirror`;
    metricLabel = questionId === "q_mirror_1"
      ? "Signed focal length"
      : conceptId === "mirror_magnification" && questionId === "q_mirror_magnification_1"
        ? "Magnification"
        : "Image distance v";
    metric = questionId === "q_mirror_1"
      ? `${reverse ? "+" : "−"}${x} cm`
      : questionId === "q_mirror_magnification_1"
        ? `${(-x / y).toFixed(2)}×`
        : questionId === "q_mirror_magnification_2"
          ? `${(-x * y).toFixed(1)} cm`
          : `${v.toFixed(1)} cm (signed)`;
  } else if (conceptId === "refraction") {
    const n = y / 10;
    const relativeIndex = reverse ? 1 / n : n;
    const r = Math.asin(Math.min(1, Math.sin(x * Math.PI / 180) / relativeIndex)) * 180 / Math.PI;
    title = "Refraction at a boundary";
    description = reverse
      ? "For this glass-to-air question, light enters a less optically dense medium and bends away from the normal."
      : "For air-to-glass, light enters a slower, optically denser medium and bends towards the normal.";
    sliders.push({ key: "x", label: "Incident angle", min: 5, max: 80, unit: "°" }, { key: "y", label: "Refractive index × 10", min: 11, max: 25, unit: "" });
    metricLabel = "Refracted angle"; metric = `${r.toFixed(1)}°`;
  } else if (conceptId === "refractive_index") {
    const n = y / 10;
    title = "Refractive index and light speed";
    if (questionId === "q_refractive_index_1") {
      description = "Use n = c/v with the speeds given in the question.";
      sliders.push({ key: "x", label: "Light speed in medium", min: 1, max: 3, unit: "×10⁸ m/s" }, { key: "y", label: "Speed in vacuum c", min: 1, max: 3, unit: "×10⁸ m/s" });
      metricLabel = "Refractive index"; metric = `${(y / x).toFixed(2)}`;
    } else {
      description = "Refractive index n = c/v. Light travels more slowly in a medium with a higher refractive index.";
      sliders.push({ key: "y", label: "Refractive index × 10", min: 10, max: 25, unit: "" });
      metricLabel = "Light speed in medium"; metric = `${(3 / n).toFixed(2)} × 10⁸ m/s`;
    }
  } else if (LENSES.includes(conceptId) || questionId === "q_sign_convention_2") {
    const f = reverse ? -x : x;
    const u = -Math.max(Math.abs(f) + 2, y);
    const v = 1 / (1 / f + 1 / u);
    title = questionId === "q_sign_convention_2" ? "Convex-lens sign convention" : conceptId === "lens_power" ? "Power of a lens" : conceptId === "lens_magnification" ? "Lens magnification" : "Spherical-lens ray diagram";
    description = questionId === "q_sign_convention_2"
      ? "A convex lens focuses light on the positive side of the optical centre, so its focal length is positive."
      : conceptId === "lens_power"
        ? `Lens power P = 1/f in metres; this ${reverse ? "concave" : "convex"} lens has ${reverse ? "negative" : "positive"} power.`
      : conceptId === "lens_magnification"
        ? "Lens magnification m = v/u. Positive means erect; negative means inverted."
        : `For lenses, 1/v − 1/u = 1/f. Here f is ${reverse ? "negative" : "positive"} and the real object's u is negative.`;
    sliders.push(
      { key: "x", label: "Focal length magnitude", min: conceptId === "lens_power" ? 5 : 5, max: conceptId === "lens_power" ? 100 : 60, unit: "cm" },
      { key: "y", label: "Object distance magnitude |u|", min: 1, max: 100, unit: "cm" },
    );
    if (conceptId !== "lens_power" && questionId !== "q_sign_convention_2") toggleLabel = "Switch to concave lens";
    metricLabel = questionId === "q_sign_convention_2" ? "Signed focal length" : conceptId === "lens_power" ? "Power" : conceptId === "lens_magnification" ? "Magnification" : "Image distance v";
    metric = questionId === "q_sign_convention_2"
      ? `${reverse ? "−" : "+"}${x} cm`
      : conceptId === "lens_power" ? `${(100 / f).toFixed(2)} D` : conceptId === "lens_magnification" ? `${(v / u).toFixed(2)}×` : `${v.toFixed(1)} cm`;
  } else if (conceptId === "human_eye") {
    title = "Accommodation of the human eye";
    description = "Ciliary muscles change the eye lens curvature so near and distant objects focus on the retina.";
    sliders.push({ key: "x", label: "Object distance", min: 25, max: 200, unit: "cm" });
    metricLabel = "Accommodation"; metric = x < 60 ? "Lens becomes thicker" : "Lens becomes thinner";
  } else if (conceptId === "eye_defects") {
    title = "Correcting vision defects";
    description = reverse
      ? "Hypermetropia (near objects blur) is corrected with a convex lens."
      : "Myopia (distant objects blur) is corrected with a concave lens.";
    toggleLabel = `Switch to ${reverse ? "myopia" : "hypermetropia"} correction`;
    metricLabel = "Correction"; metric = reverse ? "Convex lens" : "Concave lens";
  } else if (conceptId === "dispersion") {
    title = "Dispersion through a prism";
    description = "A prism separates white light into colours; violet deviates most and red least.";
    sliders.push({ key: "x", label: "Prism angle", min: 3, max: 12, unit: "°" });
    metricLabel = "Spectrum spread"; metric = `${x * 6}° · violet deviates most`;
  } else if (conceptId === "atmospheric_refraction") {
    title = "Atmospheric refraction";
    description = "Changing air density bends starlight, shifting the apparent star position and causing twinkling.";
    sliders.push({ key: "x", label: "Atmospheric layers", min: 1, max: 10, unit: "" });
    metricLabel = "Apparent position"; metric = `${x} refracting layers`;
  } else if (conceptId === "scattering") {
    title = "Scattering of light";
    description = "Shorter wavelengths scatter more strongly (approximately 1/λ⁴), helping explain the blue sky.";
    sliders.push({ key: "x", label: "Wavelength", min: 4, max: 7, unit: "×100 nm" });
    metricLabel = "Relative scattering (∝ 1/λ⁴)"; metric = `${(1 / x ** 4).toFixed(4)}`;
  } else {
    return (
      <div role="alert" className="notebook-card text-sm text-rust">
        No simulator has been mapped for {concept.label}. This concept needs a reviewed question-specific simulation.
      </div>
    );
  }

  return (
    <section className="notebook-card space-y-4" aria-label={`Simulator for ${concept.label}`}>
      <header>
        <p className="annotation">Question-aligned simulator</p>
        <h3 className="font-display text-xl">{title}</h3>
        <p className="text-sm text-graphite">{concept.chapter} · {concept.label}</p>
      </header>
      <details className="rounded-lg border border-rule px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium">Question being explored</summary>
        <p className="mt-2 text-graphite">{questionText}</p>
      </details>
      <Diagram conceptId={conceptId} questionId={questionId} x={x} y={y} z={z} reverse={reverse} />
      <p className="rounded-lg border border-rule bg-surface/60 p-3 text-sm">{description}</p>
      {sliders.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {sliders.map((slider) => (
            <Slider
              key={slider.key}
              label={slider.label}
              min={slider.min}
              max={slider.max}
              unit={slider.unit}
              value={slider.key === "x" ? x : slider.key === "y" ? y : z}
              onChange={change(slider.key)}
            />
          ))}
        </div>
      )}
      {toggleLabel && (
        <button type="button" className="btn-ghost" onClick={() => setReverse((value) => !value)}>
          {toggleLabel}
        </button>
      )}
      <Metric label={metricLabel} value={metric} />
    </section>
  );
}
