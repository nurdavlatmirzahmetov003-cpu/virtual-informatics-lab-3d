/**
 * V4 §4.3: the robots' yard as a few merged geometries (zone space, the
 * platform top at y = 0; data/robots/yard.ts lays it out):
 *   - `yardStatic`: garages, pitch, play corner, the work props and the
 *     lounge — one mesh, vertex coloured;
 *   - `dockGlow`: every garage's charging pad and battery bar in one mesh
 *     whose shader fills the bars from uniforms (no per-frame buffers);
 *   - `nameplates`: the garages' names on one canvas texture.
 */
import { BoxGeometry, BufferAttribute, CanvasTexture, CircleGeometry, CylinderGeometry, PlaneGeometry, SRGBColorSpace, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROSTER } from '@/data/robots/roster';
import { DANCE_FLOOR, GARAGE, GARAGES, PITCH, PITCH_CENTRE, PROPS, YARD_HALF, garageWalls, type Prop } from '@/data/robots/yard';
import { FONT_DISPLAY } from '@/lib/fonts';
import { mergePieces, type Piece, type Vec3 } from '../../classroom/mergeParts';

const prop = (id: string): Prop => PROPS.find((p) => p.id === id)!;
const box = (w: number, h: number, d: number, at: Vec3, color: string, rot?: Vec3): Piece => ({ geo: new BoxGeometry(w, h, d), at, color, rot });
const rbox = (w: number, h: number, d: number, r: number, at: Vec3, color: string): Piece => ({ geo: new RoundedBoxGeometry(w, h, d, 2, r), at, color });

const BACK_Z = -YARD_HALF[1] + 0.02 + GARAGE.wall / 2;
const FRONT_Z = BACK_Z - GARAGE.wall / 2 + GARAGE.depth + 0.02;

export function yardStatic(light: boolean): BufferGeometry {
  const wall = light ? '#e3e9f3' : '#3a4363';
  const frame = light ? '#c9d2e0' : '#2a3150';
  const pieces: Piece[] = [];

  /* garages: back wall, dividers, a roof in each robot's colour with a fascia for its name */
  for (const w of garageWalls()) pieces.push(box(w.half[0] * 2, w.h, w.half[1] * 2, [w.at[0], w.h / 2, w.at[1]], w.id === 'garage-back' ? wall : frame));
  GARAGES.forEach((g, i) => {
    const accent = ROSTER[i].accent;
    const zMid = (BACK_Z + FRONT_Z) / 2;
    pieces.push(box(GARAGE.width - 0.01, 0.04, GARAGE.depth, [g.pad[0], GARAGE.height + 0.02, zMid], accent));
    pieces.push(box(GARAGE.width - 0.01, 0.16, 0.03, [g.pad[0], GARAGE.height - 0.06, FRONT_Z - 0.015], accent));
    // the charging plug on the back wall, and the battery bar's frame (its light is the dock mesh)
    pieces.push(rbox(0.12, 0.12, 0.04, 0.02, [g.pad[0] - 0.2, 0.32, BACK_Z + 0.04], frame));
    pieces.push(rbox(0.14, 0.47, 0.012, 0.012, [g.pad[0] + 0.22, 0.76, BACK_Z + GARAGE.wall / 2 + 0.001], '#1b2133'));
  });

  /* pitch: turf, white lines, goals with posts and a net */
  const [x0, z0] = PITCH.min;
  const [x1, z1] = PITCH.max;
  const pw = x1 - x0;
  const pd = z1 - z0;
  const [cx, cz] = PITCH_CENTRE;
  pieces.push(box(pw + 0.2, 0.006, pd + 0.2, [cx, 0.003, cz], light ? '#62b67c' : '#2f7d48'));
  const line = '#f5f7fb';
  const lt = 0.025;
  pieces.push(box(pw, 0.004, lt, [cx, 0.008, z0], line), box(pw, 0.004, lt, [cx, 0.008, z1], line));
  pieces.push(box(lt, 0.004, pd, [x0, 0.008, cz], line), box(lt, 0.004, pd, [x1, 0.008, cz], line));
  pieces.push(box(lt, 0.004, pd, [cx, 0.008, cz], line));
  pieces.push({ geo: new TorusGeometry(0.32, lt / 2, 3, 40), at: [cx, 0.008, cz], rot: [Math.PI / 2, 0, 0], scale: [1, 1, 0.16], color: line });
  for (const side of [-1, 1]) {
    const gx = side < 0 ? x0 : x1;
    const back = gx + side * PITCH.goalDepth;
    const w = PITCH.goalWidth / 2;
    const h = PITCH.goalHeight;
    for (const s of [-1, 1]) pieces.push({ geo: new CylinderGeometry(0.018, 0.018, h, 10), at: [gx, h / 2, cz + s * w], color: '#ffffff' });
    pieces.push({ geo: new CylinderGeometry(0.018, 0.018, PITCH.goalWidth, 10), at: [gx, h, cz], rot: [Math.PI / 2, 0, 0], color: '#ffffff' });
    // the net: back, sides and roof as thin grey panels
    pieces.push(box(0.01, h, PITCH.goalWidth, [back, h / 2, cz], '#cfd5df'));
    for (const s of [-1, 1]) pieces.push(box(PITCH.goalDepth, h, 0.01, [(gx + back) / 2, h / 2, cz + s * w], '#cfd5df'));
    pieces.push(box(PITCH.goalDepth, 0.01, PITCH.goalWidth, [(gx + back) / 2, h, cz], '#cfd5df'));
  }

  /* play corner: a dance floor of bright tiles */
  const colours = ['#f472b6', '#38d6f5', '#facc15', '#a78bfa', '#4ade80', '#fb923c'];
  const n = DANCE_FLOOR.tiles;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = DANCE_FLOOR.at[0] + (i - (n - 1) / 2) * DANCE_FLOOR.tile;
      const z = DANCE_FLOOR.at[1] + (j - (n - 1) / 2) * DANCE_FLOOR.tile;
      pieces.push(box(DANCE_FLOOR.tile - 0.03, 0.012, DANCE_FLOOR.tile - 0.03, [x, 0.006, z], colours[(i * n + j) % colours.length]));
    }
  }

  /* work props */
  const crates = prop('crates');
  for (const [dx, dy, dz, s] of [
    [0, 0, 0, 1],
    [0.02, 1, -0.01, 0.9],
  ] as const) {
    const w = crates.half[0] * 2 * s;
    const d = crates.half[1] * 2 * s;
    const h = 0.22;
    const y = dy * 0.23 + h / 2;
    pieces.push(box(w, h, d, [crates.at[0] + dx, y, crates.at[1] + dz], '#c9a072'));
    pieces.push(box(w + 0.005, 0.03, d + 0.005, [crates.at[0] + dx, y, crates.at[1] + dz], '#5f7bff'));
  }
  const bench = prop('workbench');
  pieces.push(rbox(bench.half[0] * 2, 0.04, bench.half[1] * 2, 0.01, [bench.at[0], 0.48, bench.at[1]], '#a8743f'));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pieces.push(box(0.03, 0.46, 0.03, [bench.at[0] + sx * (bench.half[0] - 0.03), 0.23, bench.at[1] + sz * (bench.half[1] - 0.03)], frame));
  pieces.push(box(0.16, 0.012, 0.22, [bench.at[0], 0.506, bench.at[1]], '#1f6f4a'));
  pieces.push(box(0.05, 0.02, 0.05, [bench.at[0] + 0.02, 0.52, bench.at[1] - 0.03], '#9aa3b2'));
  const shelf = prop('bookshelf');
  pieces.push(box(shelf.half[0] * 2, shelf.h, 0.02, [shelf.at[0] + shelf.half[0] - 0.01, shelf.h / 2, shelf.at[1]], '#8a5a32', [0, 0, 0]));
  for (const s of [-1, 1]) pieces.push(box(shelf.half[0] * 2, shelf.h, 0.02, [shelf.at[0], shelf.h / 2, shelf.at[1] + s * (shelf.half[1] - 0.01)], '#8a5a32'));
  const bookColours = ['#ef4444', '#3b82f6', '#22c55e', '#f5b83d', '#a855f7', '#14b8a6'];
  for (let k = 0; k < 4; k++) {
    const y = 0.04 + k * 0.23;
    pieces.push(box(shelf.half[0] * 2, 0.02, shelf.half[1] * 2, [shelf.at[0], y, shelf.at[1]], '#8a5a32'));
    if (k === 3) break;
    for (let b = 0; b < 7; b++) pieces.push(box(0.16, 0.15 + ((b * 7 + k) % 3) * 0.02, 0.06, [shelf.at[0] + 0.02, y + 0.09, shelf.at[1] - shelf.half[1] + 0.07 + b * 0.075], bookColours[(b + k) % bookColours.length]));
  }
  const board = prop('board');
  pieces.push(box(board.half[0] * 2, 0.5, 0.02, [board.at[0], 0.75, board.at[1]], '#ffffff'));
  pieces.push(box(board.half[0] * 2 + 0.04, 0.54, 0.015, [board.at[0], 0.75, board.at[1] - 0.012], frame));
  for (const s of [-1, 1]) pieces.push(box(0.03, 1.0, 0.03, [board.at[0] + s * board.half[0], 0.5, board.at[1] - 0.02], frame));
  // a little lesson on the board: three lines and a circle
  for (let k = 0; k < 3; k++) pieces.push(box(0.3 - k * 0.06, 0.012, 0.004, [board.at[0] - 0.1 + k * 0.03, 0.88 - k * 0.08, board.at[1] + 0.012], k === 0 ? '#3b82f6' : '#334155'));
  pieces.push({ geo: new TorusGeometry(0.06, 0.006, 4, 24), at: [board.at[0] + 0.17, 0.72, board.at[1] + 0.012], color: '#ef4444' });
  const term = prop('terminal');
  pieces.push({ geo: new CylinderGeometry(0.03, 0.05, 0.85, 12), at: [term.at[0], 0.425, term.at[1]], color: frame });
  pieces.push(rbox(0.06, 0.22, 0.3, 0.02, [term.at[0], 0.92, term.at[1]], '#1b2133'));

  /* lounge: sofa, table, beanbag, plant */
  const sofa = prop('sofa');
  const sofaCol = light ? '#8b7cf6' : '#6d5ed8';
  pieces.push(rbox(sofa.half[0] * 2, 0.2, sofa.half[1] * 2, 0.04, [sofa.at[0], 0.18, sofa.at[1]], sofaCol));
  pieces.push(rbox(0.12, 0.34, sofa.half[1] * 2, 0.04, [sofa.at[0] + sofa.half[0] - 0.06, 0.38, sofa.at[1]], sofaCol));
  for (const s of [-1, 1]) pieces.push(rbox(sofa.half[0] * 2, 0.26, 0.1, 0.04, [sofa.at[0], 0.3, sofa.at[1] + s * (sofa.half[1] - 0.05)], sofaCol));
  pieces.push(rbox(sofa.half[0] * 2 - 0.12, 0.06, sofa.half[1] * 2 - 0.2, 0.03, [sofa.at[0] - 0.04, 0.3, sofa.at[1]], '#ffffff'));
  const table = prop('table');
  pieces.push({ geo: new CylinderGeometry(table.half[0], table.half[0], 0.03, 24), at: [table.at[0], 0.3, table.at[1]], color: '#f4f6fa' });
  pieces.push({ geo: new CylinderGeometry(0.02, 0.06, 0.29, 12), at: [table.at[0], 0.145, table.at[1]], color: frame });
  pieces.push({ geo: new CylinderGeometry(0.03, 0.025, 0.06, 12), at: [table.at[0] + 0.03, 0.345, table.at[1]], color: '#5f7bff' });
  const bag = prop('beanbag');
  pieces.push({ geo: new SphereGeometry(bag.half[0], 20, 12), at: [bag.at[0], 0.15, bag.at[1]], scale: [1, 0.72, 1], color: '#fb923c' });
  const plant = prop('plant');
  pieces.push({ geo: new CylinderGeometry(0.12, 0.09, 0.26, 18), at: [plant.at[0], 0.13, plant.at[1]], color: '#f4f6fa' });
  for (const [dx, dy, dz, r] of [
    [0, 0.55, 0, 0.16],
    [0.06, 0.78, 0.03, 0.13],
    [-0.05, 0.72, -0.04, 0.12],
    [0.01, 0.98, -0.01, 0.1],
  ] as const)
    pieces.push({ geo: new SphereGeometry(r, 14, 10), at: [plant.at[0] + dx, dy, plant.at[1] + dz], color: '#3fae5a' });
  pieces.push({ geo: new CylinderGeometry(0.012, 0.015, 0.6, 6), at: [plant.at[0], 0.55, plant.at[1]], color: '#6b4a2b' });

  return mergePieces(pieces, true);
}

/**
 * Every garage's charging pad (a ring on the floor) and battery bar (on the back wall) in one geometry:
 * `aDock` is the garage's index, `aFill` how high up the bar a vertex is (−1 on a pad), `aColor` the robot's colour.
 */
export function dockGlow(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  GARAGES.forEach((g, i) => {
    const tag = (geo: BufferGeometry, fill: (y: number) => number) => {
      const n = geo.attributes.position.count;
      const dock = new Float32Array(n).fill(i);
      const f = new Float32Array(n);
      const c = new Float32Array(n * 3);
      const col = hexRgb(ROSTER[i].accent);
      for (let k = 0; k < n; k++) {
        f[k] = fill(geo.attributes.position.getY(k));
        c.set(col, k * 3);
      }
      geo.setAttribute('aDock', new BufferAttribute(dock, 1));
      geo.setAttribute('aFill', new BufferAttribute(f, 1));
      geo.setAttribute('aColor', new BufferAttribute(c, 3));
      for (const name of Object.keys(geo.attributes)) if (!['position', 'aDock', 'aFill', 'aColor'].includes(name)) geo.deleteAttribute(name);
      parts.push(geo.index ? geo.toNonIndexed() : geo);
    };
    const pad = new TorusGeometry(0.2, 0.018, 4, 36);
    pad.rotateX(Math.PI / 2);
    pad.translate(g.pad[0], 0.012, g.pad[1]);
    tag(pad, () => -1);
    const disc = new CircleGeometry(0.17, 32);
    disc.rotateX(-Math.PI / 2);
    disc.translate(g.pad[0], 0.01, g.pad[1]);
    tag(disc, () => -2);
    const BAR = { h: 0.42, y: 0.55 };
    const bar = new PlaneGeometry(0.1, BAR.h, 1, 8);
    bar.translate(g.pad[0] + 0.22, BAR.y + BAR.h / 2, BACK_Z + GARAGE.wall / 2 + 0.004);
    tag(bar, (y) => (y - BAR.y) / BAR.h);
  });
  const merged = mergeGeometries(parts) ?? parts[0];
  parts.forEach((p) => p !== merged && p.dispose());
  return merged;
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const DOCK_VERTEX = /* glsl */ `
  attribute float aDock;
  attribute float aFill;
  attribute vec3 aColor;
  varying float vDock;
  varying float vFill;
  varying vec3 vColor;
  void main() {
    vDock = aDock;
    vFill = aFill;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const DOCK_FRAGMENT = /* glsl */ `
  uniform float uBattery[10];
  uniform float uCharging[10];
  uniform float uTime;
  uniform float uLight;
  varying float vDock;
  varying float vFill;
  varying vec3 vColor;
  void main() {
    int i = int(vDock + 0.5);
    float battery = 0.0;
    float charging = 0.0;
    for (int k = 0; k < 10; k++) {
      if (k == i) { battery = uBattery[k]; charging = uCharging[k]; }
    }
    vec3 c;
    if (vFill < -1.5) {
      // the pad's disc: dark, lit by the robot's colour while it charges
      vec3 idle = mix(vec3(0.16, 0.19, 0.28), mix(vec3(0.82, 0.86, 0.93), vColor, 0.18), uLight);
      c = mix(idle, vColor * 0.9, charging * (0.55 + 0.25 * sin(uTime * 3.0)));
    } else if (vFill < 0.0) {
      // the pad's ring: the robot's colour, pulsing while it charges
      c = vColor * (0.6 + charging * (0.8 + 0.6 * sin(uTime * 3.0)));
    } else {
      // the battery bar: filled to the level, red → amber → green
      vec3 level = battery < 0.25 ? vec3(1.0, 0.3, 0.3) : battery < 0.5 ? vec3(1.0, 0.72, 0.2) : vec3(0.3, 0.95, 0.5);
      float lit = step(vFill, battery);
      float edge = charging * step(battery - 0.06, vFill) * lit * (0.5 + 0.5 * sin(uTime * 6.0));
      c = mix(vec3(0.06, 0.08, 0.13), level * (1.2 + edge), lit);
    }
    gl_FragColor = vec4(c, 1.0);
  }
`;

/** The garages' names, one canvas texture; each plate maps its own band of it. */
export function nameplates(names: readonly string[]): { geo: BufferGeometry; texture: CanvasTexture } {
  const W = 512;
  const H = 96;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H * names.length;
  const ctx = canvas.getContext('2d');
  names.forEach((name, i) => {
    if (!ctx) return;
    const y = i * H;
    ctx.fillStyle = ROSTER[i].accent;
    ctx.fillRect(0, y, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 54;
    ctx.font = `800 ${size}px ${FONT_DISPLAY}`;
    while (ctx.measureText(name).width > W - 40 && size > 24) ctx.font = `800 ${(size -= 2)}px ${FONT_DISPLAY}`;
    ctx.fillText(name, W / 2, y + H / 2 + 2);
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const plates = GARAGES.map((g, i) => {
    const p = new PlaneGeometry(GARAGE.width - 0.06, 0.12);
    const uv = p.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setY(k, 1 - (i + 1 - uv.getY(k)) / names.length);
    p.translate(g.pad[0], GARAGE.height - 0.06, FRONT_Z + 0.002);
    return p;
  });
  const geo = mergeGeometries(plates) ?? plates[0];
  plates.forEach((p) => p !== geo && p.dispose());
  return { geo, texture };
}
