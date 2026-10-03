import { Color, type Mesh, type MeshStandardMaterial, type Object3D, type Texture } from 'three';

/** A paint finish: base colour plus the metal/roughness of the new coating. */
export interface PaintFinish {
  color: string;
  metalness?: number;
  roughness?: number;
}

interface Original {
  color: Color;
  map: Texture | null;
  metalness: number;
  roughness: number;
}

const tmp = new Color();

/**
 * Repaints the body materials of a loaded model while keeping its surface
 * detail: normal, roughness, metalness and AO maps stay untouched, only the
 * albedo is swapped for a solid coat. `null` restores the original look.
 *
 * Skipped: emissive parts (LEDs, screens), transparent parts (glass) and
 * materials flagged `userData.shared`. Originals are cached on each material
 * so the call is idempotent.
 */
export function applyPaint(root: Object3D, paint: PaintFinish | null, options: { onlyDark?: boolean } = {}) {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of materials) {
      const mat = m as MeshStandardMaterial;
      if (!mat.isMeshStandardMaterial || mat.userData.shared || mat.transparent || mat.name === 'Screen') continue;
      if (mat.emissiveMap || mat.emissive.getHex() !== 0) continue;
      const original = (mat.userData.paintOriginal ??= {
        color: mat.color.clone(),
        map: mat.map,
        metalness: mat.metalness,
        roughness: mat.roughness,
      }) as Original;
      // Light trims (logos, silver accents) keep their colour on a dark body.
      if (options.onlyDark && original.color.getHSL({ h: 0, s: 0, l: 0 }).l > 0.6 && !original.map) continue;
      const hadMap = mat.map !== null;
      if (paint) {
        mat.color.copy(tmp.set(paint.color));
        mat.map = null;
        if (paint.metalness !== undefined) mat.metalness = paint.metalness;
        if (paint.roughness !== undefined) mat.roughness = paint.roughness;
      } else {
        mat.color.copy(original.color);
        mat.map = original.map;
        mat.metalness = original.metalness;
        mat.roughness = original.roughness;
      }
      if (hadMap !== (mat.map !== null)) mat.needsUpdate = true;
    }
  });
}
