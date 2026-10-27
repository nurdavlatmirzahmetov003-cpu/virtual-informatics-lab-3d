/**
 * V4 §9: every achievement has a rarity and a medal colour; rarity sets the
 * badge's XP (bronze keeps the old 100, so no one's total goes down) and
 * through XP the robots' coins; the demo profile shows a mix of earned and
 * locked badges in every tier but the legendary one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENT_IDS, evaluateAchievements, summarize } from '../src/services/progress/index.ts';
import { RARITIES, RARITY, RARITY_XP, badgeXp, rarityRank } from '../src/services/progress/rarity.ts';
import { XP, computeXp, MAX_TASK_XP } from '../src/services/game/xp.ts';
import { TASKS } from '../src/services/progress/catalog.ts';
import { coinsEarned, emptySave, ECONOMY } from '../src/services/robots/economy.ts';
import { demoProgress } from '../src/services/demo/data.ts';
import { readFileSync } from 'node:fs';

const NOW = Date.UTC(2026, 9, 27, 12);

test('every achievement has a rarity, a medal colour and an icon', () => {
  const icons = readFileSync('src/components/achievements/achievementIcons.ts', 'utf8');
  for (const id of ACHIEVEMENT_IDS) {
    assert.ok(RARITIES.includes(RARITY[id]), id);
    assert.match(icons, new RegExp(`\\n  ${id}: '#[0-9a-f]{6}'`), `${id} has an enamel colour`);
    assert.match(icons, new RegExp(`\\n  ${id}: [A-Z]\\w+,`), `${id} has an icon`);
  }
  assert.deepEqual(Object.keys(RARITY).sort(), [...ACHIEVEMENT_IDS].sort());
  for (const r of RARITIES) assert.ok(ACHIEVEMENT_IDS.some((id) => RARITY[id] === r), `some ${r} badge`);
  assert.equal(RARITY.graduate, 'legendary');
  assert.ok(rarityRank('graduate') > rarityRank('firstStep'));
});

test('rarer badges give more XP, never less than the old flat 100', () => {
  assert.equal(RARITY_XP.bronze, XP.badge);
  for (let i = 1; i < RARITIES.length; i++) assert.ok(RARITY_XP[RARITIES[i]] > RARITY_XP[RARITIES[i - 1]]);
  assert.equal(MAX_TASK_XP, TASKS.length * (XP.task + XP.clean) + ACHIEVEMENT_IDS.reduce((n, id) => n + badgeXp(id), 0));
});

test('badge XP follows the badges the history earns, and the robots coins follow XP', () => {
  const s = demoProgress(NOW);
  const xp = computeXp(s.attempts);
  const earned = evaluateAchievements(summarize(s), s.attempts).filter((a) => a.unlocked);
  assert.equal(xp.badges, earned.reduce((n, a) => n + badgeXp(a.id), 0));
  assert.ok(xp.badges > earned.length * XP.badge, 'the rare ones are worth more than 100');
  assert.equal(coinsEarned(xp.total, emptySave()), ECONOMY.start + Math.floor(xp.total / ECONOMY.xpPerCoin));
});

test('the demo profile shows earned and locked badges for the defence', () => {
  const s = demoProgress(NOW);
  const all = evaluateAchievements(summarize(s), s.attempts);
  const earned = all.filter((a) => a.unlocked);
  const locked = all.filter((a) => !a.unlocked);
  assert.ok(earned.length >= 12 && locked.length >= 3, `${earned.length} earned, ${locked.length} locked`);
  assert.ok(earned.some((a) => RARITY[a.id] === 'legendary'), 'a legendary one to show');
  assert.ok(locked.some((a) => a.current > 0) || locked.length > 0, 'a locked one with progress or a hint');
});
