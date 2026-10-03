import { useEffect, type JSX } from 'react';
import { useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { NeutralToneMapping, NoToneMapping } from 'three';
import type { QualityPreset } from '@/lib/quality/presets';

/**
 * Restrained post chain: subtle bloom for emissive screens/RGB, gentle
 * vignette, Khronos PBR Neutral tone mapping. Only mounted on High/Ultra.
 */
export function PostEffects({ preset }: { preset: QualityPreset }) {
  const gl = useThree((s) => s.gl);

  // The composer applies tone mapping itself; avoid doing it twice.
  useEffect(() => {
    gl.toneMapping = NoToneMapping;
    return () => {
      gl.toneMapping = NeutralToneMapping;
    };
  }, [gl]);

  const effects: JSX.Element[] = [];
  if (preset.bloom) {
    effects.push(<Bloom key="bloom" mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.15} intensity={0.4} />);
  }
  effects.push(<Vignette key="vignette" offset={0.32} darkness={0.5} />);
  effects.push(<ToneMapping key="tone" mode={ToneMappingMode.NEUTRAL} />);

  return (
    <EffectComposer multisampling={preset.multisampling} enableNormalPass={false}>
      {effects}
    </EffectComposer>
  );
}
