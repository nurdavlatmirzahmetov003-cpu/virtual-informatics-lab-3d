import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { Box3, Sphere, Vector3, type Material, type Mesh, type Object3D, type Texture } from 'three';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { hdFile, lodFile, splitModelUrl } from '@/lib/three/loaders';
import { capTreeTextures, tuneTreeTextures } from '@/lib/three/assetCache';
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
/** Above this height on screen (px), High/Ultra fetch the 2K close-up textures. */
const HD_SWITCH_PX = 380;

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
  const hd = preset.hdTextures && !lightOnly ? hdFile(file) : null;
  // sticky: once a close-up asked for 2K textures they stay for this model
  const [wantHd, setWantHd] = useState(false);
  const askedHd = useRef(false);
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
    tuneTreeTextures(oriented, preset.anisotropy);
    // which level(s) this model renders — light only (Low / not yet detailed), switching, or full
    oriented.userData.lod = lowOnly ? 'light' : farClone ? 'switch' : 'full';
    // radius in the model's own units; the world scale is applied per frame
    const radius = new Box3().setFromObject(near).getBoundingSphere(new Sphere()).radius / oriented.scale.x;
    return { root: oriented, levels: { near, far: farClone, radius } };
  }, [main, far, node, file, useLod, lowOnly, castShadow, receiveShadow, fit, preset.transmission, preset.maxTextureSize, preset.anisotropy]);

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
    if (!farLevel && (!hd || askedHd.current)) return;
    near.getWorldPosition(center);
    near.getWorldScale(scaleVec);
    const dist = Math.max(0.001, camera.position.distanceTo(center));
    const fov = 'fov' in camera ? ((camera as { fov: number }).fov * Math.PI) / 180 : Math.PI / 4;
    const px = (radius * 2 * Math.max(scaleVec.x, scaleVec.y, scaleVec.z) * size.height) / (2 * dist * Math.tan(fov / 2));
    if (hd && !askedHd.current && px > HD_SWITCH_PX) {
      askedHd.current = true;
      setWantHd(true);
    }
    if (!farLevel) return;
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
      {hd && wantHd && (
        // its own boundary: the close-up file never suspends the scene
        <ErrorBoundary fallback={() => null} onError={(error) => console.warn(`[ModelLoader] close-up textures failed "${hd}"`, error)}>
          <Suspense fallback={null}>
            <HdTextures target={levels.near} url={hd} node={node} anisotropy={preset.anisotropy} />
          </Suspense>
        </ErrorBoundary>
      )}
    </group>
  );
}

const TEXTURE_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'] as const;
type Slot = (typeof TEXTURE_SLOTS)[number];
type Textured = Material & Partial<Record<Slot, Texture | null>>;

const meshesOf = (root: Object3D) => {
  const list: Mesh[] = [];
  root.traverse((o) => {
    if ((o as Mesh).isMesh) list.push(o as Mesh);
  });
  return list;
};
const materialsOf = (mesh: Mesh) => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Textured[];

/**
 * Swaps the 2K textures of `<name>_hd.glb` into the detailed level. The HD
 * file is built from the same cleaned geometry, so meshes and materials line
 * up one to one; if they ever do not, nothing is changed.
 */
function HdTextures({ target, url, node, anisotropy }: { target: Object3D; url: string; node?: string; anisotropy: number }) {
  const gltf = useModelFile(url);
  useEffect(() => {
    const source = (node ? gltf.scene.getObjectByName(node) : gltf.scene) ?? gltf.scene;
    const from = meshesOf(source);
    const to = meshesOf(target);
    if (from.length !== to.length) {
      console.warn(`[ModelLoader] ${url}: ${from.length} meshes vs ${to.length}, close-up textures skipped`);
      return;
    }
    const undo: Array<() => void> = [];
    to.forEach((mesh, i) => {
      const src = materialsOf(from[i]);
      materialsOf(mesh).forEach((mat, j) => {
        const hdMat = src[j];
        if (!hdMat) return;
        for (const slot of TEXTURE_SLOTS) {
          const texture = hdMat[slot];
          if (!texture || mat[slot] === undefined) continue;
          const previous = mat[slot];
          texture.anisotropy = anisotropy;
          mat[slot] = texture;
          undo.push(() => {
            mat[slot] = previous;
          });
        }
        mat.needsUpdate = true;
      });
    });
    return () => undo.forEach((fn) => fn());
  }, [gltf, target, node, url, anisotropy]);
  return null;
}

function ModelFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshBasicMaterial color="#38d6f5" wireframe transparent opacity={0.35} />
    </mesh>
  );
}
