/** Drawing-only geometry for the circuit board (simulation never uses it). */
import { pinCount, type GateType, type LogicNode } from '@/labs/LogicLab';

export const VIEW = { width: 1000, height: 560 } as const;

export interface Point {
  x: number;
  y: number;
}

/** Half-sizes used for hit tests and clamping. */
export const NODE_BOX = {
  gate: { w: 56, h: 32 },
  input: { w: 52, h: 28 },
  output: { w: 46, h: 40 },
} as const;

/** x where a gate symbol ends (bubble included) — the output lead starts there. */
export const GATE_TIP: Record<GateType, number> = { AND: 28, OR: 34, XOR: 34, NOT: 34, NAND: 40, NOR: 46 };

export const PIN_X = { gateIn: -54, gateOut: 54, inputOut: 62, outputIn: -46 } as const;

/** Input pin `port` of a node, in board units. */
export function inPin(n: LogicNode, port: number): Point {
  if (n.kind === 'output') return { x: n.x + PIN_X.outputIn, y: n.y };
  const count = pinCount(n);
  const dy = count === 1 ? 0 : port === 0 ? -14 : 14;
  return { x: n.x + PIN_X.gateIn, y: n.y + dy };
}

export function outPin(n: LogicNode): Point {
  return { x: n.x + (n.kind === 'input' ? PIN_X.inputOut : PIN_X.gateOut), y: n.y };
}

/** Horizontal S-curve, like wires on a schematic. */
export function wirePath(a: Point, b: Point): string {
  const dx = Math.max(36, Math.abs(b.x - a.x) * 0.45);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

export function clampToView(n: Pick<LogicNode, 'kind'>, x: number, y: number): Point {
  const box = NODE_BOX[n.kind];
  return {
    x: Math.round(Math.min(VIEW.width - box.w - 14, Math.max(box.w + 14, x))),
    y: Math.round(Math.min(VIEW.height - box.h - 14, Math.max(box.h + 22, y))),
  };
}

export function hitNode(nodes: readonly LogicNode[], p: Point): LogicNode | undefined {
  return [...nodes].reverse().find((n) => {
    const box = NODE_BOX[n.kind];
    return Math.abs(p.x - n.x) <= box.w + 8 && Math.abs(p.y - n.y) <= box.h + 8;
  });
}

/** Nearest input pin within reach of `p`. */
export function hitInPin(nodes: readonly LogicNode[], p: Point): { node: LogicNode; port: number } | null {
  let best: { node: LogicNode; port: number; d: number } | null = null;
  for (const n of nodes) {
    for (let port = 0; port < pinCount(n); port++) {
      const q = inPin(n, port);
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d <= 14 && (!best || d < best.d)) best = { node: n, port, d };
    }
  }
  return best && { node: best.node, port: best.port };
}

export function clientToView(svg: SVGSVGElement | null, clientX: number, clientY: number, inside = false): Point | null {
  if (!svg) return null;
  const r = svg.getBoundingClientRect();
  if (inside && (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom)) return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}
