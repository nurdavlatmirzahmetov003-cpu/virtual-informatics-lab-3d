import { useCallback, useEffect } from 'react';
import { CanvasTexture, FrontSide, SRGBColorSpace, type BufferGeometry, type Mesh, type MeshStandardMaterial, type Object3D, type Texture } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useCanvasFonts } from '@/hooks/useCanvasFonts';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { drawWallpaper } from '@/lib/three/proceduralTextures';

/**
 * How the wallpaper must be placed on a screen mesh: the UV rectangle the
 * screen uses, and whether its UVs run right-to-left / top-to-bottom relative
 * to the panel (per-product models come from different authors). The screen
 * faces +Z in the model, so "left" is −X and "up" is +Y.
 */
function screenUvFrame(geometry: BufferGeometry) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  if (!pos || !uv) return null;
  let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
  // covariance sign of (x, u) and (y, v) tells the direction of each axis
  let cx = 0, cy = 0, mx = 0, my = 0, mu = 0, mv = 0;
  const n = uv.count;
  for (let i = 0; i < n; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    uMin = Math.min(uMin, u); uMax = Math.max(uMax, u);
    vMin = Math.min(vMin, v); vMax = Math.max(vMax, v);
    mx += pos.getX(i); my += pos.getY(i); mu += u; mv += v;
  }
  mx /= n; my /= n; mu /= n; mv /= n;
  for (let i = 0; i < n; i++) {
    cx += (pos.getX(i) - mx) * (uv.getX(i) - mu);
    cy += (pos.getY(i) - my) * (uv.getY(i) - mv);
  }
  return { uMin, uMax, vMin, vMax, mirrorU: cx < 0, flipV: cy < 0 };
}

/** The shared wallpaper re-mapped onto a screen whose UVs cover only part of 0…1 or run backwards. */
function fitted(wallpaper: Texture, geometry: BufferGeometry) {
  const f = screenUvFrame(geometry);
  if (!f) return wallpaper;
  const full = f.uMin < 0.02 && f.uMax > 0.98 && f.vMin < 0.02 && f.vMax > 0.98;
  if (full && !f.mirrorU && !f.flipV) return wallpaper;
  const t = wallpaper.clone();
  const w = Math.max(1e-4, f.uMax - f.uMin);
  const h = Math.max(1e-4, f.vMax - f.vMin);
  // canvas texture (flipY): v = 1 is the top of the picture, u = 0 its left edge
  t.repeat.set(f.mirrorU ? -1 / w : 1 / w, f.flipV ? -1 / h : 1 / h);
  t.offset.set(f.mirrorU ? f.uMax / w : -f.uMin / w, f.flipV ? f.vMax / h : -f.vMin / h);
  t.needsUpdate = true;
  return t;
}

/**
 * onLoaded callback that puts the project wallpaper on a GLB's "Screen" material
 * (monitors; laptops, phones and tablets pass their own screen proportions).
 */
export function useMonitorWallpaper(w?: number, h?: number) {
  // 2K where the preset allows it (sharp close-ups); phones and Low keep 1K
  const small = useQualityPreset().maxTextureSize < 2048;
  const k = small ? 0.5 : 1;
  const width = Math.round((w ?? 2048) * k);
  const height = Math.round((h ?? 896) * k);
  const wallpaper = useDisposable(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    drawWallpaper(canvas);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    // 2K with mipmaps (CanvasTexture default) and anisotropy: the logo stays sharp at an angle (0.37)
    texture.anisotropy = 8;
    return texture;
  }, [width, height]);
  // redraw in place once the web fonts are in; clones share the image source, so they follow
  const fonts = useCanvasFonts();
  useEffect(() => {
    if (!fonts) return;
    drawWallpaper(wallpaper.image as HTMLCanvasElement);
    wallpaper.needsUpdate = true;
  }, [fonts, wallpaper]);
  return useCallback((root: Object3D) => {
    root.traverse(obj => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => {
        if (material.name !== 'Screen') return;
        const m = material as MeshStandardMaterial;
        const map = fitted(wallpaper, mesh.geometry);
        m.map = map; m.emissiveMap = map;
        m.color.set('#ffffff'); m.emissive.set('#ffffff'); m.emissiveIntensity = 0.65;
        // front only: from behind a screen would show its picture mirrored
        m.side = FrontSide;
        m.roughness = 0.27; m.metalness = 0; m.needsUpdate = true;
      });
    });
  }, [wallpaper]);
}
