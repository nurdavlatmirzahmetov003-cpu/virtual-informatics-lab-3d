import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSEMBLY_EXERCISE, STEPS, STEP_IDS, canInstall, isComplete, missingFor, newAssembly, nextStep, place, progressOf } from '../src/labs/AssemblyLab/index.ts';
import { grade, startAttempt, takeHint } from '../src/services/grading/index.ts';

const build = (order) => order.reduce((s, step) => place(s, step, STEPS[step].target).state, newAssembly());

test('the recommended order installs every step without mistakes', () => {
  const s = build(STEP_IDS);
  assert.deepEqual(s.installed, [...STEP_IDS]);
  assert.equal(s.orderErrors + s.slotErrors, 0);
  assert.ok(isComplete(s));
  assert.equal(progressOf(s.installed), 1);
});

test('dependencies, not a rigid sequence: realistic alternative orders are allowed', () => {
  // PSU, fans and the extra drive can go into the empty case first; RAM before the cooler is fine too
  const s = build(['psu', 'fans', 'storage', 'motherboard', 'ram', 'nvme', 'cpu', 'cooler', 'mountBoard', 'gpu', 'cables']);
  assert.ok(isComplete(s));
  assert.equal(s.orderErrors, 0);
  // the CPU may also be installed after the board is in the case
  const late = build(['motherboard', 'mountBoard', 'cpu', 'cooler']);
  assert.deepEqual(late.installed, ['motherboard', 'mountBoard', 'cpu', 'cooler']);
});

test('impossible orders are explained and counted, the part is not installed', () => {
  let r = place(newAssembly(), 'cooler', 'cpuTop');
  assert.equal(r.event.outcome, 'order');
  assert.equal(r.message.key, 'pcLab.order.cooler');
  assert.deepEqual(r.event.missing, ['cpu']);
  assert.equal(r.state.orderErrors, 1);
  assert.deepEqual(r.state.installed, []);

  r = place(build(['motherboard', 'cpu']), 'gpu', 'pcie');
  assert.deepEqual(r.event.missing, ['mountBoard'], 'the GPU needs the board in the case');
  assert.equal(missingFor('cables', ['psu']).length, 8);
  assert.ok(!canInstall('cpu', []));
});

test('wrong slot: e.g. the graphics card dropped on the RAM slots', () => {
  const s = build(['motherboard', 'cpu', 'mountBoard']);
  const r = place(s, 'gpu', 'dimm');
  assert.equal(r.event.outcome, 'slot');
  assert.equal(r.message.key, 'pcLab.slot.gpu');
  assert.equal(r.message.params.where, 'ram');
  assert.equal(r.state.slotErrors, 1);
  // missing the board entirely is not a mistake: the part just goes back
  const miss = place(s, 'gpu', null);
  assert.equal(miss.event.outcome, 'miss');
  assert.equal(miss.state, s);
  // installing twice does nothing
  assert.equal(place(s, 'cpu', 'socket').event.outcome, 'done');
});

test('hint target follows the recommended order among possible steps', () => {
  assert.equal(nextStep([]), 'motherboard');
  assert.equal(nextStep(['motherboard']), 'cpu');
  assert.equal(nextStep(['motherboard', 'cpu', 'cooler', 'ram', 'nvme']), 'mountBoard');
  assert.equal(nextStep([...STEP_IDS]), null);
  // with the board not mounted yet, the GPU is never suggested
  assert.notEqual(nextStep(['motherboard', 'cpu', 'cooler', 'ram', 'nvme', 'psu']), 'gpu');
});

test('grading: perfect build 10/10; mistakes and hints cost a little, capped', () => {
  const perfect = grade(ASSEMBLY_EXERCISE, build(STEP_IDS), startAttempt('assembly', 0), 222_000).report;
  assert.equal(perfect.score, 10);
  assert.equal(perfect.status, 'completed');
  assert.equal(perfect.seconds, 222);

  let s = place(newAssembly(), 'cooler', 'cpuTop').state; // order mistake
  s = place(s, 'motherboard', 'socket').state; // slot mistake
  for (const step of STEP_IDS) s = place(s, step, STEPS[step].target).state;
  let attempt = takeHint(startAttempt('assembly', 0), ASSEMBLY_EXERCISE);
  const r = grade(ASSEMBLY_EXERCISE, s, attempt, 0).report;
  assert.equal(r.status, 'completed');
  assert.equal(r.hints, 1);
  // 5 + 3·0.75 + 2·0.75 = 8.75 → −1 hint → 7.75 → 8
  assert.equal(r.score, 8);
  assert.equal(r.errors, 2, 'order + placement rules failed once each');

  for (let i = 0; i < 10; i++) attempt = takeHint(attempt, ASSEMBLY_EXERCISE);
  assert.equal(grade(ASSEMBLY_EXERCISE, build(STEP_IDS), attempt, 0).report.score, 7, 'hint penalty capped at 3');

  const half = grade(ASSEMBLY_EXERCISE, build(['motherboard', 'cpu', 'cooler', 'ram', 'nvme']), startAttempt('assembly', 0), 0).report;
  assert.equal(half.status, 'incomplete');
  assert.ok(half.score < 10 && half.score > 0);
});
