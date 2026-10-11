import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEVICES, OWN_QUIZ_DEVICES, deviceKey, deviceSpecs } from '../src/data/devices/devices.ts';
import { deviceExercise } from '../src/data/devices/deviceQuiz.ts';
import { anatomyItem } from '../src/data/hardware/anatomy.ts';
import { LAB_ZONES } from '../src/data/lab/zones.ts';
import { DEVICE_TASKS } from '../src/services/progress/catalog.ts';

const dicts = Object.fromEntries(['kk', 'ru', 'en'].map((l) => [l, JSON.parse(readFileSync(new URL(`../src/locales/${l}.json`, import.meta.url), 'utf8'))]));
const get = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const specs = (d) => deviceSpecs(d, (id) => anatomyItem(id).specs);

test('all 60 lab devices: unique, each in the zone that lists it', () => {
  assert.equal(DEVICES.length, 60);
  assert.equal(new Set(DEVICES.map((d) => d.id)).size, 60);
  for (const d of DEVICES) {
    const zone = LAB_ZONES.find((z) => z.id === d.zone);
    assert.ok(zone?.devices.includes(d.id), `${d.id} listed in zone ${d.zone}`);
  }
  // V2-4a + V2-4b: all seven device zones are complete, each device has ports, specs and a test
  const zones = [...new Set(DEVICES.map((d) => d.zone))].sort();
  assert.deepEqual(zones, ['assembly', 'mobile', 'network', 'peripherals', 'power', 'print_media', 'storage']);
  assert.equal(OWN_QUIZ_DEVICES.length, 43);
  for (const d of DEVICES) assert.ok(d.anatomy || d.answers, `${d.id} has a test`);
});

test('every device text exists in kk, ru and en (both levels, specs, ports, quiz)', () => {
  for (const [lang, dict] of Object.entries(dicts)) {
    for (const d of DEVICES) {
      for (const p of ['name', 'student', 'purpose', 'adult', 'use']) assert.equal(typeof get(dict, deviceKey(d, p)), 'string', `${lang}: ${d.id}.${p}`);
      assert.ok(specs(d).length >= 3, `${d.id} has specs`);
      for (const s of specs(d)) {
        assert.equal(typeof get(dict, `${deviceKey(d, 'specs')}.${s}.label`), 'string', `${lang}: ${d.id} spec ${s}`);
        assert.equal(typeof get(dict, `${deviceKey(d, 'specs')}.${s}.value`), 'string', `${lang}: ${d.id} spec ${s} value`);
      }
      for (const port of d.ports) assert.equal(typeof get(dict, `deviceUi.portTypes.${port}`), 'string', `${lang}: port ${port}`);
      for (const n of [1, 2, 3]) for (const k of ['question', 'a', 'b', 'c', 'explain']) assert.equal(typeof get(dict, `${deviceKey(d, 'quiz')}.q${n}.${k}`), 'string', `${lang}: ${d.id} q${n}.${k}`);
    }
  }
});

test('tests: shared Anatomy tests keep their ids, own tests are catalogued and graded', () => {
  for (const d of DEVICES) {
    const ex = deviceExercise(d);
    assert.ok(ex, `${d.id} has a test`);
    assert.equal(ex.id, d.anatomy ? `anatomy:${d.anatomy}` : `device:${d.id}`);
    assert.equal(ex.gradingRules.length, 3);
    assert.equal(ex.maxScore, 10);
  }
  assert.deepEqual([...DEVICE_TASKS].sort(), OWN_QUIZ_DEVICES.map((d) => d.id).sort());
  // answers are spread over a, b and c (no "always a" pattern)
  const letters = OWN_QUIZ_DEVICES.flatMap((d) => d.answers);
  for (const l of ['a', 'b', 'c']) assert.ok(letters.filter((x) => x === l).length >= 40, `answer ${l} used often enough`);
});

test('a perfect answer sheet scores 10, an empty one 0', async () => {
  const { grade, startAttempt } = await import('../src/services/grading/index.ts');
  for (const d of OWN_QUIZ_DEVICES) {
    const ex = deviceExercise(d);
    const good = Object.fromEntries(d.answers.map((a, i) => [`q${i + 1}`, ['a', 'b', 'c'].indexOf(a)]));
    assert.equal(grade(ex, { answers: good }, startAttempt(ex.id)).report.score, 10, d.id);
    const empty = { q1: null, q2: null, q3: null };
    assert.equal(grade(ex, { answers: empty }, startAttempt(ex.id)).report.score, 0, d.id);
  }
});

test('no unused port labels and no near-empty explanations', () => {
  const used = new Set(DEVICES.flatMap((d) => d.ports));
  for (const [lang, dict] of Object.entries(dicts)) {
    assert.deepEqual(Object.keys(dict.deviceUi.portTypes).filter((p) => !used.has(p)), [], `${lang}: every port label is used`);
    for (const d of DEVICES) assert.ok(get(dict, deviceKey(d, 'adult')).length > 80, `${lang}: ${d.id} adult text is substantial`);
  }
});
