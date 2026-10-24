import type { PieceKey } from '@/scenes/SetupStudio/assembly/assemblyRig';

/**
 * Timing of the living hero: a look assembles piece by piece, holds, then
 * leaves in reverse before the next look comes in. Pure, so it is tested
 * (scripts/hero.test.mjs) and the scene only samples it every frame.
 */
export const HERO_ORDER: readonly PieceKey[] = ['mat', 'monitorStand', 'monitor', 'pcCase', 'keyboard', 'mouse', 'speakers', 'headsetStand', 'headset'];

/** 0 = the hero setup is on the desk, 1 = the story's devices are. Written by LivingSetup, read every frame. */
export const heroPresence = { away: 0, look: 0, ready: false };

export const HERO_TIMING = {
  /** Gap between two pieces arriving. */
  stagger: 0.22,
  /** Flight of one piece. */
  fly: 0.75,
  /** How long the finished setup stays. */
  hold: 7.5,
  /** Gap between two pieces leaving, and the flight out. */
  leaveStagger: 0.09,
  leave: 0.45,
  /** Empty desk before the next look. */
  pause: 0.35,
} as const;

const T = HERO_TIMING;
const arrived = (T.stagger * (HERO_ORDER.length - 1)) + T.fly;
const leaving = arrived + T.hold;
const left = leaving + T.leaveStagger * (HERO_ORDER.length - 1) + T.leave;
/** Length of one look, seconds. */
export const LOOK_SECONDS = left + T.pause;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Lands with a small bounce, so a piece "clicks" into place. */
export function easeOutBack(x: number) {
  const c = 1.4;
  const u = x - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}
const easeIn = (x: number) => x * x * x;

/** Presence of one piece (0 gone … 1 in place, briefly above 1 on landing) at `t` seconds into a look. */
export function piecePresence(t: number, index: number) {
  const n = HERO_ORDER.length;
  if (t < leaving) return t < index * T.stagger ? 0 : easeOutBack(clamp01((t - index * T.stagger) / T.fly));
  // the last piece in leaves first
  const out = clamp01((t - leaving - (n - 1 - index) * T.leaveStagger) / T.leave);
  return 1 - easeIn(out);
}

/** Look number and seconds into it, for a clock running since the hero started. */
export function lookAt(clock: number, looks: number) {
  const i = Math.floor(clock / LOOK_SECONDS);
  return { look: ((i % looks) + looks) % looks, t: clock - i * LOOK_SECONDS };
}
