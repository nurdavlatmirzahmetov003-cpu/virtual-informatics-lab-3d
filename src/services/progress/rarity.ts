/**
 * V4 §9: every achievement has a rarity — bronze, silver, gold or legendary —
 * which sets its medal on the achievements page and the XP it gives. XP is
 * also what the robots' coins come from (services/robots/economy.ts), so a
 * rarer badge is worth more coins too: one economy. Pure, shared with the
 * server (services/game/xp.ts computes XP on both sides).
 */
import type { AchievementId } from './achievements';

export const RARITIES = ['bronze', 'silver', 'gold', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY: Record<AchievementId, Rarity> = {
  firstStep: 'bronze',
  firstComputer: 'bronze',
  halfway: 'bronze',
  streak3: 'bronze',
  dailyFive: 'bronze',
  connector: 'bronze',
  hardwareExpert: 'silver',
  networkMaster: 'silver',
  algorithmExplorer: 'silver',
  logicEngineer: 'silver',
  experimenter: 'silver',
  selfMade: 'silver',
  persistent: 'silver',
  teardownPro: 'silver',
  fixer: 'silver',
  perfectBuild: 'gold',
  lab100: 'gold',
  allRounder: 'gold',
  streak7: 'gold',
  weeklyHero: 'gold',
  speedrun: 'gold',
  graduate: 'legendary',
  honors: 'legendary',
};

/** XP per badge. Bronze keeps the old flat 100, so no one's total ever goes down. */
export const RARITY_XP: Record<Rarity, number> = { bronze: 100, silver: 150, gold: 250, legendary: 400 };

export const badgeXp = (id: AchievementId) => RARITY_XP[RARITY[id]];

/** Sort order: legendary first. */
export const rarityRank = (id: AchievementId) => RARITIES.indexOf(RARITY[id]);
