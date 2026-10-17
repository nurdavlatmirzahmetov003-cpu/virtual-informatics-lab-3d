/**
 * Named parts of a product GLB for the teardowns (2026-10): each top-level
 * node of `products/<id>.glb` (the Blender pipeline's `parts`) as its own
 * clone, centred on the origin, with the place it sits at in the device
 * (bounding-box centre, model space, metres) and its size. The teardown moves
 * the clone from `at` along its path; the quality preset picks the level.
 */
import { useMemo } from 'react';
import { Box3, Euler, Group, Vector3, type Mesh, type MeshStandardMaterial, type Object3D } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { modelLevels } from '@/lib/three/loaders';
import { useModelFile } from '@/lib/three/modelAssets';
import { capTreeTextures, tuneTreeTextures } from '@/lib/three/assetCache';
import type { Vec3 } from '@/lib/teardown/timeline';

export interface ModelPart {
  /** The part, centred on the origin (add it to a group placed at `at`). */
  object: Group;
  at: Vec3;
  size: Vec3;
}

const toVec = (v: Vector3): Vec3 => [v.x, v.y, v.z];

export function useModelParts(product: string): Record<string, ModelPart> {
  const preset = useQualityPreset();
  const file = `${import.meta.env.BASE_URL}assets/models/products/${product}.glb`;
  // close-up work: the preset's detailed level (Low: the light one)
  const gltf = useModelFile(modelLevels(file, preset.lodBias).near);
  return useMemo(() => {
    const scene = gltf.scene;
    scene.updateMatrixWorld(true);
    const parts: Record<string, ModelPart> = {};
    for (const node of scene.children) {
      const box = new Box3().setFromObject(node);
      if (box.isEmpty()) continue;
      const center = box.getCenter(new Vector3());
      const clone = node.clone(true);
      clone.traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
      // keep the node's own transform (it carries the mesh quantization) and shift the whole by −centre
      const holder = new Group();
      holder.name = `part:${node.name}`;
      holder.add(clone);
      clone.position.sub(center);
      if (preset.maxTextureSize < 2048) capTreeTextures(holder, preset.maxTextureSize);
      tuneTreeTextures(holder, preset.anisotropy);
      parts[node.name] = { object: holder, at: toVec(center), size: toVec(box.getSize(new Vector3())) };
    }
    return parts;
  }, [gltf, preset.maxTextureSize, preset.anisotropy]);
}

/** Every material named `name` in a tree (e.g. the "Screen" a teardown puts the wallpaper on). */
export function materialsNamed(root: Object3D, name: string) {
  const out: MeshStandardMaterial[] = [];
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (m.name === name) out.push(m as MeshStandardMaterial);
  });
  return out;
}

const corner = new Vector3();
type Order = 'XYZ' | 'YXZ';

/** Size of a box `size` after turning it by the Euler angles `rot`. */
export function rotatedSize(size: Vec3, rot: Vec3 = [0, 0, 0], order: Order = 'XYZ'): Vec3 {
  const e = new Euler(...rot, order);
  const box = new Box3();
  for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) box.expandByPoint(corner.set(size[0] * sx, size[1] * sy, size[2] * sz).applyEuler(e));
  return toVec(box.getSize(new Vector3()));
}

/** Uniform scale that makes a (turned) part fit inside a footprint [x, z] (and an optional height). */
export function fitScale(size: Vec3, rot: Vec3, footprint: readonly [number, number], height = Infinity, order: Order = 'XYZ') {
  const s = rotatedSize(size, rot, order);
  return Math.min(footprint[0] / s[0], footprint[1] / s[2], height / s[1]);
}

/** Where a point of the model lands after turning it by `rot`, scaling by `scale` and moving by `offset`. */
export function placePoint(p: Vec3, rot: Vec3, scale: number, offset: Vec3 = [0, 0, 0], order: Order = 'XYZ'): Vec3 {
  const v = new Vector3(...p).applyEuler(new Euler(...rot, order)).multiplyScalar(scale);
  return [v.x + offset[0], v.y + offset[1], v.z + offset[2]];
}

/**
 * Offset that puts a set of parts (one device, turned and scaled together)
 * with its bottom on y = 0 and its footprint centred on the origin.
 */
export function groundOffset(parts: readonly ModelPart[], rot: Vec3, scale: number, order: Order = 'XYZ'): Vec3 {
  const e = new Euler(...rot, order);
  const box = new Box3();
  for (const p of parts)
    for (const sx of [-0.5, 0.5])
      for (const sy of [-0.5, 0.5])
        for (const sz of [-0.5, 0.5]) box.expandByPoint(corner.set(p.at[0] + p.size[0] * sx, p.at[1] + p.size[1] * sy, p.at[2] + p.size[2] * sz).applyEuler(e).multiplyScalar(scale));
  const c = box.getCenter(new Vector3());
  return [-c.x, -box.min.y, -c.z];
}
