/**
 * Mini-quizzes of the experiments. Questions are built from the same model
 * functions the simulation uses, so a number in a question always matches
 * what the student sees on screen. Graded through services/grading.
 */
import { makeChoiceQuiz, type Exercise, type OptionLabel, type Question, type QuizWork } from '@/services/grading';

export type { OptionLabel, Question, QuizWork };

export function makeQuizExercise(experiment: string, questions: Question[]): Exercise<QuizWork> {
  return makeChoiceQuiz({
    id: `experiment:${experiment}`,
    type: 'experiment',
    instructions: { key: `experiments.${experiment}.short` },
    expectedResult: { key: 'experiments.ui.quizExpected' },
    questions,
    noAnswer: { key: 'experiments.ui.noAnswer' },
  });
}

export const text = (t: string | number): OptionLabel => ({ text: String(t) });
export const key = (k: string, params?: Record<string, string | number>): OptionLabel => ({ key: k, params });

/** Rounds for display: 3.456 → "3.5", 120 → "120". */
export const fmt = (n: number, digits = 1) => {
  const r = Number(n.toFixed(digits));
  return Number.isInteger(r) ? String(r) : r.toFixed(digits);
};
