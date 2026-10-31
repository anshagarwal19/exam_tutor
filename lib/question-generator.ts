import { BKT } from "@/lib/bkt";
import { CONCEPTS, CONCEPT_BY_ID } from "@/lib/concepts";
import { QUESTIONS } from "@/lib/question-bank";
import type { Question } from "@/lib/question-bank";
import { getDb } from "@/lib/supabase";
import type { MasterySnapshot, QuestionPrompt } from "@/lib/tutor-types";

type MasteryRow = {
  concept_id: string;
  p_known: number;
  next_review: string | null;
};

type AttemptRow = {
  question_id: string;
};

export type GeneratedQuestion = QuestionPrompt & { conceptLabel: string };

export type QuestionSelection = {
  mode?: "diagnostic" | "practice";
  conceptId?: string;
  excludedQuestionIds?: string[];
  coveredConceptIds?: string[];
  mastery?: MasterySnapshot;
};

function calibratedDifficulty(mastery: number): Question["difficulty"] {
  if (mastery < 0.4) return 1;
  if (mastery < 0.75) return 2;
  return 3;
}

function withoutAnswer(question: Question): GeneratedQuestion {
  return {
    id: question.id,
    concept: question.concept,
    conceptLabel: CONCEPT_BY_ID[question.concept]?.label ?? question.concept,
    difficulty: question.difficulty,
    text: question.text,
    options: question.options,
  };
}

export async function generateQuestion(
  userId: string,
  selection: QuestionSelection = {},
): Promise<GeneratedQuestion | null> {
  const db = getDb();
  const masteryByConcept = new Map<string, MasteryRow>();
  const recentlyAnswered = new Set<string>();

  if (db) {
    const [masteryResult, attemptsResult] = await Promise.all([
      db.from("mastery").select("concept_id,p_known,next_review").eq("user_id", userId),
      db
        .from("attempts")
        .select("question_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (masteryResult.error) throw masteryResult.error;
    if (attemptsResult.error) throw attemptsResult.error;
    for (const row of (masteryResult.data ?? []) as MasteryRow[]) {
      masteryByConcept.set(row.concept_id, row);
    }
    for (const row of (attemptsResult.data ?? []) as AttemptRow[]) {
      recentlyAnswered.add(row.question_id);
    }
  }
  for (const id of selection.excludedQuestionIds ?? []) recentlyAnswered.add(id);

  const conceptsWithQuestions = CONCEPTS.filter((concept) =>
    QUESTIONS.some((question) => question.concept === concept.id),
  );
  const conceptsWithUnusedQuestions = conceptsWithQuestions.filter((concept) =>
    QUESTIONS.some((question) => question.concept === concept.id && !recentlyAnswered.has(question.id)),
  );
  const masteryFor = (conceptId: string) => {
    const stored = masteryByConcept.get(conceptId);
    if (stored) return stored;
    const local = selection.mastery?.[conceptId];
    return local
      ? { concept_id: conceptId, p_known: local.p, next_review: local.nextReview }
      : undefined;
  };
  const now = Date.now();
  const untestedConcepts = selection.mode === "diagnostic"
    ? conceptsWithQuestions.filter((concept) => !selection.coveredConceptIds?.includes(concept.id))
    : conceptsWithQuestions;
  const candidates = untestedConcepts.filter((concept) =>
    conceptsWithUnusedQuestions.some((unused) => unused.id === concept.id),
  );
  const targetPool = candidates.length ? candidates : conceptsWithUnusedQuestions.length
    ? conceptsWithUnusedQuestions
    : untestedConcepts;
  const targetConcept = selection.conceptId
    ? conceptsWithQuestions.find((concept) => concept.id === selection.conceptId)
    : [...targetPool].sort((a, b) => {
        const aMastery = masteryFor(a.id);
        const bMastery = masteryFor(b.id);
        const aDue = aMastery?.next_review && Date.parse(aMastery.next_review) <= now ? 0 : 1;
        const bDue = bMastery?.next_review && Date.parse(bMastery.next_review) <= now ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        return (aMastery?.p_known ?? BKT.pInit) - (bMastery?.p_known ?? BKT.pInit);
      })[0];

  if (!targetConcept) return null;

  const conceptMastery = masteryFor(targetConcept.id)?.p_known ?? BKT.pInit;
  const desiredDifficulty = calibratedDifficulty(conceptMastery);
  const conceptQuestions = QUESTIONS.filter((question) => question.concept === targetConcept.id);
  const availableQuestions = conceptQuestions.filter((question) => !recentlyAnswered.has(question.id));
  const pool = availableQuestions.length ? availableQuestions : conceptQuestions;
  const closestDifference = Math.min(...pool.map((question) => Math.abs(question.difficulty - desiredDifficulty)));
  const calibratedPool = pool.filter(
    (question) => Math.abs(question.difficulty - desiredDifficulty) === closestDifference,
  );
  const question = calibratedPool[Math.floor(Math.random() * calibratedPool.length)];

  return question ? withoutAnswer(question) : null;
}
