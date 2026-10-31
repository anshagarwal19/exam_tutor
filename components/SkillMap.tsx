"use client";
import { useMemo } from "react";
import ReactFlow, { Background, Controls, Edge, Node, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { useRouter } from "next/navigation";
import { CONCEPTS } from "@/lib/concepts";
import { MasteryMap, masteryState } from "@/lib/bkt";

const STATE_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  weak: { bg: "#F6E3DF", border: "#B8432F", text: "#7A2A1C" },
  learning: { bg: "#FBF1D6", border: "#E9B949", text: "#6B5110" },
  mastered: { bg: "#DFF0E5", border: "#2E8B57", text: "#1D5A38" },
  unseen: { bg: "#FFFFFF", border: "#D9D3C4", text: "#5B6573" },
};

// Depth = longest prerequisite chain, used for a left-to-right layout.
function depthOf(id: string, memo: Record<string, number> = {}): number {
  if (id in memo) return memo[id];
  const c = CONCEPTS.find((x) => x.id === id)!;
  memo[id] = c.prereqs.length ? 1 + Math.max(...c.prereqs.map((p) => depthOf(p, memo))) : 0;
  return memo[id];
}

export default function SkillMap({ mastery }: { mastery: MasteryMap }) {
  const router = useRouter();

  const { nodes, edges } = useMemo(() => {
    const byDepth: Record<number, string[]> = {};
    CONCEPTS.forEach((c) => {
      const d = depthOf(c.id);
      (byDepth[d] ||= []).push(c.id);
    });

    const nodes: Node[] = CONCEPTS.map((c) => {
      const d = depthOf(c.id);
      const col = byDepth[d].indexOf(c.id);
      const p = mastery[c.id]?.p;
      const state = p === undefined ? "unseen" : masteryState(p);
      const s = STATE_STYLE[state];
      return {
        id: c.id,
        position: { x: d * 240, y: col * 110 },
        data: {
          label: (
            <div className="text-left">
              <div className="font-medium">{c.label}</div>
              <div className="text-xs opacity-70">{c.chapter} · {p === undefined ? "–" : `${Math.round(p * 100)}%`}</div>
            </div>
          ),
        },
        style: {
          background: s.bg,
          border: `2px solid ${s.border}`,
          color: s.text,
          borderRadius: 12,
          padding: 12,
          width: 190,
          boxShadow: state === "weak" ? "0 0 0 4px rgba(184,67,47,0.12)" : "none",
        },
      };
    });

    const edges: Edge[] = CONCEPTS.flatMap((c) =>
      c.prereqs.map((p) => ({
        id: `${p}->${c.id}`,
        source: p,
        target: c.id,
        animated: mastery[p]?.p !== undefined && masteryState(mastery[p].p) !== "mastered",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#5B6573" },
        style: { stroke: "#5B6573", strokeWidth: 1.5 },
      }))
    );

    return { nodes, edges };
  }, [mastery]);

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl border border-rule bg-surface/70">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={(_, node) => router.push(`/practice?concept=${encodeURIComponent(node.id)}`)}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} color="#D9D3C4" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
