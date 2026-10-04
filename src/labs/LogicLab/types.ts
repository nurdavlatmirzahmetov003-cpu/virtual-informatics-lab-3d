/**
 * Logic Lab data model. A circuit is a graph: input switches → gates → the
 * output LED. Positions are for drawing only; simulation and grading never
 * read x / y.
 */

export const GATE_TYPES = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'] as const;
export type GateType = (typeof GATE_TYPES)[number];
export type Bit = 0 | 1;

export type NodeKind = 'input' | 'gate' | 'output';

export interface LogicNode {
  id: string;
  kind: NodeKind;
  /** Gates only. */
  gate?: GateType;
  /** Inputs: A, B, C… · output: Y · gates: G1, G2… */
  label: string;
  x: number;
  y: number;
}

/** A wire from a node's output to input pin `port` of another node. */
export interface Wire {
  id: string;
  from: string;
  to: string;
  port: number;
}

export interface Circuit {
  nodes: LogicNode[];
  wires: Wire[];
}

export type ConnectError = 'sameNode' | 'notSource' | 'notTarget' | 'noFreePin' | 'badPin';

export type IssueCode = 'cycle' | 'pinOpen' | 'outputOpen' | 'unused';

export interface CircuitIssue {
  code: IssueCode;
  /** Node ids involved. */
  nodes: string[];
  params: Record<string, string | number>;
}

export interface TruthRow {
  inputs: Record<string, Bit>;
  /** null when the output is undefined (open pin or a loop). */
  y: Bit | null;
}
