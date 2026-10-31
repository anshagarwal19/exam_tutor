import type { Question } from "./question-bank";

// Rule-based misconception detection on the student's written reasoning.
// Upgrade path: send {question, reasoning, wrongOption} to an LLM with the misconception list
// and keep these regex rules as a fast fallback.
export function detectMisconception(q: Question, reasoning: string) {
  if (!reasoning || reasoning.trim().length < 3) {
    return { label: "No reasoning given", fix: "Write one line on how you got your answer. It's how we find the real gap." };
  }
  const hit = q.misconceptions.find((m) => m.pattern.test(reasoning));
  return hit ? { label: hit.label, fix: hit.fix } : { label: "Unclassified error", fix: "Re-read the question's sign and unit conventions, then try a similar one." };
}
