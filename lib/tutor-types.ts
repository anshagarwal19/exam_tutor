export type QuestionPrompt = {
  id: string;
  concept: string;
  difficulty: 1 | 2 | 3;
  text: string;
  options: string[];
  conceptLabel?: string;
};

export type AnswerFeedback = {
  correct: boolean;
  concept: string;
  conceptId: string;
  answer: number;
  newP: number;
  nextReview: string;
  misconception: { label: string; fix: string } | null;
  explanation: string | null;
};

export type MasterySnapshot = Record<
  string,
  { p: number; attempts: number; nextReview: string | null }
>;
