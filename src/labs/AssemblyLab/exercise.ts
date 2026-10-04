import type { Exercise } from '@/services/grading';
import { isComplete, type AssemblyState } from './session';
import { STEP_IDS } from './steps';

/**
 * Grading of the finished (or abandoned) build. Mistakes cost a little and
 * are capped, so a student who gets everything in the end still passes;
 * each hint costs a point (also capped).
 */
export const ASSEMBLY_EXERCISE: Exercise<AssemblyState> = {
  id: 'assembly',
  type: 'assembly',
  instructions: { key: 'pcLab.task.instructions' },
  expectedResult: { key: 'pcLab.task.expected' },
  maxScore: 10,
  hints: STEP_IDS.map((id) => ({ key: `pcLab.hint.${id}` })),
  hintPenalty: 1,
  retryPenalty: 0,
  maxPenalty: 3,
  // every part in place = done; earlier mistakes only lower the score
  isComplete: (s) => isComplete(s),
  gradingRules: [
    {
      id: 'complete',
      points: 5,
      label: { key: 'pcLab.rules.complete' },
      evaluate: (s) => {
        const missing = STEP_IDS.filter((id) => !s.installed.includes(id));
        return {
          passed: missing.length === 0,
          partial: (STEP_IDS.length - missing.length) / STEP_IDS.length,
          feedback: missing.length ? [{ key: 'pcLab.feedback.missing', params: { count: missing.length } }] : [],
        };
      },
    },
    {
      id: 'order',
      points: 3,
      label: { key: 'pcLab.rules.order' },
      evaluate: (s) => ({
        passed: s.orderErrors === 0,
        partial: Math.max(0, 1 - s.orderErrors / 4),
        feedback: s.orderErrors ? [{ key: 'pcLab.feedback.order', params: { count: s.orderErrors } }] : [],
      }),
    },
    {
      id: 'placement',
      points: 2,
      label: { key: 'pcLab.rules.placement' },
      evaluate: (s) => ({
        passed: s.slotErrors === 0,
        partial: Math.max(0, 1 - s.slotErrors / 4),
        feedback: s.slotErrors ? [{ key: 'pcLab.feedback.slot', params: { count: s.slotErrors } }] : [],
      }),
    },
  ],
};
