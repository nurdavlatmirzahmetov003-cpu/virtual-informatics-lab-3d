/**
 * Geometry builders for the procedural interim hardware models.
 * Everything is built from curves, extrusions and lathes with real-world
 * dimensions (metres) — not from raw boxes.
 */
import {
  BufferGeometry,
  CatmullRomCurve3,
  ExtrudeGeometry,
  LatheGeometry,
  Path,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type PathLike = Shape | Path;

function traceRoundedRect<T extends PathLike>(p: T, w: number, h: number, r: number, cx = 0, cy = 0): T {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const rr = Math.min(r, w / 2, h / 2);
  p.moveTo(x + rr, y);
  p.lineTo(x + w - rr, y);
  p.quadraticCurveTo(x + w, y, x + w, y + rr);
  p.lineTo(x + w, y + h - rr);
  p.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  p.lineTo(x + rr, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - rr);
  p.lineTo(x, y + rr);
  p.quadraticCurveTo(x, y, x + rr, y);
  return p;
}

export const roundedRectShape = (w: number, h: number, r: number, cx = 0, cy = 0) =>
  traceRoundedRect(new Shape(), w, h, r, cx, cy);
export const roundedRectPath = (w: number, h: number, r: number, cx = 0, cy = 0) =>
  traceRoundedRect(new Path(), w, h, r, cx, cy);

interface ExtrudeOptions {
  bevel?: number;
  curveSegments?: number;
}

/**
 * Extrudes a 2D shape (drawn in the XY plane) along +Y so it lies flat:
 * shape X → world X, shape Y → world −Z, bottom face at y = 0. Bevel is kept
 * inside the outline so the outer size stays exact.
 */
export function extrudeFlat(shape: Shape, height: number, { bevel = 0.002, curveSegments = 12 }: ExtrudeOptions = {}) {
  const b = Math.min(bevel, height / 2.2);
  const geo = new ExtrudeGeometry(shape, {
    depth: Math.max(0.0001, height - 2 * b),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: -b,
    bevelSegments: 3,
    curveSegments,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, b, 0);
  geo.computeVertexNormals();
  return geo;
}

/** Same as extrudeFlat but extruded along +Z (shape stays in XY, front face at z = depth). */
export function extrudeFront(shape: Shape, depth: number, { bevel = 0.002, curveSegments = 12 }: ExtrudeOptions = {}) {
  const b = Math.min(bevel, depth / 2.2);
  const geo = new ExtrudeGeometry(shape, {
    depth: Math.max(0.0001, depth - 2 * b),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: -b,
    bevelSegments: 3,
    curveSegments,
  });
  geo.translate(0, 0, b);
  geo.computeVertexNormals();
  return geo;
}

/** Rounded slab (w × height × d) with its bottom at y = 0. */
export const roundedSlab = (w: number, height: number, d: number, r: number, bevel = 0.002) =>
  extrudeFlat(roundedRectShape(w, d, r), height, { bevel });

/** Rounded frame: outer rounded rect with an inner rounded-rect opening. */
export function frameShape(w: number, h: number, r: number, border: number, innerR = r * 0.6) {
  const s = roundedRectShape(w, h, r);
  s.holes.push(roundedRectPath(w - border * 2, h - border * 2, innerR));
  return s;
}

/** Square fan frame with a circular opening. */
export function fanFrameShape(size: number, holeRadius: number) {
  const s = roundedRectShape(size, size, size * 0.08);
  const hole = new Path();
  hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

/**
 * Fan rotor: hub + `count` swept, pitched blades merged into one geometry.
 * Axis is +Z; spin it around Z.
 */
export function fanBladesGeometry(radius: number, count = 9, thickness = 0.0012) {
  const hub = radius * 0.34;
  const blade = new Shape();
  const sweep = 0.55;
  blade.moveTo(hub * 0.95, -radius * 0.08);
  blade.quadraticCurveTo(radius * 0.62, -radius * 0.2, radius * 0.97, -radius * 0.02 - sweep * radius * 0.12);
  blade.quadraticCurveTo(radius * 1.0, radius * 0.18, radius * 0.9, radius * 0.3);
  blade.quadraticCurveTo(radius * 0.6, radius * 0.22, hub * 0.95, radius * 0.16);
  blade.closePath();
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const g = new ExtrudeGeometry(blade, { depth: thickness, bevelEnabled: false, curveSegments: 10 });
    g.translate(0, 0, -thickness / 2);
    g.rotateX(0.42); // blade pitch
    g.rotateZ((i / count) * Math.PI * 2);
    parts.push(g); // ExtrudeGeometry is already non-indexed
  }
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  merged.computeVertexNormals();
  return merged;
}

/**
 * Sculpted keycap (1 × 1 × 1 unit, origin at bottom centre): rounded box
 * whose top is tapered and dished like an OEM/Cherry profile keycap.
 */
export function keycapGeometry() {
  const g = new RoundedBoxGeometry(1, 1, 1, 3, 0.14);
  const pos = g.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = v.y + 0.5; // 0 bottom → 1 top
    const taper = 1 - 0.2 * t;
    v.x *= taper;
    v.z = v.z * taper - 0.04 * t; // top leans back slightly
    if (v.y > 0.45) v.y -= 0.06 * (1 - (v.x * v.x + v.z * v.z) * 3.2); // shallow dish
    v.y += 0.5;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export interface MouseShape {
  length: number;
  width: number;
  height: number;
}

/**
 * Maps a unit-sphere point to the ergonomic mouse surface.
 * Front of the mouse faces −Z. Shared by the body mesh and part placement.
 */
export function mouseSurface({ length, width, height }: MouseShape, x: number, y: number, z: number, out = new Vector3()) {
  const t = z; // −1 front … +1 back
  const widthProfile = (0.84 + 0.16 * smooth(-1, 0.35, t)) * (1 - 0.12 * Math.max(0, t - 0.55) / 0.45);
  // thumb groove on the left side
  const groove = x < 0 ? 1 - 0.09 * Math.exp(-(((t - 0.05) / 0.45) ** 2)) * Math.max(0, 1 - Math.abs(y - 0.1) * 1.6) : 1;
  const hump = 0.52 + 0.48 * Math.exp(-(((t - 0.22) / 0.78) ** 2));
  const base = 0.004;
  out.set(
    x * (width / 2) * widthProfile * groove,
    y >= 0 ? base + y * (height - base) * hump : base + y * base,
    t * (length / 2),
  );
  return out;
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function mouseBodyGeometry(shape: MouseShape) {
  const g = new SphereGeometry(1, 96, 64);
  const pos = g.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    mouseSurface(shape, v.x, v.y, v.z, v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Lathe from a 2D profile [radius, y]; axis is +Y. Rotate to face elsewhere. */
export function latheProfile(points: Array<[number, number]>, segments = 48) {
  return new LatheGeometry(
    points.map(([r, y]) => new Vector2(r, y)),
    segments,
  );
}

/** Speaker driver: surround roll, recessed cone, dust cap. Faces +Y (render double-sided). */
export function driverGeometry(radius: number) {
  const r = radius;
  return latheProfile([
    [0, -r * 0.18],
    [r * 0.22, -r * 0.17],
    [r * 0.26, -r * 0.12], // dust cap edge
    [r * 0.3, -r * 0.2],
    [r * 0.62, -r * 0.12], // cone
    [r * 0.8, -r * 0.03],
    [r * 0.86, r * 0.03], // surround roll
    [r * 0.93, r * 0.04],
    [r * 0.98, 0],
    [r, -0.0005],
  ]);
}

/** Tube along a CatmullRom curve through points. */
export function tubeAlong(points: Array<[number, number, number]>, radius: number, segments = 48, radial = 10) {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  return new TubeGeometry(curve, segments, radius, radial, false);
}
