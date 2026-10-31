import { CHAPTERS } from "@/lib/config";
import { CONCEPTS } from "@/lib/concepts";
import type { State } from "@/lib/store";

export const ALL_CHAPTERS = "All chapters";

export type MockTestAssignment = {
  id: string;
  weekday: string;
  date: string;
  chapter: string;
  title: string;
  isComprehensive: boolean;
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

export function getWeeklyMockAssignments(state: State, now = new Date()): MockTestAssignment[] {
  const chapters = Object.keys(CHAPTERS);
  const chapterMastery = chapters.map((chapter, chapterIndex) => {
    const practiced = CONCEPTS.filter(
      (concept) =>
        concept.chapter === chapter &&
        (state.mastery[concept.id]?.attempts ?? 0) > 0,
    );
    const average = practiced.length
      ? practiced.reduce((sum, concept) => sum + state.mastery[concept.id].p, 0) / practiced.length
      : Number.POSITIVE_INFINITY;
    return { chapter, average, chapterIndex };
  });
  const weakestChapters = [...chapterMastery]
    .sort((a, b) => a.average - b.average || a.chapterIndex - b.chapterIndex)
    .map(({ chapter }) => chapter);
  const weekdayChapters = [
    ...chapters,
    weakestChapters[0],
    weakestChapters[1] ?? weakestChapters[0],
  ];
  const monday = getWeekStart(now);
  const weekKey = localDateKey(monday);

  return WEEKDAYS.map((weekday, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const isComprehensive = index === 6;
    const chapter = isComprehensive ? ALL_CHAPTERS : weekdayChapters[index];
    return {
      id: `${weekKey}:${weekday.toLowerCase()}`,
      weekday,
      date: localDateKey(date),
      chapter,
      title: isComprehensive ? "Sunday comprehensive mock test" : `${weekday} · ${chapter}`,
      isComprehensive,
    };
  });
}
