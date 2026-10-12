/**
 * Teardown timeline (V2-5a): one value `s` (0 assembled … 1 fully taken
 * apart) drives every part. Parts leave one after another in their teardown
 * order, so the slider, the step buttons and "play" all share this mapping.
 * Pure functions — no three.js — so they are unit tested.
 */
export type Vec3 = readonly [number, number, number];

/** Progress of part `index` (0 … count−1) at timeline value `s`: 0 installed … 1 out. */
export function partProgress(s: number, index: number, count: number): number {
  if (count <= 0) return 0;
  return clamp01(clamp01(s) * count - index);
}

/** Timeline value at which step `k` is complete (k parts out, 0 … count). */
export const stepValue = (k: number, count: number): number => (count <= 0 ? 0 : clamp01(Math.round(k) / count));

/** Number of parts fully out at `s` (the current step, 0 … count). */
export function stepAt(s: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count, Math.floor(clamp01(s) * count + 1e-6));
}

/** The part that is moving at `s`, else the last one out, else −1 (assembled). */
export function activeIndex(s: number, count: number): number {
  const v = clamp01(s) * count;
  if (v <= 1e-6) return -1;
  return Math.min(count - 1, Math.ceil(v - 1e-6) - 1);
}

/** Ease-in-out (cubic): parts accelerate out of their slot and settle softly. */
export function ease(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/**
 * Point at `t` (0 … 1) along a polyline that starts at the installed pose
 * (0, 0, 0) and runs through `path` (offsets in metres). Segments share the
 * time in proportion to their length, so the speed is even.
 */
export function pathPoint(path: readonly Vec3[], t: number): [number, number, number] {
  if (!path.length) return [0, 0, 0];
  const pts: Vec3[] = [[0, 0, 0], ...path];
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]));
  const total = lens.reduce((a, b) => a + b, 0);
  if (total === 0) return [...pts[pts.length - 1]] as [number, number, number];
  let d = clamp01(t) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] === 0 ? 1 : Math.min(1, d / lens[i]);
      const a = pts[i];
      const b = pts[i + 1];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    d -= lens[i];
  }
  return [...pts[pts.length - 1]] as [number, number, number];
}

/**
 * Moves the shown value toward the goal at `rate` timeline units per second
 * (one part ≈ `rate × count` s). Reduced motion jumps straight to the goal.
 */
export function approach(shown: number, goal: number, dt: number, rate: number, reduced: boolean): number {
  if (reduced) return goal;
  const step = rate * Math.min(dt, 0.1);
  return Math.abs(goal - shown) <= step ? goal : shown + Math.sign(goal - shown) * step;
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Waypoints of a typical removal: pull `out` of the slot, rise `clear`
 * metres above the higher of the two ends, travel over, set down at `to`.
 * With `clear` 0 a part dropped out from underneath glides at that height.
 */
export function route(out: Vec3, to: Vec3, clear = 0.08): Vec3[] {
  const y = Math.max(out[1], to[1]) + clear;
  return [out, [out[0], y, out[2]], [to[0], y, to[2]], to];
}

/** Offset that takes a part from `from` (installed) to `to` (rest). */
export const rel = (from: Vec3, to: Vec3): Vec3 => [to[0] - from[0], to[1] - from[1], to[2] - from[2]];

/** Seconds a 3D-printer demo print takes. */
export const PRINT_SECONDS = 16;

/** Advances a demo print; returns the new progress (0 … 1). */
export function advancePrint(t: number, dt: number, reduced: boolean): number {
  if (reduced) return 1;
  return Math.min(1, t + Math.min(dt, 0.1) / PRINT_SECONDS);
}
