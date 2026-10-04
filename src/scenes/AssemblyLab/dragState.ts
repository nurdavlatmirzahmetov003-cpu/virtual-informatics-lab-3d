import { Vector3 } from 'three';
import { STEPS, TARGET_IDS, type StepId, type TargetId } from '@/labs/AssemblyLab';
import { SNAP, WRONG, targetPosition } from './layout';

/** Frame-to-frame drag info shared with the ghost guide (no React state per frame). */
export const dragState = { step: null as StepId | null, pos: new Vector3(), near: false, snap: false, moving: 0 };

/** A part this long after install is handed over to its installed twin. */
export const SETTLE_MS = 420;

const BOARD_TARGETS: readonly TargetId[] = ['mat', 'standoffs'];

/** Which target a release at `pos` means: the right one if close, another one if close to it, or none. */
export function resolveTarget(step: StepId, pos: Vector3, installed: readonly StepId[]): TargetId | null {
  const own = STEPS[step].target;
  if (pos.distanceTo(targetPosition(own, installed)) < SNAP) return own;
  const board = step === 'motherboard' || step === 'mountBoard';
  let best: { t: TargetId; d: number } | null = null;
  for (const t of TARGET_IDS) {
    if (t === own || (board && BOARD_TARGETS.includes(t))) continue;
    const d = pos.distanceTo(targetPosition(t, installed));
    if (d < WRONG && (!best || d < best.d)) best = { t, d };
  }
  return best?.t ?? null;
}
