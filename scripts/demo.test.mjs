/**
 * V4 §8.4 demo mode and §8.1 certificate codes: the demo profile is complete
 * (every task, a commendation average, achievements part-earned, robots
 * trained and dressed within what the demo XP earns), lives in its own
 * storage namespace (the real data is never read, written or deleted),
 * resets to the same start, and its certificate codes never pass as real.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// a localStorage for the demo seeding (installed before the modules read it)
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};
// Object.keys(localStorage) lists the keys in a browser; give the mock the same shape
const keysProxy = new Proxy(globalThis.localStorage, { ownKeys: () => [...store.keys()], getOwnPropertyDescriptor: (_, k) => (store.has(k) ? { enumerable: true, configurable: true, value: store.get(k) } : undefined) });
globalThis.localStorage = keysProxy;

const { ACHIEVEMENT_IDS, TASKS, summarize, readEnvelope } = await import('../src/services/progress/index.ts');
const { computeXp } = await import('../src/services/game/xp.ts');
const { balance, normalizeSave, levelOfRobot } = await import('../src/services/robots/economy.ts');
const { ROBOT_IDS } = await import('../src/data/robots/roster.ts');
const { demoProgress, demoRobots } = await import('../src/services/demo/data.ts');
const { seedDemo, clearDemoData } = await import('../src/services/demo/mode.ts');
const { DEMO_CODE_PREFIX, demoCode, isDemoCode } = await import('../src/services/certificate/codes.ts');

const NOW = Date.UTC(2026, 9, 27, 12);

test('demo progress: every task done, commendation average, part of the achievements, nothing in the future', () => {
  const s = demoProgress(NOW);
  const sum = summarize(s);
  assert.equal(sum.totals.completed, TASKS.length);
  assert.equal(sum.totals.tasks, TASKS.length);
  assert.ok(sum.totals.average >= 90, `average ${sum.totals.average}`);
  const earned = Object.keys(s.achievements);
  assert.ok(earned.length >= ACHIEVEMENT_IDS.length / 2, `${earned.length} achievements`);
  assert.ok(earned.length < ACHIEVEMENT_IDS.length, 'some achievements are still to earn');
  assert.ok(earned.includes('graduate') && earned.includes('honors'));
  assert.ok(s.attempts.every((a) => a.at < NOW && a.at > NOW - 22 * 86_400_000));
  assert.ok(s.attempts.some((a) => a.status === 'incomplete'), 'a few first tries needed a second go');
  assert.ok(s.meta.legacyImported, 'the old prototype data is never folded into the demo');
  assert.deepEqual(demoProgress(NOW), s, 'the same demo every time');
});

test('demo robots: trained and dressed with coins the demo XP really earns', () => {
  const p = demoProgress(NOW);
  const save = demoRobots(p, NOW);
  assert.deepEqual(normalizeSave(save), save, 'a valid save (owned, allowed, in its slot)');
  assert.ok(balance(computeXp(p.attempts).total, save) >= 0, 'not overspent');
  assert.ok(ROBOT_IDS.some((id) => levelOfRobot(save, id) === 5), 'someone at the top level');
  assert.ok(ROBOT_IDS.every((id) => levelOfRobot(save, id) >= 2), 'everyone trained');
  assert.ok(save.owned.length >= 6, `${save.owned.length} items`);
  const dressed = ROBOT_IDS.filter((id) => Object.keys(save.wear[id] ?? {}).length > 0);
  assert.ok(dressed.length >= 8, `${dressed.length} robots dressed`);
});

test('demo data lives in its own namespace: the real data is never touched, reset gives the start back', () => {
  store.clear();
  store.set('vil3d:progress', '{"real":true}');
  store.set('vil3d:robots', '{"real":true}');
  store.set('vil3d:settings', '{"theme":"dark"}');
  seedDemo(NOW);
  assert.equal(store.get('vil3d:progress'), '{"real":true}');
  assert.equal(store.get('vil3d:robots'), '{"real":true}');
  const env = readEnvelope(JSON.parse(store.get("vil3d:demo:progress")));
  assert.equal(summarize(env.snapshot).totals.completed, TASKS.length);
  assert.ok(store.has('vil3d:demo:robots'));

  // play with the demo, then reset: back to the start
  store.set('vil3d:demo:robots', '{"v":1,"owned":[],"wear":{},"levels":{},"tips":[],"updatedAt":1}');
  store.set('vil3d:demo:certificate', 'DEMO-AAAA-BBBB');
  seedDemo(NOW);
  assert.deepEqual(JSON.parse(store.get('vil3d:demo:robots')), demoRobots(demoProgress(NOW), NOW));
  assert.ok(!store.has('vil3d:demo:certificate'), 'a fresh demo certificate code');

  // leaving the demo deletes only the demo keys
  clearDemoData();
  assert.deepEqual([...store.keys()].sort(), ['vil3d:progress', 'vil3d:robots', 'vil3d:settings']);
});

test('the demo flag switches the data namespace, not the settings', async () => {
  const real = await import('../src/lib/storage.ts?real');
  assert.equal(real.DEMO_ACTIVE, false);
  assert.equal(real.STORAGE_KEYS.progress, 'vil3d:progress');
  globalThis.sessionStorage = { getItem: (k) => (k === 'vil3d:demo' ? '1' : null) };
  try {
    const demo = await import('../src/lib/storage.ts?demo');
    assert.equal(demo.DEMO_ACTIVE, true);
    assert.equal(demo.DATA_NAMESPACE, 'vil3d:demo');
    assert.equal(demo.STORAGE_KEYS.progress, 'vil3d:demo:progress');
    assert.equal(demo.STORAGE_KEYS.settings, 'vil3d:settings', 'the theme and language stay the same');
  } finally {
    delete globalThis.sessionStorage;
  }
});

test('certificate codes: demo ones are marked and never look like a real BL- code', () => {
  for (let i = 0; i < 200; i++) {
    const c = demoCode();
    assert.match(c, /^DEMO-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    assert.ok(isDemoCode(c) && isDemoCode(c.toLowerCase()) && isDemoCode(` ${c}`));
  }
  assert.equal(DEMO_CODE_PREFIX, 'DEMO-');
  assert.ok(!isDemoCode('BL-ABCD-EFGH'));
});
