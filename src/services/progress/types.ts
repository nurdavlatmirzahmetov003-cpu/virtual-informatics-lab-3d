/**
 * Student progress — the one place every lab's results end up.
 *
 * Plain JSON-serialisable data, independent of React and of where it is
 * stored: the same snapshot is written to localStorage today and can be
 * written to Supabase/PostgreSQL later (see repository.ts).
 */
import type { GradeStatus } from '@/services/grading';
import { STORAGE_VERSIONS } from '@/lib/storage';

/** Current schema version of the persisted snapshot. Bump it in lib/storage.ts and add a step in migrate.ts. */
export const PROGRESS_VERSION = STORAGE_VERSIONS.progress;

/** One graded submission. */
export interface AttemptRecord {
  /** Unique per attempt (dedupes imports). */
  id: string;
  exerciseId: string;
  score: number;
  maxScore: number;
  /** 0..100 */
  percent: number;
  seconds: number;
  errors: number;
  hints: number;
  status: GradeStatus;
  /** Epoch ms when it was graded. */
  at: number;
}

/** Per-exercise summary; survives trimming of the attempt history. */
export interface ExerciseProgress {
  best: AttemptRecord;
  /** Every graded attempt ever made, including trimmed ones. */
  attempts: number;
  /** First time the exercise was completed. */
  completedAt?: number;
  /** Attempt number (1-based) of the first completion. */
  completedOnAttempt?: number;
  firstAt: number;
  lastAt: number;
}

export interface ProgressMeta {
  createdAt: number;
  /** The old prototype's `vlab_progress_v1` has been folded in. */
  legacyImported?: boolean;
}

export interface ProgressSnapshot {
  /** Chronological, newest last, capped at MAX_ATTEMPTS. */
  attempts: AttemptRecord[];
  exercises: Record<string, ExerciseProgress>;
  /** Achievement id → unlock time. */
  achievements: Record<string, number>;
  meta: ProgressMeta;
}

/** What is actually stored: the snapshot plus its schema version. */
export interface ProgressEnvelope {
  version: number;
  state: ProgressSnapshot;
}

export const MAX_ATTEMPTS = 1000;

export type TaskStatus = 'notStarted' | 'inProgress' | 'completed';
