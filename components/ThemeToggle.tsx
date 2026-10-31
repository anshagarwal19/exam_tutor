"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "sepia";

const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "sepia",
  sepia: "light",
};

const THEME_LABEL: Record<Theme, string> = {
  light: "day",
  dark: "night",
  sepia: "reading",
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.classList.contains("dark") ? "dark" : root.classList.contains("sepia") ? "sepia" : "light");
  }, []);

  function toggle() {
    const next = NEXT_THEME[theme];
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("sepia", next === "sepia");
    try {
      localStorage.setItem("cc-theme", next);
    } catch {}
  }

  const nextTheme = NEXT_THEME[theme];

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${THEME_LABEL[nextTheme]} mode`}
      title={`Switch to ${THEME_LABEL[nextTheme]} mode`}
      className="chip inline-flex items-center justify-center text-graphite hover:text-ink"
    >
      {theme === "light" ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : theme === "dark" ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8m-8 3h7" />
        </svg>
      )}
    </button>
  );
}
