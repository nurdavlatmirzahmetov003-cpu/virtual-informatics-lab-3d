import { createRecorder } from './recorder';
import type { Frame, Run } from './types';

export const MAX_FACTORIAL_N = 8;

/**
 * factorial(n) with a visible call stack: each call pushes a frame that waits
 * for the smaller call, the base case stops the descent, and the answers are
 * multiplied on the way back up.
 */
export function factorial(nInput: number): Run {
  const n = Math.max(1, Math.min(MAX_FACTORIAL_N, Math.floor(nInput)));
  const r = createRecorder('recursion', [], ['calls', 'depth']);
  const stack: Frame[] = [];
  let nextId = 1;

  const call = (k: number): number => {
    r.stats.calls++;
    const frame: Frame = { id: nextId++, n: k, status: 'active', result: null };
    stack.forEach((f) => (f.status = f.status === 'active' ? 'waiting' : f.status));
    stack.push(frame);
    r.stats.depth = Math.max(r.stats.depth, stack.length);
    r.push(0, 'call', { n: k, depth: stack.length }, { vars: { n: k }, stack });
    r.push(1, k <= 1 ? 'checkBase' : 'checkRecurse', { n: k }, { vars: { n: k }, stack });

    let result: number;
    if (k <= 1) {
      frame.status = 'base';
      frame.result = 1;
      result = 1;
      r.push(2, 'base', { n: k }, { vars: { n: k, result }, stack });
    } else {
      r.push(3, 'recurse', { n: k, n1: k - 1 }, { vars: { n: k }, stack });
      const sub = call(k - 1);
      frame.status = 'returning';
      result = k * sub;
      frame.result = result;
      r.push(3, 'combine', { n: k, n1: k - 1, sub, result }, { vars: { n: k, result }, stack });
    }
    stack.pop();
    if (stack.length) stack[stack.length - 1].status = 'active';
    return result;
  };

  r.push(0, 'start', { n }, { vars: { n } });
  const result = call(n);
  r.push(3, 'finish', { n, result, calls: r.stats.calls }, { vars: { n, result }, done: true });
  return { algorithm: 'recursion', steps: r.steps, result };
}
