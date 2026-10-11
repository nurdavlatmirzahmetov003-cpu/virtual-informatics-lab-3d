import { makeChoiceQuiz, type Exercise, type QuizWork } from '@/services/grading';
import { anatomyItem } from '@/data/hardware/anatomy';
import { anatomyExercise } from '@/data/hardware/anatomyQuiz';
import { QUIZ_OPTIONS, type Device } from './devices';

/**
 * The three-question test of a lab device as a graded exercise. A device the
 * Computer Anatomy already teaches shares its test (`anatomy:<id>`), so a
 * result counts once wherever the student takes it.
 */
export function deviceExercise(device: Device): Exercise<QuizWork> | null {
  if (device.anatomy) return anatomyExercise(anatomyItem(device.anatomy));
  if (!device.full || !device.answers) return null;
  const base = `devices.${device.id}.quiz`;
  return makeChoiceQuiz({
    id: `device:${device.id}`,
    type: 'device',
    instructions: { key: 'tasks.deviceInstructions' },
    expectedResult: { key: 'tasks.quizExpected' },
    noAnswer: { key: 'anatomy.quiz.unanswered' },
    questions: device.answers.map((answer, i) => ({
      id: `q${i + 1}`,
      prompt: { key: `${base}.q${i + 1}.question` },
      options: QUIZ_OPTIONS.map((o) => ({ key: `${base}.q${i + 1}.${o}` })),
      correct: QUIZ_OPTIONS.indexOf(answer),
      why: { key: `${base}.q${i + 1}.explain` },
    })),
  });
}
