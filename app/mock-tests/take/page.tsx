"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuestionSimulator from "@/components/QuestionSimulator";
import { CONCEPT_BY_ID } from "@/lib/concepts";
import { loadState, MockTestReport, MockTestResult, saveState, State } from "@/lib/store";
import type { AnswerFeedback, QuestionPrompt } from "@/lib/tutor-types";
import { authenticatedFetch } from "@/lib/supabase-browser";

type TestData = {
  testId: string;
  chapter: string;
  title: string;
  assignmentId?: string;
  questions: QuestionPrompt[];
};

async function responseError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export default function TakeMockTestPage() {
  const router = useRouter();
  const [learner, setLearner] = useState<State | null>(null);
  const [test, setTest] = useState<TestData | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>([]);
  const [reasonings, setReasonings] = useState<string[]>([]);
  const [graded, setGraded] = useState<MockTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const startTest = useCallback(async (
    state: State,
    chapter: string,
    title?: string,
    assignmentId?: string,
  ) => {
    setLoading(true);
    setError("");
    try {
      const response = await authenticatedFetch("/api/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: state.userId,
          chapter,
          title,
          assignmentId,
          mastery: state.mastery,
          excludedQuestionIds: state.attempts.slice(-100).map((attempt) => attempt.questionId),
        }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Could not create this mock test."));
      const data = (await response.json()) as TestData;
      setTest(data);
      setAnswers(Array(data.questions.length).fill(null));
      setReasonings(Array(data.questions.length).fill(""));
      setIndex(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create this mock test.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const state = loadState();
    if (!state.profile) {
      router.replace("/onboarding");
      return;
    }
    setLearner(state);
    const chapter = new URLSearchParams(window.location.search).get("chapter");
    const title = new URLSearchParams(window.location.search).get("title") ?? undefined;
    const assignmentId = new URLSearchParams(window.location.search).get("assignmentId") ?? undefined;
    if (!chapter) {
      router.replace("/mock-tests");
      return;
    }
    void startTest(state, chapter, title, assignmentId);
  }, [router, startTest]);

  async function submitAnswer() {
    if (!learner || !test || answers[index] === null || reasonings[index].trim().length < 3) {
      setError("Choose an answer and add a short reason before submitting.");
      return;
    }
    if (graded[index]) return;

    setBusy(true);
    setError("");
    try {
      const question = test.questions[index];
      const chosen = answers[index];
      if (chosen === null) throw new Error("Choose an answer before submitting.");
      const response = await authenticatedFetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: learner.userId,
          questionId: question.id,
          chosen,
          confidence: 0.5,
          reasoning: reasonings[index],
          currentP: learner.mastery[question.concept]?.p ?? 0.2,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Could not grade this answer."));
      const feedback = (await response.json()) as AnswerFeedback;
      const updated: State = {
        ...learner,
        mastery: {
          ...learner.mastery,
          [question.concept]: {
            p: feedback.newP,
            attempts: (learner.mastery[question.concept]?.attempts ?? 0) + 1,
            nextReview: feedback.nextReview,
          },
        },
        attempts: [
          ...learner.attempts,
          {
            questionId: question.id,
            conceptId: question.concept,
            chosen,
            correct: feedback.correct,
            confidence: 0.5,
            reasoning: reasonings[index],
            misconception: feedback.misconception?.label ?? null,
            at: new Date().toISOString(),
          },
        ],
      };
      const result: MockTestResult = {
        question,
        chosen,
        correct: feedback.correct,
        answer: feedback.answer,
        explanation: feedback.explanation,
        misconception: feedback.misconception?.label ?? null,
        masteryAfter: feedback.newP,
      };
      const results = [...graded, result];
      setGraded(results);
      saveState(updated);
      setLearner(updated);

      if (results.length === test.questions.length) {
        const report: MockTestReport = {
          id: test.testId,
          chapter: test.chapter,
          title: test.title,
          assignmentId: test.assignmentId,
          completedAt: new Date().toISOString(),
          score: results.filter((item) => item.correct).length,
          total: results.length,
          results,
        };
        saveState({
          ...updated,
          mockTestReports: [...(updated.mockTestReports ?? []), report],
        });
        const syncResponse = await authenticatedFetch("/api/learners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: updated.userId,
            ...updated.profile,
            mockTestReports: [report],
          }),
        });
        if (!syncResponse.ok) {
          const syncMessage = await responseError(syncResponse, "Could not sync your mock test report.");
          setError(`Your report is saved on this device, but cloud sync failed: ${syncMessage}`);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not grade this answer.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="pt-16 text-center text-graphite">Building your chapter mock test…</p>;
  }
  if (!learner || !test) {
    return (
      <div className="mx-auto max-w-xl space-y-4 pt-16 text-center">
        <p role="alert" className="text-rust">{error || "Mock test unavailable."}</p>
        <button className="btn-ghost" onClick={() => router.push("/mock-tests")}>Back to mock tests</button>
      </div>
    );
  }

  const question = test.questions[index];
  const concept = CONCEPT_BY_ID[question.concept];
  const chosen = answers[index];
  const reasoning = reasonings[index] ?? "";
  const result = graded[index];
  const testComplete = graded.length === test.questions.length;

  return (
    <div className="space-y-6 pt-6">
      <header className="space-y-2">
        <p className="annotation">{test.chapter} · 10-question mock test</p>
        <h1 className="font-display text-3xl font-semibold">{test.title}</h1>
        <div className="flex items-center justify-between text-sm text-graphite">
          <span>Question {index + 1} of {test.questions.length}</span>
          <span>{graded.filter((item) => item.correct).length} correct so far</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-rule">
          <div className="h-full bg-accent transition-all" style={{ width: `${((index + 1) / test.questions.length) * 100}%` }} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="notebook-card space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-graphite">
            <span className="chip">Difficulty {question.difficulty}</span>
            <span>{concept?.label}</span>
          </div>
          <h2 className="font-display text-2xl leading-snug">{question.text}</h2>
          <div className="grid gap-2">
            {question.options.map((option, optionIndex) => (
              <button
                key={optionIndex}
                type="button"
                disabled={Boolean(result)}
                onClick={() => setAnswers((current) => current.map((value, i) => i === index ? optionIndex : value))}
                className={`rounded-lg border px-4 py-3 text-left ${
                  chosen === optionIndex ? "border-accent bg-accent/10" : "border-rule bg-surface hover:border-ink/40"
                }`}
              >
                <span className="mr-3 font-mono">{String.fromCharCode(65 + optionIndex)}.</span>{option}
              </button>
            ))}
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Brief reasoning (used for misconception feedback)</span>
            <textarea
              className="input min-h-[88px]"
              value={reasoning}
              disabled={Boolean(result)}
              onChange={(event) => setReasonings((current) => current.map((value, i) => i === index ? event.target.value : value))}
              placeholder="Explain how you reached your answer."
            />
          </label>
          {result && (
            <div
              role="status"
              className={`space-y-3 rounded-lg border-l-4 p-4 ${result.correct ? "border-moss bg-moss/10" : "border-rust bg-rust/10"}`}
            >
              <p className="font-semibold">{result.correct ? "Correct!" : "Not quite — review this answer."}</p>
              <p className="text-sm">
                Your answer: <strong>{question.options[result.chosen]}</strong>
              </p>
              <p className="text-sm">
                Correct answer: <strong>{question.options[result.answer]}</strong>
              </p>
              {!result.correct && (
                <p className="text-sm">
                  {result.misconception
                    ? `${result.misconception}${result.explanation ? ` ${result.explanation}` : ""}`
                    : result.explanation ?? "Review the concept and try to identify the step that led to this answer."}
                </p>
              )}
            </div>
          )}
          {error && <p role="alert" className="text-sm text-rust">{error}</p>}
          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              className="btn-ghost"
              disabled={index === 0 || busy}
              onClick={() => { setError(""); setIndex((current) => current - 1); }}
            >
              Previous
            </button>
            {!result ? (
              <button
                type="button"
                className="btn-primary"
                disabled={chosen === null || reasoning.trim().length < 3 || busy}
                onClick={() => void submitAnswer()}
              >
                {busy ? "Checking answer…" : "Submit answer"}
              </button>
            ) : index < test.questions.length - 1 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => { setError(""); setIndex((current) => current + 1); }}
              >
                Next question
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                disabled={!testComplete}
                onClick={() => router.push(`/mock-tests/report?id=${encodeURIComponent(test.testId)}`)}
              >
                View test report
              </button>
            )}
          </div>
        </section>

        <QuestionSimulator key={question.id} conceptId={question.concept} questionId={question.id} questionText={question.text} />
      </div>
    </div>
  );
}
