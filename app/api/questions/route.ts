import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, isServerAuthConfigured } from "@/lib/auth-server";
import { CONCEPT_BY_ID } from "@/lib/concepts";
import { generateQuestion, QuestionSelection } from "@/lib/question-generator";
import type { MasterySnapshot } from "@/lib/tutor-types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validMasterySnapshot(value: unknown): value is MasterySnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([conceptId, mastery]) => {
    if (!Object.hasOwn(CONCEPT_BY_ID, conceptId) || !mastery || typeof mastery !== "object") return false;
    const row = mastery as Record<string, unknown>;
    return (
      typeof row.p === "number" &&
      Number.isFinite(row.p) &&
      row.p >= 0 &&
      row.p <= 1 &&
      typeof row.attempts === "number" &&
      Number.isInteger(row.attempts) &&
      row.attempts >= 0 &&
      (row.nextReview === null || typeof row.nextReview === "string")
    );
  });
}

export async function POST(req: NextRequest) {
  const authenticatedId = await authenticatedUserId(req);
  if (isServerAuthConfigured() && !authenticatedId) {
    return NextResponse.json({ error: "Sign in before requesting questions." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const { userId, conceptId, mode, excludedQuestionIds, coveredConceptIds, mastery } = input;
  if (
    typeof userId !== "string" ||
    !UUID_PATTERN.test(userId) ||
    (authenticatedId && userId !== authenticatedId) ||
    (conceptId !== undefined &&
      (typeof conceptId !== "string" || !Object.hasOwn(CONCEPT_BY_ID, conceptId))) ||
    (mode !== undefined && mode !== "diagnostic" && mode !== "practice") ||
    (excludedQuestionIds !== undefined &&
      (!Array.isArray(excludedQuestionIds) ||
        excludedQuestionIds.length > 200 ||
        excludedQuestionIds.some((id) => typeof id !== "string"))) ||
    (coveredConceptIds !== undefined &&
      (!Array.isArray(coveredConceptIds) ||
        coveredConceptIds.length > 100 ||
        coveredConceptIds.some((id) => typeof id !== "string" || !Object.hasOwn(CONCEPT_BY_ID, id)))) ||
    (mastery !== undefined && !validMasterySnapshot(mastery))
  ) {
    return NextResponse.json({ error: "Invalid question request." }, { status: 400 });
  }

  try {
    const selection: QuestionSelection = {
      mode: mode as QuestionSelection["mode"],
      conceptId: conceptId as string | undefined,
      excludedQuestionIds: excludedQuestionIds as string[] | undefined,
      coveredConceptIds: coveredConceptIds as string[] | undefined,
      mastery: mastery as MasterySnapshot | undefined,
    };
    const question = await generateQuestion(userId, selection);
    if (!question) {
      return NextResponse.json({ error: "No question is available for that concept." }, { status: 404 });
    }
    return NextResponse.json({ question });
  } catch (error) {
    console.error("Question selection failed.", error);
    return NextResponse.json({ error: "Question selection is temporarily unavailable." }, { status: 503 });
  }
}
