import { NextResponse } from "next/server";
import { CONCEPTS } from "@/lib/concepts";
import { QUESTIONS } from "@/lib/question-bank";

export async function GET() {
  return NextResponse.json({
    syllabus: "CBSE Class 10 Science — Physics units",
    concepts: CONCEPTS,
    edges: CONCEPTS.flatMap((concept) =>
      concept.prereqs.map((prerequisite) => ({ source: prerequisite, target: concept.id })),
    ),
    questionCoverage: {
      concepts: new Set(QUESTIONS.map((question) => question.concept)).size,
      questions: QUESTIONS.length,
    },
  });
}
