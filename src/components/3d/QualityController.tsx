import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { NoToneMapping, type LightShadow, type Material, type Mesh, type Object3D, type Texture } from 'three';
import type { QualityPreset } from '@/lib/quality/presets';
import { useSettingsStore } from '@/store/settingsStore';
import { useSceneStatus } from '@/store/sceneStatusStore';
import { lodSwitches } from '@/lib/three/modelAssets';

const MONITOR_DELAY_MS = 5000;

interface QualityControllerProps {
  preset: QualityPreset;
}

/**
 * Applies the active quality preset to live renderer state that the Canvas
 * props cannot express (per-light shadow maps), and — in auto mode — steps
 * quality down when sustained FPS drops below the display's target.
 *
 * DPR, antialiasing and post-processing are handled by SceneCanvas props.
 */
export function QualityController({ preset }: QualityControllerProps) {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const get = useThree((s) => s.get);
  const autoMode = useSettingsStore((s) => s.qualityMode === 'auto');
  const degrade = useSettingsStore((s) => s.degradeAutoQuality);
  const [monitoring, setMonitoring] = useState(false);

  // Shader compilation and first texture uploads stall the first seconds;
  // only start judging FPS once the scene has settled.
  useEffect(() => {
    const id = window.setTimeout(() => setMonitoring(true), MONITOR_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    scene.traverse((obj) => {
      const light = obj as Object3D & { isLight?: boolean; shadow?: LightShadow };
      if (!light.isLight || !light.castShadow || !light.shadow) return;
      if (light.shadow.mapSize.x === preset.shadowMapSize) return;
      light.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
      light.shadow.map?.dispose();
      light.shadow.map = null;
    });
    // Shadow maps are re-rendered on demand only (scenes flag movement via
    // gl.shadowMap.needsUpdate) — saves a full extra pass every frame.
    gl.shadowMap.autoUpdate = false;
    gl.transmissionResolutionScale = preset.transmissionScale;
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [scene, gl, invalidate, preset.shadowMapSize, preset.shadows, preset.transmissionScale]);

  useEffect(() => {
    // read-only measuring hooks: always in dev, in production only with ?debug
    if (!import.meta.env.DEV && !new URLSearchParams(window.location.search).has('debug')) return;
    const debug = window as unknown as { __vil3d?: Record<string, unknown> };
    debug.__vil3d = {
      ...debug.__vil3d,
      quality: preset.level,
      /** Every asset of the scene's Suspense boundary resolved. */
      ready: () => useSceneStatus.getState().ready,
      /** How often a model switched between its detailed and light level. */
      lod: () => lodSwitches.count,
      renderer: () => ({ ...gl.info.render, memory: { ...gl.info.memory }, programs: gl.info.programs?.length }),
      contextAttributes: () => gl.getContext().getContextAttributes(),
      scene: () => get().scene,
      camera: () => get().camera,
      controls: () => get().controls,
      /** Dev benchmark: average ms per synchronous scene render (no post) + draw stats. */
      bench: (frames = 30) => {
        const { scene: sc, camera } = get();
        gl.info.autoReset = false;
        gl.info.reset();
        gl.render(sc, camera);
        const stats = { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
        gl.info.autoReset = true;
        const ctx = gl.getContext();
        const px = new Uint8Array(4);
        const t0 = performance.now();
        for (let i = 0; i < frames; i++) gl.render(sc, camera);
        ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px); // wait for the GPU
        return { ...stats, msPerFrame: +((performance.now() - t0) / frames).toFixed(2) };
      },
      dpr: () => gl.getPixelRatio(),
      /** What the renderer actually does under the active preset. */
      state: () => {
        let shadowMapSize = 0;
        let maxTexturePx = 0;
        const lod: Record<string, number> = {};
        get().scene.traverse((o) => {
          const light = o as Object3D & { isLight?: boolean; castShadow: boolean; shadow?: LightShadow };
          if (light.isLight && light.castShadow && light.shadow) shadowMapSize = Math.max(shadowMapSize, light.shadow.mapSize.x);
          if (o.userData.lod) lod[o.userData.lod] = (lod[o.userData.lod] ?? 0) + 1;
          const mats = (o as Mesh).material;
          if (!mats || !o.visible) return;
          for (const m of (Array.isArray(mats) ? mats : [mats]) as (Material & Record<string, unknown>)[]) {
            for (const v of Object.values(m)) {
              const img = (v as Texture | null)?.isTexture ? ((v as Texture).image as { width?: number; height?: number } | undefined) : undefined;
              if (img?.width) maxTexturePx = Math.max(maxTexturePx, img.width, img.height ?? 0);
            }
          }
        });
        return {
          dpr: gl.getPixelRatio(),
          antialias: gl.getContext().getContextAttributes()?.antialias,
          shadows: gl.shadowMap.enabled && shadowMapSize > 0,
          shadowMapSize,
          // the post chain applies tone mapping itself and switches the renderer's off
          postprocessing: gl.toneMapping === NoToneMapping,
          maxTexturePx,
          lod,
        };
      },
      /** Estimated GPU texture memory of the scene (RGBA8 + mips unless compressed) and JS heap. */
      memory: () => {
        const seen = new Set<Texture>();
        get().scene.traverse((o) => {
          const mats = (o as Mesh).material;
          if (!mats) return;
          for (const m of (Array.isArray(mats) ? mats : [mats]) as (Material & Record<string, unknown>)[]) {
            for (const v of Object.values(m)) if (v && (v as Texture).isTexture) seen.add(v as Texture);
          }
        });
        let bytes = 0;
        for (const t of seen) {
          const img = t.image as { width?: number; height?: number; data?: unknown } | undefined;
          const w = img?.width ?? 0;
          const h = img?.height ?? 0;
          const compressed = (t as Texture & { isCompressedTexture?: boolean }).isCompressedTexture;
          bytes += w * h * (compressed ? 1 : 4) * (t.generateMipmaps || compressed ? 4 / 3 : 1);
        }
        const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize;
        return { textures: seen.size, textureMB: +(bytes / 1048576).toFixed(1), heapMB: heap ? +(heap / 1048576).toFixed(1) : null, gl: { ...gl.info.memory } };
      },
    };
  }, [gl, get, preset.level]);

  if (!autoMode || !monitoring) return null;
  // Re-mount per level so each step gets a fresh measurement window.
  return <PerformanceMonitor key={preset.level} iterations={12} flipflops={3} onDecline={degrade} />;
}
