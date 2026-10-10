/**
 * A catalog desk with its own model (V2-2a): the GLB is built at real size
 * with the top at DESK_TOP, so the rest of the setup keeps its layout. Solid
 * finishes (black / white) repaint only the top (`DeskTop` material); wood
 * finishes keep the product's own top.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Mesh, MeshStandardMaterial, Object3D, Texture, Color } from 'three';
import { ModelLoader } from '@/components/3d/ModelLoader';
import type { HardwareItem } from '@/data/hardware/types';
import type { DeskSurface } from '@/scenes/DeskScene/models/Desk';
import { notifySetupChanged } from './setupShared';

const SOLID: Partial<Record<DeskSurface, string>> = { black: '#1a1b1e', white: '#e6e6e2' };

export function ProductDesk({ product, surface }: { product: HardwareItem; surface: DeskSurface }) {
  const [root, setRoot] = useState<Object3D | null>(null);
  const onLoaded = useCallback((r: Object3D) => setRoot(r), []);

  useEffect(() => {
    if (!root) return;
    const solid = SOLID[surface];
    root.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const mat = m as MeshStandardMaterial;
        if (mat.name !== 'DeskTop') continue;
        const original = (mat.userData.deskOriginal ??= { color: mat.color.clone(), map: mat.map }) as { color: Color; map: Texture | null };
        mat.map = solid ? null : original.map;
        if (solid) mat.color.set(solid);
        else mat.color.copy(original.color);
        mat.needsUpdate = true;
      }
    });
    notifySetupChanged();
  }, [root, surface]);

  return <ModelLoader url={`${import.meta.env.BASE_URL}assets/models/${product.modelPath}`} onLoaded={onLoaded} />;
}
