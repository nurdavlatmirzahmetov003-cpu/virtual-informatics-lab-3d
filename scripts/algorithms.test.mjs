import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALGORITHMS, ALGORITHM_IDS, QUIZZES, QUIZ_IDS, binarySearch, bubbleSort, factorial, insertionSort, linearSearch, makeQuiz,
  parseArray, randomArray, rng, runAlgorithm, selectionSort, toItems,
} from '../src/labs/AlgorithmLab/index.ts';
import { grade, startAttempt } from '../src/services/grading/index.ts';

const SORTS = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort };
const ascending = (a) => [...a].sort((x, y) => x - y);

/** Many arrays: random, duplicates, negatives, sorted, reversed, tiny. */
function samples() {
  const next = rng(42);
  const list = [[5, -2, 5, 0, 1], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1], [7, 7, 7], [2, 1], [-99, 99, 0, -1, 1, 0], [3]];
  for (let i = 0; i < 200; i++) list.push(Array.from({ length: 2 + Math.floor(next() * 11) }, () => Math.floor(next() * 199) - 99));
  return list;
}

test('every sort orders every sample, never mutates input, and ends sorted', () => {
  for (const [name, sort] of Object.entries(SORTS)) {
    for (const values of samples()) {
      const items = toItems(values);
      const copy = JSON.stringify(items);
      const run = sort(items);
      assert.deepEqual(run.result, ascending(values), `${name} ${values}`);
      assert.equal(JSON.stringify(items), copy, 'input untouched');
      const last = run.steps.at(-1);
      assert.equal(last.done, true);
      assert.deepEqual(last.items.map((i) => i.value), ascending(values));
      assert.equal(last.hl.sorted.length, values.length, 'all marked sorted at the end');
      // stable ids: the same elements, just reordered
      assert.deepEqual(last.items.map((i) => i.id).sort((a, b) => a - b), values.map((_, i) => i));
    }
  }
});

test('step snapshots are immutable and counters only grow (backward stepping is safe)', () => {
  const run = bubbleSort(toItems([4, 3, 2, 1]));
  const first = JSON.stringify(run.steps[0]);
  run.steps.at(-1).items[0].value = 999;
  assert.equal(JSON.stringify(run.steps[0]), first);
  for (let i = 1; i < run.steps.length; i++) {
    for (const k of ['comparisons', 'swaps']) assert.ok(run.steps[i].stats[k] >= run.steps[i - 1].stats[k]);
  }
  assert.equal(run.steps.at(-1).stats.comparisons, 6);
  assert.equal(run.steps.at(-1).stats.swaps, 6);
  // an already sorted array stops after one pass
  const sorted = bubbleSort(toItems([1, 2, 3, 4, 5]));
  assert.equal(sorted.steps.at(-1).stats.comparisons, 4);
  assert.ok(sorted.steps.some((s) => s.note.key.endsWith('.early')));
});

test('counts match the textbook formulas', () => {
  const values = [9, 1, 8, 2, 7, 3];
  assert.equal(selectionSort(toItems(values)).steps.at(-1).stats.comparisons, (6 * 5) / 2);
  const inv = values.reduce((n, v, i) => n + values.slice(i + 1).filter((w) => w < v).length, 0);
  assert.equal(insertionSort(toItems(values)).steps.at(-1).stats.swaps, inv, 'insertion shifts = inversions');
  assert.equal(bubbleSort(toItems(values)).steps.at(-1).stats.swaps, inv, 'bubble swaps = inversions');
});

test('linear and binary search find every present value and report absent ones', () => {
  for (const values of samples()) {
    for (const target of [...new Set(values), 100]) {
      const lin = linearSearch(toItems(values), target);
      assert.equal(lin.result, values.indexOf(target));
      const bin = binarySearch(toItems(values), target);
      const sortedValues = bin.steps[0].items.map((i) => i.value);
      assert.deepEqual(sortedValues, ascending(values), 'binary works on the sorted array');
      if (target === 100) assert.equal(bin.result, -1);
      else assert.equal(sortedValues[bin.result], target);
      assert.ok(bin.steps.at(-1).stats.comparisons <= Math.floor(Math.log2(values.length)) + 1, 'at most ⌊log₂n⌋+1 checks');
    }
  }
  const unsorted = binarySearch(toItems([5, 1, 3]), 3);
  assert.match(unsorted.steps[0].note.key, /sortedFirst$/);
});

test('binary search variables and pointers follow left/mid/right', () => {
  const run = binarySearch(toItems([1, 3, 5, 7, 9, 11, 13]), 11);
  const mids = run.steps.filter((s) => s.vars.some((v) => v.name === 'mid')).map((s) => s.vars.find((v) => v.name === 'mid').value);
  assert.deepEqual([...new Set(mids)], [3, 5]);
  assert.equal(run.result, 5);
  const midStep = run.steps.find((s) => s.note.key.endsWith('.mid'));
  assert.deepEqual(midStep.pointers.map((p) => p.name), ['left', 'mid', 'right']);
  assert.ok(midStep.changed.includes('mid'));
});

test('recursion: call stack grows to n, base case, results multiply back', () => {
  const run = factorial(5);
  assert.equal(run.result, 120);
  assert.equal(run.steps.at(-1).stats.calls, 5);
  assert.equal(Math.max(...run.steps.map((s) => s.stack.length)), 5);
  const base = run.steps.find((s) => s.note.key.endsWith('.base'));
  assert.equal(base.stack.at(-1).n, 1);
  assert.deepEqual(base.stack.slice(0, -1).map((f) => f.status), ['waiting', 'waiting', 'waiting', 'waiting']);
  assert.deepEqual(run.steps.filter((s) => s.note.key.endsWith('.combine')).map((s) => s.note.params.result), [2, 6, 24, 120]);
  assert.equal(run.steps.at(-1).stack.length, 0);
  assert.equal(factorial(1).result, 1);
  assert.equal(factorial(99).result, 40320, 'n is capped at 8');
});

test('registry: every algorithm runs, note keys and line numbers are valid', () => {
  for (const id of ALGORITHM_IDS) {
    const run = runAlgorithm(id, { values: [4, 2, 6, 1], target: 6, n: 4 });
    assert.ok(run.steps.length > 1, id);
    for (const s of run.steps) {
      assert.ok(s.line >= 0 && s.line < ALGORITHMS[id].lines, `${id} line ${s.line}`);
      assert.match(s.note.key, new RegExp(`^algorithms\\.notes\\.${id}\\.\\w+$`));
    }
  }
});

test('array input parsing and random arrays', () => {
  assert.deepEqual(parseArray('2; -1, 3  4'), [2, -1, 3, 4]);
  for (const bad of ['5', '1, x', '1, 100', Array(13).fill(1).join(',')]) assert.equal(parseArray(bad), null, bad);
  const a = randomArray(rng(7), 8);
  assert.equal(new Set(a).size, 8);
  assert.deepEqual(randomArray(rng(7), 8), a, 'same seed, same array');
});

test('quizzes: reproducible, correct answer is right, distinct options', () => {
  for (const quiz of QUIZ_IDS) {
    for (let seed = 1; seed <= 60; seed++) {
      const v = makeQuiz(quiz, seed);
      assert.deepEqual(makeQuiz(quiz, seed), v);
      assert.ok(v.options.some((o) => o.id === v.correct));
      const labels = v.options.map((o) => o.values.join(','));
      assert.equal(new Set(labels).size, labels.length, `${quiz}#${seed} distinct`);
      const answer = v.options.find((o) => o.id === v.correct).values;
      if (quiz === 'binarySteps') {
        const run = binarySearch(toItems(v.array), v.params.target);
        assert.equal(answer[0], run.steps.at(-1).stats.comparisons);
      }
      if (quiz === 'bubblePass') {
        const once = [...v.array];
        for (let j = 0; j < once.length - 1; j++) if (once[j] > once[j + 1]) [once[j], once[j + 1]] = [once[j + 1], once[j]];
        assert.deepEqual(answer, once);
      }
      if (quiz === 'nextSwap') {
        // from position j in this pass, the first out-of-order neighbours are the answer
        let k = v.params.j;
        while (v.array[k] <= v.array[k + 1]) k++;
        assert.deepEqual(answer, [v.array[k], v.array[k + 1]]);
        assert.ok(v.array[k] > v.array[k + 1]);
      }
    }
  }
});

test('quiz grading: right answer 10/10, wrong answer explains why', () => {
  const v = makeQuiz('bubblePass', 3);
  const ok = grade(QUIZZES.bubblePass, { variant: v, choice: v.correct }, startAttempt('x', 0), 1000).report;
  assert.equal(ok.score, 10);
  assert.equal(ok.status, 'completed');
  const wrongId = v.options.find((o) => o.id !== v.correct).id;
  const bad = grade(QUIZZES.bubblePass, { variant: v, choice: wrongId }, startAttempt('x', 0), 1000).report;
  assert.equal(bad.score, 0);
  const fb = bad.outcomes[0].feedback[0];
  assert.equal(fb.key, 'algorithms.quiz.wrong');
  assert.equal(fb.detail.key, 'algorithms.quiz.bubblePass.why');
  assert.ok(String(fb.detail.params.swaps).includes('↔'));
});
