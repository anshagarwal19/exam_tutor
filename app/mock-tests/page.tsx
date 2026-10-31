"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CHAPTERS } from "@/lib/config";
import { CONCEPTS } from "@/lib/concepts";
import { getWeeklyMockAssignments, localDateKey, MockTestAssignment } from "@/lib/mock-test-schedule";
import { loadState, MockTestReport } from "@/lib/store";

export default function MockTestsPage() {
  const [reports, setReports] = useState<MockTestReport[]>([]);
  const [assignments, setAssignments] = useState<MockTestAssignment[]>([]);

  useEffect(() => {
    const state = loadState();
    setReports([...(state.mockTestReports ?? [])].reverse());
    setAssignments(getWeeklyMockAssignments(state));
  }, []);

  return (
    <div className="space-y-10 pt-6">
      <header className="space-y-2">
        <p className="annotation">Your weekly exam-prep assignments</p>
        <h1 className="font-display text-4xl font-semibold">Weekly mock tests</h1>
        <p className="max-w-2xl text-graphite">
          Complete one 10-question chapter test each day from Monday to Saturday. On Sunday, take a 10-question mixed test covering the full syllabus. Your answers update your learner model and create a report.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <p className="annotation">Monday–Sunday</p>
          <h2 className="font-display text-2xl">This week’s assignment plan</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const completed = reports.some((report) => report.assignmentId === assignment.id);
            const isToday = assignment.date === localDateKey(new Date());
            const params = new URLSearchParams({
              chapter: assignment.chapter,
              title: assignment.title,
              assignmentId: assignment.id,
            });
            return (
              <article
                key={assignment.id}
                className={`notebook-card flex flex-col gap-3 ${assignment.isComprehensive ? "border-accent/60 bg-accent/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="annotation">{assignment.weekday} · {assignment.date}</p>
                    <h3 className="mt-1 font-display text-xl">{assignment.chapter}</h3>
                  </div>
                  <span className="chip">{completed ? "Completed" : isToday ? "Today" : "10 questions"}</span>
                </div>
                <p className="text-sm text-graphite">
                  {assignment.isComprehensive
                    ? "A mixed assignment with questions from every chapter."
                    : `Chapter practice for ${assignment.chapter}.`}
                </p>
                <Link
                  href={`/mock-tests/take?${params.toString()}`}
                  className="btn-primary mt-auto self-start"
                >
                  {completed ? "Retake assignment" : assignment.isComprehensive ? "Start Sunday test" : "Start assignment"}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="annotation">Extra practice</p>
          <h2 className="font-display text-2xl">Choose a chapter</h2>
        </div>
        {Object.keys(CHAPTERS).map((chapter) => {
          const conceptCount = CONCEPTS.filter((concept) => concept.chapter === chapter).length;
          return (
            <article key={chapter} className="notebook-card flex flex-col gap-4">
              <div>
                <p className="annotation">{conceptCount} concepts</p>
                <h2 className="font-display text-2xl">{chapter}</h2>
                <p className="text-sm text-graphite">10 adaptive questions with a simulator for each question.</p>
              </div>
              <Link
                href={`/mock-tests/take?chapter=${encodeURIComponent(chapter)}`}
                className="btn-primary mt-auto self-start"
              >
                Start {chapter} test
              </Link>
            </article>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Your previous mock tests</h2>
        {reports.length === 0 ? (
          <div className="notebook-card text-sm text-graphite">Your completed mock test reports will appear here.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/mock-tests/report?id=${encodeURIComponent(report.id)}`}
                className="notebook-card flex flex-wrap items-center justify-between gap-3 transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="font-display text-lg">{report.chapter}</p>
                  <p className="text-sm text-graphite">{new Date(report.completedAt).toLocaleString()}</p>
                </div>
                <span className="chip">{report.score}/{report.total} · {Math.round((report.score / report.total) * 100)}%</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
