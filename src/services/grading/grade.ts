import type { Attempt, Exercise, GradeReport, RuleOutcome } from './types';

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function startAttempt(exerciseId: string, now = Date.now()): Attempt {
  return { exerciseId, startedAt: now, hintsUsed: 0, submissions: 0, failedSubmissions: 0, errors: 0, completed: false };
}

/** Opens the next hint; returns the same attempt once all hints are shown. */
export function takeHint<W>(attempt: Attempt, exercise: Exercise<W>): Attempt {
  if (attempt.hintsUsed >= exercise.hints.length) return attempt;
  return { ...attempt, hintsUsed: attempt.hintsUsed + 1 };
}

/** Runs every rule; a throwing rule counts as failed rather than crashing the lab. */
export function evaluateRules<W>(exercise: Exercise<W>, work: W): RuleOutcome[] {
  return exercise.gradingRules.map((rule) => {
    let passed = false;
    let partial = 0;
    let feedback: RuleOutcome['feedback'];
    try {
      const r = rule.evaluate(work);
      passed = r.passed;
      partial = r.passed ? 1 : clamp01(r.partial ?? 0);
      feedback = r.feedback ?? [];
    } catch {
      feedback = [{ key: 'grading.ruleError' }];
    }
    return { id: rule.id, label: rule.label, points: rule.points, earned: round1(rule.points * partial), passed, feedback };
  });
}

/**
 * Grades the work and returns the report plus the updated attempt.
 * Rule points are scaled to `maxScore`; hints and earlier incomplete
 * submissions cost points, capped so a correct solution stays a pass.
 * Time is reported but never penalised.
 */
export function grade<W>(exercise: Exercise<W>, work: W, attempt: Attempt, now = Date.now()): { report: GradeReport; attempt: Attempt } {
  const outcomes = evaluateRules(exercise, work);
  const total = outcomes.reduce((s, o) => s + o.points, 0) || 1;
  const earned = outcomes.reduce((s, o) => s + o.earned, 0);
  const complete = outcomes.every((o) => o.passed);
  const failedRules = outcomes.filter((o) => !o.passed).length;

  const raw = (earned / total) * exercise.maxScore;
  const penalty = Math.min(
    exercise.maxPenalty ?? 3,
    attempt.hintsUsed * (exercise.hintPenalty ?? 1) + attempt.failedSubmissions * (exercise.retryPenalty ?? 1),
  );
  const score = Math.max(0, Math.round(raw - penalty));

  const next: Attempt = {
    ...attempt,
    submissions: attempt.submissions + 1,
    failedSubmissions: attempt.failedSubmissions + (complete ? 0 : 1),
    errors: attempt.errors + failedRules,
    completed: attempt.completed || complete,
  };
  const report: GradeReport = {
    exerciseId: exercise.id,
    score,
    maxScore: exercise.maxScore,
    percent: Math.round((score / exercise.maxScore) * 100),
    seconds: Math.max(0, Math.floor((now - attempt.startedAt) / 1000)),
    errors: next.errors,
    hints: attempt.hintsUsed,
    submissions: next.submissions,
    penalty,
    status: complete ? 'completed' : 'incomplete',
    outcomes,
  };
  return { report, attempt: next };
}

/** 222 → "03:42"; an hour or more → "1:03:42". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}
