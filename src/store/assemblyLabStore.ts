import { create } from 'zustand';
import {
  ASSEMBLY_EXERCISE, isComplete, newAssembly, nextStep, place, type AssemblyState, type StepId, type TargetId,
} from '@/labs/AssemblyLab';
import { playSfx } from '@/lib/audio/sfx';
import { grade, startAttempt, takeHint, type Attempt, type GradeReport } from '@/services/grading';
import { useProgressStore } from './progressStore';

export type MessageTone = 'info' | 'ok' | 'warn' | 'hint';

export interface LabMessage {
  key: string;
  params?: Record<string, string>;
  tone: MessageTone;
}

interface AssemblyLabState {
  assembly: AssemblyState;
  attempt: Attempt;
  report: GradeReport | null;
  /** Step whose part is being carried. */
  dragging: StepId | null;
  /** Step the hint pointed at (its ghost is shown). */
  hinted: StepId | null;
  message: LabMessage;
  /** performance.now() of each install — drives the snap animation hand-over. */
  installedAt: Partial<Record<StepId, number>>;
  /** Last drop result, for the target flash (ok = green, else red). */
  flash: { target: TargetId; ok: boolean; at: number } | null;
  /** When the PC was switched on. */
  bootAt: number | null;
  /**
   * A game plays the lab (0.37 «PC build race»): every drop is reported to
   * it as a move, and a finished build is not graded as the lab's task.
   */
  onDrop: ((step: StepId, at: TargetId | null) => void) | null;
  startDrag: (step: StepId) => void;
  endDrag: () => void;
  drop: (step: StepId, at: TargetId | null) => void;
  hint: () => void;
  reset: () => void;
  /** Starts a game session: a fresh bench whose drops go to `onDrop` (null ends it). */
  playGame: (onDrop: ((step: StepId, at: TargetId | null) => void) | null) => void;
  /** Restart the clock (the scene finished loading; loading time is not the student's). */
  startClock: () => void;
}

function initial() {
  return {
    assembly: newAssembly(),
    attempt: startAttempt(ASSEMBLY_EXERCISE.id),
    report: null,
    dragging: null,
    hinted: null,
    message: { key: 'pcLab.msg.start', tone: 'info' as const },
    installedAt: {},
    flash: null,
    bootAt: null,
    onDrop: null,
  };
}

/**
 * Assembly lab session. The 3D scene and the panel share it; every rule is
 * delegated to labs/AssemblyLab (order, validation) and services/grading.
 */
export const useAssemblyLabStore = create<AssemblyLabState>()((set, get) => ({
  ...initial(),
  startDrag: (step) => {
    if (get().report) return;
    playSfx('pick');
    set({ dragging: step });
  },
  endDrag: () => set({ dragging: null }),
  drop: (step, at) => {
    const s = get();
    if (s.report) return;
    const r = place(s.assembly, step, at);
    s.onDrop?.(step, at);
    const now = performance.now();
    const outcome = r.event.outcome;
    const tone: MessageTone = outcome === 'installed' ? 'ok' : outcome === 'miss' || outcome === 'done' ? 'info' : 'warn';
    const patch: Partial<AssemblyLabState> = { assembly: r.state, dragging: null, message: { ...r.message, tone } };
    if (outcome === 'installed') {
      patch.installedAt = { ...s.installedAt, [step]: now };
      patch.flash = { target: at!, ok: true, at: now };
      if (s.hinted === step) patch.hinted = null;
      playSfx('snap');
    } else if (outcome === 'order' || outcome === 'slot') {
      patch.flash = { target: at!, ok: false, at: now };
      playSfx('error');
    }
    set(patch);
    if (outcome === 'installed' && isComplete(r.state) && s.onDrop) {
      set({ bootAt: now + 700, message: { key: 'pcLab.msg.boot', tone: 'ok' } });
      window.setTimeout(() => playSfx('boot'), 700);
    } else if (outcome === 'installed' && isComplete(r.state)) {
      const { report, attempt } = grade(ASSEMBLY_EXERCISE, r.state, s.attempt);
      useProgressStore.getState().record(report);
      set({ report, attempt, bootAt: now + 700, message: { key: 'pcLab.msg.boot', tone: 'ok' } });
      window.setTimeout(() => playSfx('boot'), 700);
    }
  },
  hint: () => {
    const s = get();
    if (s.report) return;
    const step = nextStep(s.assembly.installed);
    if (!step) return;
    // asking again about the same step repeats the hint without charging twice
    const attempt = s.hinted === step ? s.attempt : takeHint(s.attempt, ASSEMBLY_EXERCISE);
    set({ attempt, hinted: step, message: { key: `pcLab.hint.${step}`, tone: 'hint' } });
  },
  reset: () => set(initial()),
  playGame: (onDrop) => set({ ...initial(), onDrop }),
  startClock: () => {
    const s = get();
    if (s.assembly.log.length === 0 && !s.report) set({ attempt: { ...s.attempt, startedAt: Date.now() } });
  },
}));
