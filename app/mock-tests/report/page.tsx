"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadState, MockTestReport } from "@/lib/store";

export default function MockTestReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<MockTestReport | null>(null);

  useEffect(() => {
    const reportId = new URLSearchParams(window.location.search).get("id");
    const found = loadState().mockTestReports?.find((item) => item.id === reportId);
    if (!found) {
      router.replace("/mock-tests");
      return;
    }
    setReport(found);
  }, [router]);

  if (!report) return null;
  const percentage = Math.round((report.score / report.total) * 100);
  const wrong = report.results.filter((result) => !result.correct);

  return (
    <div className="space-y-8 pt-6">
      <header className="notebook-card flex flex-wrap items-center justify-between gap-5">
        <div className="space-y-2">
          <p className="annotation">Completed {new Date(report.completedAt).toLocaleString()}</p>
          <h1 className="font-display text-3xl font-semibold">{report.title} report</h1>
          <p className="text-graphite">{wrong.length} question{wrong.length === 1 ? "" : "s"} to review</p>
        </div>
        <div className="text-center">
          <p className="font-display text-5xl font-semibold">{percentage}%</p>
          <p className="text-sm text-graphite">{report.score} / {report.total} correct</p>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Question-by-question performance</h2>
        {report.results.map((result, index) => (
          <article key={`${result.question.id}-${index}`} className="notebook-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="annotation">Question {index + 1} · {result.question.conceptLabel}</p>
              <span className={`chip ${result.correct ? "text-moss" : "text-rust"}`}>
                {result.correct ? "Correct" : "Review"}
              </span>
            </div>
            <h3 className="font-display text-xl">{result.question.text}</h3>
            <p className="text-sm">
              Your answer: <strong>{result.question.options[result.chosen]}</strong>
              · Correct answer: <strong>{result.question.options[result.answer]}</strong>
            </p>
            {!result.correct && result.explanation && <p className="text-sm text-graphite">{result.explanation}</p>}
            {!result.correct && result.misconception && (
              <p className="rounded-lg border-l-4 border-ember bg-ember/10 p-3 text-sm">{result.misconception}</p>
            )}
            <p className="text-xs text-graphite">Concept mastery after this answer: {Math.round(result.masteryAfter * 100)}%</p>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/mock-tests" className="btn-primary">Choose another mock test</Link>
        <button className="btn-ghost" onClick={() => router.push("/report")}>Open learning report</button>
      </div>
    </div>
  );
}
