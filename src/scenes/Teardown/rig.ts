/**
 * Shared state of one teardown view: the timeline value shown in 3D
 * (animated toward `goal` every frame), the selected part, and listeners for
 * the DOM controls. Mutable on purpose — the canvas reads it every frame
 * without React re-renders; the UI subscribes and re-renders only when the
 * active step or the selection changes.
 */
import { createContext, useSyncExternalStore } from 'react';
import { activeIndex, stepAt } from '@/lib/teardown/timeline';

export interface TeardownRig {
  /** Timeline value drawn now (0 assembled … 1 apart). */
  shown: number;
  /** Where `shown` is heading. */
  goal: number;
  /** Timeline units per second (slower for "play all"). */
  rate: number;
  count: number;
  selected: string | null;
  /** Snapshot for the DOM: changes only when the step, active part or selection changes. */
  snapshot: { step: number; active: number; selected: string | null };
  listeners: Set<() => void>;
}

export function createRig(count: number): TeardownRig {
  return { shown: 0, goal: 0, rate: 0.5, count, selected: null, snapshot: { step: 0, active: -1, selected: null }, listeners: new Set() };
}

/** Recomputes the DOM snapshot; tells subscribers only when it changed. */
export function publish(rig: TeardownRig) {
  const step = stepAt(rig.shown, rig.count);
  const active = activeIndex(rig.shown, rig.count);
  const s = rig.snapshot;
  if (s.step === step && s.active === active && s.selected === rig.selected) return;
  rig.snapshot = { step, active, selected: rig.selected };
  rig.listeners.forEach((l) => l());
}

export function useRigSnapshot(rig: TeardownRig) {
  return useSyncExternalStore(
    (l) => {
      rig.listeners.add(l);
      return () => rig.listeners.delete(l);
    },
    () => rig.snapshot,
  );
}

export const RigContext = createContext<TeardownRig | null>(null);
