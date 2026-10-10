/**
 * Hall lighting: theme backdrop and fog, studio HDRI reflections with
 * softbox Lightformers, a hemisphere fill, and one shadow-casting key light
 * that follows the focused zone (a tight frustum keeps shadows crisp; on
 * the overview it covers the showcase). The shadow map is re-rendered only for a few seconds
 * after the focus changes, while models arrive — not every frame.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Object3D, SRGBColorSpace, type DirectionalLight } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useScenePalette } from '@/hooks/useTheme';
import { useRetainedEnvironment } from '@/lib/three/modelAssets';
import { framingScale } from '@/lib/three/framing';
import { zoneById } from '@/data/lab/zones';
import { useLabStore } from '@/store/labStore';

/** Poly Haven "Studio Small 09" (CC0), already used by the home page — reflections only. */
const HDRI = `${import.meta.env.BASE_URL}assets/hdr/studio_small_09_1k.hdr`;
const SHADOW_EXTENT = 2.4;
const SHADOW_REFRESH_MS = 6000;

function gradient(top: string, bottom: string) {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function LabLighting() {
  const preset = useQualityPreset();
  const palette = useScenePalette();
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const focus = useLabStore((s) => s.focus);
  const size = useThree((s) => s.size);
  // portrait screens see the overview from further away: push the fog back with it
  const reach = Math.max(1, framingScale(size.width / Math.max(1, size.height)));
  const key = useRef<DirectionalLight>(null);
  const [target] = useMemo(() => [new Object3D()], []);
  const refreshUntil = useRef(0);
  useRetainedEnvironment(HDRI);

  const backdrop = useMemo(() => gradient(palette.skyTop, palette.skyBottom), [palette]);
  useEffect(() => () => backdrop.dispose(), [backdrop]);

  useEffect(() => {
    const previous = gl.toneMappingExposure;
    gl.toneMappingExposure = palette.exposure;
    invalidate();
    return () => {
      gl.toneMappingExposure = previous;
    };
  }, [gl, invalidate, palette.exposure]);

  // key light above-left of the focused zone, aimed at it
  useEffect(() => {
    const l = key.current;
    if (!l) return;
    const [x, z] = focus ? zoneById(focus).center : [0, 0];
    const [fx, fz] = focus ? zoneById(focus).facing : [0, 1];
    // from the visitor's side, up and to the left
    l.position.set(x + fx * 2.6 - fz * 1.8, 4.2, z + fz * 2.6 + fx * 1.8);
    target.position.set(x, 0.6, z);
    target.updateMatrixWorld();
    refreshUntil.current = performance.now() + SHADOW_REFRESH_MS;
    invalidate();
  }, [focus, target, invalidate]);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);

  useFrame(() => {
    if (performance.now() < refreshUntil.current) gl.shadowMap.needsUpdate = true;
  });

  return (
    <>
      <primitive attach="background" object={backdrop} />
      <fog attach="fog" args={[palette.fog, 18 * reach, 42 * reach]} />
      <Environment files={HDRI} resolution={preset.environmentResolution} frames={1} environmentIntensity={0.7 * palette.envBoost}>
        <Lightformer form="rect" intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 8, 1]} />
        <Lightformer form="rect" intensity={1.8} position={[-9, 2.5, 2]} rotation-y={Math.PI / 2} scale={[10, 1, 1]} />
        <Lightformer form="rect" color="#7fdcff" intensity={1.1} position={[9, 2, -2]} rotation-y={-Math.PI / 2} scale={[10, 0.6, 1]} />
      </Environment>
      <hemisphereLight args={['#eaf2ff', palette.floorTint, 0.55]} />
      <primitive object={target} />
      <directionalLight
        ref={key}
        target={target}
        // always on when the preset has shadows: toggling would recompile every material
        castShadow={preset.shadows}
        intensity={2.1}
        color="#fff1e0"
        shadow-mapSize={[preset.shadowMapSize, preset.shadowMapSize]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
      />
      <directionalLight position={[6, 5, 9]} intensity={0.5} color="#b8ccff" />
    </>
  );
}
