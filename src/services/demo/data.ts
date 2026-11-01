/**
 * V4 §8.4: the demo profile's sample data — pure, no storage. Three weeks of
 * work on every task (a few first tries that needed a second go, a streak
 * up to today, an average above 90 %), and robots trained and dressed with
 * coins that the demo XP really earns (the same economy as a student's).
 */
import { ROBOT_IDS, type RobotId } from '@/data/robots/roster';
import { computeXp } from '@/services/game/xp';
import { applyAttempt, emptySnapshot, TASKS, unlockAchievements, type AttemptRecord, type ProgressSnapshot } from '@/services/progress';
import { buy, canWear, emptySave, ITEMS, train, wear, type RobotSave } from '@/services/robots/economy';
import { TIPS } from '@/data/robots/tips';

const DAY = 86_400_000;

/** Deterministic pseudo-random numbers: the same demo every time. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function attempt(exerciseId: string, maxScore: number, percent: number, at: number, n: number, rand: () => number): AttemptRecord {
  const score = Math.round((maxScore * percent) / 100);
  return {
    id: `demo-${exerciseId}-${n}`,
    exerciseId,
    score,
    maxScore,
    percent: Math.round((score / maxScore) * 100),
    seconds: 60 + Math.round(rand() * 420),
    errors: percent >= 100 ? 0 : Math.round(rand() * 3),
    hints: rand() < 0.2 ? 1 : 0,
    status: percent >= 60 ? 'completed' : 'incomplete',
    at,
  };
}

/** Every task done over the last three weeks; achievements unlock on the day they were earned. */
export function demoProgress(now = Date.now()): ProgressSnapshot {
  const rand = rng(2026);
  const start = now - 21 * DAY;
  let snapshot: ProgressSnapshot = { ...emptySnapshot(start), meta: { createdAt: start, legacyImported: true } };
  const record = (a: AttemptRecord) => {
    snapshot = unlockAchievements(applyAttempt(snapshot, a), a.at).snapshot;
  };
  TASKS.forEach((task, i) => {
    // spread over 21 days, the last week every day (a streak), finishing an hour ago
    const at = Math.min(now - 3_600_000, start + Math.round((i / TASKS.length) * 20 * DAY) + 9 * 3_600_000 + Math.round(rand() * 6 * 3_600_000));
    // one in five needed a second try
    if (i % 5 === 2) record(attempt(task.id, task.maxScore, 40 + Math.round(rand() * 15), at - 20 * 60_000, 1, rand));
    record(attempt(task.id, task.maxScore, i % 3 === 0 ? 100 : 86 + Math.round(rand() * 14), at, 2, rand));
  });
  return snapshot;
}

/** Target levels (1..5) per robot: a mix, so the training and the unlocks both show. */
const LEVELS: Record<RobotId, number> = { guide: 5, cleaner: 2, cargo: 2, presenter: 3, assembler: 4, teacher: 2, guard: 2, inspector: 3, librarian: 2, coach: 2 };

/** Robots trained and dressed with what the demo XP earns: every step goes through the real economy. */
export function demoRobots(progress: ProgressSnapshot, now = Date.now()): RobotSave {
  const xp = computeXp(progress.attempts).total;
  // a third of the tips already heard (each brings a coin bonus)
  let save: RobotSave = { ...emptySave(), tips: TIPS.filter((_, i) => i % 3 === 0).map((tip) => tip.id) };
  for (let level = 2; level <= 5; level++) {
    for (const id of ROBOT_IDS) {
      if (LEVELS[id] < level) continue;
      const r = train(save, xp, id);
      if (r.ok) save = r.save;
    }
  }
  // the cheaper half of the wardrobe first, then what is left of the coins
  for (const item of [...ITEMS].sort((a, b) => a.price - b.price)) {
    const r = buy(save, xp, item.id);
    if (r.ok) save = r.save;
  }
  // each robot wears what fits it, a different shirt each
  ROBOT_IDS.forEach((robot, i) => {
    const shirts = save.owned.filter((id) => ITEMS.find((it) => it.id === id)?.slot === 'shirt');
    const picks = [shirts[i % Math.max(1, shirts.length)], ...save.owned.filter((id) => ITEMS.find((it) => it.id === id)?.slot !== 'shirt')];
    for (const id of picks) {
      if (!id || canWear(save, robot, id) !== 'ok') continue;
      const slot = ITEMS.find((it) => it.id === id)!.slot;
      if (save.wear[robot]?.[slot]) continue;
      // not everyone in the same hat: every other robot skips the hat
      if (slot === 'hat' && i % 2) continue;
      save = wear(save, robot, slot, id);
    }
  });
  return { ...save, updatedAt: now };
}
