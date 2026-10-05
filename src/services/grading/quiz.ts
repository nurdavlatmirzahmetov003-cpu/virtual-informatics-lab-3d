/**
 * Multiple-choice quizzes as ordinary graded exercises: one rule per
 * question, so a quiz gets the same report (score, time, errors, status,
 * "why") as a network or a circuit. Used by the experiments and the
 * Hardware Explorer device tests.
 */
import type { Exercise, Feedback } from './types';

/** An option is either a locale key or literal text (numbers, HEX codes…). */
export type OptionLabel = { key: string; params?: Record<string, string | number> } | { text: string };

export interface Question {
  id: string;
  prompt: Feedback;
  options: OptionLabel[];
  correct: number;
  /** Why the correct answer is right — shown when the answer is wrong. */
  why: Feedback;
}

export interface QuizWork {
  answers: Record<string, number | null>;
}

export interface ChoiceQuizSpec {
  id: string;
  type: string;
  instructions: Feedback;
  expectedResult: Feedback;
  questions: Question[];
  /** Feedback for an unanswered question. */
  noAnswer?: Feedback;
}

const POINTS: Record<number, number[]> = { 1: [10], 2: [5, 5], 3: [4, 3, 3] };
export const QUIZ_MAX_SCORE = 10;

export function makeChoiceQuiz(spec: ChoiceQuizSpec): Exercise<QuizWork> {
  const n = spec.questions.length;
  const points = POINTS[n] ?? spec.questions.map(() => QUIZ_MAX_SCORE / n);
  const noAnswer = spec.noAnswer ?? { key: 'grading.noAnswer' };
  return {
    id: spec.id,
    type: spec.type,
    instructions: spec.instructions,
    expectedResult: spec.expectedResult,
    maxScore: QUIZ_MAX_SCORE,
    hints: [],
    gradingRules: spec.questions.map((q, i) => ({
      id: q.id,
      points: points[i],
      label: q.prompt,
      evaluate: ({ answers }: QuizWork) => {
        const a = answers[q.id];
        if (a === null || a === undefined) return { passed: false, feedback: [noAnswer] };
        return a === q.correct ? { passed: true } : { passed: false, feedback: [{ ...q.why }] };
      },
    })),
  };
}
