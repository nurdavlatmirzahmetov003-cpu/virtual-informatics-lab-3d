import { createRecorder, range, swapItems } from './recorder';
import type { Item, Run } from './types';

const values = (a: Item[]) => a.map((i) => i.value);

/** Neighbours swap until the largest value "bubbles" to the end; stops early when a pass makes no swap. */
export function bubbleSort(items: Item[]): Run {
  const a = items.map((i) => ({ ...i }));
  const n = a.length;
  const r = createRecorder('bubble', a, ['comparisons', 'swaps'], ['j']);
  const sorted: number[] = [];
  r.push(0, 'start', { n }, { vars: {} });
  for (let pass = 1; pass < n; pass++) {
    let swapped = false;
    r.push(1, 'passStart', { pass, last: n - pass }, { vars: { pass, swapped }, hl: { sorted } });
    for (let j = 0; j < n - pass; j++) {
      r.stats.comparisons++;
      const x = a[j].value;
      const y = a[j + 1].value;
      const vars = { pass, j, swapped };
      r.push(3, x > y ? 'outOfOrder' : 'inOrder', { j, j1: j + 1, a: x, b: y }, { vars, hl: { compare: [j, j + 1], sorted } });
      if (x > y) {
        swapItems(a, j, j + 1);
        swapped = true;
        r.stats.swaps++;
        r.push(4, 'swap', { a: x, b: y }, { vars: { pass, j, swapped }, hl: { swap: [j, j + 1], sorted } });
      }
    }
    sorted.push(n - pass);
    if (!swapped) {
      r.push(5, 'early', { pass }, { vars: { pass, swapped }, hl: { sorted: range(0, n) } });
      break;
    }
    r.push(5, 'passEnd', { pass, value: a[n - pass].value, index: n - pass }, { vars: { pass, swapped }, hl: { sorted } });
  }
  r.push(6, 'finish', { comparisons: r.stats.comparisons, swaps: r.stats.swaps }, { hl: { sorted: range(0, n) }, done: true });
  return { algorithm: 'bubble', steps: r.steps, result: values(a) };
}

/** Finds the smallest remaining value and puts it at position i. */
export function selectionSort(items: Item[]): Run {
  const a = items.map((i) => ({ ...i }));
  const n = a.length;
  const r = createRecorder('selection', a, ['comparisons', 'swaps'], ['i', 'j', 'min']);
  r.push(0, 'start', { n }, { vars: {} });
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    const sorted = range(0, i);
    r.push(1, 'minInit', { i, value: a[i].value }, { vars: { i, min }, hl: { min, sorted } });
    for (let j = i + 1; j < n; j++) {
      r.stats.comparisons++;
      const x = a[j].value;
      const best = a[min].value;
      if (x < best) {
        min = j;
        r.push(3, 'newMin', { j, a: x, b: best }, { vars: { i, j, min }, hl: { compare: [j], min, sorted } });
      } else {
        r.push(3, 'keepMin', { j, a: x, b: best }, { vars: { i, j, min }, hl: { compare: [j], min, sorted } });
      }
    }
    if (min !== i) {
      const x = a[i].value;
      const y = a[min].value;
      swapItems(a, i, min);
      r.stats.swaps++;
      r.push(4, 'swap', { i, min, a: x, b: y }, { vars: { i, min }, hl: { swap: [i, min], sorted: range(0, i + 1) } });
    } else {
      r.push(4, 'noSwap', { i, value: a[i].value }, { vars: { i, min }, hl: { sorted: range(0, i + 1) } });
    }
  }
  r.push(5, 'finish', { comparisons: r.stats.comparisons, swaps: r.stats.swaps }, { hl: { sorted: range(0, n) }, done: true });
  return { algorithm: 'selection', steps: r.steps, result: values(a) };
}

/**
 * Takes the next value (key) and slides it left past every larger value.
 * Each shift is shown as the key trading places with its left neighbour,
 * which is what `a[j+1] = a[j]` followed by `a[j+1] = key` amounts to.
 */
export function insertionSort(items: Item[]): Run {
  const a = items.map((i) => ({ ...i }));
  const n = a.length;
  const r = createRecorder('insertion', a, ['comparisons', 'swaps'], ['i', 'j']);
  r.push(0, 'start', { n }, { vars: {}, hl: { sorted: n ? [0] : [] } });
  for (let i = 1; i < n; i++) {
    const key = a[i].value;
    let pos = i;
    let j = i - 1;
    r.push(1, 'pick', { i, key }, { vars: { i, j, key }, hl: { key: pos, sorted: range(0, i) } });
    while (j >= 0) {
      r.stats.comparisons++;
      const x = a[j].value;
      if (x <= key) {
        r.push(2, 'notGreater', { j, value: x, key }, { vars: { i, j, key }, hl: { compare: [j], key: pos, sorted: range(0, i) } });
        break;
      }
      r.push(2, 'greater', { j, value: x, key }, { vars: { i, j, key }, hl: { compare: [j], key: pos, sorted: range(0, i) } });
      swapItems(a, j, pos);
      r.stats.swaps++;
      pos = j;
      j--;
      r.push(3, 'shift', { value: x, key, to: pos + 1 }, { vars: { i, j, key }, hl: { swap: [pos, pos + 1], key: pos, sorted: range(0, i + 1).filter((k) => k !== pos) } });
    }
    r.push(4, j < 0 ? 'placeStart' : 'place', { key, pos, count: i + 1 }, { vars: { i, j, key }, hl: { sorted: range(0, i + 1) } });
  }
  r.push(5, 'finish', { comparisons: r.stats.comparisons, swaps: r.stats.swaps }, { hl: { sorted: range(0, n) }, done: true });
  return { algorithm: 'insertion', steps: r.steps, result: values(a) };
}
