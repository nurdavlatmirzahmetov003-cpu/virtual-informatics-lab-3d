/**
 * Bounding boxes of GLB models without a GPU: reads the glTF JSON, rebuilds the
 * node tree as three.js objects and gives every mesh the eight corners of its
 * POSITION accessor's min/max (the glTF spec requires them). Rotations by
 * quarter turns stay exact; any other rotation gives a slightly larger box.
 */
import { readFileSync } from 'node:fs';
import { BufferAttribute, BufferGeometry, Group, Matrix4, Mesh, Quaternion, Vector3 } from 'three';

const NORMALISED = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };

function cornerGeometry(acc) {
  let { min, max } = acc;
  if (acc.normalized) {
    const d = NORMALISED[acc.componentType] ?? 1;
    min = min.map((v) => Math.max(v / d, -1));
    max = max.map((v) => Math.max(v / d, -1));
  }
  const pts = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) pts.push(x, y, z);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
  return g;
}

/** The scene of a GLB file as a three.js Group of corner-only meshes. */
export function loadGlbBounds(file) {
  const b = readFileSync(file);
  const json = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)));
  const build = (i) => {
    const n = json.nodes[i];
    const o = new Group();
    o.name = n.name ?? '';
    if (n.matrix) new Matrix4().fromArray(n.matrix).decompose(o.position, o.quaternion, o.scale);
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.copy(new Quaternion().fromArray(n.rotation));
    if (n.scale) o.scale.fromArray(n.scale);
    if (n.mesh !== undefined) for (const p of json.meshes[n.mesh].primitives) {
      const acc = json.accessors[p.attributes.POSITION];
      if (acc?.min && acc?.max) o.add(new Mesh(cornerGeometry(acc)));
    }
    for (const c of n.children ?? []) o.add(build(c));
    return o;
  };
  const root = new Group();
  for (const i of json.scenes[json.scene ?? 0].nodes) root.add(build(i));
  return root;
}

export { Vector3 };
