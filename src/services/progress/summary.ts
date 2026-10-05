/**
 * Derived numbers for the Tasks and Results pages. Everything is computed
 * from the snapshot and the catalogue — no separate counters to keep in sync.
 */
import { statusOf } from './records';
import { LAB_IDS, TASKS, type LabId, type TaskInfo } from './catalog';
import type { AttemptRecord, ExerciseProgress, ProgressSnapshot, TaskStatus } from './types';

export interface TaskState {
  info: TaskInfo;
  status: TaskStatus;
  progress?: ExerciseProgress;
}

export interface LabSummary {
  lab: LabId;
  total: number;
  completed: number;
  inProgress: number;
  /** Mean best percent over the tasks tried; null when none. */
  average: number | null;
  /** Every task completed. */
  done: boolean;
  /** Every task at 100 %. */
  perfect: boolean;
}

export interface ProgressTotals {
  tasks: number;
  completed: number;
  inProgress: number;
  /** completed / tasks, 0..100 */
  percent: number;
  /** Sum of best scores and of max scores over all tasks. */
  points: number;
  maxPoints: number;
  /** Mean best percent over attempted tasks; null when none. */
  average: number | null;
  labsCompleted: number;
  attempts: number;
}

export interface ProgressSummary {
  tasks: TaskState[];
  labs: LabSummary[];
  totals: ProgressTotals;
}

const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : null);

export function summarize(s: Pick<ProgressSnapshot, 'exercises'>): ProgressSummary {
  const tasks = TASKS.map((info) => ({ info, status: statusOf(s.exercises[info.id]), progress: s.exercises[info.id] }));
  const labs = LAB_IDS.map((lab): LabSummary => {
    const list = tasks.filter((t) => t.info.lab === lab);
    const completed = list.filter((t) => t.status === 'completed').length;
    return {
      lab,
      total: list.length,
      completed,
      inProgress: list.filter((t) => t.status === 'inProgress').length,
      average: mean(list.flatMap((t) => (t.progress ? [t.progress.best.percent] : []))),
      done: completed === list.length,
      perfect: list.every((t) => t.progress?.best.percent === 100),
    };
  });
  const tried = tasks.filter((t) => t.progress);
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return {
    tasks,
    labs,
    totals: {
      tasks: tasks.length,
      completed,
      inProgress: tasks.filter((t) => t.status === 'inProgress').length,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      points: tried.reduce((n, t) => n + t.progress!.best.score, 0),
      maxPoints: tasks.reduce((n, t) => n + t.info.maxScore, 0),
      average: mean(tried.map((t) => t.progress!.best.percent)),
      labsCompleted: labs.filter((l) => l.done).length,
      attempts: Object.values(s.exercises).reduce((n, e) => n + e.attempts, 0),
    },
  };
}

/**
 * The task to suggest next:
 *   1. an unfinished task the student worked on most recently;
 *   2. the next new task in the lab they were last active in;
 *   3. the first new task in learning order.
 * Null when everything is completed.
 */
export type RecommendReason = 'continue' | 'sameLab' | 'order';

export function recommendNext(summary: ProgressSummary): { task: TaskState; reason: RecommendReason } | null {
  const open = summary.tasks.filter((t) => t.status !== 'completed');
  if (!open.length) return null;
  const started = open.filter((t) => t.status === 'inProgress').sort((a, b) => b.progress!.lastAt - a.progress!.lastAt);
  if (started.length) return { task: started[0], reason: 'continue' };
  const last = summary.tasks.filter((t) => t.progress).sort((a, b) => b.progress!.lastAt - a.progress!.lastAt)[0];
  const sameLab = last && open.find((t) => t.info.lab === last.info.lab);
  return sameLab ? { task: sameLab, reason: 'sameLab' } : { task: open[0], reason: 'order' };
}

/** Attempts per day for the last `days` days (oldest first), local time. */
export function activityByDay(attempts: readonly AttemptRecord[], days = 14, now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d.getTime(), attempts: 0, completed: 0 };
  });
  for (const a of attempts) {
    // bucket boundaries are local midnights, so DST days (23/25 h) are right too
    const b = buckets.find((x, k) => a.at >= x.date && (k === days - 1 || a.at < buckets[k + 1].date));
    if (!b) continue;
    b.attempts += 1;
    if (a.status === 'completed') b.completed += 1;
  }
  return buckets;
}
