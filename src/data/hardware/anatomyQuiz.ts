import { makeChoiceQuiz, type Exercise, type QuizWork } from '@/services/grading';
import { QUIZ_OPTIONS, type AnatomyItem } from './anatomy';

/** The three-question device test of the Hardware Explorer as a graded exercise. */
export function anatomyExercise(item: AnatomyItem): Exercise<QuizWork> {
  const base = `anatomy.items.${item.id}.quiz`;
  return makeChoiceQuiz({
    id: `anatomy:${item.id}`,
    type: 'anatomy',
    instructions: { key: 'tasks.anatomyInstructions' },
    expectedResult: { key: 'tasks.quizExpected' },
    noAnswer: { key: 'anatomy.quiz.unanswered' },
    questions: item.answers.map((answer, i) => ({
      id: `q${i + 1}`,
      prompt: { key: `${base}.q${i + 1}.question` },
      options: QUIZ_OPTIONS.map((o) => ({ key: `${base}.q${i + 1}.${o}` })),
      correct: QUIZ_OPTIONS.indexOf(answer),
      why: { key: `${base}.q${i + 1}.explain` },
    })),
  });
}
