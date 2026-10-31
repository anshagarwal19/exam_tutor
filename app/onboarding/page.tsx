"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadState, saveState, initialMastery } from "@/lib/store";
import { CONCEPTS } from "@/lib/concepts";
import { DIAGNOSTIC_OPTIONS, DiagnosticLength } from "@/lib/config";
import { authenticatedFetch } from "@/lib/supabase-browser";

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Onboarding() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", board: "CBSE", classCode: "", examDate: "", minutesPerDay: 30 });
  const [length, setLength] = useState<DiagnosticLength>(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.examDate || form.examDate < localDateString(new Date())) {
      setError("Choose today or a future exam date.");
      return;
    }
    setSaving(true);
    const s = loadState();
    const profile = { ...form, classCode: form.classCode.trim().toUpperCase(), diagnosticLength: length };
    try {
      const response = await authenticatedFetch("/api/learners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: s.userId, ...profile }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(typeof body.error === "string" ? body.error : "Could not save class enrollment.");
      }
      s.profile = profile;
      s.mastery = initialMastery(CONCEPTS.map((c) => c.id));
      s.attempts = [];
      saveState(s);
      router.push("/diagnostic");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save class enrollment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 pt-8">
      <div className="space-y-2">
        <p className="annotation">Step 1 of 2</p>
        <h1 className="font-display text-4xl font-semibold">Let's find where you actually stand.</h1>
        <p className="text-graphite">Confidence matters as much as the answer. You get feedback after every question.</p>
      </div>

      <form onSubmit={submit} className="notebook-card space-y-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Full name</span>
          <input className="input" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Syllabus</span>
          <p className="input text-graphite">CBSE Class 10 Science · Physics units</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Class code</span>
          <input
            className="input"
            required
            minLength={2}
            maxLength={32}
            pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,31}"
            autoCapitalize="characters"
            placeholder="Ask your teacher for the class code"
            value={form.classCode}
            onChange={(e) => setForm({ ...form, classCode: e.target.value })}
          />
          <span className="text-xs text-graphite">This places your progress in your teacher's class overview.</span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Exam date</span>
          <input
            type="date"
            className="input"
            required
            min={localDateString(new Date())}
            value={form.examDate}
            onChange={(e) => {
              setForm({ ...form, examDate: e.target.value });
              setError("");
            }}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Diagnostic length</legend>
          <div className="grid grid-cols-2 gap-3">
            {DIAGNOSTIC_OPTIONS.map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setLength(n)}
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  length === n ? "border-accent bg-accent/10 ring-2 ring-accent/20" : "border-rule hover:border-ink/40"
                }`}
              >
                <span className="block font-display text-xl">{n} questions</span>
                <span className="text-xs text-graphite">{n === 5 ? "Quick accuracy check (about 5 min)" : "Deeper check (about 8 min)"}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-1.5">
          <span className="flex justify-between text-sm font-medium">
            Study time per day
            <span className="font-mono text-accent">
              {form.minutesPerDay >= 60
                ? `${Math.floor(form.minutesPerDay / 60)} hr${form.minutesPerDay >= 120 ? "s" : ""}${form.minutesPerDay % 60 ? ` ${form.minutesPerDay % 60} min` : ""}`
                : `${form.minutesPerDay} min`}
            </span>
          </span>
          <input
            type="range"
            min={10}
            max={360}
            step={5}
            value={form.minutesPerDay}
            onChange={(e) => setForm({ ...form, minutesPerDay: Number(e.target.value) })}
            className="w-full accent-accent"
          />
          <span className="flex justify-between text-xs text-graphite"><span>10 min</span><span>6 hours</span></span>
        </label>

        {error && <p role="alert" className="text-sm text-rust">{error}</p>}
        <button className="btn-primary w-full" disabled={saving}>{saving ? "Saving profile..." : "Begin diagnostic"}</button>
      </form>
    </div>
  );
}
