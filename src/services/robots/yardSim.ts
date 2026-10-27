/**
 * V4 §4.3: the one running robots' yard of this browser tab. The lab's
 * zone 11 and the «Біздің роботтар» page both show it: whichever is open
 * steps it, so a robot charging in the lab is still charging on the page.
 * On Low the robots that also work in the hall stay on duty there (four
 * fewer in the yard); a change of quality or of a robot's level starts a
 * fresh day.
 */
import type { RobotId } from '@/data/robots/roster';
import { createYard, stepYard, type YardEvent, type YardWorld } from '@/lib/robots/life';

/** On Low these are on duty in the hall, not in the yard. */
export const AWAY_ON_LOW: readonly RobotId[] = ['guide', 'presenter', 'teacher', 'assembler'];

let world: YardWorld | null = null;
let key = '';
const listeners = new Set<(e: YardEvent) => void>();

export function yardWorld(low: boolean, levels: Partial<Record<RobotId, number>>): YardWorld {
  const k = JSON.stringify([low, levels]);
  if (!world || k !== key) {
    const prev = world;
    world = createYard({ seed: Math.floor(Date.now() / 1000) & 0xffff, away: low ? AWAY_ON_LOW : [], levels });
    // a new level keeps the day going: batteries and states carry over where they can
    if (prev) for (const a of world.agents) {
      const old = prev.agents.find((b) => b.id === a.id);
      if (old && old.state !== 'away' && a.state !== 'away') a.battery = old.battery;
    }
    key = k;
  }
  return world;
}

/** Advances the yard by real seconds (in steps the walking can take), up to a minute behind. */
export function advanceYard(w: YardWorld, seconds: number, maxStep = 0.1) {
  let left = Math.min(seconds, 60);
  while (left > 1e-6) {
    const dt = Math.min(maxStep, left);
    for (const e of stepYard(w, dt)) listeners.forEach((fn) => fn(e));
    left -= dt;
  }
}

export function onYardEvent(fn: (e: YardEvent) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
