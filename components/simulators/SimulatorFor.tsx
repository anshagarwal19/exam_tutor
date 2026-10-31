"use client";
import { CHAPTERS } from "@/lib/config";
import CircuitSimulator from "./CircuitSimulator";
import MagnetSimulator from "./MagnetSimulator";
import LightSimulator from "./LightSimulator";

// Picks the simulator for a chapter. To change which simulator a chapter gets, edit lib/config.ts.
export default function SimulatorFor({ chapter }: { chapter: string }) {
  const kind = CHAPTERS[chapter]?.simulator ?? "light";
  if (kind === "circuit") return <CircuitSimulator />;
  if (kind === "magnet") return <MagnetSimulator />;
  return <LightSimulator />;
}
