import { useEffect, useMemo, useRef, type JSX } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer, HueSaturation, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { Effect, ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing';
import { Uniform } from 'three';
import { CustomToneMapping, NeutralToneMapping, NoToneMapping } from 'three';
import type { QualityPreset } from '@/lib/quality/presets';
import { GRADE_EXPOSURE, GRADE_SATURATION, useSceneGrade } from '@/lib/three/grade';
import { sceneFocus } from '@/lib/three/sceneFocus';

/**
 * Restrained post chain: subtle bloom for emissive screens/RGB, optional
 * depth of field following `sceneFocus`, gentle vignette, Khronos PBR
 * Neutral tone mapping, SMAA. Only mounted on High/Ultra. A scene that asks
 * for the vivid grade (lib/three/grade.ts) gets ACES and a little saturation
 * instead, and a stronger glow on its emissive parts.
 */
/** Scales the linear colour before tone mapping (the vivid grade's exposure, see lib/three/grade.ts). */
class ExposureEffect extends Effect {
  constructor(exposure: number) {
    const fragment = `uniform float exposure;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = vec4(inputColor.rgb * exposure, inputColor.a); }`;
    super('Exposure', fragment, {
      uniforms: new Map([['exposure', new Uniform(exposure)]]),
    });
  }
}

export function PostEffects({ preset }: { preset: QualityPreset }) {
  const gl = useThree((s) => s.gl);
  const dof = useRef<DepthOfFieldEffect>(null);
  const vivid = useSceneGrade((s) => s.vivid);
  const exposure = useMemo(() => new ExposureEffect(GRADE_EXPOSURE), []);
  useEffect(() => () => exposure.dispose(), [exposure]);

  // The composer applies tone mapping itself; avoid doing it twice.
  useEffect(() => {
    gl.toneMapping = NoToneMapping;
    return () => {
      gl.toneMapping = useSceneGrade.getState().vivid ? CustomToneMapping : NeutralToneMapping;
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
    effects.push(<Bloom key="bloom" mipmapBlur luminanceThreshold={vivid ? 1 : 0.9} luminanceSmoothing={0.15} intensity={vivid ? 0.6 : 0.35} />);
  }
  effects.push(<Vignette key="vignette" offset={0.32} darkness={0.55} />);
  if (vivid) effects.push(<primitive key="exposure" object={exposure} />);
  effects.push(<ToneMapping key="tone" mode={vivid ? ToneMappingMode.ACES_FILMIC : ToneMappingMode.NEUTRAL} />);
  // HueSaturation takes −1…1 around the original; the same boost as the shader grade
  if (vivid) effects.push(<HueSaturation key="sat" saturation={GRADE_SATURATION - 1} />);
  // after tone mapping: SMAA works on display-referred colour; MSAA (composer
  // multisampling) handles geometry edges, SMAA the specular / sub-pixel shimmer
  if (preset.smaa) effects.push(<SMAA key="smaa" />);

  return (
    <EffectComposer multisampling={preset.multisampling} enableNormalPass={false}>
      {effects}
    </EffectComposer>
  );
}
