import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, grade, startAttempt, takeHint, toAssessment } from '../src/services/grading/index.ts';

/** A tiny exercise on a plain object: the service knows nothing about networks. */
const exercise = {
  id: 'demo:sum',
  type: 'demo',
  instructions: { key: 'x' },
  expectedResult: { key: 'y' },
  maxScore: 10,
  hints: [{ key: 'h1' }, { key: 'h2' }],
  gradingRules: [
    { id: 'a', points: 6, label: { key: 'a' }, evaluate: (w) => ({ passed: w.a === 1, partial: w.a / 2, feedback: w.a === 1 ? [] : [{ key: 'why.a' }] }) },
    { id: 'b', points: 4, label: { key: 'b' }, evaluate: (w) => ({ passed: w.b }) },
  ],
};

test('score, status, time, errors and partial credit', () => {
  const start = startAttempt(exercise.id, 1000);
  const { report, attempt } = grade(exercise, { a: 0.5, b: true }, start, 1000 + 222_000);
  assert.equal(report.status, 'incomplete');
  assert.equal(report.score, 6, '0.25 × 6 + 4 = 5.5 → 6');
  assert.equal(report.seconds, 222);
  assert.equal(formatDuration(report.seconds), '03:42');
  assert.equal(report.errors, 1);
  assert.deepEqual(report.outcomes[0].feedback, [{ key: 'why.a' }]);
  assert.equal(attempt.failedSubmissions, 1);

  const second = grade(exercise, { a: 1, b: true }, attempt, 1000 + 300_000);
  assert.equal(second.report.status, 'completed');
  assert.equal(second.report.score, 9, 'one earlier incomplete submission costs a point');
  assert.equal(second.report.errors, 1, 'errors accumulate over submissions');
  assert.equal(second.attempt.completed, true);
});

test('hints cost points but a complete solution never drops below the cap', () => {
  let a = startAttempt(exercise.id, 0);
  a = takeHint(takeHint(takeHint(a, exercise), exercise), exercise);
  assert.equal(a.hintsUsed, 2, 'no more hints than the exercise has');
  a = { ...a, failedSubmissions: 5 };
  const { report } = grade(exercise, { a: 1, b: true }, a, 0);
  assert.equal(report.penalty, 3);
  assert.equal(report.score, 7);
  assert.equal(report.hints, 2);
  assert.equal(report.status, 'completed');
});

test('a throwing rule fails safely; progress bridge keeps the numbers', () => {
  const broken = { ...exercise, gradingRules: [...exercise.gradingRules, { id: 'c', points: 2, label: { key: 'c' }, evaluate: () => { throw new Error('x'); } }] };
  const { report } = grade(broken, { a: 1, b: true }, startAttempt(broken.id, 0), 61_000);
  assert.equal(report.outcomes.at(-1).feedback[0].key, 'grading.ruleError');
  assert.equal(report.score, 8, '10 of 12 points → 8/10');
  const saved = toAssessment(report);
  assert.equal(saved.score, 80);
  assert.equal(saved.maxScore, 100);
  assert.equal(saved.seconds, 61);
  assert.equal(formatDuration(3725), '1:02:05');
});
