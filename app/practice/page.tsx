"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CONCEPT_BY_ID } from "@/lib/concepts";
import { loadState, saveState, State } from "@/lib/store";
import { masteryState } from "@/lib/bkt";
import type { AnswerFeedback, QuestionPrompt } from "@/lib/tutor-types";
import QuestionSimulator from "@/components/QuestionSimulator";
import { authenticatedFetch } from "@/lib/supabase-browser";

type DueReview = { conceptId: string; nextReview: string };
const FOCUSED_PRACTICE_LENGTH = 8;

async function getError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export default function Practice() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [question, setQuestion] = useState<QuestionPrompt | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0.5);
  const [reasoning, setReasoning] = useState("");
  const [result, setResult] = useState<AnswerFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isReview, setIsReview] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [focusedAnswers, setFocusedAnswers] = useState(0);

  const pickQuestion = useCallback(async (learner: State, requestedConceptId?: string) => {
    setLoading(true);
    setError("");
    setQuestion(null);
    setChosen(null);
    setConfidence(0.5);
    setReasoning("");
    setResult(null);

    try {
      let dueReview: DueReview | undefined;
      if (!requestedConceptId) {
        const reviewResponse = await authenticatedFetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: learner.userId, mastery: learner.mastery }),
        });
        if (!reviewResponse.ok) throw new Error(await getError(reviewResponse, "Could not load review schedule."));
        const reviews = (await reviewResponse.json()) as { reviews: DueReview[] };
        dueReview = reviews.reviews[0];
      }

      const response = await authenticatedFetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: learner.userId,
          mode: "practice",
          conceptId: requestedConceptId ?? dueReview?.conceptId,
          excludedQuestionIds: learner.attempts.slice(-100).map((attempt) => attempt.questionId),
          mastery: learner.mastery,
        }),
      });
      if (!response.ok) throw new Error(await getError(response, "Could not select the next question."));
      const body = (await response.json()) as { question: QuestionPrompt };
      setQuestion(body.question);
      setIsReview(!requestedConceptId && Boolean(dueReview));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not select the next question.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const learner = loadState();
    if (!learner.profile) {
      router.replace("/onboarding");
      return;
    }
    const requestedConceptId = new URLSearchParams(window.location.search).get("concept");
    const focusedConceptId =
      requestedConceptId && Object.hasOwn(CONCEPT_BY_ID, requestedConceptId) ? requestedConceptId : undefined;
    setSelectedConceptId(focusedConceptId ?? null);
    setFocusedAnswers(0);
    setState(learner);
    void pickQuestion(learner, focusedConceptId);
  }, [pickQuestion, router]);

  async function submit() {
    if (!state || !question || chosen === null) return;
    setBusy(true);
    setError("");
    try {
      const response = await authenticatedFetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: state.userId,
          questionId: question.id,
          chosen,
          confidence,
          reasoning,
          currentP: state.mastery[question.concept]?.p ?? 0.2,
        }),
      });
      if (!response.ok) throw new Error(await getError(response, "Could not check this answer."));
      const data = (await response.json()) as AnswerFeedback;
      const next: State = {
        ...state,
        mastery: {
          ...state.mastery,
          [question.concept]: {
            p: data.newP,
            attempts: (state.mastery[question.concept]?.attempts ?? 0) + 1,
            nextReview: data.nextReview,
          },
        },
        attempts: [
          ...state.attempts,
          {
            questionId: question.id,
            conceptId: question.concept,
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
      if (selectedConceptId) setFocusedAnswers((count) => count + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check this answer.");
    } finally {
      setBusy(false);
    }
  }

  if (!state) return null;
  if (loading || !question) {
    return (
      <div className="mx-auto max-w-xl space-y-4 pt-16 text-center">
        <p className="annotation">{loading ? "Finding your next question" : "Practice unavailable"}</p>
        <p className="text-graphite">{loading ? "Checking due reviews and your current concept mastery..." : error}</p>
        {!loading && (
          <button className="btn-primary" onClick={() => void pickQuestion(state, selectedConceptId ?? undefined)}>
            Try again
          </button>
        )}
      </div>
    );
  }

  const concept = CONCEPT_BY_ID[question.concept];
  const p = state.mastery[question.concept]?.p ?? 0.2;

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-2">
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="annotation">
              {selectedConceptId
                ? `Focused practice · ${Math.min(focusedAnswers + (result ? 0 : 1), FOCUSED_PRACTICE_LENGTH)} of ${FOCUSED_PRACTICE_LENGTH}`
                : isReview
                  ? "Scheduled spaced review"
                  : "Adaptive practice · weakest concept"}
            </p>
            <h1 className="font-display text-3xl font-semibold">{concept?.label}</h1>
            <p className="text-sm text-graphite">{concept?.chapter} · difficulty {question.difficulty}</p>
          </div>
          <span className="chip capitalize">{masteryState(p)} · {Math.round(p * 100)}%</span>
        </div>

        <div className="notebook-card space-y-5">
          <h2 className="font-display text-xl leading-snug">{question.text}</h2>
          <div className="grid gap-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                disabled={!!result}
                onClick={() => setChosen(index)}
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  chosen === index ? "border-accent bg-accent/10" : "border-rule bg-surface hover:border-ink/40"
                } ${result && index === result.answer ? "!border-moss !bg-moss/10" : ""} ${
                  result && chosen === index && !result.correct ? "!border-rust !bg-rust/10" : ""
                }`}
              >
                <span className="mr-3 font-mono">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>

          {!result && (
            <>
              <label className="block space-y-1">
                <span className="flex justify-between text-sm text-graphite">
                  <span>How sure are you?</span><span className="font-mono">{Math.round(confidence * 100)}%</span>
                </span>
                <input type="range" min={0} max={1} step={0.05} value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} className="w-full accent-accent" />
              </label>
              <textarea className="input min-h-[88px]" placeholder="Explain your reasoning. We use this to identify misconceptions." value={reasoning} onChange={(event) => setReasoning(event.target.value)} />
              <button className="btn-primary w-full" disabled={chosen === null || reasoning.trim().length < 3 || busy} onClick={() => void submit()}>
                {busy ? "Checking..." : "Check"}
              </button>
            </>
          )}

          {error && <p role="alert" className="text-sm text-rust">{error}</p>}

          {result && (
            <div className="space-y-3">
              <p className={`font-display text-xl ${result.correct ? "text-moss" : "text-rust"}`}>
                {result.correct ? "Correct. Mastery updated." : "Not quite. Mastery updated."}
              </p>
              <p className="text-sm text-graphite">
                {concept?.label}: now at {Math.round(result.newP * 100)}%. Next review {new Date(result.nextReview).toLocaleDateString()}.
              </p>
              {result.misconception && (
                <div className="rounded-md border-l-4 border-ember bg-ember/10 p-3 text-sm">
                  <p className="font-medium text-ember">{result.misconception.label}</p>
                  <p>{result.misconception.fix}</p>
                </div>
              )}
              {selectedConceptId && focusedAnswers >= FOCUSED_PRACTICE_LENGTH && (
                <p className="rounded-lg bg-moss/10 p-3 text-sm text-moss">
                  Topic set complete: you answered {FOCUSED_PRACTICE_LENGTH} questions on {concept?.label}.
                </p>
              )}
              <div className="flex gap-3">
                {selectedConceptId && focusedAnswers >= FOCUSED_PRACTICE_LENGTH ? (
                  <button className="btn-primary flex-1" onClick={() => router.push("/skill-map")}>
                    Back to skill map
                  </button>
                ) : (
                  <button
                    className="btn-primary flex-1"
                    disabled={loading}
                    onClick={() => void pickQuestion(state, selectedConceptId ?? undefined)}
                  >
                    {loading ? "Finding..." : selectedConceptId ? "Next question in this topic" : "Next question"}
                  </button>
                )}
                <button className="btn-ghost" onClick={() => router.push("/report")}>Report</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <QuestionSimulator key={question.id} conceptId={question.concept} questionId={question.id} questionText={question.text} />
      </section>
    </div>
  );
}
