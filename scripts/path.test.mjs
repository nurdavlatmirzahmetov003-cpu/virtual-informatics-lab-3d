/**
 * Section 8 (0.37): the personal learning path (next step, spaced review,
 * Leitner flash cards) and the weekly parent report.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TASKS, LAB_IDS } from '../src/services/progress/catalog.ts';
import { FAQ_IDS } from '../src/services/bit/faq.ts';
import { BOX_DAYS, DAY, LAB_TOPICS, answerCard, labScores, nextStep, reviewQueue, sessionCards } from '../src/services/progress/learningPath.ts';

const NOW = Date.UTC(2026, 9, 20, 9);
const result = (id, percent, attempts, lastAt) => {
  const best = { id: `a-${id}`, exerciseId: id, score: percent, maxScore: 100, percent, seconds: 60, errors: 0, hints: 0, status: percent === 100 ? 'passed' : 'partial', at: lastAt };
  return { best, attempts, firstAt: lastAt, lastAt, ...(percent >= 60 ? { completedAt: lastAt, completedOnAttempt: 1 } : {}) };
};

test('next step: the first task in the learning order that is not done', () => {
  assert.equal(nextStep({ exercises: {}, attempts: [] }).id, TASKS[0].id);
  const exercises = { [TASKS[0].id]: result(TASKS[0].id, 100, 1, NOW), [TASKS[1].id]: result(TASKS[1].id, 100, 1, NOW) };
  assert.equal(nextStep({ exercises, attempts: [] }).id, TASKS[2].id);
  const all = Object.fromEntries(TASKS.map((t) => [t.id, result(t.id, 100, 1, NOW)]));
  assert.equal(nextStep({ exercises: all, attempts: [] }), null);
});

test('review: weak tasks come back after a day, good ones later and later', () => {
  const [a, b, c] = TASKS;
  const exercises = {
    [a.id]: result(a.id, 50, 1, NOW - 2 * DAY),
    [b.id]: result(b.id, 100, 1, NOW - 2 * DAY),
    [c.id]: result(c.id, 100, 3, NOW - 2 * DAY),
  };
  const { due, later } = reviewQueue({ exercises, attempts: [] }, NOW);
  assert.deepEqual(due.map((d) => d.task.id), [a.id, b.id], 'the weak one first, then the one done once (1 day)');
  assert.ok(due[0].weak);
  assert.deepEqual(later.map((d) => d.task.id), [c.id], 'done three times: back after 7 days');
  assert.equal(later[0].dueAt, NOW - 2 * DAY + 7 * DAY);
  assert.equal(labScores({ exercises })[a.lab], Math.round((50 + 100 + 100) / 3));
});

test('flash cards: Leitner boxes, the weakest labs first, every topic is a real answer', () => {
  for (const lab of LAB_IDS) for (const id of LAB_TOPICS[lab]) assert.ok(FAQ_IDS.includes(id), `${lab}: ${id}`);
  let card = answerCard(undefined, true, NOW);
  assert.deepEqual(card, { box: 1, dueAt: NOW + BOX_DAYS[1] * DAY });
  card = answerCard(card, true, NOW);
  assert.equal(card.box, 2);
  card = answerCard(card, false, NOW);
  assert.equal(card.box, 1, 'not known: back to the first box');
  for (let i = 0; i < 9; i++) card = answerCard(card, true, NOW);
  assert.equal(card.box, 5);

  const scores = Object.fromEntries(LAB_IDS.map((l) => [l, 90]));
  scores.logic = 20;
  const first = sessionCards({}, scores, NOW);
  assert.equal(first.length, 5);
  assert.ok(LAB_TOPICS.logic.includes(first[0]), 'the weakest lab first');
  // a due card comes before new ones; a card not due yet is left out
  const cards = { cpu: { box: 2, dueAt: NOW - 1 }, ram: { box: 3, dueAt: NOW + DAY } };
  const s = sessionCards(cards, scores, NOW);
  assert.equal(s[0], 'cpu');
  assert.ok(!s.includes('ram'));
});

test('weekly report: one week of attempts, first completions, achievements and the tasks to help with', async () => {
  const { weeklyReport, currentWeek } = await import('../src/services/progress/weeklyReport.ts');
  const { weekStart } = await import('../src/services/progress/challenges.ts');
  const week = currentWeek(NOW);
  const from = weekStart(week);
  const [a, b] = TASKS;
  const attempt = (id, percent, at, seconds = 120) => ({ id: `${id}-${at}`, exerciseId: id, score: percent, maxScore: 100, percent, seconds, errors: 0, hints: 0, status: 'passed', at });
  const attempts = [attempt(a.id, 100, from - DAY), attempt(a.id, 60, from + 3600_000), attempt(b.id, 40, from + DAY + 3600_000), attempt(b.id, 70, from + DAY + 7200_000)];
  const exercises = { [a.id]: { ...result(a.id, 100, 2, from + 3600_000), completedAt: from - DAY }, [b.id]: { ...result(b.id, 70, 2, from + DAY), completedAt: from + DAY + 7200_000 } };
  const r = weeklyReport({ attempts, exercises, achievements: { firstStep: from + 10, old: from - 5 * DAY } }, week);
  assert.equal(r.attempts, 3, 'last week does not count');
  assert.equal(r.activeDays, 2);
  assert.equal(r.average, Math.round((60 + 40 + 70) / 3));
  assert.equal(r.seconds, 360);
  assert.deepEqual(r.completed, [b.id], 'the first task was finished the week before');
  assert.deepEqual(r.achievements, ['firstStep']);
  assert.deepEqual(r.struggling, [b.id]);
  assert.equal(weeklyReport({ attempts, exercises, achievements: {} }, week + 1).attempts, 0);
});
