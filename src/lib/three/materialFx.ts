import type { Color, Material, Mesh, MeshStandardMaterial, Object3D } from 'three';

/** Original look of one material, so highlight/dim can be applied and undone. */
export interface MatRecord {
  mat: MeshStandardMaterial;
  color: Color;
  emissive: Color;
  env: number;
}

/**
 * Records every PBR material under `root` once. Materials flagged
 * `userData.shared` belong to several objects and are left untouched.
 */
export function captureMaterials(root: Object3D | null): MatRecord[] {
  const list: MatRecord[] = [];
  const seen = new Set<Material>();
  root?.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const sm = m as MeshStandardMaterial;
      if (seen.has(m) || m.userData.shared || !sm.color || !sm.emissive) continue;
      seen.add(m);
      list.push({ mat: sm, color: sm.color.clone(), emissive: sm.emissive.clone(), env: sm.envMapIntensity ?? 1 });
    }
  });
  return list;
}

/** Restores the recorded colours (call on unmount so a remount starts clean). */
export function restoreMaterials(records: readonly MatRecord[]) {
  for (const r of records) {
    r.mat.color.copy(r.color);
    r.mat.emissive.copy(r.emissive);
    r.mat.envMapIntensity = r.env;
  }
}
