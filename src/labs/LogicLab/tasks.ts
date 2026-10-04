/**
 * The graded Logic Lab tasks. Grading compares BEHAVIOUR: the circuit's
 * output for every input combination against the expected function — any
 * correct circuit passes, wherever its gates are drawn and however many.
 */
import type { Exercise, Feedback, RuleResult } from '@/services/grading';
import { baseCircuit, gatesOf } from './circuit';
import { analyze, combinations, evaluate, outputCone } from './simulate';
import type { Bit, Circuit, GateType } from './types';
import { GATE_TYPES } from './types';

export const LOGIC_TASK_IDS = ['and', 'notOr', 'xorBasic', 'table'] as const;
export type LogicTaskId = (typeof LOGIC_TASK_IDS)[number];
export const isLogicTaskId = (v: unknown): v is LogicTaskId => LOGIC_TASK_IDS.includes(v as LogicTaskId);

export interface LogicTask extends Exercise<Circuit> {
  task: LogicTaskId;
  inputs: readonly string[];
  /** Gates offered in the palette (and the only ones allowed). */
  allowed: readonly GateType[];
  /** Expected output for one input combination. */
  target: (bits: Record<string, Bit>) => Bit;
  /** Show the expected column of the truth table (the "given table" task). */
  givenTable: boolean;
  start: () => Circuit;
}

const fb = (key: string, params?: Feedback['params']): Feedback => ({ key: `logic.feedback.${key}`, params });
const combo = (bits: Record<string, Bit>) =>
  Object.entries(bits)
    .map(([k, v]) => `${k} = ${v}`)
    .join(', ');

/** Y must be wired and every gate it depends on fully connected, without loops. */
function completeRule(c: Circuit): RuleResult {
  const cone = outputCone(c);
  const issues = analyze(c).filter((i) => i.code !== 'unused' && i.nodes.some((id) => cone.has(id)));
  return { passed: issues.length === 0, feedback: issues.map((i) => fb(`issue.${i.code}`, i.params)) };
}

/** Compares Y on every row; lists the first rows that differ. */
function behaviourRule(task: Pick<LogicTask, 'inputs' | 'target'>, c: Circuit): RuleResult {
  const rows = combinations(task.inputs);
  const wrong: Feedback[] = [];
  let good = 0;
  for (const bits of rows) {
    const actual = evaluate(c, bits).output;
    const expected = task.target(bits);
    if (actual === expected) good++;
    else wrong.push(fb(actual === null ? 'rowUndefined' : 'row', { combo: combo(bits), expected, actual: actual ?? '?' }));
  }
  const extra = wrong.length > 4 ? [fb('moreRows', { count: wrong.length - 4 })] : [];
  return { passed: good === rows.length, partial: good / rows.length, feedback: [...wrong.slice(0, 4), ...extra] };
}

function allowedRule(task: Pick<LogicTask, 'allowed'>, c: Circuit): RuleResult {
  const banned = gatesOf(c).filter((g) => !task.allowed.includes(g.gate!));
  return {
    passed: banned.length === 0,
    feedback: banned.length ? [fb('forbidden', { gates: [...new Set(banned.map((g) => g.gate))].join(', '), allowed: task.allowed.join(', ') })] : [],
  };
}

function makeTask(task: LogicTaskId, inputs: string[], target: LogicTask['target'], allowed: readonly GateType[] = GATE_TYPES, givenTable = false): LogicTask {
  const key = (k: string) => `logic.tasks.${task}.${k}`;
  const restricted = allowed.length < GATE_TYPES.length;
  const self = { inputs, target, allowed };
  return {
    id: `logic:${task}`,
    type: 'logic',
    task,
    inputs,
    allowed,
    target,
    givenTable,
    instructions: { key: key('instructions') },
    expectedResult: { key: key('expected') },
    maxScore: 10,
    hints: [1, 2, 3].map((n) => ({ key: key(`hint${n}`) })),
    start: () => baseCircuit(inputs),
    gradingRules: [
      { id: 'complete', points: 2, label: { key: 'logic.rules.complete' }, evaluate: completeRule },
      { id: 'behaviour', points: restricted ? 6 : 8, label: { key: 'logic.rules.behaviour', params: { rows: 2 ** inputs.length } }, evaluate: (c) => behaviourRule(self, c) },
      ...(restricted ? [{ id: 'allowed', points: 2, label: { key: 'logic.rules.allowed', params: { allowed: allowed.join(', ') } }, evaluate: (c: Circuit) => allowedRule(self, c) }] : []),
    ],
  };
}

const b = (v: boolean): Bit => (v ? 1 : 0);

export const LOGIC_TASKS: Record<LogicTaskId, LogicTask> = {
  and: makeTask('and', ['A', 'B'], ({ A, B }) => b(A === 1 && B === 1)),
  notOr: makeTask('notOr', ['A', 'B'], ({ A, B }) => b(A === 0 || B === 1)),
  xorBasic: makeTask('xorBasic', ['A', 'B'], ({ A, B }) => b(A !== B), ['AND', 'OR', 'NOT']),
  // majority: Y = 1 when at least two of A, B, C are 1
  table: makeTask('table', ['A', 'B', 'C'], ({ A, B, C }) => b(A + B + C >= 2), GATE_TYPES, true),
};

/** Free mode: three switches, every gate, no grading. */
export const FREE_INPUTS = ['A', 'B', 'C'] as const;
