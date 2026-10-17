/**
 * Daily and weekly challenges (V2-11a). Deterministic: the same date gives
 * every student the same challenge, on the browser and on the server, and
 * whether it is done is read from the attempts alone — nothing extra is
 * stored or sent. Days and weeks follow Kazakhstan time (UTC+5, Monday-first).
 */
import { LAB_IDS, tasksOf, type TaskInfo } from './catalog';
import type { AttemptRecord } from './types';

export const DAY_MS = 86_400_000;
const OFFSET_MS = 5 * 3_600_000;

/** Day number in Kazakhstan time (UTC+5). */
export const dayKey = (ts: number) => Math.floor((ts + OFFSET_MS) / DAY_MS);
/** Monday-first week number (1970-01-01 was a Thursday). */
export const weekKey = (ts: number) => Math.floor((dayKey(ts) + 3) / 7);
/** First moment of a day / week, epoch ms. */
export const dayStart = (day: number) => day * DAY_MS - OFFSET_MS;
export const weekStart = (week: number) => dayStart(week * 7 - 3);

/** Small seeded PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A daily item counts with at least this score (a quick review also counts). */
export const DAILY_PASS = 80;
export const DAILY_SIZE = 3;

/** Three tasks from three different laboratories, the same for everyone that day. */
export function dailyTasks(day: number): TaskInfo[] {
  const r = rng(day * 2654435761);
  const labs = [...LAB_IDS];
  const out: TaskInfo[] = [];
  while (out.length < DAILY_SIZE && labs.length) {
    const lab = labs.splice(Math.floor(r() * labs.length), 1)[0];
    const tasks = tasksOf(lab);
    out.push(tasks[Math.floor(r() * tasks.length)]);
  }
  return out;
}

export interface DailyStatus {
  day: number;
  items: Array<{ task: TaskInfo; done: boolean; best: number | null }>;
  done: number;
  complete: boolean;
}

const byDay = (attempts: readonly AttemptRecord[]) => {
  const m = new Map<number, AttemptRecord[]>();
  for (const a of attempts) {
    const k = dayKey(a.at);
    const list = m.get(k);
    if (list) list.push(a);
    else m.set(k, [a]);
  }
  return m;
};

function dailyFrom(day: number, sameDay: readonly AttemptRecord[]): DailyStatus {
  const items = dailyTasks(day).map((task) => {
    const scores = sameDay.filter((a) => a.exerciseId === task.id).map((a) => a.percent);
    const best = scores.length ? Math.max(...scores) : null;
    return { task, done: best !== null && best >= DAILY_PASS, best };
  });
  const done = items.filter((i) => i.done).length;
  return { day, items, done, complete: done === items.length };
}

export function dailyStatus(attempts: readonly AttemptRecord[], day: number): DailyStatus {
  return dailyFrom(day, attempts.filter((a) => dayKey(a.at) === day));
}

/** Every day with activity, with its daily challenge result. */
export function dailyHistory(attempts: readonly AttemptRecord[]): DailyStatus[] {
  return [...byDay(attempts)].map(([day, list]) => dailyFrom(day, list));
}

export const WEEKLY_GOALS = ['complete', 'labs', 'perfect', 'clean', 'daily'] as const;
export type WeeklyGoalId = (typeof WEEKLY_GOALS)[number];
const GOAL_TARGET: Record<WeeklyGoalId, number> = { complete: 8, labs: 3, perfect: 3, clean: 5, daily: 3 };
export const WEEKLY_SIZE = 3;

export function weeklyGoals(week: number): WeeklyGoalId[] {
  const r = rng(week * 40503 + 17);
  const pool = [...WEEKLY_GOALS];
  const out: WeeklyGoalId[] = [];
  while (out.length < WEEKLY_SIZE) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}

export interface WeeklyStatus {
  week: number;
  goals: Array<{ id: WeeklyGoalId; current: number; target: number; done: boolean }>;
  done: number;
  complete: boolean;
}

function goalValue(id: WeeklyGoalId, list: readonly AttemptRecord[]): number {
  const completed = list.filter((a) => a.status === 'completed');
  switch (id) {
    case 'complete':
      return new Set(completed.map((a) => a.exerciseId)).size;
    case 'labs':
      return new Set(list.map((a) => a.exerciseId.split(':')[0])).size;
    case 'perfect':
      return new Set(list.filter((a) => a.percent === 100).map((a) => a.exerciseId)).size;
    case 'clean':
      return completed.filter((a) => a.hints === 0).length;
    case 'daily':
      return dailyHistory(list).filter((d) => d.complete).length;
  }
}

function weeklyFrom(week: number, list: readonly AttemptRecord[]): WeeklyStatus {
  const goals = weeklyGoals(week).map((id) => {
    const target = GOAL_TARGET[id];
    const current = Math.min(goalValue(id, list), target);
    return { id, current, target, done: current >= target };
  });
  const done = goals.filter((g) => g.done).length;
  return { week, goals, done, complete: done === goals.length };
}

export function weeklyStatus(attempts: readonly AttemptRecord[], week: number): WeeklyStatus {
  return weeklyFrom(week, attempts.filter((a) => weekKey(a.at) === week));
}

export function weeklyHistory(attempts: readonly AttemptRecord[]): WeeklyStatus[] {
  const m = new Map<number, AttemptRecord[]>();
  for (const a of attempts) {
    const k = weekKey(a.at);
    const list = m.get(k);
    if (list) list.push(a);
    else m.set(k, [a]);
  }
  return [...m].map(([week, list]) => weeklyFrom(week, list));
}

/** Days in a row with a completed task: the current run (ending today or yesterday) and the longest. */
export function streak(attempts: readonly AttemptRecord[], today: number) {
  const days = new Set(attempts.filter((a) => a.status === 'completed').map((a) => dayKey(a.at)));
  let current = 0;
  for (let d = days.has(today) ? today : today - 1; days.has(d); d--) current++;
  let longest = 0;
  for (const d of days) {
    if (days.has(d - 1)) continue;
    let n = 1;
    while (days.has(d + n)) n++;
    longest = Math.max(longest, n);
  }
  return { current, longest, today: days.has(today) };
}
