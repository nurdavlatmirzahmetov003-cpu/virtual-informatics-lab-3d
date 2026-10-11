import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { activeIndex, approach, ease, partProgress, pathPoint, route, stepAt, stepValue } from '../src/lib/teardown/timeline.ts';
import { TEARDOWNS, TEARDOWN_IDS, isTeardownId, teardownOfDevice } from '../src/data/teardown/teardowns.ts';
import { deviceById } from '../src/data/devices/devices.ts';

const dicts = Object.fromEntries(['kk', 'ru', 'en'].map((l) => [l, JSON.parse(readFileSync(new URL(`../src/locales/${l}.json`, import.meta.url), 'utf8'))]));
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('timeline: parts leave one after another, in order', () => {
  const n = 4;
  assert.deepEqual([0, 1, 2, 3].map((i) => partProgress(0, i, n)), [0, 0, 0, 0]);
  assert.deepEqual([0, 1, 2, 3].map((i) => partProgress(1, i, n)), [1, 1, 1, 1]);
  // halfway through step 2: part 0 out, part 1 half way, the rest inside
  assert.deepEqual([0, 1, 2, 3].map((i) => partProgress(0.375, i, n)), [1, 0.5, 0, 0]);
  // out-of-range values are clamped
  assert.equal(partProgress(-1, 0, n), 0);
  assert.equal(partProgress(2, 3, n), 1);
});

test('steps: values, current step and the moving part', () => {
  const n = 9;
  assert.equal(stepValue(0, n), 0);
  assert.equal(stepValue(n, n), 1);
  assert.equal(stepValue(n + 3, n), 1, 'clamped');
  for (let k = 0; k <= n; k++) assert.equal(stepAt(stepValue(k, n), n), k, `step ${k} round-trips`);
  assert.equal(activeIndex(0, n), -1, 'assembled: no part');
  assert.equal(activeIndex(stepValue(1, n), n), 0, 'first part just out');
  assert.equal(activeIndex(stepValue(1, n) + 0.01, n), 1, 'second part moving');
  assert.equal(activeIndex(1, n), n - 1);
});

test('easing and paths: start at the installed pose, end at rest, even speed', () => {
  close(ease(0), 0);
  close(ease(1), 1);
  close(ease(0.5), 0.5);
  assert.ok(ease(0.25) < 0.25 && ease(0.75) > 0.75, 'slow in, slow out');
  const path = [[0, 1, 0], [3, 1, 0]];
  assert.deepEqual(pathPoint(path, 0), [0, 0, 0]);
  assert.deepEqual(pathPoint(path, 1), [3, 1, 0]);
  assert.deepEqual(pathPoint(path, 0.25), [0, 1, 0], 'first segment is 1 of 4 m');
  assert.deepEqual(pathPoint(path, 0.625), [1.5, 1, 0]);
  assert.deepEqual(pathPoint([], 0.7), [0, 0, 0], 'no path: stays put (e.g. a hinged lid)');
});

test('route: out of the slot, over, down onto the bench', () => {
  const r = route([-0.07, 0, 0], [-0.5, -0.3, 0.2], 0.1);
  assert.equal(r.length, 4);
  assert.deepEqual(r[0], [-0.07, 0, 0]);
  assert.deepEqual(r[3], [-0.5, -0.3, 0.2]);
  close(r[1][1], 0.1);
  close(r[2][1], 0.1);
  // clear 0: parts dropped out underneath glide at that height
  assert.deepEqual(route([0, -0.04, 0], [0.2, -0.07, 0.3], 0)[1], [0, -0.04, 0]);
});

test('approach: moves at the rate, never overshoots, reduced motion jumps', () => {
  close(approach(0, 1, 0.1, 0.5, false), 0.05);
  assert.equal(approach(0.98, 1, 0.1, 0.5, false), 1);
  close(approach(1, 0, 0.1, 0.5, false), 0.95);
  assert.equal(approach(0, 1, 0.016, 0.5, true), 1);
  close(approach(0, 1, 5, 0.5, false), 0.05, 1e-9); // a long frame is capped at 0.1 s
});

test('teardowns: realistic order and every text in kk, ru and en', () => {
  assert.deepEqual([...TEARDOWN_IDS], ['system_unit', 'laptop']);
  const su = TEARDOWNS.system_unit.parts;
  assert.equal(su[0], 'panel', 'the side panel comes off first');
  assert.equal(su.at(-1), 'motherboard', 'the board comes out last');
  assert.ok(su.indexOf('cooler') < su.indexOf('cpu'), 'cooler before the CPU under it');
  const lp = TEARDOWNS.laptop.parts;
  assert.deepEqual(lp.slice(0, 3), ['lid', 'bottom_cover', 'battery'], 'lid, cover, then the battery first for safety');
  assert.equal(lp.at(-1), 'motherboard');
  for (const p of ['ram', 'ssd', 'wifi', 'cooling', 'speakers', 'display_cable']) assert.ok(lp.includes(p), `laptop has ${p}`);
  for (const [lang, d] of Object.entries(dicts)) {
    for (const k of ['open', 'title', 'close', 'slider', 'prev', 'next', 'playApart', 'playAssemble', 'step', 'start', 'parts', 'hint', 'sceneLabel']) {
      assert.equal(typeof d.teardown.ui[k], 'string', `${lang}: teardown.ui.${k}`);
    }
    for (const id of TEARDOWN_IDS) {
      assert.ok(d.teardown[id].title && d.teardown[id].intro, `${lang}: ${id} title/intro`);
      for (const p of TEARDOWNS[id].parts) {
        assert.ok(d.teardown[id].parts[p]?.name, `${lang}: ${id}.${p}.name`);
        assert.ok(d.teardown[id].parts[p]?.text.length > 60, `${lang}: ${id}.${p}.text`);
      }
      assert.deepEqual(Object.keys(d.teardown[id].parts).sort(), [...TEARDOWNS[id].parts].sort(), `${lang}: no stray part texts`);
    }
  }
});

test('lab devices open their teardown', () => {
  assert.equal(teardownOfDevice('case'), 'system_unit');
  assert.equal(teardownOfDevice('laptop'), 'laptop');
  assert.equal(teardownOfDevice('mouse'), undefined);
  for (const d of ['case', 'laptop']) assert.ok(deviceById(d), `${d} is a lab device`);
  assert.ok(isTeardownId('laptop'));
  assert.ok(!isTeardownId('toaster'));
  assert.ok(!isTeardownId(null));
});
