import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { activeIndex, advancePrint, approach, ease, partProgress, pathPoint, PRINT_SECONDS, rel, route, stepAt, stepValue } from '../src/lib/teardown/timeline.ts';
import { teardownExercise, teardownQuestions } from '../src/data/teardown/teardownQuiz.ts';
import { TEARDOWN_TASKS } from '../src/services/progress/catalog.ts';
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
  assert.deepEqual([...TEARDOWN_IDS], ['system_unit', 'laptop', 'smartphone', 'tablet', 'all_in_one', 'printer_3d']);
  const su = TEARDOWNS.system_unit.parts;
  assert.equal(su[0], 'panel', 'the side panel comes off first');
  assert.equal(su.at(-1), 'motherboard', 'the board comes out last');
  assert.ok(su.indexOf('cooler') < su.indexOf('cpu'), 'cooler before the CPU under it');
  const lp = TEARDOWNS.laptop.parts;
  assert.deepEqual(lp.slice(0, 3), ['lid', 'bottom_cover', 'battery'], 'lid, cover, then the battery first for safety');
  assert.equal(lp.at(-1), 'motherboard');
  for (const p of ['ram', 'ssd', 'wifi', 'cooling', 'speakers', 'display_cable']) assert.ok(lp.includes(p), `laptop has ${p}`);
  const ph = TEARDOWNS.smartphone.parts;
  assert.equal(ph[0], 'sim_tray', 'the SIM tray comes out before the phone is opened');
  assert.ok(ph.indexOf('battery') < ph.indexOf('mainboard'), 'battery before the board');
  for (const p of ['display', 'battery', 'mainboard', 'cameras', 'speaker', 'vibration']) assert.ok(ph.includes(p), `smartphone has ${p}`);
  assert.deepEqual(TEARDOWNS.all_in_one.parts.slice(0, 2), ['stand', 'back_cover'], 'all-in-one: stand, then the back cover');
  for (const p of ['extruder', 'heated_bed', 'steppers', 'control_board']) assert.ok(TEARDOWNS.printer_3d.parts.includes(p), `3D printer has ${p}`);
  for (const [lang, d] of Object.entries(dicts)) {
    for (const k of ['open', 'title', 'close', 'slider', 'prev', 'next', 'playApart', 'playAssemble', 'step', 'start', 'parts', 'hint', 'sceneLabel', 'does', 'how', 'quizIntro', 'print', 'printStop', 'printing', 'printDone', 'printHint', 'printAbout', 'placeholder']) {
      assert.equal(typeof d.teardown.ui[k], 'string', `${lang}: teardown.ui.${k}`);
    }
    for (const id of TEARDOWN_IDS) {
      assert.ok(d.teardown[id].title && d.teardown[id].intro, `${lang}: ${id} title/intro`);
      for (const p of TEARDOWNS[id].parts) {
        const part = d.teardown[id].parts[p];
        assert.ok(part?.name, `${lang}: ${id}.${p}.name`);
        assert.ok(part?.text.length > 60, `${lang}: ${id}.${p}.text`);
        assert.ok(part?.does.length > 8 && part.does.length < 90, `${lang}: ${id}.${p}.does is a short line`);
        assert.ok(part?.ask.includes(part.name) || part.ask.toLowerCase().includes(part.name.toLowerCase()), `${lang}: ${id}.${p}.ask names the part`);
      }
      const does = TEARDOWNS[id].parts.map((p) => d.teardown[id].parts[p].does);
      assert.equal(new Set(does).size, does.length, `${lang}: ${id} parts do different things`);
      assert.deepEqual(Object.keys(d.teardown[id].parts).sort(), [...TEARDOWNS[id].parts].sort(), `${lang}: no stray part texts`);
    }
  }
});

test('lab devices open their teardown', () => {
  assert.equal(teardownOfDevice('case'), 'system_unit');
  assert.equal(teardownOfDevice('laptop'), 'laptop');
  assert.equal(teardownOfDevice('mouse'), undefined);
  for (const d of ['case', 'laptop', 'smartphone', 'tablet', 'all_in_one', 'printer_3d']) {
    assert.ok(deviceById(d), `${d} is a lab device`);
    assert.ok(teardownOfDevice(d), `${d} opens a teardown`);
  }
  assert.ok(isTeardownId('laptop'));
  assert.ok(!isTeardownId('toaster'));
  assert.ok(!isTeardownId(null));
});

test('"What does this part do?": 3 questions, the right answer among two other parts, graded to 10', async () => {
  const { grade, startAttempt } = await import('../src/services/grading/index.ts');
  assert.deepEqual([...TEARDOWN_TASKS], [...TEARDOWN_IDS], 'every teardown has a progress task');
  const positions = [];
  for (const id of TEARDOWN_IDS) {
    const qs = teardownQuestions(id);
    assert.equal(qs.length, 3);
    assert.deepEqual(qs.map((q) => q.part), [...TEARDOWNS[id].quiz]);
    for (const q of qs) {
      assert.equal(q.options.length, 3, `${id}.${q.part}: three options`);
      assert.equal(new Set(q.options).size, 3, `${id}.${q.part}: distinct options`);
      assert.equal(q.options[q.correct], q.part, `${id}.${q.part}: right option is the part itself`);
      for (const o of q.options) assert.ok(TEARDOWNS[id].parts.includes(o), `${id}: ${o} is a part`);
      positions.push(q.correct);
    }
    const ex = teardownExercise(id);
    assert.equal(ex.id, `teardown:${id}`);
    assert.equal(ex.type, 'teardown');
    assert.equal(ex.maxScore, 10);
    const good = Object.fromEntries(qs.map((q) => [q.id, q.correct]));
    assert.equal(grade(ex, { answers: good }, startAttempt(ex.id)).report.score, 10, `${id} perfect`);
    const bad = Object.fromEntries(qs.map((q) => [q.id, (q.correct + 1) % 3]));
    assert.equal(grade(ex, { answers: bad }, startAttempt(ex.id)).report.score, 0, `${id} all wrong`);
  }
  for (const p of [0, 1, 2]) assert.ok(positions.includes(p), `right answer appears at position ${p}`);
});

test('helpers: offsets to rest and the demo print', () => {
  assert.deepEqual(rel([1, 2, 3], [1.5, 0, 3]), [0.5, -2, 0]);
  close(advancePrint(0, 1, false), 0.1 / PRINT_SECONDS, 1e-12); // long frames are capped
  assert.equal(advancePrint(0.99, 0.1, false), Math.min(1, 0.99 + 0.1 / PRINT_SECONDS));
  assert.equal(advancePrint(0.999999, 0.1, false), 1);
  assert.equal(advancePrint(0, 0.016, true), 1, 'reduced motion: the print is shown finished');
});
