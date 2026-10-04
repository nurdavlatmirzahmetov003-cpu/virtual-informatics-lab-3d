import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import type { LightShadow, Object3D } from 'three';
import type { QualityPreset } from '@/lib/quality/presets';
import { useSettingsStore } from '@/store/settingsStore';

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
    if (!import.meta.env.DEV) return;
    const debug = window as unknown as { __vil3d?: Record<string, unknown> };
    debug.__vil3d = {
      ...debug.__vil3d,
      quality: preset.level,
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
    };
  }, [gl, get, preset.level]);

  if (!autoMode || !monitoring) return null;
  // Re-mount per level so each step gets a fresh measurement window.
  return <PerformanceMonitor key={preset.level} iterations={12} flipflops={3} onDecline={degrade} />;
}
