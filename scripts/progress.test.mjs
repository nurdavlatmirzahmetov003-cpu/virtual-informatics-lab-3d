import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TASKS, LAB_IDS, taskById, labOf,
  applyAttempt, emptySnapshot, mergeSnapshots, rebuild, isBetter,
  migrateProgress, readEnvelope, fromPrototype,
  summarize, recommendNext, activityByDay,
  ACHIEVEMENT_IDS, evaluateAchievements, unlockAchievements,
  buildExport, parseImport,
  createLocalProgressRepository, memoryStore, PROTOTYPE_KEY, PROGRESS_VERSION, MAX_ATTEMPTS,
} from '../src/services/progress/index.ts';
import { NETWORK_TASKS } from '../src/labs/NetworkLab/tasks.ts';
import { LOGIC_TASKS } from '../src/labs/LogicLab/tasks.ts';
import { QUIZZES } from '../src/labs/AlgorithmLab/quizzes.ts';
import { ASSEMBLY_EXERCISE } from '../src/labs/AssemblyLab/exercise.ts';
import { ANATOMY_ITEMS } from '../src/data/hardware/anatomy.ts';
import { anatomyExercise } from '../src/data/hardware/anatomyQuiz.ts';
import { OWN_QUIZ_DEVICES } from '../src/data/devices/devices.ts';
import { deviceExercise } from '../src/data/devices/deviceQuiz.ts';
import { TEARDOWN_IDS } from '../src/data/teardown/teardowns.ts';
import { teardownExercise } from '../src/data/teardown/teardownQuiz.ts';
import { CONNECT_EXERCISES } from '../src/labs/ConnectLab/index.ts';
import { FIX_EXERCISE } from '../src/labs/SystemSim/index.ts';
import * as cpuTemp from '../src/labs/Experiments/cpuTemp.ts';
import * as memory from '../src/labs/Experiments/memory.ts';
import * as storage from '../src/labs/Experiments/storage.ts';
import * as latency from '../src/labs/Experiments/latency.ts';
import * as binary from '../src/labs/Experiments/binary.ts';
import * as cpuCycle from '../src/labs/Experiments/cpuCycle.ts';
import * as rgb from '../src/labs/Experiments/rgb.ts';
import * as resolution from '../src/labs/Experiments/resolution.ts';
import * as refresh from '../src/labs/Experiments/refresh.ts';
import { setProgressRepository, useProgressStore } from '../src/store/progressStore.ts';

let n = 0;
/** A stored attempt; percent drives score out of 10. */
const rec = (exerciseId, percent, at, extra = {}) => ({
  id: `t${++n}`, exerciseId, score: Math.round(percent / 10), maxScore: 10, percent,
  seconds: 30, errors: 0, hints: 0, status: percent === 100 ? 'completed' : 'incomplete', at, ...extra,
});
const report = (exerciseId, score, status = 'completed', extra = {}) => ({
  exerciseId, score, maxScore: 10, percent: score * 10, seconds: 42, errors: 0, hints: 0, submissions: 1, penalty: 0, status, outcomes: [], ...extra,
});
const complete = (s, ids, extra) => ids.reduce((acc, id, i) => applyAttempt(acc, rec(id, 100, 1000 + i, extra)), s);
const legacy = (exercise, score, completedAt) => ({ exercise, score, maxScore: 100, seconds: 12, errors: 1, hints: 0, completedAt });

test('catalog matches every real exercise: ids, types, max score and instruction keys', () => {
  const experiments = { cpuTemp, memory, storage, latency, binaryData: binary, cpuCycle, rgb, resolution, refresh };
  const real = [
    ...ANATOMY_ITEMS.map(anatomyExercise),
    ...OWN_QUIZ_DEVICES.map(deviceExercise),
    ...TEARDOWN_IDS.map(teardownExercise),
    ASSEMBLY_EXERCISE,
    ...Object.values(CONNECT_EXERCISES),
    ...Object.values(NETWORK_TASKS),
    ...Object.values(QUIZZES),
    ...Object.values(LOGIC_TASKS),
    ...Object.entries(experiments).map(([, m]) => m.exercise()),
    FIX_EXERCISE,
  ];
  assert.equal(real.length, TASKS.length, 'every exercise is in the catalog and vice versa');
  for (const ex of real) {
    const info = taskById(ex.id);
    assert.ok(info, `${ex.id} is catalogued`);
    assert.equal(info.type, ex.type, `${ex.id} type`);
    assert.equal(info.maxScore, ex.maxScore, `${ex.id} maxScore`);
    assert.equal(info.instructions, ex.instructions.key, `${ex.id} instructions`);
    assert.equal(info.expected, ex.expectedResult.key, `${ex.id} expected`);
  }
  assert.equal(new Set(TASKS.map((t) => t.id)).size, TASKS.length, 'ids are unique');
  assert.deepEqual([...new Set(TASKS.map((t) => t.lab))], [...LAB_IDS], 'labs in learning order');
  assert.equal(labOf('network:lan'), 'network', 'retired ids still map to their lab');
  assert.equal(labOf('legacy:algorithms'), 'algorithms');
});

test('every catalog and achievement text exists in kk, ru and en', () => {
  const get = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  for (const lang of ['kk', 'ru', 'en']) {
    const dict = JSON.parse(readFileSync(new URL(`../src/locales/${lang}.json`, import.meta.url), 'utf8'));
    const keys = [
      ...TASKS.flatMap((t) => [t.title, t.summary, t.instructions, t.expected]),
      ...ACHIEVEMENT_IDS.flatMap((id) => [`achievements.items.${id}.name`, `achievements.items.${id}.condition`]),
      ...LAB_IDS.map((l) => `labs.modules.${l}.title`),
    ];
    for (const k of keys) assert.equal(typeof get(dict, k), 'string', `${lang}: ${k}`);
  }
});

test('repeated attempts keep the best result and every attempt; history is capped, summaries are not', () => {
  let s = emptySnapshot(0);
  s = applyAttempt(s, rec('logic:and', 60, 10));
  s = applyAttempt(s, rec('logic:and', 90, 20, { status: 'incomplete' }));
  s = applyAttempt(s, rec('logic:and', 80, 30, { status: 'completed' }));
  s = applyAttempt(s, rec('logic:and', 50, 40));
  const e = s.exercises['logic:and'];
  assert.equal(e.attempts, 4);
  assert.equal(e.best.percent, 90, 'best = highest percent');
  assert.equal(e.completedAt, 30);
  assert.equal(e.completedOnAttempt, 3);
  assert.equal(e.firstAt, 10);
  assert.equal(e.lastAt, 40);
  assert.equal(s.attempts.length, 4);

  assert.ok(isBetter(rec('x', 80, 1, { status: 'completed' }), rec('x', 80, 1)), 'completed wins a tie');
  assert.ok(isBetter(rec('x', 80, 1, { hints: 0 }), rec('x', 80, 1, { hints: 2 })), 'fewer hints win a tie');

  for (let i = 0; i < MAX_ATTEMPTS + 5; i++) s = applyAttempt(s, rec('network:repair', 10, 100 + i));
  assert.equal(s.attempts.length, MAX_ATTEMPTS);
  assert.equal(s.exercises['logic:and'].best.percent, 90, 'trimmed history keeps the best');
  assert.equal(s.exercises['network:repair'].attempts, MAX_ATTEMPTS + 5);
});

test('migration v1 → v3: scores move to /10, the old 70 % pass mark decides status, junk is skipped', () => {
  const s = migrateProgress({ attempts: [legacy('assembly', 85, 1000), legacy('logic:and', 40, 2000), { exercise: 'bad', score: 900 }, null] }, 1, 5);
  assert.equal(s.attempts.length, 2);
  assert.deepEqual(
    { score: s.exercises.assembly.best.score, max: s.exercises.assembly.best.maxScore, percent: s.exercises.assembly.best.percent },
    { score: 9, max: 10, percent: 85 },
  );
  assert.equal(s.exercises.assembly.completedAt, 1000);
  assert.equal(s.exercises['logic:and'].completedAt, undefined);
  assert.equal(s.meta.createdAt, 5);
});

test('migration v2 → v3 keeps lifetime bests trimmed from history without double counting', () => {
  const best = legacy('assembly', 100, 1);
  const s = migrateProgress({ attempts: [legacy('assembly', 50, 9), best], best: [best, legacy('network:connect3', 70, 3)] }, 2);
  assert.equal(s.exercises.assembly.attempts, 2, 'the best entry also in attempts is counted once');
  assert.equal(s.exercises.assembly.best.percent, 100);
  assert.equal(s.exercises['network:connect3'].best.percent, 70, 'a best that was trimmed from attempts survives');
});

test('v3 validation drops corrupt parts only and rebuilds lost summaries', () => {
  const good = rec('rgb', 100, 50);
  const good2 = rec('experiment:rgb', 70, 60);
  const s = migrateProgress({
    attempts: [good, good2, { ...rec('x', 50, 1), percent: 500 }, 'oops'],
    exercises: { rgb: { best: good, attempts: 1, firstAt: 50, lastAt: 50, completedAt: 50 }, broken: { best: null } },
    achievements: { firstStep: 123, bad: 'yesterday' },
    meta: { createdAt: 7, legacyImported: true },
  }, 3);
  assert.equal(s.attempts.length, 2);
  assert.ok(s.exercises.rgb);
  assert.ok(!s.exercises.broken);
  assert.equal(s.exercises['experiment:rgb'].attempts, 1, 'summary rebuilt from attempts');
  assert.deepEqual(s.achievements, { firstStep: 123 });
  assert.equal(s.meta.legacyImported, true);
  assert.equal(readEnvelope(null).snapshot.attempts.length, 0, 'nothing stored → empty');
});

test('local repository upgrades old data in place, backs it up, keeps corrupt text and imports the prototype once', () => {
  const kv = memoryStore();
  const key = 'test:progress';
  const old = JSON.stringify({ state: { attempts: [legacy('assembly', 100, 10)], best: [] }, version: 2 });
  kv.setItem(key, old);
  kv.setItem(PROTOTYPE_KEY, JSON.stringify({ assemble: 20, network: 8, algo: 0, bogus: 5 }));
  const repo = createLocalProgressRepository(kv, key);

  const s = repo.load();
  assert.equal(s.exercises.assembly.best.percent, 100);
  assert.equal(s.exercises['legacy:assembly'].best.status, 'completed', 'prototype 20/20 counts as passed');
  assert.equal(s.exercises['legacy:network'].best.percent, 40);
  assert.equal(s.exercises['legacy:algorithms'], undefined, 'zero scores are not history');
  assert.equal(kv.getItem(`${key}:backup-v2`), old, 'original v2 text is backed up');

  repo.save(s);
  const saved = JSON.parse(kv.getItem(key));
  assert.equal(saved.version, PROGRESS_VERSION);
  assert.equal(saved.state.meta.legacyImported, true);
  assert.equal(repo.load().attempts.length, s.attempts.length, 'prototype is not imported twice');

  kv.setItem(key, '{not json');
  assert.ok(repo.load().attempts.every((a) => a.exerciseId.startsWith('legacy:')), 'only the prototype history can be recovered');
  assert.equal(kv.getItem(`${key}:corrupt`), '{not json', 'unreadable data is kept, not silently lost');
  assert.deepEqual(fromPrototype('nonsense'), []);
});

test('summary, statuses and the recommended next task', () => {
  const empty = summarize(emptySnapshot());
  assert.equal(empty.totals.tasks, TASKS.length);
  assert.equal(empty.totals.average, null);
  assert.deepEqual(recommendNext(empty), { task: empty.tasks[0], reason: 'order' });

  let s = applyAttempt(emptySnapshot(), rec('network:connect3', 100, 10));
  let sum = summarize(s);
  assert.equal(sum.tasks.find((t) => t.info.id === 'network:connect3').status, 'completed');
  let next = recommendNext(sum);
  assert.equal(next.reason, 'sameLab');
  assert.equal(next.task.info.id, 'network:routerLan');

  s = applyAttempt(s, rec('logic:xorBasic', 40, 20));
  sum = summarize(s);
  next = recommendNext(sum);
  assert.equal(next.reason, 'continue');
  assert.equal(next.task.status, 'inProgress');
  assert.equal(sum.totals.completed, 1);
  assert.equal(sum.totals.inProgress, 1);
  assert.equal(sum.totals.points, 14);
  assert.equal(sum.totals.average, 70);
  assert.equal(sum.labs.find((l) => l.lab === 'network').completed, 1);

  const all = complete(emptySnapshot(), TASKS.map((t) => t.id));
  const full = summarize(all);
  assert.equal(recommendNext(full), null);
  assert.equal(full.totals.percent, 100);
  assert.equal(full.totals.labsCompleted, LAB_IDS.length);
});

test('activity is bucketed per local day for the last 14 days', () => {
  const now = new Date(2026, 9, 5, 15, 0).getTime();
  const day = 86_400_000;
  const days = activityByDay([rec('a', 100, now - 1000), rec('b', 50, now - 2 * day), rec('c', 50, now - 20 * day)], 14, now);
  assert.equal(days.length, 14);
  assert.equal(days[13].attempts, 1);
  assert.equal(days[13].completed, 1);
  assert.equal(days[11].attempts, 1);
  assert.equal(days.reduce((s, d) => s + d.attempts, 0), 2, 'older attempts are outside the window');
});

test('achievements unlock from real conditions and are never taken back', () => {
  const ids = (s) => evaluateAchievements(summarize(s)).filter((a) => a.unlocked).map((a) => a.id);
  assert.deepEqual(ids(emptySnapshot()), []);

  let s = applyAttempt(emptySnapshot(), rec('assembly', 100, 1, { status: 'completed', errors: 2 }));
  assert.ok(ids(s).includes('firstComputer'));
  assert.ok(ids(s).includes('firstStep'));
  assert.ok(!ids(s).includes('perfectBuild'), 'mistakes rule out Perfect Build');
  s = applyAttempt(s, rec('assembly', 100, 2, { status: 'completed' }));
  assert.ok(ids(s).includes('perfectBuild'));
  assert.ok(!ids(s).includes('lab100'), 'the assembly lab also holds "connect the PC"');
  s = complete(s, ['connect:pc']);
  assert.ok(ids(s).includes('lab100'), 'both assembly-lab tasks at 100 %');

  s = complete(s, ['network:connect3', 'network:routerLan', 'network:addressing']);
  assert.ok(!ids(s).includes('networkMaster'));
  assert.equal(evaluateAchievements(summarize(s)).find((a) => a.id === 'networkMaster').current, 3);
  s = complete(s, ['network:repair']);
  assert.ok(!ids(s).includes('networkMaster'), 'the Ethernet and Wi-Fi tasks count for networking too');
  s = complete(s, ['connect:ethernet', 'connect:wifi']);
  assert.ok(ids(s).includes('networkMaster'));

  let p = emptySnapshot();
  p = applyAttempt(p, rec('logic:and', 20, 1));
  p = applyAttempt(p, rec('logic:and', 40, 2));
  p = applyAttempt(p, rec('logic:and', 100, 3));
  assert.ok(ids(p).includes('persistent'));

  const first = unlockAchievements(s, 500);
  assert.ok(first.unlocked.includes('networkMaster'));
  assert.equal(first.snapshot.achievements.networkMaster, 500);
  const again = unlockAchievements(first.snapshot, 900);
  assert.deepEqual(again.unlocked, [], 'already unlocked ones are not announced again');
  const shrunk = unlockAchievements({ ...first.snapshot, exercises: {} }, 900);
  assert.equal(shrunk.snapshot.achievements.networkMaster, 500, 'kept even if the scores are gone');

  const graduate = evaluateAchievements(summarize(complete(emptySnapshot(), TASKS.map((t) => t.id))));
  // the V2-11a history badges need days, weeks and timing, not just finished tasks
  const HISTORY = ['perfectBuild', 'persistent', 'streak3', 'streak7', 'dailyFive', 'weeklyHero', 'speedrun'];
  assert.ok(graduate.every((a) => HISTORY.includes(a.id) || a.unlocked), graduate.filter((a) => !a.unlocked && !HISTORY.includes(a.id)).map((a) => a.id).join());
});

test('export → import round trip; import merges without duplicates and rejects foreign files', () => {
  let s = applyAttempt(emptySnapshot(1), rec('rgb', 80, 10));
  s = applyAttempt(s, rec('experiment:rgb', 100, 20));
  s = { ...s, achievements: { firstStep: 20 } };
  const file = JSON.stringify(buildExport(s, Date.UTC(2026, 9, 5)));
  const parsed = parseImport(file);
  assert.equal(parsed.ok, true);
  assert.equal(JSON.parse(file).summary.tasks.find((t) => t.id === 'experiment:rgb').best, '10/10');

  const mine = applyAttempt(emptySnapshot(5), rec('logic:and', 50, 30));
  const merged = mergeSnapshots(mine, parsed.snapshot);
  assert.equal(merged.attempts.length, 3);
  assert.equal(merged.exercises['experiment:rgb'].best.percent, 100);
  assert.equal(merged.achievements.firstStep, 20);
  // compared as stored (JSON): optional fields may be absent or undefined
  assert.equal(JSON.stringify(mergeSnapshots(merged, parsed.snapshot)), JSON.stringify(merged), 'importing the same file twice changes nothing');

  assert.deepEqual(parseImport('nope'), { ok: false, error: 'notJson' });
  assert.deepEqual(parseImport('{"app":"other","kind":"progress","version":3,"data":{}}'), { ok: false, error: 'wrongFile' });
  assert.deepEqual(parseImport(JSON.stringify(buildExport(emptySnapshot()))), { ok: false, error: 'empty' });
  assert.deepEqual(parseImport('x'.repeat(2_000_001)), { ok: false, error: 'tooLarge' });
});

test('store: record → summary, achievement toast, persisted v3; import counts new attempts; reset keeps the prototype mark', async () => {
  const kv = memoryStore();
  await setProgressRepository(createLocalProgressRepository(kv, 'store:test'));
  const store = useProgressStore;
  assert.equal(store.getState().hydrated, true);
  assert.equal(store.getState().attempts.length, 0);

  store.getState().record(report('logic:and', 6, 'incomplete'));
  store.getState().record(report('logic:and', 9, 'completed', { hints: 1 }));
  const st = store.getState();
  assert.equal(st.exercises['logic:and'].attempts, 2);
  assert.equal(st.exercises['logic:and'].best.score, 9);
  assert.deepEqual(st.toasts, ['firstStep']);
  st.dismissToast('firstStep');
  assert.deepEqual(store.getState().toasts, []);

  const saved = JSON.parse(kv.getItem('store:test'));
  assert.equal(saved.version, PROGRESS_VERSION);
  assert.equal(saved.state.attempts.length, 2);

  const incoming = rebuild([rec('network:connect3', 100, 5)]);
  assert.deepEqual(store.getState().importSnapshot(incoming), { added: 1 });
  assert.deepEqual(store.getState().importSnapshot(incoming), { added: 0 });

  store.getState().reset();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(store.getState().attempts.length, 0);
  assert.deepEqual(store.getState().achievements, {});
  assert.equal(JSON.parse(kv.getItem('store:test')).state.meta.legacyImported, true);

  // reload: same data comes back from storage
  store.getState().record(report('assembly', 10));
  await setProgressRepository(createLocalProgressRepository(kv, 'store:test'));
  assert.equal(store.getState().exercises.assembly.best.score, 10);
});
