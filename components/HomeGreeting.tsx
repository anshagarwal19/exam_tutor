"use client";

import { useEffect, useState } from "react";
import { useLearnerGreeting } from "@/lib/learner-greeting";
import { loadState } from "@/lib/store";

export default function HomeGreeting() {
  const authenticatedName = useLearnerGreeting();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(loadState().profile?.name || authenticatedName);
  }, [authenticatedName]);

  if (!name) return null;

  return (
    <p className="annotation pb-3 text-xl" role="status">
      Hello, {name}!
    </p>
  );
}
