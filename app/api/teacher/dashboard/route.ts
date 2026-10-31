import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CONCEPTS, CONCEPT_BY_ID } from "@/lib/concepts";
import { getDb } from "@/lib/supabase";

function matchesSecret(supplied: string | undefined, expected: string): boolean {
  if (!supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function hasTeacherAccess(req: NextRequest, expected: string): boolean {
  const cookieSecret = req.cookies.get("teacher_dashboard_key")?.value;
  const authorization = req.headers.get("authorization") ?? "";
  const suppliedBearer = authorization.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  return matchesSecret(cookieSecret, expected) || matchesSecret(suppliedBearer, expected);
}

export async function GET(req: NextRequest) {
  const teacherKey = process.env.TEACHER_DASHBOARD_KEY;
  if (!teacherKey) {
    return NextResponse.json({ error: "Teacher dashboard access is not configured." }, { status: 503 });
  }
  if (!hasTeacherAccess(req, teacherKey)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const classCode = req.nextUrl.searchParams.get("classCode")?.trim().toUpperCase();
  if (!classCode || !/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(classCode)) {
    return NextResponse.json({ error: "A valid classCode is required." }, { status: 400 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Teacher data requires database configuration." }, { status: 503 });
    }

    const [gapsResult, misconceptionsResult, summaryResult] = await Promise.all([
      db.from("teacher_concept_gaps").select("*").eq("class_code", classCode),
      db
        .from("teacher_misconception_patterns")
        .select("*")
        .eq("class_code", classCode)
        .order("occurrences", { ascending: false })
        .limit(50),
      db.from("teacher_dashboard_summary").select("*").eq("class_code", classCode).maybeSingle(),
    ]);

    const queryError = gapsResult.error ?? misconceptionsResult.error ?? summaryResult.error;
    if (queryError) {
      console.error("Could not load teacher dashboard data.", queryError);
      return NextResponse.json({ error: "Could not load teacher dashboard data." }, { status: 503 });
    }

    const masteryByConcept = new Map((gapsResult.data ?? []).map((row) => [row.concept_id, row]));
    const concepts = CONCEPTS.map((concept) => {
      const row = masteryByConcept.get(concept.id);
      return {
        id: concept.id,
        label: concept.label,
        chapter: concept.chapter,
        prereqs: concept.prereqs,
        learnerCount: row?.learner_count ?? 0,
        averageMastery: row?.average_mastery ?? null,
        weakLearnerCount: row?.weak_learner_count ?? 0,
        dueForReviewCount: row?.due_for_review_count ?? 0,
      };
    }).sort(
      (a, b) =>
        b.weakLearnerCount - a.weakLearnerCount ||
        (a.averageMastery ?? 0) - (b.averageMastery ?? 0),
    );

    return NextResponse.json(
      {
        classCode,
        summary: summaryResult.data ?? { learner_count: 0, attempts_count: 0, concepts_with_data: 0 },
        concepts,
        misconceptions: (misconceptionsResult.data ?? []).map((row) => ({
          conceptId: row.concept_id,
          concept: CONCEPT_BY_ID[row.concept_id]?.label ?? row.concept_id,
          label: row.misconception,
          occurrences: row.occurrences,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Teacher dashboard request failed.", error);
    return NextResponse.json({ error: "Teacher dashboard is temporarily unavailable." }, { status: 503 });
  }
}
