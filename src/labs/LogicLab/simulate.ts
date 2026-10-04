/**
 * Combinational simulation. A node's value is computed from its input wires
 * on demand; an open pin or a feedback loop makes the value undefined (null)
 * instead of guessing — the UI shows it and `analyze` explains why.
 */
import { gatesOf, inputsOf, nodeById, outputOf, pinCount, wireAt, wiresFrom } from './circuit';
import type { Bit, Circuit, CircuitIssue, GateType, LogicNode, TruthRow } from './types';

export function gateOutput(gate: GateType, a: Bit, b: Bit = 0): Bit {
  switch (gate) {
    case 'AND':
      return (a & b) as Bit;
    case 'OR':
      return (a | b) as Bit;
    case 'NOT':
      return (1 - a) as Bit;
    case 'XOR':
      return (a ^ b) as Bit;
    case 'NAND':
      return (1 - (a & b)) as Bit;
    case 'NOR':
      return (1 - (a | b)) as Bit;
  }
}

export interface Evaluation {
  /** Node id → its output value. */
  nodes: Map<string, Bit | null>;
  /** Wire id → the signal on it. */
  wires: Map<string, Bit | null>;
  output: Bit | null;
}

export function evaluate(c: Circuit, inputs: Record<string, Bit>): Evaluation {
  const value = new Map<string, Bit | null>();
  const visiting = new Set<string>();
  const loops = cycleNodes(c);

  const val = (id: string): Bit | null => {
    if (value.has(id)) return value.get(id)!;
    const n = nodeById(c, id);
    if (!n) return null;
    if (n.kind === 'input') {
      value.set(id, inputs[n.label] ?? 0);
      return value.get(id)!;
    }
    // a node on a loop has no stable value
    if (loops.has(id) || visiting.has(id)) {
      value.set(id, null);
      return null;
    }
    visiting.add(id);
    const pins = Array.from({ length: pinCount(n) }, (_, p) => {
      const w = wireAt(c, id, p);
      return w ? val(w.from) : null;
    });
    visiting.delete(id);
    let out: Bit | null = null;
    if (pins.every((p) => p !== null)) out = n.kind === 'output' ? pins[0] : gateOutput(n.gate!, pins[0] as Bit, (pins[1] ?? 0) as Bit);
    value.set(id, out);
    return out;
  };

  for (const n of c.nodes) val(n.id);

  const wires = new Map(c.wires.map((w) => [w.id, value.get(w.from) ?? null]));
  const out = outputOf(c);
  return { nodes: value, wires, output: out ? (value.get(out.id) ?? null) : null };
}

/** Nodes that sit on a feedback loop (Tarjan's strongly connected components). */
export function cycleNodes(c: Circuit): Set<string> {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const result = new Set<string>();
  let counter = 0;
  const next = (id: string) => wiresFrom(c, id).map((w) => w.to);

  const strong = (id: string) => {
    index.set(id, counter);
    low.set(id, counter++);
    stack.push(id);
    onStack.add(id);
    for (const to of next(id)) {
      if (!index.has(to)) {
        strong(to);
        low.set(id, Math.min(low.get(id)!, low.get(to)!));
      } else if (onStack.has(to)) low.set(id, Math.min(low.get(id)!, index.get(to)!));
    }
    if (low.get(id) === index.get(id)) {
      const group: string[] = [];
      let top: string;
      do {
        top = stack.pop()!;
        onStack.delete(top);
        group.push(top);
      } while (top !== id);
      if (group.length > 1 || next(id).includes(id)) group.forEach((g) => result.add(g));
    }
  };
  for (const n of c.nodes) if (!index.has(n.id)) strong(n.id);
  return result;
}

/** Every node the output depends on (walking wires backwards from Y). */
export function outputCone(c: Circuit): Set<string> {
  const out = outputOf(c);
  const seen = new Set<string>();
  const queue = out ? [out.id] : [];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const w of c.wires) if (w.to === id) queue.push(w.from);
  }
  return seen;
}

const labelOf = (c: Circuit, id: string) => nodeById(c, id)?.label ?? id;

/** Everything a teacher would point at: loops, open pins, an unwired LED, unused gates. */
export function analyze(c: Circuit): CircuitIssue[] {
  const issues: CircuitIssue[] = [];
  const loops = cycleNodes(c);
  if (loops.size) issues.push({ code: 'cycle', nodes: [...loops], params: { gates: [...loops].map((id) => labelOf(c, id)).join(' → ') } });
  const out = outputOf(c);
  if (out && !wireAt(c, out.id, 0)) issues.push({ code: 'outputOpen', nodes: [out.id], params: { output: out.label } });
  for (const g of gatesOf(c)) {
    // one line per gate, listing every open pin
    const open = Array.from({ length: pinCount(g) }, (_, p) => p).filter((p) => !wireAt(c, g.id, p));
    if (open.length) issues.push({ code: 'pinOpen', nodes: [g.id], params: { gate: g.label, type: g.gate!, pins: open.map((p) => p + 1).join(', ') } });
    if (!wiresFrom(c, g.id).length) issues.push({ code: 'unused', nodes: [g.id], params: { gate: g.label, type: g.gate! } });
  }
  return issues;
}

/** All input combinations in binary order (A is the most significant bit). */
export function combinations(labels: readonly string[]): Array<Record<string, Bit>> {
  return Array.from({ length: 2 ** labels.length }, (_, row) =>
    Object.fromEntries(labels.map((l, i) => [l, ((row >> (labels.length - 1 - i)) & 1) as Bit])),
  );
}

export function truthTable(c: Circuit, labels: readonly string[] = inputsOf(c).map((n) => n.label)): TruthRow[] {
  return combinations(labels).map((inputs) => ({ inputs, y: evaluate(c, inputs).output }));
}

/** The circuit as a Boolean formula, e.g. "NOT(A) OR B"; null while incomplete or looping. */
export function expression(c: Circuit): string | null {
  const out = outputOf(c);
  const loops = cycleNodes(c);
  const build = (n: LogicNode | undefined, top: boolean): string | null => {
    if (!n || loops.has(n.id)) return null;
    if (n.kind === 'input') return n.label;
    const args = Array.from({ length: pinCount(n) }, (_, p) => {
      const w = wireAt(c, n.id, p);
      return w ? build(nodeById(c, w.from), false) : null;
    });
    if (args.some((a) => a === null)) return null;
    if (n.kind === 'output') return build(nodeById(c, wireAt(c, n.id, 0)!.from), true);
    if (n.gate === 'NOT') return `NOT(${args[0]})`;
    const text = `${args[0]} ${n.gate} ${args[1]}`;
    return top ? text : `(${text})`;
  };
  return out ? build(out, true) : null;
}
