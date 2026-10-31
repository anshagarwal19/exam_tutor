"use client";
// Client-side state. Survives refresh via localStorage. The server stores everything when Supabase is configured.
import { BKT, MasteryMap, masteryState } from "./bkt";
import type { DiagnosticLength } from "./config";

const KEY = "concept-compass:v1";
const ACCOUNT_KEY_PREFIX = `${KEY}:`;
let activeUserId: string | null = null;

export type Profile = {
  name: string;
  board: string;
  classCode: string;
  examDate: string;
  minutesPerDay: number;
  diagnosticLength: DiagnosticLength;
};

export type Attempt = {
  questionId: string;
  conceptId?: string;
  chosen: number;
  correct: boolean;
  confidence: number;
  reasoning: string;
  misconception: string | null;
  at: string;
};

export type MockTestResult = {
  question: {
    id: string;
    concept: string;
    conceptLabel?: string;
    difficulty: 1 | 2 | 3;
    text: string;
    options: string[];
  };
  chosen: number;
  correct: boolean;
  answer: number;
  explanation: string | null;
  misconception: string | null;
  masteryAfter: number;
};

export type MockTestReport = {
  id: string;
  chapter: string;
  title: string;
  assignmentId?: string;
  completedAt: string;
  score: number;
  total: number;
  results: MockTestResult[];
};

export type State = {
  userId: string;
  profile: Profile | null;
  mastery: MasteryMap;
  attempts: Attempt[];
  mockTestReports?: MockTestReport[];
};

export function activateUser(userId: string | null) {
  activeUserId = userId;
  if (!userId || typeof window === "undefined") return;

  const accountKey = `${ACCOUNT_KEY_PREFIX}${userId}`;
  if (localStorage.getItem(accountKey)) return;

  const legacy = localStorage.getItem(KEY);
  if (!legacy) return;
  try {
    const state = JSON.parse(legacy) as State;
    state.userId = userId;
    localStorage.setItem(accountKey, JSON.stringify(state));
    localStorage.removeItem(KEY);
  } catch (error) {
    console.error("Could not migrate local learner progress to the signed-in account.", error);
  }
}

function storageKey(userId?: string) {
  return activeUserId ? `${ACCOUNT_KEY_PREFIX}${activeUserId}` : userId ? `${ACCOUNT_KEY_PREFIX}${userId}` : KEY;
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function loadState(): State {
  if (typeof window === "undefined") return { userId: "", profile: null, mastery: {}, attempts: [] };
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) {
      const state = JSON.parse(raw) as State;
      if (state.profile && !state.profile.classCode) state.profile.classCode = "";
      return state;
    }
  } catch {}
  const fresh: State = { userId: activeUserId ?? makeId(), profile: null, mastery: {}, attempts: [] };
  localStorage.setItem(storageKey(fresh.userId), JSON.stringify(fresh));
  return fresh;
}

export function saveState(s: State) {
  localStorage.setItem(storageKey(s.userId), JSON.stringify(s));
}

export function initialMastery(conceptIds: string[]): MasteryMap {
  return Object.fromEntries(conceptIds.map((id) => [id, { p: BKT.pInit, attempts: 0, nextReview: null }]));
}

export { masteryState };
