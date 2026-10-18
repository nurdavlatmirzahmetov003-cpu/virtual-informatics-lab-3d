/**
 * Merges many small static pieces into one geometry (one draw call): each
 * piece is placed (position / Euler rotation / scale, then optional parent
 * transforms) and may carry a vertex colour, so pieces that differ only in
 * colour still share one material. Keeps the classroom and the robot
 * teacher cheap on Low / Medium (2026-10).
 */
import { BufferAttribute, BufferGeometry, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type Vec3 = readonly [number, number, number];

export interface Place {
  at?: Vec3;
  rot?: Vec3;
  scale?: Vec3;
}

export interface Piece extends Place {
  geo: BufferGeometry;
  color?: string;
  /** Outer transforms applied after the piece's own (innermost first), like nested groups. */
  parents?: readonly Place[];
}

const matrixOf = ({ at = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1] }: Place) =>
  new Matrix4().compose(new Vector3(...at), new Quaternion().setFromEuler(new Euler(...rot)), new Vector3(...scale));

const KEEP = new Set(['position', 'normal', 'uv']);

/** One geometry from the pieces; with `colors`, a `color` attribute from each piece's colour (default white). */
export function mergePieces(pieces: readonly Piece[], colors = false): BufferGeometry {
  const parts = pieces.map((p) => {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    p.geo.dispose();
    for (const name of Object.keys(g.attributes)) if (!KEEP.has(name)) g.deleteAttribute(name);
    const m = matrixOf(p);
    for (const parent of p.parents ?? []) m.premultiply(matrixOf(parent));
    g.applyMatrix4(m);
    if (colors) {
      const c = new Color(p.color ?? '#ffffff');
      const n = g.attributes.position.count;
      const data = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) data.set([c.r, c.g, c.b], i * 3);
      g.setAttribute('color', new BufferAttribute(data, 3));
    }
    return g;
  });
  const merged = mergeGeometries(parts) ?? new BufferGeometry();
  parts.forEach((g) => g.dispose());
  return merged;
}
