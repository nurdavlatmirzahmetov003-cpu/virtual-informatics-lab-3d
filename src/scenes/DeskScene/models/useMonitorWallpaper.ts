import { useCallback } from 'react';
import { CanvasTexture, SRGBColorSpace, type Mesh, type MeshStandardMaterial, type Object3D } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { drawWallpaper } from '@/lib/three/proceduralTextures';

/** onLoaded callback that puts the project wallpaper on the monitor GLB's "Screen" material. */
export function useMonitorWallpaper() {
  const wallpaper = useDisposable(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536; canvas.height = 672;
    drawWallpaper(canvas);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  return useCallback((root: Object3D) => {
    root.traverse(obj => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => {
        if (material.name !== 'Screen') return;
        const m = material as MeshStandardMaterial;
        m.map = wallpaper; m.emissiveMap = wallpaper;
        m.color.set('#ffffff'); m.emissive.set('#ffffff'); m.emissiveIntensity = 0.65;
        m.roughness = 0.27; m.metalness = 0; m.needsUpdate = true;
      });
    });
  }, [wallpaper]);
}
