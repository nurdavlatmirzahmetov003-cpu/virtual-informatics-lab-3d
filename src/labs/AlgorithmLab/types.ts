/**
 * Algorithm Lab data model. Every algorithm is run once, up front, into a
 * list of immutable step snapshots — so stepping backwards is just moving an
 * index, and the UI never re-executes anything.
 */

export const ALGORITHM_IDS = ['linear', 'binary', 'bubble', 'selection', 'insertion', 'recursion'] as const;
export type AlgorithmId = (typeof ALGORITHM_IDS)[number];
export type AlgorithmKind = 'search' | 'sort' | 'recursion';

/** An array element with a stable id, so the UI can animate it as it moves. */
export interface Item {
  id: number;
  value: number;
}

/** Which positions to colour in this step (indices into `items`). */
export interface Highlight {
  compare: number[];
  swap: number[];
  sorted: number[];
  found: number | null;
  min: number | null;
  key: number | null;
  /** Binary search: the part of the array still in play. */
  range: [number, number] | null;
}

export interface Pointer {
  name: string;
  index: number;
}

/** A call-stack frame of the recursion demo. */
export interface Frame {
  id: number;
  n: number;
  status: 'active' | 'waiting' | 'base' | 'returning';
  result: number | null;
}

/** A translatable explanation: locale key + params. */
export interface Note {
  key: string;
  params?: Record<string, string | number>;
}

export type VarValue = number | string | boolean | null;

export interface Step {
  /** Pseudocode line (0-based) being executed. */
  line: number;
  items: Item[];
  hl: Highlight;
  pointers: Pointer[];
  /** Live variables in display order. */
  vars: Array<{ name: string; value: VarValue }>;
  /** Variables whose value changed in this step. */
  changed: string[];
  /** comparisons / swaps (sorts), comparisons (searches), calls / depth (recursion). */
  stats: Record<string, number>;
  note: Note;
  stack: Frame[];
  done: boolean;
}

export interface Run {
  algorithm: AlgorithmId;
  steps: Step[];
  /** Search: found index or −1 · sort: sorted values · recursion: n! */
  result: number | number[];
}

export interface AlgorithmInput {
  values: readonly number[];
  target?: number;
  /** Recursion: n for n! */
  n?: number;
}
