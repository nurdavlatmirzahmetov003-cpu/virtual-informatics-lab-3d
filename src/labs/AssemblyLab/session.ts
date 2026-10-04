/**
 * One assembly attempt as plain data. `place` is the only way to change it:
 * it decides whether a drop installs the part, is out of order, or is in the
 * wrong slot — and returns the explanation key the UI shows.
 */
import { STEPS, STEP_BY_TARGET, STEP_IDS, missingFor, type StepId, type TargetId } from './steps';

export type PlaceOutcome = 'installed' | 'order' | 'slot' | 'miss' | 'done';

export interface AssemblyEvent {
  step: StepId;
  outcome: PlaceOutcome;
  /** For "slot": the target the part was dropped on. */
  at?: TargetId;
  missing?: StepId[];
}

export interface AssemblyState {
  installed: StepId[];
  /** Dropped where another part belongs. */
  slotErrors: number;
  /** Right place, but something it depends on is not installed yet. */
  orderErrors: number;
  log: AssemblyEvent[];
}

export const newAssembly = (): AssemblyState => ({ installed: [], slotErrors: 0, orderErrors: 0, log: [] });

export interface PlaceResult {
  state: AssemblyState;
  event: AssemblyEvent;
  /** Locale key explaining what happened. */
  message: { key: string; params?: Record<string, string> };
}

/**
 * `at` is the target the part was released over (null = empty space, which
 * just returns the part to the tray and is not counted as a mistake).
 */
export function place(s: AssemblyState, step: StepId, at: TargetId | null): PlaceResult {
  const finish = (event: AssemblyEvent, key: string, patch: Partial<AssemblyState> = {}, params?: Record<string, string>): PlaceResult => {
    const state = { ...s, ...patch, log: [...s.log, event] };
    return { state, event, message: { key, params } };
  };
  if (s.installed.includes(step)) return { state: s, event: { step, outcome: 'done' }, message: { key: 'pcLab.msg.already' } };
  if (at === null) return { state: s, event: { step, outcome: 'miss' }, message: { key: 'pcLab.msg.miss' } };

  if (at !== STEPS[step].target) {
    return finish({ step, outcome: 'slot', at }, `pcLab.slot.${step}`, { slotErrors: s.slotErrors + 1 }, { where: STEP_BY_TARGET[at] });
  }
  const missing = missingFor(step, s.installed);
  if (missing.length) {
    return finish({ step, outcome: 'order', missing }, `pcLab.order.${step}`, { orderErrors: s.orderErrors + 1 }, { missing: missing.join(',') });
  }
  return finish({ step, outcome: 'installed' }, `pcLab.done.${step}`, { installed: [...s.installed, step] });
}

export const isComplete = (s: AssemblyState) => STEP_IDS.every((id) => s.installed.includes(id));
