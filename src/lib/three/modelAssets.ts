import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useEnvironment, useGLTF, useTexture } from '@react-three/drei';
import { Box3, Group, Vector3, type Mesh, type MeshPhysicalMaterial, type Object3D, type Texture } from 'three';
import { DRACO_DECODER_PATH, withKTX2 } from './loaders';
import { capTextureSize, disposeTexture, disposeTree, retainAsset } from './assetCache';

/** LOD level changes since load (read by `__vil3d.lod()` when measuring). */
export const lodSwitches = { count: 0 };

/** Preserve proportions, orient the source, then fit to real-world metres. */
export interface ModelFit {
  axis: 0 | 1 | 2;
  /** Size along `axis` in metres; omitted = keep the model's own scale (real-size product models). */
  size?: number;
  rotation?: readonly [number, number, number];
  align?: 'floor' | 'center';
  offset?: readonly [number, number, number];
  /** Put a side of the bounding box on the origin instead of centring that axis (e.g. a card's back on the board). */
  pin?: Partial<Record<'x' | 'y' | 'z', 'min' | 'max'>>;
}

/**
 * Loads a GLB (Draco, Meshopt, KTX2) and keeps it cached while mounted. Once
 * no scene has used the file for a moment, its geometry, materials, textures
 * and decoded images are disposed and it leaves the loader cache.
 */
export function useModelFile(file: string) {
  const gl = useThree((s) => s.gl);
  const extend = useMemo(() => withKTX2(gl), [gl]);
  const gltf = useGLTF(file, DRACO_DECODER_PATH, true, extend);
  useEffect(
    () =>
      retainAsset(`gltf:${file}`, () => {
        disposeTree(gltf.scene);
        useGLTF.clear(file);
      }),
    [file, gltf],
  );
  return gltf;
}

/**
 * Texture files loaded with drei's useTexture: limited to the preset's
 * texture size and released (disposed, cache cleared) once unused.
 */
export function useSceneTextures(urls: string[], textures: Texture[], maxSize: number, anisotropy = 8) {
  const key = urls.join('|');
  useEffect(() => {
    textures.forEach((t) => {
      capTextureSize(t, maxSize);
      if (t.anisotropy !== anisotropy) {
        t.anisotropy = anisotropy;
        t.needsUpdate = true;
      }
    });
  }, [textures, maxSize, anisotropy]);
  useEffect(
    () =>
      retainAsset(`tex:${key}`, () => {
        textures.forEach(disposeTexture);
        useTexture.clear(key.split('|'));
      }),
    [key, textures],
  );
}

/** Keeps a loaded HDRI cached while a scene uses it. */
export function useRetainedEnvironment(file: string | undefined) {
  useEffect(() => (file ? retainAsset(`hdr:${file}`, () => useEnvironment.clear({ files: file })) : undefined), [file]);
}

/** Clone so the cached original stays pristine; every instance owns its materials. */
export function cloneSource(source: Object3D, castShadow: boolean, receiveShadow: boolean, transmission: boolean) {
  const clone = source.clone(true);
  clone.position.set(0, 0, 0);
  clone.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => {
      const physical = material as MeshPhysicalMaterial;
      // physical glass renders the scene twice: only where the preset allows it
      if (!transmission && physical.transmission > 0) {
        physical.transmission = 0;
        physical.clearcoat = 1;
        physical.clearcoatRoughness = 0.08;
      }
    });
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
  });
  return clone;
}

/**
 * Wraps `levels` (the detailed model first) in an oriented, fitted group.
 * The fit is measured on the first level, so every level lines up.
 */
export function fitModel(levels: Object3D[], fit: ModelFit | undefined, name: string) {
  const inner = new Group();
  levels.forEach((l) => inner.add(l));
  if (fit?.rotation) inner.rotation.set(...fit.rotation);
  const oriented = new Group();
  oriented.name = name;
  oriented.add(inner);
  oriented.updateMatrixWorld(true);
  if (fit) {
    const box = new Box3().setFromObject(levels[0]);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = fit.size ? fit.size / Math.max(size.getComponent(fit.axis), 0.000001) : 1;
    oriented.scale.setScalar(scale);
    const at = (k: 'x' | 'y' | 'z', centre: number) => (fit.pin?.[k] === 'max' ? box.max[k] : fit.pin?.[k] === 'min' ? box.min[k] : centre);
    oriented.position.set(-at('x', center.x) * scale, -at('y', fit.align === 'floor' ? box.min.y : center.y) * scale, -at('z', center.z) * scale);
    if (fit.offset) oriented.position.add(new Vector3(...fit.offset));
  }
  oriented.updateMatrixWorld(true);
  return oriented;
}

/** Tells the enclosing PCPart that its materials changed (it re-captures them for highlight/dim). */
export function notifyPcPart(root: Object3D) {
  let parent = root.parent;
  while (parent) {
    if (parent.userData.pcPart) {
      parent.userData.assetVersion = (parent.userData.assetVersion ?? 0) + 1;
      break;
    }
    parent = parent.parent;
  }
}
