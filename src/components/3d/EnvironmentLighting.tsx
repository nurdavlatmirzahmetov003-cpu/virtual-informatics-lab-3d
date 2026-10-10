import { useEffect, useMemo } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useScenePalette } from '@/hooks/useTheme';
import { useRetainedEnvironment } from '@/lib/three/modelAssets';

/** Vertical backdrop gradient (screen space): cheap, and no banding at 256 px. */
function gradientTexture(top: string, bottom: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

interface EnvironmentLightingProps {
  /** Equirectangular .hdr used for image-based reflections (not shown as background). */
  hdri?: string;
  /** Strength of image-based lighting on all PBR materials. */
  environmentIntensity?: number;
  /** Scales the direct key / fill / rim lights. */
  intensity?: number;
  /** Solid backdrop colour; by default a theme gradient (night lab / day lab). */
  background?: string;
  /** Half-size (m) of the key light's shadow frustum — keep tight for crisp shadows. */
  shadowExtent?: number;
  fog?: [near: number, far: number];
}

/**
 * Studio lighting rig: HDRI (or procedural softboxes) for reflections, plus
 * Lightformer strips that give glossy surfaces long product-shot highlights,
 * and a key / fill / rim set of direct lights.
 */
export function EnvironmentLighting({
  hdri,
  environmentIntensity = 1,
  intensity = 1,
  background,
  shadowExtent = 3,
  fog = [6, 16],
}: EnvironmentLightingProps) {
  const preset = useQualityPreset();
  const palette = useScenePalette();
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useRetainedEnvironment(hdri);

  const backdrop = useMemo(() => (background ? null : gradientTexture(palette.skyTop, palette.skyBottom)), [background, palette]);
  useEffect(() => () => backdrop?.dispose(), [backdrop]);

  // brighter V2 look: exposure per theme (the post chain reads the same value)
  useEffect(() => {
    const previous = gl.toneMappingExposure;
    gl.toneMappingExposure = palette.exposure;
    invalidate();
    return () => {
      gl.toneMappingExposure = previous;
    };
  }, [gl, invalidate, palette.exposure]);

  return (
    <>
      {backdrop ? <primitive attach="background" object={backdrop} /> : <color attach="background" args={[background!]} />}
      <fog attach="fog" args={[background ?? palette.fog, ...fog]} />

      <Environment
        files={hdri}
        resolution={preset.environmentResolution}
        frames={1}
        environmentIntensity={environmentIntensity * palette.envBoost}
      >
        {/* overhead softbox */}
        <Lightformer form="rect" intensity={1.6} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[6, 3, 1]} />
        {/* key-side strip: long highlight on glass and glossy plastics */}
        <Lightformer form="rect" intensity={2.4} position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[4, 0.8, 1]} />
        {/* cool rim strip */}
        <Lightformer form="rect" color="#7fdcff" intensity={1.2} position={[5, 1.5, -2]} rotation-y={-Math.PI / 2} scale={[5, 0.4, 1]} />
      </Environment>

      {/* key */}
      <directionalLight
        castShadow={preset.shadows}
        position={[-2.2, 3.6, 2.4]}
        intensity={2.2 * intensity}
        color="#fff1e0"
        shadow-mapSize={[preset.shadowMapSize, preset.shadowMapSize]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.015}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
      />
      {/* fill */}
      <directionalLight position={[3, 1.8, 2.5]} intensity={0.45 * intensity} color="#b8ccff" />
      {/* rim / back light */}
      <spotLight
        position={[1.6, 2.6, -2.2]}
        angle={0.55}
        penumbra={0.9}
        intensity={14 * intensity}
        color="#7fd8ff"
        distance={8}
        decay={2}
      />
    </>
  );
}
