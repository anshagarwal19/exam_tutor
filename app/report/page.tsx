"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadState, State } from "@/lib/store";
import { buildReport } from "@/lib/report";
import RadarChart from "@/components/RadarChart";
import BarList from "@/components/BarList";

export default function ReportPage() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.profile) {
      router.replace("/onboarding");
      return;
    }
    setState(s);
  }, [router]);

  if (!state || !state.profile) return null;
  const r = buildReport(state.mastery, state.attempts, state.profile.examDate);

  if (!r.hasData) {
    return (
      <div className="mx-auto max-w-xl space-y-4 pt-16 text-center">
        <p className="annotation">No report yet</p>
        <h1 className="font-display text-4xl font-semibold">Answer a few questions first.</h1>
        <Link href="/diagnostic" className="btn-primary">Start the diagnostic</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-6">
      <header className="space-y-2">
        <p className="annotation">Report for {state.profile.name}</p>
        <h1 className="font-display text-4xl font-semibold">Where you stand in Class 10 Physics</h1>
        <p className="text-graphite">
          {r.tested} of {r.total} concepts tested.
          {r.daysLeft !== null && r.daysLeft > 0 ? ` ${r.daysLeft} days to your exam.` : ""}
        </p>
      </header>

      {/* Chart row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="notebook-card space-y-4">
          <h2 className="font-display text-xl">Your shape, by chapter</h2>
          <RadarChart axes={r.chapters} />
        </section>
        <section className="notebook-card space-y-4">
          <h2 className="font-display text-xl">Concept by concept</h2>
          <BarList items={r.concepts} />
        </section>
      </div>

      {/* Strengths, gaps, focus */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Where you stand out" tone="moss">
          {r.strengths.length ? r.strengths.map((s) => <Item key={s}>{s}</Item>) : <Item>Not yet. Keep practising.</Item>}
        </Card>
        <Card title="Where skills are missing" tone="rust">
          {r.gaps.length ? r.gaps.map((s) => <Item key={s}>{s}</Item>) : <Item>No major gaps found.</Item>}
        </Card>
        <Card title="Focus on these first" tone="accent">
          {r.focus.map((s, i) => <Item key={s}>{i + 1}. {s}</Item>)}
        </Card>
      </div>

      {/* Mistakes */}
      {r.topMisconceptions.length > 0 && (
        <section className="notebook-card space-y-3">
          <h2 className="font-display text-xl">Patterns in your mistakes</h2>
          <ul className="space-y-2">
            {r.topMisconceptions.map(([label, count]) => (
              <li key={label} className="flex justify-between rounded-lg border-l-4 border-ember bg-ember/10 px-4 py-2 text-sm">
                <span>{label}</span>
                <span className="font-mono text-graphite">{count}×</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Roadmap */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Your roadmap</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {r.roadmap.map((w) => (
            <div key={w.concept} className="notebook-card space-y-3">
              <p className="annotation">{w.week}</p>
              <h3 className="font-display text-lg">{w.concept}</h3>
              <p className="text-xs text-graphite">{w.chapter} · now {Math.round(w.mastery * 100)}%</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {w.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="notebook-card space-y-4">
        <h2 className="font-display text-xl">Where to study next</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {r.resources.map((res) => (
            <li key={res.url + res.chapter} className="rounded-lg border border-rule p-4">
              <p className="text-xs text-graphite">{res.chapter}</p>
              <a href={res.url} target="_blank" rel="noreferrer" className="font-medium text-accent underline underline-offset-4">
                {res.title}
              </a>
              <p className="text-sm text-graphite">{res.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => router.push("/practice")}>Practise the focus area</button>
        <Link href="/skill-map" className="btn-ghost">Open skill map</Link>
      </div>
    </div>
  );
}

function Card({ title, tone, children }: { title: string; tone: "moss" | "rust" | "accent"; children: React.ReactNode }) {
  const bar = { moss: "bg-moss", rust: "bg-rust", accent: "bg-accent" }[tone];
  return (
    <div className="notebook-card space-y-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${bar}`} />
        <h3 className="font-display text-lg">{title}</h3>
      </div>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return <li className="text-sm">{children}</li>;
}
