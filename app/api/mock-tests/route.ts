import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, isServerAuthConfigured } from "@/lib/auth-server";
import { CONCEPTS, CONCEPT_BY_ID } from "@/lib/concepts";
import { ALL_CHAPTERS } from "@/lib/mock-test-schedule";
import { QUESTIONS } from "@/lib/question-bank";
import type { MasterySnapshot, QuestionPrompt } from "@/lib/tutor-types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MOCK_TEST_LENGTH = 10;

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

function difficultyFor(mastery: number): 1 | 2 | 3 {
  if (mastery < 0.4) return 1;
  if (mastery < 0.75) return 2;
  return 3;
}

function validMastery(value: unknown): value is MasterySnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([id, row]) => {
    if (!Object.hasOwn(CONCEPT_BY_ID, id) || !row || typeof row !== "object") return false;
    const mastery = row as Record<string, unknown>;
    return typeof mastery.p === "number" && Number.isFinite(mastery.p) && mastery.p >= 0 && mastery.p <= 1;
  });
}

export async function POST(request: NextRequest) {
  const authenticatedId = await authenticatedUserId(request);
  if (isServerAuthConfigured() && !authenticatedId) {
    return NextResponse.json({ error: "Sign in before creating mock tests." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const { userId, chapter, mastery, excludedQuestionIds } = input;
  if (
    typeof userId !== "string" ||
    !UUID_PATTERN.test(userId) ||
    (authenticatedId && userId !== authenticatedId) ||
    typeof chapter !== "string" ||
    (chapter !== ALL_CHAPTERS && !CONCEPTS.some((concept) => concept.chapter === chapter)) ||
    (mastery !== undefined && !validMastery(mastery)) ||
    (excludedQuestionIds !== undefined &&
      (!Array.isArray(excludedQuestionIds) ||
        excludedQuestionIds.length > 200 ||
        excludedQuestionIds.some((id) => typeof id !== "string"))) ||
    (input.title !== undefined && (typeof input.title !== "string" || input.title.length > 100)) ||
    (input.assignmentId !== undefined &&
      (typeof input.assignmentId !== "string" || input.assignmentId.length > 100))
  ) {
    return NextResponse.json({ error: "Invalid mock test request." }, { status: 400 });
  }

  const excluded = new Set((excludedQuestionIds ?? []) as string[]);
  const availableConcepts = CONCEPTS.filter(
      (concept) =>
        (chapter === ALL_CHAPTERS || concept.chapter === chapter) &&
        QUESTIONS.some((question) => question.concept === concept.id),
  );
  const chapterNames = chapter === ALL_CHAPTERS
    ? shuffle([...new Set(availableConcepts.map((concept) => concept.chapter))])
    : [chapter];
  const conceptGroups = chapterNames.map((chapterName) =>
    shuffle(availableConcepts.filter((concept) => concept.chapter === chapterName)),
  );

  const selected: QuestionPrompt[] = [];
  const selectedIds = new Set<string>();
  let round = 0;
  while (selected.length < MOCK_TEST_LENGTH) {
    let addedThisRound = false;
    for (const group of conceptGroups) {
      if (selected.length >= MOCK_TEST_LENGTH) break;
      const concept = group[round % group.length];
      if (!concept) continue;
      const conceptMastery = (mastery as MasterySnapshot | undefined)?.[concept.id]?.p ?? 0.2;
      const desiredDifficulty = difficultyFor(conceptMastery);
      const allQuestions = QUESTIONS.filter(
        (question) => question.concept === concept.id && !selectedIds.has(question.id),
      );
      if (!allQuestions.length) continue;
      const unseen = allQuestions.filter((question) => !excluded.has(question.id));
      const pool = unseen.length ? unseen : allQuestions;
      const closest = Math.min(...pool.map((question) => Math.abs(question.difficulty - desiredDifficulty)));
      const calibrated = pool.filter((question) => Math.abs(question.difficulty - desiredDifficulty) === closest);
      const question = calibrated[Math.floor(Math.random() * calibrated.length)];
      if (!question) continue;
      selectedIds.add(question.id);
      selected.push({
        id: question.id,
        concept: question.concept,
        conceptLabel: concept.label,
        difficulty: question.difficulty,
        text: question.text,
        options: question.options,
      });
      addedThisRound = true;
    }
    if (!addedThisRound) break;
    round += 1;
  }

  if (selected.length < MOCK_TEST_LENGTH) {
    return NextResponse.json({ error: `Not enough questions are available for ${chapter}.` }, { status: 503 });
  }

  return NextResponse.json({
    testId: crypto.randomUUID(),
    chapter,
    title: typeof input.title === "string" ? input.title : `${chapter} mock test`,
    assignmentId: typeof input.assignmentId === "string" ? input.assignmentId : undefined,
    questions: selected,
  });
}
