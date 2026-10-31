"use client";

import { createContext, useContext } from "react";

export const LearnerGreetingContext = createContext<string | null>(null);

export function useLearnerGreeting() {
  return useContext(LearnerGreetingContext);
}
