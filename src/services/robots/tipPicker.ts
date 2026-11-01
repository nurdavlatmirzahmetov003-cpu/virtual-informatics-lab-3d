/**
 * V4 §4.5: which tip a robot says and when it may speak. A click asks for
 * a tip at once (a few seconds apart, so clicks do not pile up); coming
 * close to a robot in the lab offers one far less often, and the same
 * robot does not start talking again by proximity for a while. Pure.
 */
import type { RobotId } from '@/data/robots/roster';
import { tipsOf, type Tip } from '@/data/robots/tips';

/** Milliseconds. */
export const TIP_LIMITS = { click: 4000, near: 25_000, nearSameRobot: 90_000 } as const;

export function createTipLimiter() {
  let last = -Infinity;
  const lastNear = new Map<RobotId, number>();
  return {
    allow(robot: RobotId, kind: 'click' | 'near', now: number): boolean {
      if (kind === 'click') {
        if (now - last < TIP_LIMITS.click) return false;
      } else {
        if (now - last < TIP_LIMITS.near) return false;
        if (now - (lastNear.get(robot) ?? -Infinity) < TIP_LIMITS.nearSameRobot) return false;
        lastNear.set(robot, now);
      }
      last = now;
      return true;
    },
  };
}

/** A tip of this robot: one not heard yet if there is any, otherwise any of its tips. */
export function pickTip(robot: RobotId, heard: ReadonlySet<string>, rand: () => number = Math.random): Tip {
  const all = tipsOf(robot);
  const fresh = all.filter((t) => !heard.has(t.id));
  const pool = fresh.length ? fresh : all;
  return pool[Math.floor(rand() * pool.length) % pool.length];
}
