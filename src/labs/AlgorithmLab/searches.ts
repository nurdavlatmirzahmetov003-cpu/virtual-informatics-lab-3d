import { createRecorder } from './recorder';
import type { Item, Run } from './types';

/** Checks every element left to right — works on any array. */
export function linearSearch(items: Item[], target: number): Run {
  const a = items.map((i) => ({ ...i }));
  const r = createRecorder('linear', a, ['comparisons'], ['i']);
  r.push(0, 'start', { target, n: a.length }, { vars: { target } });
  for (let i = 0; i < a.length; i++) {
    r.stats.comparisons++;
    const value = a[i].value;
    if (value === target) {
      r.push(1, 'found', { i, value, target, comparisons: r.stats.comparisons }, { vars: { i, target }, hl: { found: i }, done: true });
      return { algorithm: 'linear', steps: r.steps, result: i };
    }
    r.push(1, 'mismatch', { i, value, target }, { vars: { i, target }, hl: { compare: [i] } });
  }
  r.push(2, 'missing', { target, comparisons: r.stats.comparisons }, { vars: { target }, done: true });
  return { algorithm: 'linear', steps: r.steps, result: -1 };
}

const isSorted = (items: Item[]) => items.every((x, i) => i === 0 || items[i - 1].value <= x.value);

/**
 * Halves the sorted range each time. An unsorted input is sorted first and
 * the first step says so — binary search is only correct on sorted data.
 */
export function binarySearch(items: Item[], target: number): Run {
  const wasSorted = isSorted(items);
  const a = [...items].sort((x, y) => x.value - y.value).map((i) => ({ ...i }));
  const r = createRecorder('binary', a, ['comparisons'], ['left', 'mid', 'right']);
  let left = 0;
  let right = a.length - 1;
  r.push(0, wasSorted ? 'start' : 'sortedFirst', { target, left, right }, { vars: { left, right, target }, hl: { range: [left, right] } });
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const value = a[mid].value;
    r.stats.comparisons++;
    const vars = { left, right, mid, target };
    if (value === target) {
      r.push(3, 'found', { mid, value, comparisons: r.stats.comparisons }, { vars, hl: { found: mid, range: [left, right] }, done: true });
      return { algorithm: 'binary', steps: r.steps, result: mid };
    }
    r.push(2, 'mid', { left, right, mid, value, target }, { vars, hl: { compare: [mid], range: [left, right] } });
    if (value < target) {
      left = mid + 1;
      r.push(4, 'goRight', { value, target, left }, { vars: { left, right, mid, target }, hl: { range: [left, right] } });
    } else {
      right = mid - 1;
      r.push(5, 'goLeft', { value, target, right }, { vars: { left, right, mid, target }, hl: { range: [left, right] } });
    }
  }
  r.push(6, 'missing', { target, comparisons: r.stats.comparisons, left, right }, { vars: { left, right, target }, hl: { range: [left, right] }, done: true });
  return { algorithm: 'binary', steps: r.steps, result: -1 };
}
