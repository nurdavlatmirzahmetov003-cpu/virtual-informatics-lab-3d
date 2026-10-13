import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BOOT_SECONDS, FAULTS, FAULT_IDS, FIX_EXERCISE, GOOD_BUILD, T_SHUTDOWN, T_THROTTLE, WORKLOADS,
  changesBetween, check, gameFps, nextFault, post, runLoad, systemWatts, videoPath,
} from '../src/labs/SystemSim/index.ts';
import { grade, startAttempt } from '../src/services/grading/index.ts';

const dicts = Object.fromEntries(['kk', 'ru', 'en'].map((l) => [l, JSON.parse(readFileSync(new URL(`../src/locales/${l}.json`, import.meta.url), 'utf8'))]));
const get = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const b = (patch) => ({ ...GOOD_BUILD, ...patch });

test('a sound PC boots to the desktop and survives a game', () => {
  const d = check(GOOD_BUILD);
  assert.equal(d.post.outcome, 'desktop');
  assert.equal(d.post.beep, 'ok');
  assert.ok(d.healthy);
  assert.ok(d.fps >= 100);
  assert.ok(d.game.peakC < 80, `tower cooler keeps it cool: ${d.game.peakC}`);
  assert.equal(d.game.throttled, false);
});

test('POST: no memory beeps and shows nothing; no video; wrong port; no boot device', () => {
  assert.deepEqual([post(b({ ram: 0 })).outcome, post(b({ ram: 0 })).beep, post(b({ ram: 0 })).picture], ['noRam', 'memory', false]);
  const f = post(b({ cpu: 'intelF', gpu: 'none' }));
  assert.deepEqual([f.outcome, f.beep, f.picture], ['noVideo', 'video', false], 'F-series CPU without a card: no picture at all');
  assert.equal(post(b({ cpu: 'ryzen', gpu: 'none', monitor: 'board' })).outcome, 'desktop', 'integrated graphics still show a picture');
  assert.equal(post(b({ monitor: 'board' })).outcome, 'wrongPort', 'a fitted card switches the board output off');
  assert.equal(videoPath(b({ gpu: 'none', monitor: 'gpu' })), 'wrongPort', 'no card to plug into');
  const nb = post(b({ storage: 'none' }));
  assert.deepEqual([nb.outcome, nb.picture], ['noBoot', true], 'BIOS shows "Boot device not found"');
  assert.deepEqual(post(b({ cooler: 'none' })).warnings, ['cpuFan']);
});

test('boot time: HDD slowest, NVMe fastest', () => {
  const t = (storage) => post(b({ storage })).bootSeconds;
  assert.ok(t('hdd') > t('sata') && t('sata') > t('nvme'));
  assert.equal(t('nvme'), BOOT_SECONDS.nvme);
  assert.ok(t('hdd') / t('nvme') > 4);
});

test('cooling: none overheats and trips; weak cooler throttles on a hot CPU; tower is fine', () => {
  const none = runLoad(b({ cooler: 'none' }), 'game');
  assert.equal(none.shutdown?.reason, 'overheat');
  assert.ok(none.throttled, 'it throttles first');
  assert.ok(none.peakC >= T_SHUTDOWN);
  assert.ok(none.shutdown.t < 30, `trips within half a minute: ${none.shutdown.t}`);
  const weakHot = runLoad(b({ cpu: 'intelF', cooler: 'stock' }), 'game');
  assert.equal(weakHot.shutdown, null);
  assert.ok(weakHot.throttled, 'a 148 W CPU on a stock cooler throttles');
  assert.ok(weakHot.peakC <= T_THROTTLE + 1);
  assert.ok(weakHot.performance < 1);
  const stockRyzen = runLoad(b({ cooler: 'stock' }), 'game');
  assert.equal(stockRyzen.throttled, false, 'an 88 W CPU is fine on its stock cooler');
  // temperatures only rise towards the steady state from a cool start
  const temps = runLoad(GOOD_BUILD, 'game').samples.map((s) => s.tempC);
  for (let i = 1; i < temps.length; i++) assert.ok(temps[i] >= temps[i - 1] - 0.01);
});

test('power: a 300 W PSU cannot feed a gaming card; 550 W can; idle is fine on any', () => {
  const weak = runLoad(b({ psu: 300 }), 'game');
  assert.equal(weak.shutdown?.reason, 'psu');
  assert.ok(systemWatts(b({}), 'game', 67) > 300);
  assert.equal(runLoad(b({ psu: 550 }), 'game').shutdown, null);
  assert.equal(runLoad(b({ psu: 300 }), 'idle').shutdown, null, 'it boots and idles — the shutdown comes under load');
});

test('games need a graphics card: integrated graphics are unplayable', () => {
  assert.ok(gameFps(b({})) >= 100);
  assert.ok(gameFps(b({ gpu: 'none', monitor: 'board' })) < 20);
  assert.equal(gameFps(b({ cpu: 'intelF', gpu: 'none' })), 0);
});

test('every fault is broken, and one change fixes it', () => {
  const fixes = { ram: { ram: 2 }, gpu: { gpu: 'rtx' }, monitor: { monitor: 'gpu' }, storage: { storage: 'sata' }, cooler: { cooler: 'stock' }, psu: { psu: 550 } };
  for (const f of FAULT_IDS) {
    assert.equal(check(FAULTS[f]).healthy, false, `${f} is broken`);
    assert.equal(changesBetween(GOOD_BUILD, FAULTS[f]) >= 1, true);
    assert.ok(check({ ...FAULTS[f], ...fixes[f] }).healthy, `${f} fixed`);
  }
  // the F-series CPU can also be fixed by a CPU with graphics + monitor on the board
  assert.ok(check({ ...FAULTS.gpu, cpu: 'ryzen', monitor: 'board' }).healthy);
  assert.equal(nextFault('psu'), 'ram');
});

test('fix task: right cause + minimal fix = 10; wrong cause or extra changes cost points', () => {
  const ex = FIX_EXERCISE;
  const perfect = { fault: 'cooler', diagnosis: 'cooler', build: { ...FAULTS.cooler, cooler: 'tower' } };
  const r = grade(ex, perfect, startAttempt(ex.id)).report;
  assert.equal(r.score, 10);
  assert.equal(r.status, 'completed');
  const wrongCause = grade(ex, { ...perfect, diagnosis: 'psu' }, startAttempt(ex.id)).report;
  assert.equal(wrongCause.status, 'incomplete');
  assert.equal(wrongCause.score, 6);
  const shotgun = grade(ex, { ...perfect, build: { ...GOOD_BUILD, storage: 'sata', psu: 550, ram: 1 } }, startAttempt(ex.id)).report;
  assert.ok(shotgun.score < 10 && shotgun.score >= 8, `changed everything: ${shotgun.score}`);
  const notFixed = grade(ex, { fault: 'psu', diagnosis: 'psu', build: FAULTS.psu }, startAttempt(ex.id)).report;
  assert.equal(notFixed.status, 'incomplete');
});

test('every simulation text exists in kk, ru and en', () => {
  for (const [lang, d] of Object.entries(dicts)) {
    for (const k of ['title', 'eyebrow', 'lead', 'disclaimer']) assert.equal(typeof get(d, `sim.${k}`), 'string', `${lang}: sim.${k}`);
    for (const o of ['desktop', 'noRam', 'noVideo', 'wrongPort', 'noBoot']) {
      assert.equal(typeof get(d, `sim.outcome.${o}.title`), 'string', `${lang}: outcome ${o}`);
      assert.equal(typeof get(d, `sim.outcome.${o}.why`), 'string', `${lang}: outcome ${o} why`);
    }
    for (const s of ['overheat', 'psu']) assert.equal(typeof get(d, `sim.shutdown.${s}.why`), 'string', `${lang}: shutdown ${s}`);
    for (const w of WORKLOADS) assert.equal(typeof get(d, `sim.workloads.${w}`), 'string', `${lang}: workload ${w}`);
    for (const f of FAULT_IDS) assert.equal(typeof get(d, `sim.causes.${f}`), 'string', `${lang}: cause ${f}`);
    for (const rule of FIX_EXERCISE.gradingRules) assert.equal(typeof get(d, rule.label.key), 'string', `${lang}: ${rule.label.key}`);
    for (const k of ['noCause', 'wrongCause', 'tooMany', 'still.noRam', 'still.noVideo', 'still.wrongPort', 'still.noBoot', 'still.overheat', 'still.psu']) {
      assert.equal(typeof get(d, `sim.feedback.${k}`), 'string', `${lang}: feedback ${k}`);
    }
    for (const k of ['instructions', 'expected', 'hint', 'title', 'short']) assert.equal(typeof get(d, `sim.task.${k}`), 'string', `${lang}: task ${k}`);
  }
});
