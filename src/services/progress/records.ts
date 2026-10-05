import type { GradeReport } from '@/services/grading';
import { MAX_ATTEMPTS, type AttemptRecord, type ExerciseProgress, type ProgressSnapshot, type TaskStatus } from './types';

export function emptySnapshot(now = Date.now()): ProgressSnapshot {
  return { attempts: [], exercises: {}, achievements: {}, meta: { createdAt: now } };
}

let seq = 0;
/** Unique enough for local data and for deduping imports; not a security token. */
export function attemptId(at: number) {
  seq = (seq + 1) % 1296;
  return `${at.toString(36)}-${seq.toString(36).padStart(2, '0')}${Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')}`;
}

/** A graded report → the record that is stored. */
export function fromReport(report: GradeReport, now = Date.now()): AttemptRecord {
  return {
    id: attemptId(now),
    exerciseId: report.exerciseId,
    score: report.score,
    maxScore: report.maxScore,
    percent: report.percent,
    seconds: report.seconds,
    errors: report.errors,
    hints: report.hints,
    status: report.status,
    at: now,
  };
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function isAttemptRecord(v: unknown): v is AttemptRecord {
  if (!v || typeof v !== 'object') return false;
  const a = v as AttemptRecord;
  return (
    typeof a.id === 'string' && a.id.length > 0 && a.id.length < 64 &&
    typeof a.exerciseId === 'string' && a.exerciseId.length > 0 && a.exerciseId.length < 100 &&
    finite(a.maxScore) && a.maxScore > 0 && a.maxScore <= 1000 &&
    finite(a.score) && a.score >= 0 && a.score <= a.maxScore &&
    finite(a.percent) && a.percent >= 0 && a.percent <= 100 &&
    [a.seconds, a.errors, a.hints, a.at].every((n) => finite(n) && n >= 0) &&
    (a.status === 'completed' || a.status === 'incomplete')
  );
}

/**
 * Which of two attempts is the "best result": higher percent, then a
 * completed one, then fewer hints and errors, then faster.
 */
export function isBetter(a: AttemptRecord, b: AttemptRecord | undefined): boolean {
  if (!b) return true;
  if (a.percent !== b.percent) return a.percent > b.percent;
  if (a.status !== b.status) return a.status === 'completed';
  if (a.hints !== b.hints) return a.hints < b.hints;
  if (a.errors !== b.errors) return a.errors < b.errors;
  return a.seconds < b.seconds;
}

function nextExercise(prev: ExerciseProgress | undefined, a: AttemptRecord): ExerciseProgress {
  const attempts = (prev?.attempts ?? 0) + 1;
  const firstCompletion = !prev?.completedAt && a.status === 'completed';
  return {
    best: isBetter(a, prev?.best) ? a : prev!.best,
    attempts,
    completedAt: prev?.completedAt ?? (firstCompletion ? a.at : undefined),
    completedOnAttempt: prev?.completedOnAttempt ?? (firstCompletion ? attempts : undefined),
    firstAt: Math.min(prev?.firstAt ?? a.at, a.at),
    lastAt: Math.max(prev?.lastAt ?? a.at, a.at),
  };
}

/** Adds one attempt: history grows (capped), the exercise summary keeps the best. Pure. */
export function applyAttempt(s: ProgressSnapshot, a: AttemptRecord): ProgressSnapshot {
  return {
    ...s,
    attempts: [...s.attempts, a].slice(-MAX_ATTEMPTS),
    exercises: { ...s.exercises, [a.exerciseId]: nextExercise(s.exercises[a.exerciseId], a) },
  };
}

/** Builds summaries from a plain attempt list (migrations). */
export function rebuild(attempts: readonly AttemptRecord[], base: ProgressSnapshot = emptySnapshot()): ProgressSnapshot {
  return [...attempts].sort((x, y) => x.at - y.at).reduce(applyAttempt, base);
}

const minDefined = (a?: number, b?: number) => (a === undefined ? b : b === undefined ? a : Math.min(a, b));

function mergeExercise(x: ExerciseProgress | undefined, y: ExerciseProgress | undefined, seen: number): ExerciseProgress {
  if (!x) return { ...y!, attempts: Math.max(y!.attempts, seen) };
  if (!y) return { ...x, attempts: Math.max(x.attempts, seen) };
  return {
    best: isBetter(y.best, x.best) ? y.best : x.best,
    attempts: Math.max(x.attempts, y.attempts, seen),
    completedAt: minDefined(x.completedAt, y.completedAt),
    completedOnAttempt: minDefined(x.completedOnAttempt, y.completedOnAttempt),
    firstAt: Math.min(x.firstAt, y.firstAt),
    lastAt: Math.max(x.lastAt, y.lastAt),
  };
}

/**
 * Union of two snapshots — used by import. Nothing already stored is lost,
 * and importing the same file twice changes nothing (attempts dedupe by id).
 */
export function mergeSnapshots(a: ProgressSnapshot, b: ProgressSnapshot): ProgressSnapshot {
  const byId = new Map<string, AttemptRecord>();
  for (const r of [...a.attempts, ...b.attempts]) if (!byId.has(r.id)) byId.set(r.id, r);
  const attempts = [...byId.values()].sort((x, y) => x.at - y.at).slice(-MAX_ATTEMPTS);
  const counts = new Map<string, number>();
  for (const r of attempts) counts.set(r.exerciseId, (counts.get(r.exerciseId) ?? 0) + 1);

  const exercises: ProgressSnapshot['exercises'] = {};
  for (const id of new Set([...Object.keys(a.exercises), ...Object.keys(b.exercises)])) {
    exercises[id] = mergeExercise(a.exercises[id], b.exercises[id], counts.get(id) ?? 0);
  }
  const achievements = { ...b.achievements };
  for (const [id, at] of Object.entries(a.achievements)) achievements[id] = Math.min(at, achievements[id] ?? at);
  return {
    attempts,
    exercises,
    achievements,
    meta: { createdAt: Math.min(a.meta.createdAt, b.meta.createdAt), legacyImported: a.meta.legacyImported || b.meta.legacyImported || undefined },
  };
}

export function statusOf(p: ExerciseProgress | undefined): TaskStatus {
  if (!p) return 'notStarted';
  return p.completedAt !== undefined ? 'completed' : 'inProgress';
}
