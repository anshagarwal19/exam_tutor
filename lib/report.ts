import { CONCEPTS, CONCEPT_BY_ID } from "./concepts";
import { CHAPTERS, Resource } from "./config";
import type { MasteryMap } from "./bkt";
import type { Attempt } from "./store";

const DAY = 86400000;

// Turns mastery and attempts into the report: chart data, strengths, gaps, priorities, roadmap, resources.
export function buildReport(mastery: MasteryMap, attempts: Attempt[], examDate: string) {
  const p = (id: string) => mastery[id]?.p ?? 0.2;
  const tested = CONCEPTS.filter((c) => (mastery[c.id]?.attempts ?? 0) > 0);
  const dependents = (id: string) => CONCEPTS.filter((c) => c.prereqs.includes(id)).length;

  // Chapter averages for the radar chart (null = not tested yet).
  const chapters = Object.keys(CHAPTERS).map((chapter) => {
    const inCh = tested.filter((c) => c.chapter === chapter);
    const value = inCh.length ? inCh.reduce((s, c) => s + p(c.id), 0) / inCh.length : null;
    return { label: chapter, value };
  });

  const strengths = tested.filter((c) => p(c.id) >= 0.75).sort((a, b) => p(b.id) - p(a.id));
  const gaps = tested
    .filter((c) => p(c.id) < 0.55)
    .sort((a, b) => p(a.id) - p(b.id) || dependents(b.id) - dependents(a.id));

  // Focus: weakest tested concepts first. A concept that other concepts depend on ranks higher on ties.
  const focusPool = gaps.length ? gaps : tested.filter((c) => p(c.id) < 0.85).sort((a, b) => p(a.id) - p(b.id));
  const focus = focusPool.slice(0, 3);

  // Misconceptions counted across all wrong answers.
  const counts: Record<string, number> = {};
  attempts.forEach((a) => {
    if (a.misconception) counts[a.misconception] = (counts[a.misconception] ?? 0) + 1;
  });
  const topMisconceptions = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Time left decides how many weeks the roadmap spans.
  const daysLeft = examDate ? Math.ceil((new Date(examDate).getTime() - Date.now()) / DAY) : null;
  const weeks = daysLeft && daysLeft > 0 ? Math.max(1, Math.min(4, Math.floor(daysLeft / 7))) : 2;

  const roadmap = focus.map((c, i) => {
    const fix = c.remediation;
    return {
      week: `Week ${Math.min(i + 1, weeks)}`,
      concept: c.label,
      chapter: c.chapter,
      mastery: p(c.id),
      steps: [
        `Fix the gap: ${fix}`,
        `Practise 5 questions on ${c.label} in the ${c.chapter} simulator.`,
        `Re-test ${c.label}. Target 75% or more before moving on.`,
      ],
    };
  });

  const resourceChapters = [...new Set(focus.map((c) => c.chapter))];
  const resources: (Resource & { chapter: string })[] = resourceChapters.flatMap((ch) =>
    (CHAPTERS[ch]?.resources ?? []).map((r) => ({ ...r, chapter: ch }))
  );

  return {
    hasData: tested.length > 0,
    chapters,
    concepts: CONCEPTS.map((c) => ({
      label: c.label,
      value: (mastery[c.id]?.attempts ?? 0) > 0 ? p(c.id) : null,
    })),
    strengths: strengths.map((c) => CONCEPT_BY_ID[c.id].label),
    gaps: gaps.map((c) => CONCEPT_BY_ID[c.id].label),
    focus: focus.map((c) => c.label),
    topMisconceptions,
    daysLeft,
    roadmap,
    resources,
    tested: tested.length,
    total: CONCEPTS.length,
  };
}
