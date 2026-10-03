import { Environment, Lightformer } from '@react-three/drei';
import { useQualityPreset } from '@/hooks/useQualityPreset';

interface EnvironmentLightingProps {
  /** Scales every light; scenes tune mood without touching the rig. */
  intensity?: number;
  background?: string;
}

/**
 * Studio lighting rig: an offline, procedurally generated softbox environment
 * for reflections (no CDN HDRI) + key / fill / rim lights.
 *
 * A Poly Haven HDRI can replace the Lightformers later via `files`, keeping
 * the same component API.
 */
export function EnvironmentLighting({ intensity = 1, background = '#07080c' }: EnvironmentLightingProps) {
  const preset = useQualityPreset();

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 6, 16]} />

      <Environment resolution={preset.environmentResolution} frames={1}>
        {/* overhead softbox */}
        <Lightformer form="rect" intensity={2.2 * intensity} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[6, 3, 1]} />
        {/* key side strip */}
        <Lightformer form="rect" intensity={3 * intensity} position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[4, 1.2, 1]} />
        {/* cool rim strip */}
        <Lightformer form="rect" color="#7fdcff" intensity={1.6 * intensity} position={[5, 1.5, -2]} rotation-y={-Math.PI / 2} scale={[5, 0.6, 1]} />
        {/* low warm bounce */}
        <Lightformer form="ring" color="#ffd9b0" intensity={0.6 * intensity} position={[0, 1, 6]} scale={3} />
      </Environment>

      <hemisphereLight args={['#c9d6ff', '#14161c', 0.25 * intensity]} />
      <directionalLight
        castShadow={preset.shadows}
        position={[-3.5, 5.5, 3]}
        intensity={2.4 * intensity}
        color="#fff3e4"
        shadow-mapSize={[preset.shadowMapSize, preset.shadowMapSize]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
      />
      <directionalLight position={[4, 2.5, 2]} intensity={0.5 * intensity} color="#b8ccff" />
      <spotLight position={[2.5, 3, -3.5]} angle={0.6} penumbra={0.8} intensity={18 * intensity} color="#6fd8ff" distance={10} />
    </>
  );
}
