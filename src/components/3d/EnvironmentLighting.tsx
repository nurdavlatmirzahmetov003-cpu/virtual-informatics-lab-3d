import { Environment, Lightformer } from '@react-three/drei';
import { useQualityPreset } from '@/hooks/useQualityPreset';

interface EnvironmentLightingProps {
  /** Equirectangular .hdr used for image-based reflections (not shown as background). */
  hdri?: string;
  /** Strength of image-based lighting on all PBR materials. */
  environmentIntensity?: number;
  /** Scales the direct key / fill / rim lights. */
  intensity?: number;
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
  background = '#07080c',
  shadowExtent = 3,
  fog = [6, 16],
}: EnvironmentLightingProps) {
  const preset = useQualityPreset();

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, ...fog]} />

      <Environment
        files={hdri}
        resolution={preset.environmentResolution}
        frames={1}
        environmentIntensity={environmentIntensity}
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
