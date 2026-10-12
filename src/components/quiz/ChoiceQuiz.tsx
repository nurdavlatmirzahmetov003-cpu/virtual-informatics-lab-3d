import { useMemo } from 'react';
import { QUIZ_OPTIONS, type QuizOption } from '@/data/hardware/anatomy';
import type { Exercise, QuizWork } from '@/services/grading';
import { QuizForm } from './QuizForm';

/**
 * Three-question a / b / c test whose texts follow the `…quiz.qN.{question,
 * a, b, c, explain}` locale layout (Anatomy and lab devices). `keyBase` is
 * the `…quiz` path. Mount with a `key` per device to reset it.
 */
export function ChoiceQuiz({ answers, keyBase, exercise }: { answers: readonly QuizOption[]; keyBase: string; exercise: Exercise<QuizWork> }) {
  const questions = useMemo(
    () =>
      answers.map((answer, i) => {
        const q = `${keyBase}.q${i + 1}`;
        return { prompt: `${q}.question`, options: QUIZ_OPTIONS.map((o) => `${q}.${o}`), correct: QUIZ_OPTIONS.indexOf(answer), explain: `${q}.explain` };
      }),
    [answers, keyBase],
  );
  return <QuizForm questions={questions} exercise={exercise} />;
}
