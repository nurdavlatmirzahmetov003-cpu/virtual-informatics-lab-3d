import { makeChoiceQuiz, type Exercise, type QuizWork } from '@/services/grading';
import { TEARDOWNS, type TeardownId } from './teardowns';

export interface PartQuestion {
  id: string;
  /** The part asked about. */
  part: string;
  /** Parts whose "does" line is offered, in display order. */
  options: readonly string[];
  /** Index of the right option. */
  correct: number;
}

/**
 * "What does this part do?" for one teardown: three questions, each offers
 * the right function and two from other parts of the same device. The
 * choice is deterministic (same questions for everyone, gradeable offline);
 * the right answer moves between positions so there is no "always a".
 */
export function teardownQuestions(id: TeardownId): PartQuestion[] {
  const { parts, quiz } = TEARDOWNS[id];
  const n = parts.length;
  return quiz.map((part, qi) => {
    const at = parts.indexOf(part);
    const others = [parts[(at + 2) % n], parts[(at + n - 3) % n], parts[(at + 4) % n]].filter((p, i, a) => p !== part && a.indexOf(p) === i).slice(0, 2);
    const correct = (qi * 2 + 1) % 3; // 1, 0, 2
    const options = [...others];
    options.splice(correct, 0, part);
    return { id: `q${qi + 1}`, part, options, correct };
  });
}

export function teardownExercise(id: TeardownId): Exercise<QuizWork> {
  const base = `teardown.${id}.parts`;
  return makeChoiceQuiz({
    id: `teardown:${id}`,
    type: 'teardown',
    instructions: { key: 'tasks.teardownInstructions' },
    expectedResult: { key: 'tasks.quizExpected' },
    noAnswer: { key: 'anatomy.quiz.unanswered' },
    questions: teardownQuestions(id).map((q) => ({
      id: q.id,
      prompt: { key: `${base}.${q.part}.ask` },
      options: q.options.map((p) => ({ key: `${base}.${p}.does` })),
      correct: q.correct,
      why: { key: `${base}.${q.part}.text` },
    })),
  });
}
