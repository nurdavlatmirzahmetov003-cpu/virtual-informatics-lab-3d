/**
 * V4 §4.3: walking on the robots' yard. The platform is a grid of 5 cm
 * cells; each cell stores its clearance — the distance to the nearest
 * obstacle or platform edge — so one grid serves robots of every size: a
 * robot of radius r may stand where clearance ≥ r. Paths come from A* on
 * that grid (8 neighbours, no corner cutting) and are pulled straight
 * wherever the robot fits along the whole segment. Pure: no three.js.
 */
import type { P2, Prop } from '@/data/robots/yard';

export const CELL = 0.05;

export interface YardGrid {
  /** Platform half sizes (m). */
  half: P2;
  cols: number;
  rows: number;
  /** Clearance per cell (m), row-major. */
  clear: Float32Array;
}

const distToBox = (x: number, z: number, p: Prop) => {
  const dx = Math.max(0, Math.abs(x - p.at[0]) - p.half[0]);
  const dz = Math.max(0, Math.abs(z - p.at[1]) - p.half[1]);
  return Math.hypot(dx, dz);
};

export function buildGrid(half: P2, obstacles: readonly Prop[]): YardGrid {
  const cols = Math.round((half[0] * 2) / CELL);
  const rows = Math.round((half[1] * 2) / CELL);
  const clear = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, z] = cellCentre({ half }, c, r);
      // the platform's edge counts as a wall: robots never step off
      let d = Math.min(half[0] - Math.abs(x), half[1] - Math.abs(z));
      for (const p of obstacles) d = Math.min(d, distToBox(x, z, p));
      clear[r * cols + c] = d;
    }
  }
  return { half, cols, rows, clear };
}

export const cellCentre = (g: Pick<YardGrid, 'half'>, c: number, r: number): P2 => [-g.half[0] + (c + 0.5) * CELL, -g.half[1] + (r + 0.5) * CELL];

export function cellOf(g: YardGrid, p: P2): [number, number] {
  const c = Math.floor((p[0] + g.half[0]) / CELL);
  const r = Math.floor((p[1] + g.half[1]) / CELL);
  return [Math.max(0, Math.min(g.cols - 1, c)), Math.max(0, Math.min(g.rows - 1, r))];
}

/** Clearance at a point (the nearest cell's). */
export function clearanceAt(g: YardGrid, p: P2): number {
  if (Math.abs(p[0]) > g.half[0] || Math.abs(p[1]) > g.half[1]) return -1;
  const [c, r] = cellOf(g, p);
  return g.clear[r * g.cols + c];
}

export const fits = (g: YardGrid, p: P2, radius: number) => clearanceAt(g, p) >= radius;

/** The robot fits all along the segment a → b (sampled every half cell). */
export function segmentFits(g: YardGrid, a: P2, b: P2, radius: number): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CELL / 2)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (!fits(g, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], radius)) return false;
  }
  return true;
}

/** The nearest point a robot of this radius fits, searching outwards from `p` (null if none within 1 m). */
export function nearestFit(g: YardGrid, p: P2, radius: number): P2 | null {
  if (fits(g, p, radius)) return p;
  const [c0, r0] = cellOf(g, p);
  for (let ring = 1; ring <= 1 / CELL; ring++) {
    let best: P2 | null = null;
    let bestD = Infinity;
    for (let dr = -ring; dr <= ring; dr++) {
      for (let dc = -ring; dc <= ring; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
        const c = c0 + dc;
        const r = r0 + dr;
        if (c < 0 || r < 0 || c >= g.cols || r >= g.rows || g.clear[r * g.cols + c] < radius) continue;
        const q = cellCentre(g, c, r);
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (d < bestD) {
          bestD = d;
          best = q;
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/** A binary min-heap of cell indices, each with the key it was pushed with (a cell may be in it more than once). */
class Heap {
  private keys: number[] = [];
  private items: number[] = [];
  get size() {
    return this.items.length;
  }
  private swap(a: number, b: number) {
    [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
  }
  push(i: number, key: number) {
    this.keys.push(key);
    this.items.push(i);
    let k = this.items.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (this.keys[p] <= this.keys[k]) break;
      this.swap(p, k);
      k = p;
    }
  }
  pop(): number {
    const top = this.items[0];
    const lastKey = this.keys.pop()!;
    const last = this.items.pop()!;
    if (this.items.length) {
      this.keys[0] = lastKey;
      this.items[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < this.items.length && this.keys[l] < this.keys[m]) m = l;
        if (r < this.items.length && this.keys[r] < this.keys[m]) m = r;
        if (m === k) break;
        this.swap(m, k);
        k = m;
      }
    }
    return top;
  }
}

/**
 * A path from `from` to `to` for a robot of `radius`: waypoints after `from`,
 * ending at `to` (or the nearest point it fits). `blocked`: extra cells to
 * avoid (other robots standing in the way). Null when there is no way.
 */
export function findPath(g: YardGrid, from: P2, to: P2, radius: number, blocked?: (c: number, r: number) => boolean): P2[] | null {
  const start = nearestFit(g, from, radius);
  const goal = nearestFit(g, to, radius);
  if (!start || !goal) return null;
  const [sc, sr] = cellOf(g, start);
  const [gc, gr] = cellOf(g, goal);
  const n = g.cols * g.rows;
  const gScore = new Float32Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const h = (c: number, r: number) => {
    const dx = Math.abs(c - gc);
    const dy = Math.abs(r - gr);
    return (dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy)) * CELL;
  };
  const s = sr * g.cols + sc;
  gScore[s] = 0;
  const open = new Heap();
  open.push(s, h(sc, sr));
  const goalIdx = gr * g.cols + gc;
  const ok = (c: number, r: number) => c >= 0 && r >= 0 && c < g.cols && r < g.rows && g.clear[r * g.cols + c] >= radius && !blocked?.(c, r);
  while (open.size) {
    const cur = open.pop();
    if (cur === goalIdx) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cc = cur % g.cols;
    const cr = (cur - cc) / g.cols;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const c = cc + dc;
        const r = cr + dr;
        if (!ok(c, r)) continue;
        // diagonals only when both sides are free: no squeezing past a corner
        if (dr && dc && (!ok(cc + dc, cr) || !ok(cc, cr + dr))) continue;
        const i = r * g.cols + c;
        if (closed[i]) continue;
        const step = (dr && dc ? Math.SQRT2 : 1) * CELL;
        const tentative = gScore[cur] + step;
        if (tentative < gScore[i]) {
          gScore[i] = tentative;
          came[i] = cur;
          open.push(i, tentative + h(c, r));
        }
      }
    }
  }
  if (came[goalIdx] === -1 && goalIdx !== s) return null;
  const cells: P2[] = [];
  for (let i = goalIdx; i !== -1 && i !== s; i = came[i]) {
    const c = i % g.cols;
    cells.push(cellCentre(g, c, (i - c) / g.cols));
  }
  cells.reverse();
  cells[cells.length - 1] = goal;
  // string pulling: skip waypoints while the straight segment still fits
  const out: P2[] = [];
  let anchor = start;
  let k = 0;
  while (k < cells.length) {
    let far = k;
    for (let j = cells.length - 1; j > k; j--) {
      if (segmentFits(g, anchor, cells[j], radius)) {
        far = j;
        break;
      }
    }
    out.push(cells[far]);
    anchor = cells[far];
    k = far + 1;
  }
  return out.length ? out : [goal];
}
