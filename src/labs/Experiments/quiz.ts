/**
 * Mini-quizzes of the experiments. Questions are built from the same model
 * functions the simulation uses, so a number in a question always matches
 * what the student sees on screen. Graded through services/grading.
 */
import type { Exercise, Feedback } from '@/services/grading';

/** An option is either a locale key or literal text (numbers, HEX codes…). */
export type OptionLabel = { key: string; params?: Record<string, string | number> } | { text: string };

export interface Question {
  id: string;
  prompt: Feedback;
  options: OptionLabel[];
  correct: number;
  /** Why the correct answer is right — shown after checking. */
  why: Feedback;
}

export interface QuizWork {
  answers: Record<string, number | null>;
}

const POINTS: Record<number, number[]> = { 1: [10], 2: [5, 5], 3: [4, 3, 3] };

export function makeQuizExercise(experiment: string, questions: Question[]): Exercise<QuizWork> {
  const points = POINTS[questions.length] ?? questions.map(() => 10 / questions.length);
  return {
    id: `experiment:${experiment}`,
    type: 'experiment',
    instructions: { key: `experiments.${experiment}.title` },
    expectedResult: { key: 'experiments.ui.quizExpected' },
    maxScore: 10,
    hints: [],
    gradingRules: questions.map((q, i) => ({
      id: q.id,
      points: points[i],
      label: q.prompt,
      evaluate: ({ answers }: QuizWork) => {
        const a = answers[q.id];
        if (a === null || a === undefined) return { passed: false, feedback: [{ key: 'experiments.ui.noAnswer' }] };
        return a === q.correct ? { passed: true } : { passed: false, feedback: [{ ...q.why }] };
      },
    })),
  };
}

export const text = (t: string | number): OptionLabel => ({ text: String(t) });
export const key = (k: string, params?: Record<string, string | number>): OptionLabel => ({ key: k, params });

/** Rounds for display: 3.456 → "3.5", 120 → "120". */
export const fmt = (n: number, digits = 1) => {
  const r = Number(n.toFixed(digits));
  return Number.isInteger(r) ? String(r) : r.toFixed(digits);
};
