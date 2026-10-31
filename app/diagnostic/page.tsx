"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CONCEPT_BY_ID } from "@/lib/concepts";
import { loadState, saveState, State } from "@/lib/store";
import { masteryState } from "@/lib/bkt";
import type { AnswerFeedback, QuestionPrompt } from "@/lib/tutor-types";
import QuestionSimulator from "@/components/QuestionSimulator";
import { authenticatedFetch } from "@/lib/supabase-browser";

export default function Diagnostic() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [current, setCurrent] = useState<QuestionPrompt | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0.5);
  const [reasoning, setReasoning] = useState("");
  const [result, setResult] = useState<AnswerFeedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [error, setError] = useState("");
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [coveredConcepts, setCoveredConcepts] = useState<Set<string>>(new Set());

  const total = state?.profile?.diagnosticLength ?? 5;

  useEffect(() => {
    const s = loadState();
    if (!s.profile) {
      router.replace("/onboarding");
      return;
    }
    setState(s);
    void loadNextQuestion(s, [], []);
  }, [router]);

  async function loadNextQuestion(s: State, questionIds: string[], conceptIds: string[]) {
    setLoadingQuestion(true);
    setError("");
    setCurrent(null);
    try {
      const response = await authenticatedFetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: s.userId,
          mode: "diagnostic",
          excludedQuestionIds: questionIds,
          coveredConceptIds: conceptIds,
          mastery: s.mastery,
        }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(typeof body.error === "string" ? body.error : "Could not select the next question.");
      }
      const body = (await response.json()) as { question: QuestionPrompt };
      setCurrent(body.question);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not select the next question.");
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function submit() {
    if (!state || !current || chosen === null) return;
    setBusy(true);
    setError("");
    const currentP = state.mastery[current.concept]?.p ?? 0.2;
    try {
      const response = await authenticatedFetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: state.userId, questionId: current.id, chosen, confidence, reasoning, currentP }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(typeof body.error === "string" ? body.error : "Could not check this answer.");
      }
      const data = (await response.json()) as AnswerFeedback;
      const next: State = {
        ...state,
        mastery: {
          ...state.mastery,
          [current.concept]: {
            p: data.newP,
            attempts: (state.mastery[current.concept]?.attempts ?? 0) + 1,
            nextReview: data.nextReview,
          },
        },
        attempts: [
          ...state.attempts,
          {
          questionId: current.id,
          conceptId: current.concept,
          chosen,
          correct: data.correct,
          confidence,
          reasoning,
          misconception: data.misconception?.label ?? null,
          at: new Date().toISOString(),
          },
        ],
      };
      saveState(next);
      setState(next);
      setResult(data);
      setAnswered(new Set([...answered, current.id]));
      setCoveredConcepts(new Set([...coveredConcepts, current.concept]));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check this answer.");
    } finally {
      setBusy(false);
    }
  }

  async function continueNext() {
    if (!state) return;
    setResult(null);
    setChosen(null);
    setReasoning("");
    setConfidence(0.5);
    if (answered.size >= total) return router.push("/report");
    await loadNextQuestion(state, [...answered], [...coveredConcepts]);
  }

  if (!state) return null;
  if (!current) {
    return (
      <div className="mx-auto max-w-xl space-y-4 pt-16 text-center">
        <p className="annotation">{loadingQuestion ? "Finding your next question" : "Diagnostic test"}</p>
        <p className="text-graphite">{loadingQuestion ? "Selecting a question for your syllabus and current mastery..." : error}</p>
        {!loadingQuestion && <button className="btn-primary" onClick={() => void loadNextQuestion(state, [...answered], [...coveredConcepts])}>Try again</button>}
      </div>
    );
  }
  const concept = CONCEPT_BY_ID[current.concept];
  const progress = answered.size / total;

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-6 pt-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="min-w-0 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-graphite">
            <span>Question {Math.min(answered.size + 1, total)} of {total}</span>
            <span className="annotation !text-base">{concept?.chapter}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-rule">
            <motion.div className="h-full bg-accent" animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="notebook-card space-y-6"
          >
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-graphite">
            <span className="rounded bg-accent/10 px-2 py-0.5 text-accent">Difficulty {current.difficulty}</span>
            <span>{concept?.label}</span>
          </div>

          <h2 className="font-display text-2xl leading-snug">{current.text}</h2>

          <div className="grid gap-3">
            {current.options.map((opt, i) => (
              <button
                key={i}
                disabled={!!result}
                onClick={() => setChosen(i)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                  chosen === i ? "border-accent bg-accent/10 ring-2 ring-accent/20" : "border-rule bg-surface hover:border-ink/40"
                } ${result && i === result.answer ? "!border-moss !bg-moss/10" : ""} ${
                  result && chosen === i && i !== result.answer ? "!border-rust !bg-rust/10" : ""
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current font-mono text-sm">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          {!result && (
            <label className="block space-y-1">
              <span className="flex justify-between text-sm text-graphite">
                <span>How sure are you?</span>
                <span className="font-mono">{Math.round(confidence * 100)}%</span>
              </span>
              <input type="range" min={0} max={1} step={0.05} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full accent-accent" />
            </label>
          )}

          {!result && chosen !== null && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Show your reasoning in one or two lines</span>
              <textarea className="input min-h-[96px]" placeholder="e.g. Concave mirror, so f is negative because..." value={reasoning} onChange={(e) => setReasoning(e.target.value)} />
              <span className="annotation !text-base">Your wording tells us more than the letter you picked.</span>
            </label>
          )}

          {!result && (
            <button className="btn-primary w-full" disabled={chosen === null || reasoning.trim().length < 3 || busy} onClick={submit}>
              {busy ? "Checking..." : "Lock answer"}
            </button>
          )}
          {error && <p role="alert" className="text-sm text-rust">{error}</p>}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 rounded-lg border border-rule bg-surface p-5">
                <p className={`font-display text-xl ${result.correct ? "text-moss" : "text-rust"}`}>
                  {result.correct ? "Correct." : "Not quite."}
                </p>
                <p className="text-sm text-graphite">
                  {result.concept}: now at <span className="font-mono">{Math.round(result.newP * 100)}%</span>,{" "}
                  <span className="capitalize">{masteryState(result.newP)}</span>.
                </p>
                {result.misconception && (
                  <div className="rounded-md border-l-4 border-ember bg-ember/10 p-3">
                    <p className="text-sm font-medium text-ember">Likely gap: {result.misconception.label}</p>
                    <p className="text-sm">{result.misconception.fix}</p>
                  </div>
                )}
                <button className="btn-primary w-full" onClick={() => void continueNext()} disabled={loadingQuestion}>
                  {answered.size >= total ? "See my report" : "Next question"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </section>

      <aside className="min-w-0 lg:sticky lg:top-4">
        <QuestionSimulator key={current.id} conceptId={current.concept} questionId={current.id} questionText={current.text} />
      </aside>
    </div>
  );
}
