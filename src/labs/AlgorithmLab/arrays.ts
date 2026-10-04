import type { Item } from './types';

export const ARRAY_LIMITS = { min: 2, max: 12, value: 99 } as const;

/** "8, 3 6;1" → [8, 3, 6, 1]; null unless 2–12 integers within ±99. */
export function parseArray(text: string): number[] | null {
  const tokens = text.trim().split(/[\s,;]+/).filter(Boolean);
  if (tokens.length < ARRAY_LIMITS.min || tokens.length > ARRAY_LIMITS.max) return null;
  if (tokens.some((t) => !/^[-+]?\d+$/.test(t))) return null;
  const values = tokens.map(Number);
  return values.every((v) => Math.abs(v) <= ARRAY_LIMITS.value) ? values : null;
}

export const toItems = (values: readonly number[]): Item[] => values.map((value, id) => ({ id, value }));

/** Small deterministic PRNG (mulberry32) so quizzes and tests are reproducible. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (next: () => number, min: number, max: number) => min + Math.floor(next() * (max - min + 1));

export function shuffle<T>(list: readonly T[], next: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `count` distinct values in [min, max]. */
export function randomArray(next: () => number, count = 8, min = 1, max = 60): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return shuffle(pool, next).slice(0, Math.min(count, pool.length));
}
