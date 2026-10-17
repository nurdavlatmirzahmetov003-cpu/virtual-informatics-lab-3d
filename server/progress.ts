/**
 * A student's progress on the server: attempts and achievements rows. The
 * browser sends its whole snapshot; new attempts are added (ids dedupe), the
 * earliest unlock time of each achievement wins, and the merged snapshot is
 * returned — the same rules as the browser's import (mergeSnapshots).
 */
import type { Db } from './db';
import { emptySnapshot, isAttemptRecord, rebuild } from '@/services/progress/records';
import type { AttemptRecord, ProgressSnapshot } from '@/services/progress/types';

interface AttemptRow {
  id: string;
  exercise_id: string;
  score: number;
  max_score: number;
  percent: number;
  seconds: number;
  errors: number;
  hints: number;
  status: 'completed' | 'incomplete';
  at: number;
}

export function loadProgress(db: Db, userId: string, createdAt: number): ProgressSnapshot {
  const rows = db.prepare('SELECT id, exercise_id, score, max_score, percent, seconds, errors, hints, status, at FROM attempts WHERE user_id = ? ORDER BY at').all(userId) as unknown as AttemptRow[];
  const attempts: AttemptRecord[] = rows.map((r) => ({
    id: r.id,
    exerciseId: r.exercise_id,
    score: r.score,
    maxScore: r.max_score,
    percent: r.percent,
    seconds: r.seconds,
    errors: r.errors,
    hints: r.hints,
    status: r.status,
    at: r.at,
  }));
  const snapshot = rebuild(attempts, emptySnapshot(createdAt));
  const ach = db.prepare('SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?').all(userId) as Array<{ achievement_id: string; unlocked_at: number }>;
  snapshot.achievements = Object.fromEntries(ach.map((a) => [a.achievement_id, a.unlocked_at]));
  snapshot.meta = { createdAt, legacyImported: true };
  return snapshot;
}

/** Ids of the attempts already stored for a student (to tell which ones a sync adds). */
export const storedAttemptIds = (db: Db, userId: string) => new Set((db.prepare('SELECT id FROM attempts WHERE user_id = ?').all(userId) as Array<{ id: string }>).map((r) => r.id));

/** Stores what the browser sent (validated, at most 1000 attempts) and returns the merged snapshot. */
export function saveProgress(db: Db, userId: string, createdAt: number, incoming: unknown): ProgressSnapshot {
  const s = incoming as Partial<ProgressSnapshot> | null;
  const attempts = Array.isArray(s?.attempts) ? s.attempts.filter(isAttemptRecord).slice(-1000) : [];
  const insert = db.prepare(
    'INSERT INTO attempts (user_id, id, exercise_id, score, max_score, percent, seconds, errors, hints, status, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, id) DO NOTHING',
  );
  const ach = db.prepare(
    'INSERT INTO achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?) ON CONFLICT (user_id, achievement_id) DO UPDATE SET unlocked_at = MIN(achievements.unlocked_at, excluded.unlocked_at)',
  );
  db.exec('BEGIN');
  try {
    for (const a of attempts) {
      insert.run(userId, a.id.slice(0, 64), a.exerciseId.slice(0, 64), a.score, a.maxScore, a.percent, a.seconds, a.errors, a.hints, a.status, a.at);
    }
    const achievements = s?.achievements && typeof s.achievements === 'object' ? s.achievements : {};
    for (const [id, at] of Object.entries(achievements)) {
      if (typeof at === 'number' && Number.isFinite(at) && /^[a-zA-Z0-9]{1,40}$/.test(id)) ach.run(userId, id, at);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return loadProgress(db, userId, createdAt);
}
