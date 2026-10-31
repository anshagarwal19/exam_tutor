import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, isServerAuthConfigured } from "@/lib/auth-server";
import { CONCEPT_BY_ID } from "@/lib/concepts";
import { QUESTION_BY_ID } from "@/lib/question-bank";
import { getDb } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLASS_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;

export async function POST(req: NextRequest) {
  const authenticatedId = await authenticatedUserId(req);
  if (isServerAuthConfigured() && !authenticatedId) {
    return NextResponse.json({ error: "Sign in to save learner data." }, { status: 401 });
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
  const classCode = typeof input.classCode === "string" ? input.classCode.trim().toUpperCase() : "";
  if (
    typeof input.userId !== "string" ||
    !UUID_PATTERN.test(input.userId) ||
    (authenticatedId && input.userId !== authenticatedId) ||
    typeof input.name !== "string" ||
    input.name.trim().length < 1 ||
    input.name.trim().length > 80 ||
    typeof input.board !== "string" ||
    input.board.length > 40 ||
    !CLASS_CODE_PATTERN.test(classCode) ||
    typeof input.examDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.examDate) ||
    (input.minutesPerDay !== undefined &&
      (typeof input.minutesPerDay !== "number" || !Number.isInteger(input.minutesPerDay) || input.minutesPerDay < 10 || input.minutesPerDay > 360)) ||
    (input.diagnosticLength !== undefined &&
      (input.diagnosticLength !== 5 && input.diagnosticLength !== 8)) ||
    (input.mastery !== undefined &&
      (!input.mastery || typeof input.mastery !== "object" || Array.isArray(input.mastery) ||
        Object.entries(input.mastery).some(([id, value]) => {
          if (!Object.hasOwn(CONCEPT_BY_ID, id) || !value || typeof value !== "object") return true;
          const row = value as Record<string, unknown>;
          return typeof row.p !== "number" || row.p < 0 || row.p > 1 ||
            typeof row.attempts !== "number" || !Number.isInteger(row.attempts) || row.attempts < 0 ||
            !(row.nextReview === null || typeof row.nextReview === "string");
        }))) ||
    (input.attempts !== undefined &&
      (!Array.isArray(input.attempts) || input.attempts.length > 2000 ||
        input.attempts.some((attempt) => {
          if (!attempt || typeof attempt !== "object") return true;
          const row = attempt as Record<string, unknown>;
          return typeof row.questionId !== "string" || !QUESTION_BY_ID[row.questionId] ||
            typeof row.chosen !== "number" || !Number.isInteger(row.chosen) ||
            typeof row.correct !== "boolean" ||
            typeof row.confidence !== "number" || row.confidence < 0 || row.confidence > 1 ||
            typeof row.reasoning !== "string" || row.reasoning.length > 2000 ||
            !(row.misconception === null || typeof row.misconception === "string") ||
            typeof row.at !== "string" || !Number.isFinite(Date.parse(row.at));
        }))) ||
    (input.mockTestReports !== undefined &&
      (!Array.isArray(input.mockTestReports) || input.mockTestReports.length > 100 ||
        input.mockTestReports.some((report) => {
          if (!report || typeof report !== "object") return true;
          const reportId = (report as Record<string, unknown>).id;
          return typeof reportId !== "string" || !reportId || reportId.length > 100;
        })))
  ) {
    return NextResponse.json({ error: "Invalid learner profile or class code." }, { status: 400 });
  }

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ persisted: false });

    const { error } = await db.from("learner_profiles").upsert({
      user_id: input.userId,
      display_name: input.name.trim(),
      board: input.board,
      class_code: classCode,
      exam_date: input.examDate,
      ...(isServerAuthConfigured() && input.minutesPerDay !== undefined ? { minutes_per_day: input.minutesPerDay } : {}),
      ...(isServerAuthConfigured() && input.diagnosticLength !== undefined ? { diagnostic_length: input.diagnosticLength } : {}),
    });
    if (error) {
      console.error("Could not save learner profile.", error);
      return NextResponse.json({ error: "Could not save class enrollment. Please try again." }, { status: 503 });
    }

    if (input.mastery && typeof input.mastery === "object") {
      const masteryRows = Object.entries(input.mastery).map(([concept_id, value]) => {
        const row = value as { p: number; nextReview: string | null };
        return { user_id: authenticatedId, concept_id, p_known: row.p, next_review: row.nextReview };
      });
      if (masteryRows.length) {
        const result = await db.from("mastery").upsert(masteryRows, { onConflict: "user_id,concept_id" });
        if (result.error) {
          console.error("Could not migrate learner mastery.", result.error);
          return NextResponse.json({ error: "Could not migrate your saved mastery." }, { status: 503 });
        }
      }
    }

    if (Array.isArray(input.attempts) && input.attempts.length) {
      const attempts = input.attempts.map((value) => {
        const row = value as {
          questionId: string; conceptId?: string; chosen: number; correct: boolean;
          confidence: number; reasoning: string; misconception: string | null; at: string;
        };
        const question = QUESTION_BY_ID[row.questionId];
        return {
          user_id: authenticatedId,
          question_id: row.questionId,
          concept_id: row.conceptId && Object.hasOwn(CONCEPT_BY_ID, row.conceptId) ? row.conceptId : question.concept,
          chosen: row.chosen,
          correct: row.correct,
          confidence: row.confidence,
          reasoning: row.reasoning,
          misconception: row.misconception,
          created_at: row.at,
        };
      });
      const result = await db.from("attempts").insert(attempts);
      if (result.error) {
        console.error("Could not migrate learner attempts.", result.error);
        return NextResponse.json({ error: "Could not migrate your saved answers." }, { status: 503 });
      }
    }

    if (Array.isArray(input.mockTestReports) && input.mockTestReports.length) {
      const reportRows = input.mockTestReports.map((report) => ({
        user_id: authenticatedId,
        report_id: (report as { id: string }).id,
        report_data: report,
      }));
      const result = await db.from("mock_test_reports").upsert(reportRows, { onConflict: "user_id,report_id" });
      if (result.error) {
        console.error("Could not migrate learner mock test reports.", result.error);
        return NextResponse.json({ error: "Could not migrate your mock test reports." }, { status: 503 });
      }
    }

    return NextResponse.json({ persisted: true });
  } catch (error) {
    console.error("Learner profile synchronization failed.", error);
    return NextResponse.json({ error: "Profile service is temporarily unavailable." }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const userId = await authenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Sign in to load learner data." }, { status: 401 });

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ persisted: false, profile: null, mastery: {}, attempts: [], mockTestReports: [] });

    const [profileResult, masteryResult, attemptsResult, reportsResult] = await Promise.all([
      db.from("learner_profiles").select("*").eq("user_id", userId).maybeSingle(),
      db.from("mastery").select("concept_id,p_known,next_review").eq("user_id", userId),
      db.from("attempts").select("question_id,concept_id,chosen,correct,confidence,reasoning,misconception,created_at").eq("user_id", userId).order("created_at", { ascending: true }).limit(2000),
      db.from("mock_test_reports").select("report_data").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    ]);
    const queryError = profileResult.error ?? masteryResult.error ?? attemptsResult.error ?? reportsResult.error;
    if (queryError) {
      console.error("Could not restore learner account data.", queryError);
      return NextResponse.json({ error: "Could not restore learner account data. Check that the latest Supabase schema has been applied." }, { status: 503 });
    }

    const attempts = (attemptsResult.data ?? []).map((row) => ({
      questionId: row.question_id,
      conceptId: row.concept_id,
      chosen: row.chosen,
      correct: row.correct,
      confidence: row.confidence ?? 0.5,
      reasoning: row.reasoning,
      misconception: row.misconception,
      at: row.created_at,
    }));
    const attemptCounts = new Map<string, number>();
    for (const attempt of attempts) {
      attemptCounts.set(attempt.conceptId, (attemptCounts.get(attempt.conceptId) ?? 0) + 1);
    }
    const mastery = Object.fromEntries((masteryResult.data ?? []).map((row) => [
      row.concept_id,
      { p: row.p_known, attempts: attemptCounts.get(row.concept_id) ?? 0, nextReview: row.next_review },
    ]));
    const profile = profileResult.data ? {
      name: profileResult.data.display_name,
      board: profileResult.data.board,
      classCode: profileResult.data.class_code,
      examDate: profileResult.data.exam_date,
      minutesPerDay: profileResult.data.minutes_per_day ?? 30,
      diagnosticLength: profileResult.data.diagnostic_length ?? 5,
    } : null;
    const mockTestReports = (reportsResult.data ?? []).map((row) => row.report_data);

    return NextResponse.json({ persisted: true, profile, mastery, attempts, mockTestReports });
  } catch (error) {
    console.error("Learner account restore failed.", error);
    return NextResponse.json({ error: "Learner account service is temporarily unavailable." }, { status: 503 });
  }
}
