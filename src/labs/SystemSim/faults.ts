/**
 * "Fix the broken computer": prepared faults. Each starts from the sound
 * build with one thing wrong; the student watches the symptoms, names the
 * cause and changes the build until it boots and survives a game.
 */
import type { Exercise, Feedback } from '@/services/grading';
import { GOOD_BUILD, changesBetween, type Build } from './build';
import { check } from './sim';

export const FAULT_IDS = ['ram', 'gpu', 'monitor', 'storage', 'cooler', 'psu'] as const;
export type FaultId = (typeof FAULT_IDS)[number];

/** The broken build of each fault. */
export const FAULTS: Readonly<Record<FaultId, Build>> = {
  ram: { ...GOOD_BUILD, ram: 0 },
  gpu: { ...GOOD_BUILD, cpu: 'intelF', gpu: 'none' },
  monitor: { ...GOOD_BUILD, monitor: 'board' },
  storage: { ...GOOD_BUILD, storage: 'none' },
  cooler: { ...GOOD_BUILD, cooler: 'none' },
  psu: { ...GOOD_BUILD, psu: 300 },
};

export interface FixWork {
  fault: FaultId;
  /** The cause the student named, or null. */
  diagnosis: FaultId | null;
  /** The build as the student left it. */
  build: Build;
}

const fb = (key: string, params?: Feedback['params']): Feedback => ({ key: `sim.feedback.${key}`, params });

export const FIX_EXERCISE: Exercise<FixWork> = {
  id: 'sim:fix',
  type: 'sim',
  instructions: { key: 'sim.task.instructions' },
  expectedResult: { key: 'sim.task.expected' },
  maxScore: 10,
  hints: [{ key: 'sim.task.hint' }],
  gradingRules: [
    {
      id: 'diagnosis',
      points: 4,
      label: fb('rule.diagnosis'),
      evaluate: (w) => (w.diagnosis === w.fault ? { passed: true } : { passed: false, feedback: [fb(w.diagnosis ? 'wrongCause' : 'noCause')] }),
    },
    {
      id: 'fixed',
      points: 4,
      label: fb('rule.fixed'),
      evaluate: (w) => {
        const d = check(w.build);
        if (d.healthy) return { passed: true };
        return { passed: false, feedback: [fb(d.post.outcome === 'desktop' ? `still.${d.game?.shutdown?.reason ?? 'unstable'}` : `still.${d.post.outcome}`)] };
      },
    },
    {
      id: 'minimal',
      points: 2,
      label: fb('rule.minimal'),
      // one change fixes every fault (two for the F-series CPU: either a card, or a CPU with graphics)
      evaluate: (w) => {
        const n = changesBetween(FAULTS[w.fault], w.build);
        const allowed = w.fault === 'gpu' ? 2 : 1;
        return n <= allowed ? { passed: true } : { passed: false, partial: Math.max(0, 1 - (n - allowed) / 3), feedback: [fb('tooMany', { n })] };
      },
    },
  ],
  isComplete: (w) => w.diagnosis === w.fault && check(w.build).healthy,
};

/** The next fault in the round (the page rotates through them). */
export const nextFault = (f: FaultId): FaultId => FAULT_IDS[(FAULT_IDS.indexOf(f) + 1) % FAULT_IDS.length];
