import { useEffect, useRef, type JSX } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing';
import { NeutralToneMapping, NoToneMapping } from 'three';
import type { QualityPreset } from '@/lib/quality/presets';
import { sceneFocus } from '@/lib/three/sceneFocus';

/**
 * Restrained post chain: subtle bloom for emissive screens/RGB, optional
 * depth of field following `sceneFocus`, gentle vignette, Khronos PBR
 * Neutral tone mapping. Only mounted on High/Ultra.
 */
export function PostEffects({ preset }: { preset: QualityPreset }) {
  const gl = useThree((s) => s.gl);
  const dof = useRef<DepthOfFieldEffect>(null);

  // The composer applies tone mapping itself; avoid doing it twice.
  useEffect(() => {
    gl.toneMapping = NoToneMapping;
    return () => {
      gl.toneMapping = NeutralToneMapping;
    };
  }, [gl]);

  useFrame(() => {
    const effect = dof.current;
    if (!effect) return;
    effect.target = sceneFocus.enabled ? sceneFocus.target : null;
    // ease bokeh so focus pulls feel optical rather than switched
    const goal = sceneFocus.enabled ? sceneFocus.bokehScale : 0;
    effect.bokehScale += (goal - effect.bokehScale) * 0.15;
  });

  const effects: JSX.Element[] = [];
  if (preset.depthOfField) {
    effects.push(<DepthOfField key="dof" ref={dof} worldFocusRange={0.35} bokehScale={0} resolutionScale={0.5} />);
  }
  if (preset.bloom) {
    effects.push(<Bloom key="bloom" mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.15} intensity={0.35} />);
  }
  effects.push(<Vignette key="vignette" offset={0.32} darkness={0.55} />);
  effects.push(<ToneMapping key="tone" mode={ToneMappingMode.NEUTRAL} />);

  return (
    <EffectComposer multisampling={preset.multisampling} enableNormalPass={false}>
      {effects}
    </EffectComposer>
  );
}
