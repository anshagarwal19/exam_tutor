// Bayesian Knowledge Tracing: one mastery probability per concept, updated after every answer.
// pL = P(known), pT = P(learn on this attempt), pG = P(guess right | unknown), pS = P(slip | known).

export const BKT = { pT: 0.15, pG: 0.25, pS: 0.1, pInit: 0.2 };

export function updateMastery(pL: number, correct: boolean, confidence = 0.5): number {
  const { pT, pG, pS } = BKT;
  const knownLikelihood = correct ? 1 - pS : pS;
  const unknownLikelihood = correct ? pG : 1 - pG;
  const evidenceWeight = 0.5 + confidence;
  const weightedKnown = knownLikelihood ** evidenceWeight;
  const weightedUnknown = unknownLikelihood ** evidenceWeight;
  const posterior =
    (pL * weightedKnown) / (pL * weightedKnown + (1 - pL) * weightedUnknown);
  return posterior + (1 - posterior) * pT;
}

// Spaced repetition: strong concepts come back later. Days until next review.
export function reviewIntervalDays(mastery: number): number {
  if (mastery >= 0.9) return 14;
  if (mastery >= 0.75) return 7;
  if (mastery >= 0.5) return 3;
  return 1;
}

export type MasteryMap = Record<string, { p: number; attempts: number; nextReview: string | null }>;

export function nextReviewDate(mastery: number): string {
  const d = new Date();
  d.setDate(d.getDate() + reviewIntervalDays(mastery));
  return d.toISOString();
}

export function masteryState(p: number): "unseen" | "weak" | "learning" | "mastered" {
  if (p === undefined) return "unseen";
  if (p >= 0.85) return "mastered";
  if (p >= 0.55) return "learning";
  return "weak";
}
