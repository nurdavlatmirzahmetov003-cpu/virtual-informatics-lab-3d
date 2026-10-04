import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GATE_TYPES, LOGIC_TASKS, LOGIC_TASK_IDS, addGate, analyze, baseCircuit, combinations, connect, connectToNode, cycleNodes, evaluate,
  expression, gateOutput, moveNode, removeGate, removeWire, truthTable,
} from '../src/labs/LogicLab/index.ts';
import { grade, startAttempt } from '../src/services/grading/index.ts';

/** Builds a circuit from a tiny spec: gates [['G1','AND'],…], wires ['A>G1.0', 'G1>Y.0'] */
function build(inputs, gates, wires) {
  let c = baseCircuit(inputs);
  for (const [, type] of gates) c = addGate(c, type, 500, 300);
  for (const spec of wires) {
    const [from, rest] = spec.split('>');
    const [to, port] = rest.split('.');
    const r = connect(c, from, to, Number(port));
    assert.equal(r.error, null, spec);
    c = r.circuit;
  }
  return c;
}

const run = (task, c) => grade(LOGIC_TASKS[task], c, startAttempt('x', 0), 0).report;

test('every gate follows its truth table', () => {
  const expected = { AND: [0, 0, 0, 1], OR: [0, 1, 1, 1], XOR: [0, 1, 1, 0], NAND: [1, 1, 1, 0], NOR: [1, 0, 0, 0] };
  for (const [g, out] of Object.entries(expected)) assert.deepEqual([[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => gateOutput(g, a, b)), out, g);
  assert.deepEqual([0, 1].map((a) => gateOutput('NOT', a)), [1, 0]);
  for (const g of GATE_TYPES) {
    const c = build(['A', 'B'], [['G1', g]], g === 'NOT' ? ['A>G1.0', 'G1>Y.0'] : ['A>G1.0', 'B>G1.1', 'G1>Y.0']);
    assert.deepEqual(truthTable(c).map((r) => r.y), g === 'NOT' ? [1, 1, 0, 0] : expected[g]);
  }
});

test('signals propagate through chains; wires carry their source value', () => {
  // Y = NOT(A) OR B
  const c = build(['A', 'B'], [['G1', 'NOT'], ['G2', 'OR']], ['A>G1.0', 'G1>G2.0', 'B>G2.1', 'G2>Y.0']);
  assert.deepEqual(truthTable(c).map((r) => r.y), [1, 1, 0, 1]);
  const e = evaluate(c, { A: 1, B: 0 });
  assert.equal(e.nodes.get('G1'), 0);
  assert.equal(e.output, 0);
  const w = c.wires.find((x) => x.from === 'G1');
  assert.equal(e.wires.get(w.id), 0);
  assert.equal(expression(c), 'NOT(A) OR B');
});

test('open pins and loops make the output undefined and are reported', () => {
  const open = build(['A', 'B'], [['G1', 'AND']], ['A>G1.0', 'G1>Y.0']);
  assert.ok(truthTable(open).every((r) => r.y === null));
  assert.ok(analyze(open).some((i) => i.code === 'pinOpen' && i.params.pins === '2'));
  assert.equal(expression(open), null);

  const empty = baseCircuit(['A', 'B']);
  assert.ok(analyze(empty).some((i) => i.code === 'outputOpen'));

  // G1 = A AND G2, G2 = NOT G1  → loop
  const loop = build(['A', 'B'], [['G1', 'AND'], ['G2', 'NOT']], ['A>G1.0', 'G2>G1.1', 'G1>G2.0', 'G1>Y.0']);
  assert.deepEqual([...cycleNodes(loop)].sort(), ['G1', 'G2']);
  assert.equal(evaluate(loop, { A: 1, B: 0 }).output, null);
  assert.ok(analyze(loop).some((i) => i.code === 'cycle'));
  // a three-gate ring is found as one loop
  const ring = build(['A', 'B'], [['G1', 'OR'], ['G2', 'NOT'], ['G3', 'NOT']], ['A>G1.0', 'G3>G1.1', 'G1>G2.0', 'G2>G3.0', 'G2>Y.0']);
  assert.deepEqual([...cycleNodes(ring)].sort(), ['G1', 'G2', 'G3']);
  assert.ok(truthTable(ring).every((r) => r.y === null));
});

test('wiring rules: one signal per pin, sources/targets, free-pin choice, deletes', () => {
  let c = addGate(baseCircuit(['A', 'B']), 'AND', 0, 0);
  assert.equal(connect(c, 'Y', 'G1', 0).error, 'notSource');
  assert.equal(connect(c, 'G1', 'A', 0).error, 'notTarget');
  assert.equal(connect(c, 'G1', 'G1', 0).error, 'sameNode');
  assert.equal(connect(c, 'A', 'G1', 2).error, 'badPin');
  c = connectToNode(c, 'A', 'G1').circuit;
  c = connectToNode(c, 'B', 'G1').circuit;
  assert.deepEqual(c.wires.map((w) => [w.from, w.port]), [['A', 0], ['B', 1]]);
  assert.equal(connectToNode(c, 'A', 'G1').error, 'noFreePin');
  c = connect(c, 'A', 'G1', 1).circuit;
  assert.deepEqual(c.wires.map((w) => [w.from, w.port]).sort(), [['A', 0], ['A', 1]], 'replaced, not doubled');
  c = connect(c, 'G1', 'Y', 0).circuit;
  assert.equal(removeWire(c, c.wires[0].id).wires.length, 2);
  const gone = removeGate(c, 'G1');
  assert.equal(gone.wires.length, 0);
  assert.equal(removeGate(c, 'A'), c, 'switches cannot be deleted');
});

test('combinations are in binary order with A as the high bit', () => {
  assert.deepEqual(combinations(['A', 'B']).map((r) => `${r.A}${r.B}`), ['00', '01', '10', '11']);
  assert.equal(combinations(['A', 'B', 'C']).length, 8);
});

const SOLUTIONS = {
  and: () => build(['A', 'B'], [['G1', 'AND']], ['A>G1.0', 'B>G1.1', 'G1>Y.0']),
  notOr: () => build(['A', 'B'], [['G1', 'NOT'], ['G2', 'OR']], ['A>G1.0', 'G1>G2.0', 'B>G2.1', 'G2>Y.0']),
  // (A AND NOT B) OR (NOT A AND B)
  xorBasic: () =>
    build(['A', 'B'], [['G1', 'NOT'], ['G2', 'NOT'], ['G3', 'AND'], ['G4', 'AND'], ['G5', 'OR']], [
      'A>G1.0', 'B>G2.0', 'A>G3.0', 'G2>G3.1', 'G1>G4.0', 'B>G4.1', 'G3>G5.0', 'G4>G5.1', 'G5>Y.0',
    ]),
  // (A AND B) OR (C AND (A OR B))
  table: () =>
    build(['A', 'B', 'C'], [['G1', 'AND'], ['G2', 'OR'], ['G3', 'AND'], ['G4', 'OR']], ['A>G1.0', 'B>G1.1', 'A>G2.0', 'B>G2.1', 'C>G3.0', 'G2>G3.1', 'G1>G4.0', 'G3>G4.1', 'G4>Y.0']),
};

test('every task: empty board fails, a correct circuit scores 10/10', () => {
  for (const id of LOGIC_TASK_IDS) {
    const task = LOGIC_TASKS[id];
    assert.equal(task.gradingRules.reduce((s, r) => s + r.points, 0), 10, id);
    assert.equal(run(id, task.start()).status, 'incomplete');
    const ok = run(id, SOLUTIONS[id]());
    assert.equal(ok.status, 'completed', `${id}: ${JSON.stringify(ok.outcomes.filter((o) => !o.passed))}`);
    assert.equal(ok.score, 10);
  }
});

test('grading compares behaviour, not layout or gate count', () => {
  let moved = SOLUTIONS.and();
  for (const n of moved.nodes) moved = moveNode(moved, n.id, 1000 - n.x, 600 - n.y);
  assert.equal(run('and', moved).score, 10);
  // NOT(NAND(A,B)) is also A AND B; an unused extra gate does not matter
  let alt = build(['A', 'B'], [['G1', 'NAND'], ['G2', 'NOT']], ['A>G1.0', 'B>G1.1', 'G1>G2.0', 'G2>Y.0']);
  alt = addGate(alt, 'XOR', 100, 100);
  assert.equal(run('and', alt).score, 10);
  // De Morgan: NOT(A) OR B == NAND(A, NOT B)
  const dm = build(['A', 'B'], [['G1', 'NOT'], ['G2', 'NAND']], ['B>G1.0', 'A>G2.0', 'G1>G2.1', 'G2>Y.0']);
  assert.equal(run('notOr', dm).score, 10);
});

test('a wrong circuit names the combinations that differ', () => {
  const or = build(['A', 'B'], [['G1', 'OR']], ['A>G1.0', 'B>G1.1', 'G1>Y.0']);
  const r = run('and', or);
  const beh = r.outcomes.find((o) => o.id === 'behaviour');
  assert.equal(beh.passed, false);
  assert.equal(beh.earned, 4, '2 of 4 rows right → half of 8 points');
  assert.deepEqual(beh.feedback.map((f) => f.params.combo), ['A = 0, B = 1', 'A = 1, B = 0']);
  assert.deepEqual(beh.feedback.map((f) => [f.params.expected, f.params.actual]), [[0, 1], [0, 1]]);
});

test('XOR task: the XOR gate itself is not allowed', () => {
  const direct = build(['A', 'B'], [['G1', 'XOR']], ['A>G1.0', 'B>G1.1', 'G1>Y.0']);
  const r = run('xorBasic', direct);
  assert.equal(r.status, 'incomplete');
  const rule = r.outcomes.find((o) => o.id === 'allowed');
  assert.equal(rule.passed, false);
  assert.match(rule.feedback[0].params.gates, /XOR/);
  assert.equal(r.outcomes.find((o) => o.id === 'behaviour').passed, true);
});

test('incomplete circuits explain open pins and loops', () => {
  const open = build(['A', 'B'], [['G1', 'AND']], ['A>G1.0', 'G1>Y.0']);
  const r = run('and', open);
  const keys = r.outcomes.flatMap((o) => o.feedback.map((f) => f.key));
  assert.ok(keys.includes('logic.feedback.issue.pinOpen'));
  assert.ok(keys.includes('logic.feedback.rowUndefined'));
});
