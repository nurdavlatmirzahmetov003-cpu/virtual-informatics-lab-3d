/**
 * Experience, level and badges of the Games arena (0.37), worked out from a
 * player's best score per game — the server keeps the bests, so nothing
 * else has to be stored and nothing can be typed in.
 */
import { ARCADE_GAMES, HANDS_ON_GAMES, type ArcadeGame } from './index';

export type Bests = Partial<Record<ArcadeGame, number>>;

/** A hands-on job counts as done from this score up (a finished job earns at least 1000 − mistakes). */
const DONE = 1000;

export const BADGE_IDS = ['builder', 'engineer', 'cabler', 'detective', 'eagleEye', 'allRounder', 'champion'] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

const at = (b: Bests, g: ArcadeGame, min: number) => (b[g] ?? -1) >= min;

const RULES: Readonly<Record<BadgeId, (b: Bests) => boolean>> = {
  builder: (b) => at(b, 'phone', DONE) && at(b, 'laptop', DONE),
  engineer: (b) => at(b, 'pcbuild', DONE),
  cabler: (b) => at(b, 'plug', DONE) && at(b, 'network', DONE),
  detective: (b) => at(b, 'fault', DONE),
  eagleEye: (b) => at(b, 'device', 900),
  allRounder: (b) => ARCADE_GAMES.every((g) => b[g] !== undefined),
  champion: (b) => HANDS_ON_GAMES.some((g) => at(b, g, 1800)),
};

export const badgesOf = (b: Bests): BadgeId[] => BADGE_IDS.filter((id) => RULES[id](b));

/** Experience points: a tenth of every best score. */
export const totalXp = (b: Bests) => ARCADE_GAMES.reduce((sum, g) => sum + Math.floor((b[g] ?? 0) / 10), 0);

export const XP_PER_LEVEL = 300;

/** Level 1, 2, … and how far into the current level (0 … 1). */
export function levelOf(xp: number): { level: number; into: number; toNext: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
  return { level, into, toNext: XP_PER_LEVEL - (xp % XP_PER_LEVEL) };
}
