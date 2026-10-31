import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

function isValidKey(supplied: string) {
  const expected = process.env.TEACHER_DASHBOARD_KEY;

  if (!expected || !supplied) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = typeof body.key === "string" ? body.key : "";

    if (!process.env.TEACHER_DASHBOARD_KEY) {
      return NextResponse.json(
        { error: "Teacher login is not configured." },
        { status: 503 }
      );
    }

    if (!isValidKey(key)) {
      return NextResponse.json(
        { error: "Incorrect teacher key." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("teacher_dashboard_key", key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/teacher",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid login request." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("teacher_dashboard_key", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/teacher",
    maxAge: 0,
  });

  return response;
}