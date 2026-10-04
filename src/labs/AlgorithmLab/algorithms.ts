import { toItems } from './arrays';
import { factorial } from './recursion';
import { binarySearch, linearSearch } from './searches';
import { bubbleSort, insertionSort, selectionSort } from './sorts';
import type { AlgorithmId, AlgorithmInput, AlgorithmKind, Run } from './types';

export interface AlgorithmSpec {
  id: AlgorithmId;
  kind: AlgorithmKind;
  /** Number of pseudocode lines (the text is in locales: algorithms.code.<id>.<line>). */
  lines: number;
  /** Counters shown under the visualisation. */
  stats: readonly string[];
  /** Big-O shown on the card, language-neutral. */
  complexity: string;
  run: (input: AlgorithmInput) => Run;
}

const target = (input: AlgorithmInput) => input.target ?? input.values[0] ?? 0;

export const ALGORITHMS: Record<AlgorithmId, AlgorithmSpec> = {
  linear: { id: 'linear', kind: 'search', lines: 3, stats: ['comparisons'], complexity: 'O(n)', run: (i) => linearSearch(toItems(i.values), target(i)) },
  binary: { id: 'binary', kind: 'search', lines: 7, stats: ['comparisons'], complexity: 'O(log n)', run: (i) => binarySearch(toItems(i.values), target(i)) },
  bubble: { id: 'bubble', kind: 'sort', lines: 7, stats: ['comparisons', 'swaps'], complexity: 'O(n²)', run: (i) => bubbleSort(toItems(i.values)) },
  selection: { id: 'selection', kind: 'sort', lines: 6, stats: ['comparisons', 'swaps'], complexity: 'O(n²)', run: (i) => selectionSort(toItems(i.values)) },
  insertion: { id: 'insertion', kind: 'sort', lines: 6, stats: ['comparisons', 'swaps'], complexity: 'O(n²)', run: (i) => insertionSort(toItems(i.values)) },
  recursion: { id: 'recursion', kind: 'recursion', lines: 4, stats: ['calls', 'depth'], complexity: 'O(n)', run: (i) => factorial(i.n ?? 4) },
};

export const runAlgorithm = (id: AlgorithmId, input: AlgorithmInput) => ALGORITHMS[id].run(input);
