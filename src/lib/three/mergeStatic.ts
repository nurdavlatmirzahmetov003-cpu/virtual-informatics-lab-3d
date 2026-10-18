import { BufferAttribute, Matrix4, Mesh, type BufferGeometry, type Material, type MeshBasicMaterial, type MeshStandardMaterial, type Object3D } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Materials that look the same draw as one: type, colours, surface and maps. */
function materialKey(m: Material) {
  const s = m as MeshStandardMaterial & MeshBasicMaterial;
  return [
    m.type,
    s.color?.getHexString(),
    s.emissive?.getHexString(),
    s.roughness,
    s.metalness,
    s.map?.uuid,
    m.transparent,
    m.side,
    m.toneMapped,
    m.depthWrite,
  ].join('|');
}

/** Same attribute set everywhere (position, normal, uv), indexed — what mergeGeometries needs. */
function normalise(g: BufferGeometry) {
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  const count = g.attributes.position.count;
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new BufferAttribute(new Float32Array(count * 2), 2));
  if (!g.index) g.setIndex(Array.from({ length: count }, (_, i) => i));
  g.morphAttributes = {};
  g.clearGroups();
  return g;
}

/**
 * Static decor built from many small meshes draws as one mesh per material:
 * the originals are hidden (React still owns them) and merged copies are
 * added under `root`. Instanced meshes and multi-material meshes are left as
 * they are. Returns the undo (removes and disposes the merged copies).
 */
export function mergeStatic(root: Object3D): () => void {
  root.updateWorldMatrix(true, true);
  const toLocal = new Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<string, { material: Material; parts: BufferGeometry[]; meshes: Mesh[]; cast: boolean; receive: boolean }>();
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh || (mesh as unknown as { isInstancedMesh?: boolean }).isInstancedMesh || Array.isArray(mesh.material) || !mesh.visible) return;
    const key = materialKey(mesh.material);
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { material: mesh.material, parts: [], meshes: [], cast: false, receive: false }));
    b.parts.push(normalise(mesh.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(toLocal, mesh.matrixWorld))));
    b.meshes.push(mesh);
    b.cast ||= mesh.castShadow;
    b.receive ||= mesh.receiveShadow;
  });
  const added: Mesh[] = [];
  const hidden: Mesh[] = [];
  for (const b of buckets.values()) {
    if (b.meshes.length < 2) {
      b.parts.forEach((g) => g.dispose());
      continue;
    }
    const geometry = mergeGeometries(b.parts);
    b.parts.forEach((g) => g.dispose());
    if (!geometry) continue;
    const merged = new Mesh(geometry, b.material);
    merged.castShadow = b.cast;
    merged.receiveShadow = b.receive;
    merged.name = 'merged-static';
    root.add(merged);
    added.push(merged);
    b.meshes.forEach((m) => {
      m.visible = false;
      hidden.push(m);
    });
  }
  return () => {
    added.forEach((m) => {
      root.remove(m);
      m.geometry.dispose();
    });
    hidden.forEach((m) => (m.visible = true));
  };
}
