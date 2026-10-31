"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Summary = {
  learner_count: number;
  attempts_count: number;
  concepts_with_data: number;
};

type ConceptGap = {
  id: string;
  label: string;
  chapter: string;
  learnerCount: number;
  averageMastery: number | null;
  weakLearnerCount: number;
  dueForReviewCount: number;
};

type Misconception = {
  conceptId: string;
  concept: string;
  label: string;
  occurrences: number;
};

type Dashboard = {
  classCode: string;
  summary: Summary;
  concepts: ConceptGap[];
  misconceptions: Misconception[];
};

async function responseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export default function TeacherDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [accessRequired, setAccessRequired] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [key, setKey] = useState("");
  const [classCode, setClassCode] = useState("");
  const [classRequired, setClassRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = useCallback(async (requestedClassCode = "") => {
    setLoading(true);
    setError("");
    try {
      const query = requestedClassCode ? `?classCode=${encodeURIComponent(requestedClassCode)}` : "";
      const response = await fetch(`/api/teacher/dashboard${query}`, { cache: "no-store" });
      if (response.status === 401) {
        setAccessRequired(true);
        setClassRequired(false);
        setDashboard(null);
        return;
      }
      if (response.status === 400) {
        setAccessRequired(false);
        setClassRequired(true);
        setDashboard(null);
        if (requestedClassCode.trim()) {
          setError(await responseError(response));
        }
        return;
      }
      if (response.status === 503) setConfigured(false);
      if (!response.ok) throw new Error(await responseError(response));
      setConfigured(true);
      setAccessRequired(false);
      setClassRequired(false);
      setDashboard((await response.json()) as Dashboard);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setKey("");
      await loadDashboard();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    const response = await fetch("/api/teacher/login", { method: "DELETE" });
    if (!response.ok) {
      setError(await responseError(response));
      return;
    }
    setDashboard(null);
    setClassRequired(false);
    setAccessRequired(true);
  }

  async function selectClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = classCode.trim().toUpperCase();
    setClassCode(normalized);
    await loadDashboard(normalized);
  }

  if (loading && !dashboard && !accessRequired && configured) {
    return <p className="pt-16 text-center text-graphite">Loading teacher dashboard...</p>;
  }

  if (!configured) {
    return (
      <section className="notebook-card mx-auto mt-12 max-w-xl space-y-3">
        <p className="annotation">Setup needed</p>
        <h1 className="font-display text-3xl font-semibold">Teacher dashboard unavailable</h1>
        <p className="text-graphite">
          Configure the server-side teacher key and Supabase database settings, then run the SQL in
          <code className="mx-1 rounded bg-rule/40 px-1">supabase/schema.sql</code>.
        </p>
        {error && <p role="alert" className="text-sm text-rust">{error}</p>}
      </section>
    );
  }

  if (accessRequired) {
    return (
      <section className="notebook-card mx-auto mt-12 max-w-md space-y-5">
        <div className="space-y-2">
          <p className="annotation">Teacher access</p>
          <h1 className="font-display text-3xl font-semibold">Class overview</h1>
          <p className="text-sm text-graphite">Enter the teacher dashboard key to view class-wide learning gaps.</p>
        </div>
        <form className="space-y-4" onSubmit={signIn}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Teacher access key</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              required
            />
          </label>
          {error && <p role="alert" className="text-sm text-rust">{error}</p>}
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Open dashboard"}
          </button>
        </form>
      </section>
    );
  }

  if (classRequired || (!dashboard && !loading)) {
    return (
      <section className="notebook-card mx-auto mt-12 max-w-md space-y-5">
        <div className="space-y-2">
          <p className="annotation">Class selection</p>
          <h1 className="font-display text-3xl font-semibold">Choose your class</h1>
          <p className="text-sm text-graphite">Enter the class code students use during onboarding. Class data stays separated by code.</p>
        </div>
        <form className="space-y-4" onSubmit={(event) => void selectClass(event)}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Class code</span>
            <input
              className="input"
              required
              minLength={2}
              maxLength={32}
              pattern="[A-Za-z0-9][A-Za-z0-9_\x2d]{1,31}"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="e.g. 10A"
              value={classCode}
              onChange={(event) => setClassCode(event.target.value.toUpperCase())}
            />
            <span className="text-xs text-graphite">Type the full code (for example, 10A), then press Enter or click “View class”.</span>
          </label>
          {error && <p role="alert" className="text-sm text-rust">{error}</p>}
          <div className="flex gap-3">
            <button className="btn-primary flex-1" disabled={loading}>
              {loading ? "Loading..." : "View class"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => void signOut()}>Sign out</button>
          </div>
        </form>
      </section>
    );
  }

  if (!dashboard) return null;

  const weakest = dashboard.concepts[0]?.averageMastery;

  return (
    <div className="space-y-8 pt-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="annotation">Teacher view · Class {dashboard.classCode}</p>
          <h1 className="font-display text-4xl font-semibold">Class learning gaps</h1>
          <p className="text-graphite">Aggregate mastery, review priorities, and recurring misconceptions.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !px-4 !py-2" onClick={() => void loadDashboard(dashboard.classCode)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn-ghost !px-4 !py-2" onClick={() => { setDashboard(null); setClassRequired(true); }} >Change class</button>
          <button className="btn-ghost !px-4 !py-2" onClick={() => void signOut()}>Sign out</button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rust/40 bg-rust/10 p-3 text-sm text-rust">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Learners" value={dashboard.summary.learner_count} />
        <Metric label="Answers recorded" value={dashboard.summary.attempts_count} />
        <Metric label="Concepts with data" value={`${dashboard.summary.concepts_with_data} / ${dashboard.concepts.length}`} />
        <Metric label="Lowest class mastery" value={weakest == null ? "—" : `${Math.round(weakest * 100)}%`} />
      </section>

      <section className="notebook-card space-y-5">
        <div>
          <p className="annotation">Start here</p>
          <h2 className="font-display text-2xl">Concept mastery by class</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-graphite">
                <th className="pb-3 pr-4 font-medium">Concept</th>
                <th className="pb-3 pr-4 font-medium">Chapter</th>
                <th className="pb-3 pr-4 font-medium">Average mastery</th>
                <th className="pb-3 pr-4 font-medium">Learners below 55%</th>
                <th className="pb-3 font-medium">Due for review</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.concepts.map((concept) => (
                <tr key={concept.id} className="border-b border-rule/70 last:border-0">
                  <td className="py-3 pr-4 font-medium">{concept.label}</td>
                  <td className="py-3 pr-4 text-graphite">{concept.chapter}</td>
                  <td className="py-3 pr-4">
                    <div className="flex min-w-32 items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-rule/60">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.round((concept.averageMastery ?? 0) * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-graphite">
                        {concept.averageMastery == null ? "—" : `${Math.round(concept.averageMastery * 100)}%`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={concept.weakLearnerCount > 0 ? "font-semibold text-rust" : "text-graphite"}>
                      {concept.weakLearnerCount}
                    </span>
                  </td>
                  <td className="py-3 text-graphite">{concept.dueForReviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="notebook-card space-y-4">
        <div>
          <p className="annotation">Reasoning patterns</p>
          <h2 className="font-display text-2xl">Common misconceptions</h2>
        </div>
        {dashboard.misconceptions.length ? (
          <ul className="divide-y divide-rule">
            {dashboard.misconceptions.map((item) => (
              <li key={`${item.conceptId}-${item.label}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-graphite">{item.concept}</p>
                </div>
                <span className="chip">{item.occurrences} {item.occurrences === 1 ? "answer" : "answers"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-graphite">No misconception patterns have been recorded yet.</p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="notebook-card space-y-2 !p-5">
      <p className="text-sm text-graphite">{label}</p>
      <p className="font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
