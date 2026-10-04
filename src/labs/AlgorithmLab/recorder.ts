import type { AlgorithmId, Frame, Highlight, Item, Note, Step, VarValue } from './types';

const EMPTY: Highlight = { compare: [], swap: [], sorted: [], found: null, min: null, key: null, range: null };

export interface StepInput {
  hl?: Partial<Highlight>;
  vars?: Record<string, VarValue>;
  stack?: Frame[];
  done?: boolean;
}

/**
 * Collects snapshots while an algorithm runs. Every push deep-copies the
 * array, stack and counters, and works out which variables changed — the
 * algorithms themselves stay plain loops.
 */
export function createRecorder(algorithm: AlgorithmId, items: Item[], statKeys: readonly string[], pointerVars: readonly string[] = []) {
  const steps: Step[] = [];
  const stats: Record<string, number> = Object.fromEntries(statKeys.map((k) => [k, 0]));
  let previous: Record<string, VarValue> = {};

  function push(line: number, event: string, params: Note['params'] = {}, input: StepInput = {}) {
    const vars = input.vars ?? {};
    const changed = Object.keys(vars).filter((k) => previous[k] !== vars[k]);
    previous = { ...vars };
    const pointers = pointerVars
      .filter((name) => typeof vars[name] === 'number' && (vars[name] as number) >= 0 && (vars[name] as number) < items.length)
      .map((name) => ({ name, index: vars[name] as number }));
    steps.push({
      line,
      items: items.map((i) => ({ ...i })),
      hl: { ...EMPTY, ...input.hl, sorted: [...(input.hl?.sorted ?? [])] },
      pointers,
      vars: Object.entries(vars).map(([name, value]) => ({ name, value })),
      changed,
      stats: { ...stats },
      note: { key: `algorithms.notes.${algorithm}.${event}`, params },
      stack: (input.stack ?? []).map((f) => ({ ...f })),
      done: Boolean(input.done),
    });
  }

  return { steps, stats, push };
}

export const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);

export function swapItems(items: Item[], a: number, b: number) {
  [items[a], items[b]] = [items[b], items[a]];
}
