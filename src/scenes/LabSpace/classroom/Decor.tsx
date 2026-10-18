/**
 * Furniture and greenery for the hall's empty floor (0.35, data/lab/decor.ts):
 * plants, book cabinets with a globe, a reading lounge with a floor lamp,
 * bean bags and a mobile whiteboard. Low-poly procedural pieces merged into
 * three draw calls — every solid in one vertex-coloured mesh, the lamp glow,
 * and the whiteboard's drawing — so Low / Medium stay as fast as before.
 */
import { BoxGeometry, CanvasTexture, ConeGeometry, DoubleSide, CylinderGeometry, IcosahedronGeometry, PlaneGeometry, SphereGeometry, SRGBColorSpace, type BufferGeometry } from 'three';
import { DECOR, type DecorItem } from '@/data/lab/decor';
import { useDisposable } from '@/hooks/useDisposable';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useTheme } from '@/hooks/useTheme';
import { mergePieces, type Piece, type Place, type Vec3 } from './mergeParts';

interface Colors {
  pot: string;
  potLight: string;
  soil: string;
  leaves: readonly string[];
  wood: string;
  body: string;
  metal: string;
  rug: string;
  rugAlt: string;
  sofa: string;
  cushions: readonly string[];
  bags: readonly string[];
  books: readonly string[];
}

const colorsFor = (light: boolean): Colors => ({
  pot: '#e07a5f',
  potLight: light ? '#f4f1ea' : '#d9d4ca',
  soil: '#4a3727',
  leaves: ['#3fa66b', '#57c27f', '#2f8f5b', '#7bd389'],
  wood: light ? '#c89a6a' : '#a87c52',
  body: light ? '#f6f7fb' : '#2b3356',
  metal: light ? '#9aa6bb' : '#59627e',
  rug: light ? '#cfdcff' : '#3a4a8a',
  rugAlt: light ? '#ffe0cf' : '#6b4a6e',
  sofa: light ? '#6f8cff' : '#5873e6',
  cushions: ['#ffb35c', '#ff8a7a', '#7ff3d8'],
  bags: ['#ff8a7a', '#56dbf8', '#ffd27e'],
  books: ['#ef6461', '#f4b942', '#4fb3bf', '#7d6bd6', '#5fbf77', '#e86fa8', '#3d7dd8', '#f08a4b'],
});

const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
const cyl = (top: number, bottom: number, h: number, seg = 14) => new CylinderGeometry(top, bottom, h, seg);

/** A row of books standing on a board at height y, from x0 to x1 (local frame, spines facing +Z). */
function books(x0: number, x1: number, y: number, z: number, depth: number, c: Colors, seed: number): Piece[] {
  const out: Piece[] = [];
  let x = x0;
  let i = seed;
  while (x < x1 - 0.03) {
    const w = 0.025 + ((i * 7) % 4) * 0.008;
    const h = 0.2 + ((i * 5) % 5) * 0.025;
    if (x + w > x1) break;
    out.push({ geo: box(w, h, depth), at: [x + w / 2, y + h / 2, z], color: c.books[i % c.books.length] });
    x += w + 0.004;
    i++;
    // a gap now and then, with one book leaning into it
    if (i % 9 === 0 && x + 0.12 < x1) {
      out.push({ geo: box(0.03, 0.24, depth), at: [x + 0.07, y + 0.115, z], rot: [0, 0, -0.32], color: c.books[(i + 3) % c.books.length] });
      x += 0.14;
    }
  }
  return out;
}

function foliage(c: Colors, spots: readonly [number, number, number, number][], seed: number): Piece[] {
  return spots.map(([x, y, z, r], i) => ({
    geo: new IcosahedronGeometry(r, 1),
    at: [x, y, z] as Vec3,
    rot: [i * 0.7, seed + i, 0] as Vec3,
    scale: [1, 0.85, 1] as Vec3,
    color: c.leaves[(seed + i) % c.leaves.length],
  }));
}

function plantTall(c: Colors, seed: number): Piece[] {
  return [
    { geo: cyl(0.26, 0.2, 0.5), at: [0, 0.25, 0], color: c.pot },
    { geo: cyl(0.24, 0.24, 0.02), at: [0, 0.49, 0], color: c.soil },
    { geo: cyl(0.025, 0.035, 0.75, 6), at: [0, 0.85, 0], color: c.wood },
    ...foliage(c, [
      [0, 1.5, 0, 0.34],
      [0.2, 1.22, 0.06, 0.28],
      [-0.18, 1.3, -0.08, 0.3],
      [0.04, 1.05, -0.2, 0.24],
      [-0.06, 1.75, 0.08, 0.22],
    ], seed),
  ];
}

function plantBush(c: Colors, seed: number): Piece[] {
  return [
    { geo: cyl(0.22, 0.18, 0.38), at: [0, 0.19, 0], color: c.potLight },
    ...foliage(c, [
      [0, 0.62, 0, 0.27],
      [0.17, 0.52, 0.06, 0.2],
      [-0.15, 0.55, -0.05, 0.21],
      [0.02, 0.8, 0.05, 0.17],
    ], seed),
  ];
}

/** Low cabinet (1.9 m long, front +Z) with two book shelves, a globe and a small plant on top. */
function cabinet(c: Colors, seed: number): Piece[] {
  const W = 1.9;
  const H = 0.82;
  const D = 0.42;
  const pieces: Piece[] = [
    { geo: box(W, 0.03, D + 0.02), at: [0, H, 0], color: c.wood },
    { geo: box(W, H - 0.06, 0.02), at: [0, (H - 0.03) / 2 + 0.03, -D / 2 + 0.01], color: c.body },
    { geo: box(W, 0.05, D), at: [0, 0.025, 0], color: c.body },
    { geo: box(W, 0.025, D), at: [0, 0.42, 0], color: c.body },
    ...[-1, 0, 1].map((s) => ({ geo: box(0.025, H - 0.03, D), at: [(s * (W - 0.025)) / 2, (H - 0.03) / 2 + 0.015, 0] as Vec3, color: c.body })),
    ...books(-W / 2 + 0.04, -0.03, 0.05, 0.02, 0.24, c, seed),
    ...books(0.03, W / 2 - 0.04, 0.05, 0.02, 0.24, c, seed + 3),
    ...books(-W / 2 + 0.04, -0.2, 0.435, 0.02, 0.24, c, seed + 5),
    ...books(0.25, W / 2 - 0.04, 0.435, 0.02, 0.24, c, seed + 1),
    // globe on its stand
    { geo: cyl(0.07, 0.09, 0.03), at: [-0.55, H + 0.03, 0], color: c.metal },
    { geo: cyl(0.01, 0.01, 0.1, 6), at: [-0.55, H + 0.09, 0], color: c.metal },
    { geo: new SphereGeometry(0.14, 20, 14), at: [-0.55, H + 0.27, 0], rot: [0, 0, 0.4], color: '#3d8fd8' },
    { geo: new SphereGeometry(0.141, 10, 8, 0.4, 1.4, 0.7, 1.1), at: [-0.55, H + 0.27, 0], rot: [0, 0, 0.4], color: '#5fbf77' },
    // succulent
    { geo: cyl(0.08, 0.06, 0.12), at: [0.6, H + 0.075, 0], color: c.pot },
    ...foliage(c, [[0.6, H + 0.2, 0, 0.09]], seed),
  ];
  return pieces;
}

/** Sofa, round rug and coffee table with books; the lamp's shade is returned separately (it glows). */
function lounge(c: Colors): { solid: Piece[]; glow: Piece[] } {
  const solid: Piece[] = [
    { geo: cyl(1.2, 1.2, 0.012, 40), at: [0, 0.006, 0.15], color: c.rug },
    { geo: cyl(0.85, 0.85, 0.014, 40), at: [0, 0.008, 0.15], color: c.rugAlt },
    // sofa: base, back, arms, seat cushions
    { geo: box(1.9, 0.26, 0.82), at: [0, 0.2, -0.55], color: c.sofa },
    { geo: box(1.9, 0.5, 0.2), at: [0, 0.55, -0.9], color: c.sofa },
    { geo: box(0.18, 0.38, 0.82), at: [-0.95, 0.38, -0.55], color: c.sofa },
    { geo: box(0.18, 0.38, 0.82), at: [0.95, 0.38, -0.55], color: c.sofa },
    ...[-0.42, 0.42].map((x) => ({ geo: box(0.8, 0.1, 0.62), at: [x, 0.38, -0.47] as Vec3, color: c.sofa })),
    ...c.cushions.map((col, i) => ({ geo: box(0.4, 0.36, 0.12), at: [-0.55 + i * 0.55, 0.6, -0.74] as Vec3, rot: [-0.18, 0, (i - 1) * 0.08] as Vec3, color: col })),
    ...[-0.85, 0.85].flatMap((x) => [-0.2, -0.9].map((z) => ({ geo: cyl(0.025, 0.02, 0.07, 6), at: [x, 0.035, z] as Vec3, color: c.metal }))),
    // coffee table
    { geo: cyl(0.42, 0.42, 0.035, 32), at: [0, 0.44, 0.45], color: c.wood },
    { geo: cyl(0.035, 0.035, 0.42, 8), at: [0, 0.21, 0.45], color: c.metal },
    { geo: cyl(0.22, 0.24, 0.02, 24), at: [0, 0.01, 0.45], color: c.metal },
    { geo: box(0.26, 0.035, 0.19), at: [0.1, 0.475, 0.42], rot: [0, 0.3, 0], color: c.books[2] },
    { geo: box(0.24, 0.03, 0.17), at: [0.1, 0.508, 0.42], rot: [0, 0.1, 0], color: c.books[5] },
    { geo: cyl(0.04, 0.035, 0.09, 12), at: [-0.16, 0.505, 0.5], color: '#ffffff' },
    // floor lamp: base and pole
    { geo: cyl(0.16, 0.18, 0.03, 20), at: [1.3, 0.015, -0.75], color: c.metal },
    { geo: cyl(0.014, 0.014, 1.45, 6), at: [1.3, 0.75, -0.75], color: c.metal },
  ];
  const glow: Piece[] = [{ geo: new ConeGeometry(0.22, 0.28, 20, 1, true), at: [1.3, 1.55, -0.75], rot: [Math.PI, 0, 0] }];
  return { solid, glow };
}

function beanbags(c: Colors): Piece[] {
  return [
    { geo: box(2.0, 0.012, 1.5), at: [0, 0.006, 0], color: c.rugAlt },
    ...c.bags.map((col, i) => {
      const a = -0.9 + i * 0.9;
      return { geo: new SphereGeometry(0.42, 18, 12), at: [Math.sin(a) * 0.7, 0.24, -Math.cos(a) * 0.45] as Vec3, scale: [1, 0.58, 1] as Vec3, color: col };
    }),
    { geo: cyl(0.3, 0.3, 0.3, 24), at: [0, 0.15, 0.25], color: c.potLight },
    { geo: box(0.2, 0.04, 0.15), at: [0, 0.32, 0.25], rot: [0, 0.5, 0], color: c.books[0] },
  ];
}

const BOARD = { w: 1.5, h: 0.95, y: 1.3 };

function whiteboard(c: Colors): Piece[] {
  return [
    { geo: box(BOARD.w + 0.06, BOARD.h + 0.06, 0.035), at: [0, BOARD.y, 0], color: c.metal },
    { geo: box(BOARD.w * 0.6, 0.03, 0.08), at: [0, BOARD.y - BOARD.h / 2 - 0.03, 0.05], color: c.metal },
    ...[-1, 1].flatMap((s) => [
      { geo: cyl(0.018, 0.018, BOARD.y + BOARD.h / 2, 6), at: [s * (BOARD.w / 2 + 0.06), (BOARD.y + BOARD.h / 2) / 2, 0] as Vec3, color: c.metal },
      { geo: box(0.05, 0.03, 0.55), at: [s * (BOARD.w / 2 + 0.06), 0.05, 0] as Vec3, color: c.metal },
    ]),
    // markers in the tray
    ...['#ef4444', '#2563eb', '#16a34a'].map((col, i) => ({ geo: cyl(0.009, 0.009, 0.12, 6), at: [-0.2 + i * 0.07, BOARD.y - BOARD.h / 2 - 0.005, 0.06] as Vec3, rot: [0, 0, Math.PI / 2] as Vec3, color: col })),
  ];
}

/** A marker drawing: a small flow chart and a binary sum, no words (works in every language). */
function boardTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 324;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fbfcff';
    ctx.fillRect(0, 0, 512, 324);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2563eb';
    ctx.beginPath();
    ctx.ellipse(110, 52, 58, 26, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(62, 110, 96, 50);
    ctx.beginPath();
    ctx.moveTo(110, 196);
    ctx.lineTo(160, 230);
    ctx.lineTo(110, 264);
    ctx.lineTo(60, 230);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = '#16a34a';
    for (const [y0, y1] of [
      [78, 110],
      [160, 196],
    ]) {
      ctx.beginPath();
      ctx.moveTo(110, y0);
      ctx.lineTo(110, y1);
      ctx.stroke();
    }
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 40px Consolas, monospace';
    ctx.fillText('1011', 270, 90);
    ctx.fillText('+0110', 246, 140);
    ctx.fillRect(246, 156, 140, 5);
    ctx.fillStyle = '#7c3aed';
    ctx.fillText('10001', 246, 206);
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(250, 270);
    for (let i = 0; i <= 10; i++) ctx.lineTo(250 + i * 22, 270 - Math.sin(i * 0.9) * 26);
    ctx.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const placeOf = (item: DecorItem): Place => ({ at: [item.at[0], 0, item.at[1]], rot: [0, item.yaw, 0] });

function build(light: boolean): { solid: BufferGeometry; glow: BufferGeometry; board: BufferGeometry } {
  const c = colorsFor(light);
  const solid: Piece[] = [];
  const glow: Piece[] = [];
  const board: Piece[] = [];
  DECOR.forEach((item, i) => {
    const parents = [placeOf(item)];
    const add = (list: Piece[], into: Piece[]) => list.forEach((p) => into.push({ ...p, parents: [...(p.parents ?? []), ...parents] }));
    switch (item.kind) {
      case 'plant_tall':
        add(plantTall(c, i), solid);
        break;
      case 'plant_bush':
        add(plantBush(c, i), solid);
        break;
      case 'cabinet':
        add(cabinet(c, i), solid);
        break;
      case 'lounge': {
        const l = lounge(c);
        add(l.solid, solid);
        add(l.glow, glow);
        break;
      }
      case 'beanbags':
        add(beanbags(c), solid);
        break;
      case 'whiteboard':
        add(whiteboard(c), solid);
        add([{ geo: new PlaneGeometry(BOARD.w, BOARD.h), at: [0, BOARD.y, 0.019] }], board);
        break;
    }
  });
  return { solid: mergePieces(solid, true), glow: mergePieces(glow), board: mergePieces(board) };
}

export function Decor() {
  const light = useTheme() === 'light';
  const level = useQualityPreset().level;
  const geo = useDisposable(() => build(light), [light]);
  const drawing = useDisposable(boardTexture, []);
  const cheap = level === 'low' || level === 'medium';
  return (
    <group>
      <mesh geometry={geo.solid} castShadow receiveShadow>
        {cheap ? <meshLambertMaterial vertexColors /> : <meshStandardMaterial vertexColors roughness={0.72} metalness={0.04} envMapIntensity={0.6} />}
      </mesh>
      <mesh geometry={geo.glow}>
        <meshBasicMaterial color={light ? '#fff1d6' : '#ffe2a8'} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.board}>
        <meshBasicMaterial map={drawing} color={light ? '#ffffff' : '#d8dcea'} />
      </mesh>
    </group>
  );
}
