/**
 * Achievements. Each is a pure check over the progress summary that returns
 * how far the student is (current / target), so locked achievements can show
 * "2 / 4" next to their condition. Names and conditions are locale keys:
 * achievements.items.<id>.name / .condition. The V2-11a badges also read
 * the attempt history (streaks, challenges, speed).
 */
import { CONNECT_TASKS, TEARDOWN_TASKS, taskById, tasksOf, type LabId } from './catalog';
import { dailyHistory, streak, weeklyHistory } from './challenges';
import { summarize, type ProgressSummary } from './summary';
import type { AttemptRecord, ProgressSnapshot } from './types';

export const ACHIEVEMENT_IDS = [
  'firstStep',
  'firstComputer',
  'perfectBuild',
  'hardwareExpert',
  'networkMaster',
  'algorithmExplorer',
  'logicEngineer',
  'experimenter',
  'lab100',
  'selfMade',
  'persistent',
  'allRounder',
  'halfway',
  'graduate',
  // 0.36: every task done with an average of 90 % or more — the commendation's badge
  'honors',
  // V2-11a
  'streak3',
  'streak7',
  'dailyFive',
  'weeklyHero',
  'teardownPro',
  'connector',
  'fixer',
  'speedrun',
] as const;
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export interface AchievementProgress {
  id: AchievementId;
  current: number;
  target: number;
  unlocked: boolean;
}

type Check = (s: ProgressSummary, attempts: readonly AttemptRecord[]) => { current: number; target: number };

const done = (s: ProgressSummary, id: string) => s.tasks.some((t) => t.info.id === id && t.status === 'completed');
/** Hands-on lab tasks (not quizzes) for the speed badge. */
const HANDS_ON = new Set(['assembly', 'network', 'logic', 'connect', 'sim']);
export const SPEEDRUN_SECONDS = 120;

const completedIn = (s: ProgressSummary, lab: LabId) => ({ current: s.labs.find((l) => l.lab === lab)!.completed, target: tasksOf(lab).length });
const count = (n: number, target: number) => ({ current: Math.min(n, target), target });

const CHECKS: Record<AchievementId, Check> = {
  firstStep: (s) => count(s.totals.completed, 1),
  // the PC build itself (the assembly lab also holds the V2-6 "connect the PC" task)
  firstComputer: (s) => count(s.tasks.some((t) => t.info.id === 'assembly' && t.status === 'completed') ? 1 : 0, 1),
  // the whole build with nothing wrong: 10/10, no mistakes, no hints
  perfectBuild: (s) => {
    const best = s.tasks.find((t) => t.info.id === 'assembly')?.progress?.best;
    return count(best && best.status === 'completed' && best.percent === 100 && best.errors === 0 && best.hints === 0 ? 1 : 0, 1);
  },
  hardwareExpert: (s) => count(s.labs.find((l) => l.lab === 'hardware')!.completed, 10),
  networkMaster: (s) => completedIn(s, 'network'),
  algorithmExplorer: (s) => completedIn(s, 'algorithms'),
  logicEngineer: (s) => completedIn(s, 'logic'),
  experimenter: (s) => completedIn(s, 'experiments'),
  // one whole laboratory with every task at 100 %
  lab100: (s) => count(s.labs.some((l) => l.perfect) ? 1 : 0, 1),
  selfMade: (s) => count(s.tasks.filter((t) => t.status === 'completed' && t.progress!.best.status === 'completed' && t.progress!.best.hints === 0).length, 5),
  // finished a task that took three or more attempts
  persistent: (s) => count(s.tasks.some((t) => (t.progress?.completedOnAttempt ?? 0) >= 3) ? 1 : 0, 1),
  allRounder: (s) => count(s.labs.filter((l) => l.completed > 0).length, s.labs.length),
  halfway: (s) => count(s.totals.completed, Math.ceil(s.totals.tasks / 2)),
  graduate: (s) => count(s.totals.completed, s.totals.tasks),
  honors: (s) => count(s.totals.completed >= s.totals.tasks && (s.totals.average ?? 0) >= 90 ? 1 : 0, 1),
  streak3: (_, a) => count(streak(a, 0).longest, 3),
  streak7: (_, a) => count(streak(a, 0).longest, 7),
  dailyFive: (_, a) => count(dailyHistory(a).filter((d) => d.complete).length, 5),
  weeklyHero: (_, a) => count(weeklyHistory(a).some((w) => w.complete) ? 1 : 0, 1),
  teardownPro: (s) => count(TEARDOWN_TASKS.filter((t) => done(s, `teardown:${t}`)).length, TEARDOWN_TASKS.length),
  connector: (s) => count(CONNECT_TASKS.filter((t) => done(s, `connect:${t}`)).length, CONNECT_TASKS.length),
  fixer: (s) => count(s.tasks.find((t) => t.info.id === 'sim:fix')?.progress?.best.percent === 100 ? 1 : 0, 1),
  // a hands-on lab task done perfectly within two minutes
  speedrun: (_, a) => count(a.some((x) => x.percent === 100 && x.seconds <= SPEEDRUN_SECONDS && HANDS_ON.has(taskById(x.exerciseId)?.type ?? '')) ? 1 : 0, 1),
};

export function evaluateAchievements(summary: ProgressSummary, attempts: readonly AttemptRecord[] = []): AchievementProgress[] {
  return ACHIEVEMENT_IDS.map((id) => {
    const { current, target } = CHECKS[id](summary, attempts);
    return { id, current, target, unlocked: current >= target };
  });
}

/**
 * Records newly unlocked achievements with their time. Never removes one:
 * an achievement stays even if a later import or migration changes scores.
 */
export function unlockAchievements(s: ProgressSnapshot, now = Date.now()): { snapshot: ProgressSnapshot; unlocked: AchievementId[] } {
  const unlocked = evaluateAchievements(summarize(s), s.attempts)
    .filter((a) => a.unlocked && s.achievements[a.id] === undefined)
    .map((a) => a.id);
  if (!unlocked.length) return { snapshot: s, unlocked };
  const achievements = { ...s.achievements };
  for (const id of unlocked) achievements[id] = now;
  return { snapshot: { ...s, achievements }, unlocked };
}

export const isAchievementId = (v: unknown): v is AchievementId => ACHIEVEMENT_IDS.includes(v as AchievementId);
