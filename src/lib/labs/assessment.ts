export interface Assessment {
  exercise: string;
  score: number;
  maxScore: number;
  seconds: number;
  errors: number;
  hints: number;
  completedAt: number;
}

/** Penalize attempts, never speed: slower learners can still earn full marks. */
export function assess(exercise: string, fraction: number, seconds: number, errors = 0, hints = 0): Assessment {
  const nonnegative = (n: number) => Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const e = nonnegative(errors), h = nonnegative(hints);
  const coverage = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  return { exercise, score: Math.max(0, Math.round(coverage * 100) - e * 4 - h * 2), maxScore: 100,
    seconds: nonnegative(seconds), errors: e, hints: h, completedAt: Date.now() };
}

export function isAssessment(value: unknown): value is Assessment {
  if (!value || typeof value !== 'object') return false;
  const a = value as Assessment;
  return typeof a.exercise === 'string' && a.exercise.length < 100 && a.maxScore === 100 &&
    [a.score,a.seconds,a.errors,a.hints,a.completedAt].every(n => Number.isFinite(n) && n >= 0) && a.score <= 100;
}
