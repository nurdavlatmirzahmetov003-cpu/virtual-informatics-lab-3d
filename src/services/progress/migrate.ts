/**
 * Schema migrations of stored progress. Every older shape is upgraded to the
 * current snapshot; invalid entries are skipped one by one, never the whole
 * history. Add a step here whenever PROGRESS_VERSION is bumped.
 *
 *   v1 (0.8)  { attempts: Assessment[] }            score 0..100
 *   v2 (0.9)  { attempts: Assessment[], best: Assessment[] }
 *   v3 (0.16) ProgressSnapshot                      attempts + per-exercise summary + achievements
 */
import { emptySnapshot, isAttemptRecord, isBetter, rebuild } from './records';
import { LAB_IDS, type LabId } from './catalog';
import { MAX_ATTEMPTS, type AttemptRecord, type ExerciseProgress, type ProgressSnapshot } from './types';

/** The v1/v2 record (lib/labs/assessment.ts before 0.16). */
interface LegacyAssessment {
  exercise: string;
  score: number;
  maxScore: number;
  seconds: number;
  errors: number;
  hints: number;
  completedAt: number;
}

/** The old pass mark of v1/v2: 70 %. */
const LEGACY_PASS = 70;

function isLegacyAssessment(v: unknown): v is LegacyAssessment {
  if (!v || typeof v !== 'object') return false;
  const a = v as LegacyAssessment;
  return (
    typeof a.exercise === 'string' && a.exercise.length > 0 && a.exercise.length < 100 && a.maxScore === 100 &&
    [a.score, a.seconds, a.errors, a.hints, a.completedAt].every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0) &&
    a.score <= 100
  );
}

function fromLegacy(a: LegacyAssessment, i: number): AttemptRecord {
  return {
    id: `m${a.completedAt.toString(36)}-${i.toString(36)}`,
    exerciseId: a.exercise,
    // every lab is out of 10 now; the exact percentage is kept
    score: Math.round(a.score / 10),
    maxScore: 10,
    percent: Math.round(a.score),
    seconds: Math.floor(a.seconds),
    errors: Math.floor(a.errors),
    hints: Math.floor(a.hints),
    status: a.score >= LEGACY_PASS ? 'completed' : 'incomplete',
    at: a.completedAt,
  };
}

/** v1 and v2: attempts (+ lifetime bests that may have been trimmed from attempts). */
function fromV2(state: unknown, now: number): ProgressSnapshot {
  const s = (state ?? {}) as { attempts?: unknown; best?: unknown };
  const list = [...(Array.isArray(s.attempts) ? s.attempts : []), ...(Array.isArray(s.best) ? s.best : [])].filter(isLegacyAssessment);
  // a best entry is usually also in attempts — same exercise, time and score
  const seen = new Set<string>();
  const unique = list.filter((a) => {
    const k = `${a.exercise}|${a.completedAt}|${a.score}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
  return rebuild(unique.map(fromLegacy), emptySnapshot(now));
}

function validExercise(v: unknown): v is ExerciseProgress {
  if (!v || typeof v !== 'object') return false;
  const e = v as ExerciseProgress;
  const n = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
  return (
    isAttemptRecord(e.best) && n(e.attempts) && e.attempts >= 1 && n(e.firstAt) && n(e.lastAt) &&
    (e.completedAt === undefined || n(e.completedAt)) && (e.completedOnAttempt === undefined || n(e.completedOnAttempt))
  );
}

/** v3 (and anything claiming to be newer): keep every valid part. */
function fromV3(state: unknown, now: number): ProgressSnapshot {
  const s = (state ?? {}) as Partial<Record<keyof ProgressSnapshot, unknown>>;
  const attempts = (Array.isArray(s.attempts) ? s.attempts : []).filter(isAttemptRecord).sort((a, b) => a.at - b.at).slice(-MAX_ATTEMPTS);

  const exercises: ProgressSnapshot['exercises'] = {};
  const rawEx = s.exercises && typeof s.exercises === 'object' ? (s.exercises as Record<string, unknown>) : {};
  for (const [id, e] of Object.entries(rawEx)) if (id.length < 100 && validExercise(e) && e.best.exerciseId === id) exercises[id] = e;
  // a summary lost to corruption is rebuilt from the attempts that remain
  const rebuilt = rebuild(attempts.filter((a) => !exercises[a.exerciseId]));
  for (const [id, e] of Object.entries(rebuilt.exercises)) exercises[id] = e;
  for (const a of attempts) {
    const e = exercises[a.exerciseId];
    if (isBetter(a, e.best)) exercises[a.exerciseId] = { ...e, best: a };
  }

  const achievements: Record<string, number> = {};
  const rawAch = s.achievements && typeof s.achievements === 'object' ? (s.achievements as Record<string, unknown>) : {};
  for (const [id, at] of Object.entries(rawAch)) if (id.length < 64 && typeof at === 'number' && Number.isFinite(at) && at >= 0) achievements[id] = at;

  const meta = (s.meta ?? {}) as { createdAt?: unknown; legacyImported?: unknown };
  return {
    attempts,
    exercises,
    achievements,
    meta: {
      createdAt: typeof meta.createdAt === 'number' && Number.isFinite(meta.createdAt) ? meta.createdAt : now,
      legacyImported: meta.legacyImported === true || undefined,
    },
  };
}

/** Upgrades a stored state of any known version to the current snapshot. */
export function migrateProgress(state: unknown, version: number, now = Date.now()): ProgressSnapshot {
  if (!Number.isFinite(version) || version < 3) return fromV2(state, now);
  return fromV3(state, now);
}

/** Reads a stored envelope `{ version, state }` (zustand-persist format of v1/v2). */
export function readEnvelope(raw: unknown, now = Date.now()): { snapshot: ProgressSnapshot; version: number } {
  const env = (raw ?? {}) as { version?: unknown; state?: unknown };
  const version = typeof env.version === 'number' ? env.version : 0;
  return { snapshot: migrateProgress(env.state, version, now), version };
}

/**
 * The first HTML prototype kept `{ assemble, network, algo, logic, exp }`,
 * each 0..20 (14 = passed), under `vlab_progress_v1`. Each module becomes
 * one `legacy:<lab>` attempt so the history shows it; no new task counts as
 * done because of it.
 */
const PROTOTYPE_MODULES: Record<string, LabId> = { assemble: 'assembly', network: 'network', algo: 'algorithms', logic: 'logic', exp: 'experiments' };

export function fromPrototype(raw: unknown, now = Date.now()): AttemptRecord[] {
  if (!raw || typeof raw !== 'object') return [];
  const out: AttemptRecord[] = [];
  for (const [mod, lab] of Object.entries(PROTOTYPE_MODULES)) {
    const v = (raw as Record<string, unknown>)[mod];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || !LAB_IDS.includes(lab)) continue;
    const score = Math.min(20, Math.round(v));
    out.push({
      id: `legacy-${mod}`,
      exerciseId: `legacy:${lab}`,
      score,
      maxScore: 20,
      percent: Math.round((score / 20) * 100),
      seconds: 0,
      errors: 0,
      hints: 0,
      status: score >= 14 ? 'completed' : 'incomplete',
      at: now,
    });
  }
  return out;
}
