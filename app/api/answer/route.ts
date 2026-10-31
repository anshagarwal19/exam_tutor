import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, isServerAuthConfigured } from "@/lib/auth-server";
import { CONCEPT_BY_ID } from "@/lib/concepts";
import { QUESTION_BY_ID } from "@/lib/question-bank";
import { BKT, updateMastery, nextReviewDate } from "@/lib/bkt";
import { detectMisconception } from "@/lib/misconception";
import { getDb } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const authenticatedId = await authenticatedUserId(req);
  if (isServerAuthConfigured() && !authenticatedId) {
    return NextResponse.json({ error: "Sign in before submitting answers." }, { status: 401 });
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
  const { userId, questionId, chosen } = input;
  const confidence = input.confidence === undefined ? 0.5 : input.confidence;
  const reasoning = input.reasoning === undefined ? "" : input.reasoning;
  const currentP = input.currentP;
  const q = typeof questionId === "string" ? QUESTION_BY_ID[questionId] : undefined;

  if (
    typeof userId !== "string" ||
    !UUID_PATTERN.test(userId) ||
    (authenticatedId && userId !== authenticatedId) ||
    !q ||
    typeof chosen !== "number" ||
    !Number.isInteger(chosen) ||
    chosen < 0 ||
    chosen >= q.options.length ||
    typeof confidence !== "number" ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1 ||
    typeof reasoning !== "string" ||
    reasoning.trim().length < 3 ||
    reasoning.length > 2000 ||
    (currentP !== undefined &&
      (typeof currentP !== "number" || !Number.isFinite(currentP) || currentP < 0 || currentP > 1))
  ) {
    return NextResponse.json({ error: "Invalid answer submission." }, { status: 400 });
  }

  const correct = chosen === q.answer;
  const misconception = correct ? null : detectMisconception(q, reasoning);

  let newP: number;
  let nextReview: string;
  try {
    const db = getDb();
    if (db) {
      const { data, error } = await db.rpc("record_answer", {
        p_user_id: userId,
        p_question_id: q.id,
        p_concept_id: q.concept,
        p_chosen: chosen,
        p_correct: correct,
        p_confidence: confidence,
        p_reasoning: reasoning,
        p_misconception: misconception?.label ?? null,
        p_initial_mastery: BKT.pInit,
        p_transition: BKT.pT,
        p_guess: BKT.pG,
        p_slip: BKT.pS,
      });

      if (error) {
        console.error("Could not save answer and mastery.", error);
        return NextResponse.json({ error: "Could not save this answer. Please try again." }, { status: 503 });
      }

      const saved = Array.isArray(data) ? data[0] : data;
      if (!saved || typeof saved.new_p !== "number" || typeof saved.next_review !== "string") {
        console.error("Answer persistence returned an invalid result.");
        return NextResponse.json({ error: "Could not confirm the saved answer." }, { status: 503 });
      }
      newP = saved.new_p;
      nextReview = saved.next_review;
    } else {
      const priorP = typeof currentP === "number" ? currentP : BKT.pInit;
      newP = updateMastery(priorP, correct, confidence);
      nextReview = nextReviewDate(newP);
    }
  } catch (error) {
    console.error("Answer processing failed.", error);
    return NextResponse.json({ error: "Answer processing is temporarily unavailable." }, { status: 503 });
  }

  return NextResponse.json({
    correct,
    concept: CONCEPT_BY_ID[q.concept]?.label,
    conceptId: q.concept,
    answer: q.answer,
    newP,
    nextReview,
    misconception,
    explanation: correct ? null : misconception?.fix ?? null,
  });
}
