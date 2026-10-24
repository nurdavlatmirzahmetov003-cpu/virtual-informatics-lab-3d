/**
 * The weekly report for parents (0.37): what the student did in one week
 * (Monday to Sunday, Kazakhstan time, the same weeks as the challenges),
 * from the attempts kept in progress — pure, so it is tested and printed
 * the same everywhere.
 */
import { labOf, taskById, type LabId } from './catalog';
import { weekKey, weekStart } from './challenges';
import type { ProgressSnapshot } from './types';

export interface WeeklyReport {
  week: number;
  from: number;
  /** Start of the next week (exclusive end). */
  to: number;
  attempts: number;
  /** Tasks completed for the first time this week. */
  completed: string[];
  /** Average result of this week's attempts, 0 … 100 (null: none). */
  average: number | null;
  /** Time spent on graded attempts, seconds. */
  seconds: number;
  /** Days with at least one attempt (0 … 7). */
  activeDays: number;
  /** Labs worked in, with the number of attempts, most first. */
  labs: Array<{ lab: LabId; attempts: number }>;
  /** Achievements unlocked this week. */
  achievements: string[];
  /** Tasks tried this week whose best result is still under 80 %. */
  struggling: string[];
}

export const currentWeek = (now: number) => weekKey(now);

export function weeklyReport(s: Pick<ProgressSnapshot, 'attempts' | 'exercises' | 'achievements'>, week: number): WeeklyReport {
  const from = weekStart(week);
  const to = weekStart(week + 1);
  const inWeek = s.attempts.filter((a) => a.at >= from && a.at < to);
  const labs = new Map<LabId, number>();
  for (const a of inWeek) {
    const lab = labOf(a.exerciseId);
    if (lab) labs.set(lab, (labs.get(lab) ?? 0) + 1);
  }
  const days = new Set(inWeek.map((a) => Math.floor((a.at - from) / 86_400_000)));
  const ids = [...new Set(inWeek.map((a) => a.exerciseId))].filter((id) => taskById(id));
  return {
    week,
    from,
    to,
    attempts: inWeek.length,
    completed: Object.entries(s.exercises)
      .filter(([id, p]) => p.completedAt !== undefined && p.completedAt >= from && p.completedAt < to && taskById(id))
      .map(([id]) => id),
    average: inWeek.length ? Math.round(inWeek.reduce((sum, a) => sum + a.percent, 0) / inWeek.length) : null,
    seconds: inWeek.reduce((sum, a) => sum + a.seconds, 0),
    activeDays: days.size,
    labs: [...labs].map(([lab, attempts]) => ({ lab, attempts })).sort((a, b) => b.attempts - a.attempts),
    achievements: Object.entries(s.achievements)
      .filter(([, at]) => at >= from && at < to)
      .map(([id]) => id),
    struggling: ids.filter((id) => (s.exercises[id]?.best.percent ?? 100) < 80),
  };
}
