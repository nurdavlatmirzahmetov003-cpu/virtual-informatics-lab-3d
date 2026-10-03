import { Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { useThree, type ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Mesh, Object3D } from 'three';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DRACO_DECODER_PATH, withKTX2 } from '@/lib/three/loaders';

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
}

/**
 * Loads a GLB without ever taking the whole scene down: failures are caught
 * locally, logged with the url, and replaced by a fallback.
 */
export function ModelLoader({ url, fallback, ...props }: ModelLoaderProps) {
  return (
    <ErrorBoundary
      fallback={() => fallback ?? <ModelFallback />}
      onError={(error) => console.error(`[ModelLoader] failed to load "${url}"`, error)}
    >
      <Suspense fallback={null}>
        <GLTFModel url={url} {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

function GLTFModel({
  url,
  castShadow = true,
  receiveShadow = true,
  disposeOnUnmount = false,
  onLoaded,
  ...groupProps
}: Omit<ModelLoaderProps, 'fallback'>) {
  const gl = useThree((s) => s.gl);
  const extend = useMemo(() => withKTX2(gl), [gl]);
  const gltf = useGLTF(url, DRACO_DECODER_PATH, true, extend);

  // Clone so the cached original stays pristine when a model is reused.
  const root = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
      }
    });
    return clone;
  }, [gltf, castShadow, receiveShadow]);

  useEffect(() => {
    onLoaded?.(root);
  }, [root, onLoaded]);

  useEffect(() => {
    if (!disposeOnUnmount) return;
    return () => useGLTF.clear(url);
  }, [url, disposeOnUnmount]);

  return (
    <group {...groupProps}>
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
