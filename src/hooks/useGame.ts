/**
 * The signed-in or guest student's game state (V2-11a), derived from the
 * progress store with the same pure rules the server uses: XP, level,
 * this week's XP, streak, today's challenge and this week's goals.
 */
import { useMemo } from 'react';
import { computeXp, levelOf } from '@/services/game/xp';
import { dailyStatus, dayKey, streak, weekKey, weekStart, weeklyStatus } from '@/services/progress/challenges';
import { useProgressStore } from '@/store/progressStore';
import { useNow } from './useNow';

export function useGame() {
  const attempts = useProgressStore((s) => s.attempts);
  const now = useNow();
  const day = dayKey(now);
  const week = weekKey(now);
  return useMemo(() => {
    const xp = computeXp(attempts);
    const before = computeXp(attempts, weekStart(week) - 1).total;
    return {
      xp,
      level: levelOf(xp.total),
      weekXp: xp.total - before,
      streak: streak(attempts, day),
      daily: dailyStatus(attempts, day),
      weekly: weeklyStatus(attempts, week),
    };
    // day / week, not `now`: recompute when the date turns, not every tick
  }, [attempts, day, week]);
}
