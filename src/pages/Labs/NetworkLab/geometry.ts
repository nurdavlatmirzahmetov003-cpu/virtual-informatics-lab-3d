/** Drawing-only geometry for the workspace SVG (never used by grading). */
import { DEVICE_SPECS, deviceById, roleOf, type Device, type DeviceType, type Link, type Network } from '@/labs/NetworkLab';

export const VIEW = { width: 1000, height: 620 } as const;

export interface Point {
  x: number;
  y: number;
}

/**
 * End devices take cables on their top edge, network gear on the bottom, so
 * a switch above its computers is wired without cables crossing the tiles.
 */
export function portSide(type: DeviceType, port: string): 'top' | 'bottom' {
  if (type === 'accessPoint') return port === 'eth0' ? 'top' : 'bottom';
  return roleOf(type) === 'host' ? 'top' : 'bottom';
}

export function portPoint(d: Pick<Device, 'type' | 'x' | 'y'>, port: string): Point {
  const spec = DEVICE_SPECS[d.type];
  const side = portSide(d.type, port);
  const row = spec.ports.filter((p) => portSide(d.type, p.id) === side);
  const i = Math.max(0, row.findIndex((p) => p.id === port));
  return { x: d.x - spec.width / 2 + ((i + 1) * spec.width) / (row.length + 1), y: d.y + (side === 'top' ? -spec.height / 2 : spec.height / 2) };
}

/** Keeps a device fully inside the workspace. */
export function clampToView(d: Pick<Device, 'type'>, x: number, y: number): Point {
  const { width, height } = DEVICE_SPECS[d.type];
  return {
    x: Math.round(Math.min(VIEW.width - width / 2 - 8, Math.max(width / 2 + 8, x))),
    y: Math.round(Math.min(VIEW.height - height / 2 - 24, Math.max(height / 2 + 18, y))),
  };
}

type Side = 'top' | 'bottom';

/** Cables leave a port away from its tile, then bend towards the other end. */
function controls(a: Point, b: Point, sa: Side, sb: Side): [Point, Point] {
  const sag = 34 + Math.min(90, Math.hypot(b.x - a.x, b.y - a.y) * 0.18);
  return [
    { x: a.x, y: a.y + (sa === 'top' ? -sag : sag) },
    { x: b.x, y: b.y + (sb === 'top' ? -sag : sag) },
  ];
}

export function cablePath(a: Point, b: Point, sa: Side = 'bottom', sb: Side = 'bottom'): string {
  const [c1, c2] = controls(a, b, sa, sb);
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

function bezier(a: Point, b: Point, sa: Side, sb: Side, steps = 16): Point[] {
  const [c1, c2] = controls(a, b, sa, sb);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
    };
  });
}

export function linkEnds(net: Network, link: Link): [Point, Point, Side, Side] | null {
  const a = deviceById(net, link.a.device);
  const b = deviceById(net, link.b.device);
  return a && b ? [portPoint(a, link.a.port), portPoint(b, link.b.port), portSide(a.type, link.a.port), portSide(b.type, link.b.port)] : null;
}

/** Polyline the packet follows: device → its port → along the cable → next device. */
export function packetRoute(net: Network, hops: string[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < hops.length; i++) {
    const d = deviceById(net, hops[i]);
    if (!d) continue;
    points.push({ x: d.x, y: d.y });
    const next = hops[i + 1];
    if (!next) break;
    const link = net.links.find((l) => (l.a.device === d.id && l.b.device === next) || (l.b.device === d.id && l.a.device === next));
    if (!link) continue;
    const [from, to] = link.a.device === d.id ? [link.a, link.b] : [link.b, link.a];
    const nd = deviceById(net, next);
    if (nd) points.push(...bezier(portPoint(d, from.port), portPoint(nd, to.port), portSide(d.type, from.port), portSide(nd.type, to.port)));
  }
  return points;
}

export function routeLength(points: Point[]): number[] {
  const acc = [0];
  for (let i = 1; i < points.length; i++) acc.push(acc[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  return acc;
}

export function pointAt(points: Point[], lengths: number[], distance: number): Point {
  if (points.length === 1 || distance <= 0) return points[0];
  if (distance >= lengths.at(-1)!) return points.at(-1)!;
  const i = Math.max(1, lengths.findIndex((l) => l >= distance));
  const span = lengths[i] - lengths[i - 1] || 1;
  const t = (distance - lengths[i - 1]) / span;
  return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * t, y: points[i - 1].y + (points[i].y - points[i - 1].y) * t };
}

/** Client (screen) coordinates → workspace units; null when outside the board. */
export function clientToView(svg: SVGSVGElement | null, clientX: number, clientY: number, inside = false): Point | null {
  if (!svg) return null;
  const r = svg.getBoundingClientRect();
  if (inside && (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom)) return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}
