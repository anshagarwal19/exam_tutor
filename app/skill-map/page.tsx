"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SkillMap from "@/components/SkillMap";
import { loadState, State } from "@/lib/store";

export default function SkillMapPage() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.profile) return router.replace("/onboarding");
    setState(s);
  }, [router]);

  if (!state) return null;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="annotation">Your map</p>
          <h1 className="font-display text-4xl font-semibold">Class 10 Physics, mapped to you</h1>
          <p className="text-graphite">Arrows point from prerequisite to the concept that depends on it. Click a node to practise it.</p>
        </div>
        <button className="btn-primary" onClick={() => router.push("/practice")}>Practise weakest</button>
      </div>
      <SkillMap mastery={state.mastery} />
      <div className="flex gap-5 text-sm text-graphite">
        <Legend color="bg-rust" label="Weak (<55%)" />
        <Legend color="bg-amber" label="Learning" />
        <Legend color="bg-moss" label="Mastered (85%+)" />
        <Legend color="bg-rule" label="Unseen" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      {label}
    </span>
  );
}
