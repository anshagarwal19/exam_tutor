import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, isServerAuthConfigured } from "@/lib/auth-server";
import { CONCEPTS, CONCEPT_BY_ID } from "@/lib/concepts";
import { getDb } from "@/lib/supabase";
import type { MasterySnapshot } from "@/lib/tutor-types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validMastery(value: unknown): value is MasterySnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([conceptId, mastery]) =>
      Object.hasOwn(CONCEPT_BY_ID, conceptId) &&
      !!mastery &&
      typeof mastery === "object" &&
      typeof mastery.p === "number" &&
      Number.isFinite(mastery.p) &&
      mastery.p >= 0 &&
      mastery.p <= 1 &&
      typeof mastery.attempts === "number" &&
      Number.isInteger(mastery.attempts) &&
      mastery.attempts >= 0 &&
      (mastery.nextReview === null || typeof mastery.nextReview === "string"),
  );
}

async function dueReviews(userId: string, masterySnapshot?: MasterySnapshot) {
  const db = getDb();
  if (db) {
    const { data, error } = await db
      .from("mastery")
      .select("concept_id,p_known,next_review")
      .eq("user_id", userId)
      .lte("next_review", new Date().toISOString())
      .order("next_review", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      conceptId: row.concept_id,
      concept: CONCEPT_BY_ID[row.concept_id]?.label ?? row.concept_id,
      mastery: row.p_known,
      nextReview: row.next_review,
    }));
  }

  const now = Date.now();
  return CONCEPTS.flatMap((concept) => {
    const mastery = masterySnapshot?.[concept.id];
    if (!mastery?.nextReview || Date.parse(mastery.nextReview) > now) return [];
    return [{
      conceptId: concept.id,
      concept: concept.label,
      mastery: mastery.p,
      nextReview: mastery.nextReview,
    }];
  }).sort((a, b) => Date.parse(a.nextReview) - Date.parse(b.nextReview));
}

export async function GET(req: NextRequest) {
  const authenticatedId = await authenticatedUserId(req);
  if (isServerAuthConfigured() && !authenticatedId) return NextResponse.json({ error: "Sign in to load reviews." }, { status: 401 });
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId || !UUID_PATTERN.test(userId) || (authenticatedId && userId !== authenticatedId)) {
    return NextResponse.json({ error: "A valid userId is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ reviews: await dueReviews(userId) });
  } catch (error) {
    console.error("Could not load due reviews.", error);
    return NextResponse.json({ error: "Could not load scheduled reviews." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const authenticatedId = await authenticatedUserId(req);
  if (isServerAuthConfigured() && !authenticatedId) return NextResponse.json({ error: "Sign in to load reviews." }, { status: 401 });
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
  if (
    typeof input.userId !== "string" ||
    !UUID_PATTERN.test(input.userId) ||
    (authenticatedId && input.userId !== authenticatedId) ||
    !validMastery(input.mastery)
  ) {
    return NextResponse.json({ error: "A valid userId and mastery map are required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ reviews: await dueReviews(input.userId, input.mastery) });
  } catch (error) {
    console.error("Review scheduling failed.", error);
    return NextResponse.json({ error: "Review scheduling is temporarily unavailable." }, { status: 503 });
  }
}
