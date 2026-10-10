import type { BufferGeometry, Material, Mesh, Object3D, Texture } from 'three';

/**
 * Reference counting for cached GPU assets (GLBs, textures). A scene retains
 * what it renders; when nothing has used an asset for GRACE_MS it is
 * disposed — geometry, materials, textures and decoded images — and dropped
 * from the loader cache. Leaving a page therefore frees that page's assets,
 * while quick remounts (StrictMode, a quality change, going back) reuse them.
 */
const GRACE_MS = 2000;
const users = new Map<string, number>();
const timers = new Map<string, number>();
const disposers = new Map<string, () => void>();

export function retainAsset(key: string, dispose: () => void): () => void {
  users.set(key, (users.get(key) ?? 0) + 1);
  window.clearTimeout(timers.get(key));
  timers.delete(key);
  disposers.set(key, dispose);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const n = (users.get(key) ?? 1) - 1;
    if (n > 0) {
      users.set(key, n);
      return;
    }
    users.delete(key);
    timers.set(
      key,
      window.setTimeout(() => {
        timers.delete(key);
        if (users.has(key)) return;
        const run = disposers.get(key);
        disposers.delete(key);
        run?.();
      }, GRACE_MS),
    );
  };
}

/** Assets currently retained by mounted scenes (dev diagnostics). */
export const retainedAssets = () => [...users.keys()];

export function disposeTexture(texture: Texture) {
  const original = (texture.userData as { original?: unknown }).original;
  for (const image of [texture.image, original]) (image as { close?: () => void } | undefined)?.close?.();
  texture.dispose();
}

export function disposeMaterial(material: Material) {
  for (const value of Object.values(material)) if (value && (value as Texture).isTexture) disposeTexture(value as Texture);
  material.dispose();
}

/** Frees everything an object tree holds on the GPU (and its decoded images). */
export function disposeTree(root: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => materials.add(m));
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach(disposeMaterial);
}

/**
 * Limits a texture to `max` px on its longest side (Low preset). The full
 * image is kept, so raising the quality restores it without reloading.
 */
export function capTextureSize(texture: Texture, max: number) {
  const ud = texture.userData as { original?: CanvasImageSource & { width: number; height: number }; cap?: number };
  const source = ud.original ?? (texture.image as (CanvasImageSource & { width: number; height: number }) | undefined);
  if (!source || !source.width || typeof document === 'undefined') return;
  const scale = Math.min(1, max / Math.max(source.width, source.height));
  const cap = scale < 1 ? max : 0;
  if ((ud.cap ?? 0) === cap) return;
  if (cap === 0) {
    texture.image = source;
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
    ud.original = source;
    texture.image = canvas;
  }
  ud.cap = cap;
  texture.needsUpdate = true;
}

/**
 * Anisotropic filtering by quality (three clamps it to the GPU maximum).
 * GLB cut-out (MASK) materials keep their plain alpha test: alpha-to-coverage
 * turned minified masks (case top vents) into dark speckle; it is used only
 * on the project's own grille materials, whose alpha maps are authored for it.
 */
export function tuneTreeTextures(root: Object3D, anisotropy: number) {
  root.traverse((o) => {
    const mats = (o as Mesh).material;
    if (!mats) return;
    for (const m of Array.isArray(mats) ? mats : [mats]) {
      for (const v of Object.values(m)) {
        const t = v as Texture | null;
        if (!t?.isTexture || t.anisotropy === anisotropy) continue;
        t.anisotropy = anisotropy;
        // only re-upload a texture that is already on the GPU
        if (t.version > 0) t.needsUpdate = true;
      }
    }
  });
}

export function capTreeTextures(root: Object3D, max: number) {
  const seen = new Set<Texture>();
  root.traverse((o) => {
    const mats = (o as Mesh).material;
    if (!mats) return;
    for (const m of Array.isArray(mats) ? mats : [mats]) {
      for (const v of Object.values(m)) if (v && (v as Texture).isTexture && !seen.has(v as Texture)) seen.add(v as Texture);
    }
  });
  seen.forEach((t) => capTextureSize(t, max));
}
