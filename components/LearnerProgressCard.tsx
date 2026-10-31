"use client";

import { useEffect, useState } from "react";
import MasteryRing from "@/components/MasteryRing";
import { CONCEPTS, CONCEPT_BY_ID } from "@/lib/concepts";
import { loadState, State } from "@/lib/store";

type Progress = {
  value: number;
  label: string;
  detail: string;
};

function getProgress(state: State): Progress {
  const practicedConcepts = CONCEPTS.filter(
    (concept) => (state.mastery[concept.id]?.attempts ?? 0) > 0,
  );
  const latestAttempt = state.attempts
    .filter((attempt) => attempt.conceptId && CONCEPT_BY_ID[attempt.conceptId])
    .reduce<(typeof state.attempts)[number] | null>(
      (latest, attempt) =>
        !latest || Date.parse(attempt.at) > Date.parse(latest.at) ? attempt : latest,
      null,
    );
  const latestConcept = latestAttempt?.conceptId
    ? CONCEPT_BY_ID[latestAttempt.conceptId]
    : undefined;

  if (latestConcept) {
    const chapterConcepts = practicedConcepts.filter(
      (concept) => concept.chapter === latestConcept.chapter,
    );
    const value =
      chapterConcepts.reduce((total, concept) => total + state.mastery[concept.id].p, 0) /
      chapterConcepts.length;
    return {
      value: Number.isFinite(value) ? value : 0,
      label: `${latestConcept.chapter} progress`,
      detail: `Last studied: ${latestConcept.label} · ${chapterConcepts.length} concept${chapterConcepts.length === 1 ? "" : "s"} practiced`,
    };
  }

  if (practicedConcepts.length > 0) {
    const value =
      practicedConcepts.reduce((total, concept) => total + state.mastery[concept.id].p, 0) /
      practicedConcepts.length;
    return {
      value,
      label: "Overall mastery",
      detail: `Across ${practicedConcepts.length} practiced concept${practicedConcepts.length === 1 ? "" : "s"}`,
    };
  }

  return {
    value: 0,
    label: "Not started",
    detail: "Your progress will appear here after your first answer.",
  };
}

export default function LearnerProgressCard() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(getProgress(loadState()));
  }, []);

  return (
    <div className="notebook-card flex flex-col items-center gap-4 py-10">
      {progress ? (
        <>
          <MasteryRing value={progress.value} label={progress.label} />
          <p className="annotation rotate-[-2deg] text-center">{progress.detail}</p>
        </>
      ) : (
        <div className="flex h-[18.5rem] flex-col items-center justify-center gap-5">
          <MasteryRing value={0} label="Loading progress" />
          <p className="annotation">Your learning progress</p>
        </div>
      )}
    </div>
  );
}
