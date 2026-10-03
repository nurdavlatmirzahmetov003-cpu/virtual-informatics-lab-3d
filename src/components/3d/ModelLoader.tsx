import { useEffect, useMemo, type ReactNode } from 'react';
import { useThree, type ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Vector3, type Mesh, type MeshPhysicalMaterial, type Object3D } from 'three';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DRACO_DECODER_PATH, withKTX2 } from '@/lib/three/loaders';
import { useQualityPreset } from '@/hooks/useQualityPreset';

type GroupProps = ThreeElements['group'];

interface ModelLoaderProps extends Omit<GroupProps, 'children'> {
  /** GLB/glTF url under /assets/models (Draco, Meshopt and KTX2 supported). */
  url: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Shown if the file fails to load or parse. Defaults to a neutral marker. */
  fallback?: ReactNode;
  /** Remove the asset from the loader cache when this component unmounts. */
  disposeOnUnmount?: boolean;
  onLoaded?: (root: Object3D) => void;
  /** Preserve proportions, orient the source, then fit to real-world metres. */
  fit?: { axis: 0 | 1 | 2; size: number; rotation?: readonly [number, number, number]; align?: 'floor' | 'center'; offset?: readonly [number, number, number] };
}

/**
 * Loads a GLB without ever taking the whole scene down: failures are caught
 * locally, logged with the url, and replaced by a fallback.
 */
export function ModelLoader({ url, fallback, ...props }: ModelLoaderProps) {
  return (
    <ErrorBoundary
      fallback={() => fallback === undefined ? <ModelFallback /> : fallback}
      onError={(error) => console.error(`[ModelLoader] failed to load "${url}"`, error)}
    >
      <GLTFModel url={url} {...props} />
    </ErrorBoundary>
  );
}

function GLTFModel({
  url,
  castShadow = true,
  receiveShadow = true,
  disposeOnUnmount = false,
  onLoaded,
  fit,
  ...groupProps
}: Omit<ModelLoaderProps, 'fallback'>) {
  const gl = useThree((s) => s.gl);
  const transmission = useQualityPreset().transmission;
  const extend = useMemo(() => withKTX2(gl), [gl]);
  const gltf = useGLTF(url, DRACO_DECODER_PATH, true, extend);

  // Clone so the cached original stays pristine when a model is reused.
  const root = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) {
        // Geometries and textures stay cached; every instance owns its materials.
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(m => m.clone()) : mesh.material.clone();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => {
          const physical = material as MeshPhysicalMaterial;
          if (!transmission && physical.transmission > 0) {
            physical.transmission = 0;
            physical.clearcoat = 1;
            physical.clearcoatRoughness = 0.08;
          }
        });
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
      }
    });
    const oriented = new Group();
    oriented.name = `asset:${url.split('/').pop()}`;
    oriented.add(clone);
    if (fit?.rotation) clone.rotation.set(...fit.rotation);
    oriented.updateMatrixWorld(true);
    if (fit) {
      const box = new Box3().setFromObject(oriented);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      const scale = fit.size / Math.max(size.getComponent(fit.axis), 0.000001);
      oriented.scale.setScalar(scale);
      oriented.position.set(-center.x * scale, -(fit.align === 'floor' ? box.min.y : center.y) * scale, -center.z * scale);
      if (fit.offset) oriented.position.add(new Vector3(...fit.offset));
    }
    return oriented;
  }, [gltf, castShadow, receiveShadow, fit, url, transmission]);

  useEffect(() => {
    onLoaded?.(root);
    let parent = root.parent;
    while (parent) {
      if (parent.userData.pcPart) { parent.userData.assetVersion = (parent.userData.assetVersion ?? 0) + 1; break; }
      parent = parent.parent;
    }
    return () => {
      root.traverse(obj => {
        const mesh = obj as Mesh;
        if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => m.dispose());
      });
    };
  }, [root, onLoaded]);

  useEffect(() => {
    if (!disposeOnUnmount) return;
    return () => useGLTF.clear(url);
  }, [url, disposeOnUnmount]);

  return (
    <group {...groupProps} dispose={null}>
      <primitive object={root} />
    </group>
  );
}

function ModelFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshBasicMaterial color="#38d6f5" wireframe transparent opacity={0.35} />
    </mesh>
  );
}
