/** Immutable circuit edits. Invalid edits return an error code instead of a broken circuit. */
import type { Circuit, ConnectError, GateType, LogicNode, Wire } from './types';

export const MAX_GATES = 16;
export const INPUT_LABELS = ['A', 'B', 'C', 'D'] as const;

export const pinCount = (n: LogicNode) => (n.kind === 'output' ? 1 : n.kind === 'input' ? 0 : n.gate === 'NOT' ? 1 : 2);
export const hasOutput = (n: LogicNode) => n.kind !== 'output';
export const nodeById = (c: Circuit, id: string) => c.nodes.find((n) => n.id === id);
export const inputsOf = (c: Circuit) => c.nodes.filter((n) => n.kind === 'input');
export const gatesOf = (c: Circuit) => c.nodes.filter((n) => n.kind === 'gate');
export const outputOf = (c: Circuit) => c.nodes.find((n) => n.kind === 'output');
export const wireAt = (c: Circuit, to: string, port: number) => c.wires.find((w) => w.to === to && w.port === port);

/** Inputs on the left, the LED on the right — the empty board of a task. */
export function baseCircuit(inputs: readonly string[]): Circuit {
  const gap = 400 / Math.max(1, inputs.length);
  const nodes: LogicNode[] = inputs.map((label, i) => ({ id: label, kind: 'input', label, x: 80, y: 80 + gap / 2 + i * gap }));
  nodes.push({ id: 'Y', kind: 'output', label: 'Y', x: 920, y: 280 });
  return { nodes, wires: [] };
}

function nextGateId(c: Circuit) {
  const used = new Set(c.nodes.map((n) => n.id));
  for (let i = 1; ; i++) if (!used.has(`G${i}`)) return `G${i}`;
}

export function addGate(c: Circuit, gate: GateType, x: number, y: number): Circuit {
  if (gatesOf(c).length >= MAX_GATES) return c;
  const id = nextGateId(c);
  return { ...c, nodes: [...c.nodes, { id, kind: 'gate', gate, label: id, x, y }] };
}

/** Only gates can be deleted; the task's switches and LED stay. */
export function removeGate(c: Circuit, id: string): Circuit {
  if (nodeById(c, id)?.kind !== 'gate') return c;
  return { nodes: c.nodes.filter((n) => n.id !== id), wires: c.wires.filter((w) => w.from !== id && w.to !== id) };
}

export function moveNode(c: Circuit, id: string, x: number, y: number): Circuit {
  return { ...c, nodes: c.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) };
}

export function removeWire(c: Circuit, wireId: string): Circuit {
  return { ...c, wires: c.wires.filter((w) => w.id !== wireId) };
}

export function canConnect(c: Circuit, from: string, to: string, port: number): ConnectError | null {
  const a = nodeById(c, from);
  const b = nodeById(c, to);
  if (!a || !b) return 'badPin';
  if (from === to) return 'sameNode';
  if (!hasOutput(a)) return 'notSource';
  if (pinCount(b) === 0) return 'notTarget';
  if (port < 0 || port >= pinCount(b)) return 'badPin';
  return null;
}

/**
 * Wires an output to an input pin. A pin takes one signal, so connecting to
 * a used pin replaces its wire. Loops are allowed here and reported by
 * `analyze` — students should see why a loop has no stable value.
 */
export function connect(c: Circuit, from: string, to: string, port: number): { circuit: Circuit; error: ConnectError | null } {
  const error = canConnect(c, from, to, port);
  if (error) return { circuit: c, error };
  let n = c.wires.length + 1;
  while (c.wires.some((w) => w.id === `W${n}`)) n++;
  const wires = c.wires.filter((w) => !(w.to === to && w.port === port));
  return { circuit: { ...c, wires: [...wires, { id: `W${n}`, from, to, port }] }, error: null };
}

/** Dropped on a node body rather than a pin: use its first free input pin. */
export function connectToNode(c: Circuit, from: string, to: string): { circuit: Circuit; error: ConnectError | null } {
  const b = nodeById(c, to);
  if (!b) return { circuit: c, error: 'badPin' };
  if (from === to) return { circuit: c, error: 'sameNode' };
  if (pinCount(b) === 0) return { circuit: c, error: 'notTarget' };
  for (let port = 0; port < pinCount(b); port++) if (!wireAt(c, to, port)) return connect(c, from, to, port);
  return { circuit: c, error: 'noFreePin' };
}

export const wiresFrom = (c: Circuit, id: string): Wire[] => c.wires.filter((w) => w.from === id);
