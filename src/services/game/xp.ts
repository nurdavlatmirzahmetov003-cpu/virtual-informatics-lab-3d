/**
 * XP and levels (V2-11a). Never stored: always derived from the attempt
 * history with the same code in the browser and on the server, so the
 * leaderboard cannot be fed a made-up total and improving an old result
 * counts exactly once.
 *
 *   task        50 × best percent (incomplete tries count too)
 *   clean       +10 for a completed 100 % without mistakes or hints
 *   badge       +100 per achievement the history earns
 *   daily       +20 per daily item, +40 for all three
 *   weekly      +75 per weekly goal
 */
// direct modules, not the index: the server imports this file and the index pulls in browser storage
import { ACHIEVEMENT_IDS, evaluateAchievements } from '@/services/progress/achievements';
import { TASKS } from '@/services/progress/catalog';
import { dailyHistory, weeklyHistory } from '@/services/progress/challenges';
import { rebuild } from '@/services/progress/records';
import { summarize } from '@/services/progress/summary';
import type { AttemptRecord } from '@/services/progress/types';

export const XP = { task: 50, clean: 10, badge: 100, dailyItem: 20, dailyAll: 40, weeklyGoal: 75 } as const;

export interface XpBreakdown {
  tasks: number;
  clean: number;
  badges: number;
  daily: number;
  weekly: number;
  total: number;
}

const KNOWN = new Set(TASKS.map((t) => t.id));

/** XP earned by the attempts made up to `until` (inclusive). */
export function computeXp(attempts: readonly AttemptRecord[], until = Infinity): XpBreakdown {
  const list = until === Infinity ? attempts : attempts.filter((a) => a.at <= until);
  const snap = rebuild(list);
  let tasks = 0;
  let clean = 0;
  for (const [id, ex] of Object.entries(snap.exercises)) {
    if (!KNOWN.has(id)) continue;
    tasks += Math.round((XP.task * ex.best.percent) / 100);
    const b = ex.best;
    if (b.status === 'completed' && b.percent === 100 && b.errors === 0 && b.hints === 0) clean += XP.clean;
  }
  const badges = evaluateAchievements(summarize(snap), list).filter((x) => x.unlocked).length * XP.badge;
  const daily = dailyHistory(list).reduce((n, d) => n + d.done * XP.dailyItem + (d.complete ? XP.dailyAll : 0), 0);
  const weekly = weeklyHistory(list).reduce((n, w) => n + w.done * XP.weeklyGoal, 0);
  return { tasks, clean, badges, daily, weekly, total: tasks + clean + badges + daily + weekly };
}

/** XP needed to reach `level` (level 1 at 0; each level needs 75 more than the last). */
export const levelThreshold = (level: number) => (75 * (level - 1) * level) / 2;

export interface LevelInfo {
  level: number;
  /** XP into the current level and the size of the level. */
  into: number;
  span: number;
  /** 0..1 */
  progress: number;
  rank: RankId;
}

export const RANKS = ['novice', 'explorer', 'technician', 'engineer', 'specialist', 'expert', 'architect'] as const;
export type RankId = (typeof RANKS)[number];
/** Two levels per rank; level 13+ is "architect". */
export const rankOf = (level: number): RankId => RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 2))];

export function levelOf(xp: number): LevelInfo {
  let level = 1;
  while (levelThreshold(level + 1) <= xp) level++;
  const base = levelThreshold(level);
  const span = levelThreshold(level + 1) - base;
  return { level, into: xp - base, span, progress: span ? (xp - base) / span : 0, rank: rankOf(level) };
}

/** The most a student can reach from tasks and badges alone (for context on the results page). */
export const MAX_TASK_XP = TASKS.length * (XP.task + XP.clean) + ACHIEVEMENT_IDS.length * XP.badge;
