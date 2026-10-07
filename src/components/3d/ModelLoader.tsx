import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { Box3, Sphere, Vector3, type Mesh, type Object3D } from 'three';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { lodFile, splitModelUrl } from '@/lib/three/loaders';
import { capTreeTextures } from '@/lib/three/assetCache';
import { cloneSource, fitModel, lodSwitches, notifyPcPart, useModelFile, type ModelFit } from '@/lib/three/modelAssets';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useSceneStatus } from '@/store/sceneStatusStore';

type GroupProps = ThreeElements['group'];

interface ModelLoaderProps extends Omit<GroupProps, 'children'> {
  /**
   * GLB/glTF url under /assets/models (Draco, Meshopt and KTX2 supported).
   * `file.glb#node` shows only that node of the file.
   */
  url: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Shown if the file fails to load or parse. Defaults to a neutral marker. */
  fallback?: ReactNode;
  onLoaded?: (root: Object3D) => void;
  fit?: ModelFit;
  /**
   * Switch to the lighter `_lod1` level while the model is small on screen
   * (default true where such a file exists).
   */
  distanceLod?: boolean;
  /**
   * Hero first: show the light level until the scene is ready, then fetch
   * the detailed file in the background. For models that start small on
   * screen (they would show the light level anyway), so the loader waits
   * for less and nothing visibly changes.
   */
  deferDetail?: boolean;
}

/** Below this height on screen (px) the light level is shown; ×0.6 on High/Ultra. */
const LOD_SWITCH_PX = 90;

/**
 * Loads a GLB without ever taking the whole scene down: failures are caught
 * locally, logged with the url, and replaced by a fallback.
 */
export function ModelLoader({ url, fallback, deferDetail = false, ...props }: ModelLoaderProps) {
  const deferrable = deferDetail && lodFile(splitModelUrl(url).file) !== null;
  const ready = useSceneStatus((s) => s.ready);
  const [detail, setDetail] = useState(!deferrable);
  useEffect(() => {
    if (detail || !ready) return;
    // after the first frames are on screen, when the browser is idle
    const idle = window.requestIdleCallback?.(() => setDetail(true), { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(() => setDetail(true), 1200) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [detail, ready]);

  const light = <GLTFModel url={url} {...props} lightOnly />;
  return (
    <ErrorBoundary
      fallback={() => (fallback === undefined ? <ModelFallback /> : fallback)}
      onError={(error) => console.error(`[ModelLoader] failed to load "${url}"`, error)}
    >
      {deferrable ? <Suspense fallback={light}>{detail ? <GLTFModel url={url} {...props} /> : light}</Suspense> : <GLTFModel url={url} {...props} />}
    </ErrorBoundary>
  );
}

function GLTFModel({
  url,
  castShadow = true,
  receiveShadow = true,
  onLoaded,
  fit,
  distanceLod = true,
  lightOnly = false,
  ...groupProps
}: Omit<ModelLoaderProps, 'fallback' | 'deferDetail'> & { lightOnly?: boolean }) {
  const preset = useQualityPreset();
  const { file, node } = splitModelUrl(url);
  const light = lodFile(file);
  // Low preset (phones, weak GPUs): the light file only. Otherwise the full
  // file, plus the light one to stand in while the model is small on screen.
  const lowOnly = light !== null && (preset.lodBias >= 2 || lightOnly);
  const useLod = light !== null && !lowOnly && distanceLod;
  const main = useModelFile(lowOnly ? light : file);
  // hooks cannot be conditional: without a far level this is the same cached file
  const far = useModelFile(useLod ? light : lowOnly ? light : file);

  const { root, levels } = useMemo(() => {
    const pick = (scene: Object3D) => (node ? scene.getObjectByName(node) : scene) ?? scene;
    const near = cloneSource(pick(main.scene), castShadow, receiveShadow, preset.transmission);
    const farClone = useLod ? cloneSource(pick(far.scene), castShadow, receiveShadow, preset.transmission) : null;
    if (farClone) farClone.visible = false;
    const oriented = fitModel(farClone ? [near, farClone] : [near], fit, `asset:${node ?? file.split('/').pop()}`);
    if (preset.maxTextureSize < 2048) capTreeTextures(oriented, preset.maxTextureSize);
    // which level(s) this model renders — light only (Low / not yet detailed), switching, or full
    oriented.userData.lod = lowOnly ? 'light' : farClone ? 'switch' : 'full';
    // radius in the model's own units; the world scale is applied per frame
    const radius = new Box3().setFromObject(near).getBoundingSphere(new Sphere()).radius / oriented.scale.x;
    return { root: oriented, levels: { near, far: farClone, radius } };
  }, [main, far, node, file, useLod, lowOnly, castShadow, receiveShadow, fit, preset.transmission, preset.maxTextureSize]);

  useEffect(() => {
    onLoaded?.(root);
    notifyPcPart(root);
    return () => {
      root.traverse((obj) => {
        const mesh = obj as Mesh;
        if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
      });
    };
  }, [root, onLoaded]);

  // screen-size LOD: the light level only while the model is small on screen
  const center = useMemo(() => new Vector3(), []);
  const scaleVec = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size, gl, invalidate }) => {
    const { near, far: farLevel, radius } = levels;
    if (!farLevel) return;
    near.getWorldPosition(center);
    near.getWorldScale(scaleVec);
    const dist = Math.max(0.001, camera.position.distanceTo(center));
    const fov = 'fov' in camera ? ((camera as { fov: number }).fov * Math.PI) / 180 : Math.PI / 4;
    const px = (radius * 2 * Math.max(scaleVec.x, scaleVec.y, scaleVec.z) * size.height) / (2 * dist * Math.tan(fov / 2));
    const limit = LOD_SWITCH_PX * (preset.lodBias === 0 ? 0.6 : 1);
    // hysteresis: no flicker around the limit
    const small = farLevel.visible ? px < limit * 1.15 : px < limit;
    if (small === farLevel.visible) return;
    farLevel.visible = small;
    near.visible = !small;
    lodSwitches.count++;
    gl.shadowMap.needsUpdate = true;
    invalidate();
  });

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
