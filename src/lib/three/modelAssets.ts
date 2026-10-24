import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useEnvironment, useGLTF, useTexture } from '@react-three/drei';
import { type Mesh, type MeshPhysicalMaterial, type Object3D, type Texture } from 'three';
import { DRACO_DECODER_PATH, withKTX2 } from './loaders';
export { fitModel, type ModelFit } from './fit';
import { capTextureSize, disposeTexture, disposeTree, retainAsset } from './assetCache';

/** LOD level changes since load (read by `__vil3d.lod()` when measuring). */
export const lodSwitches = { count: 0 };

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
