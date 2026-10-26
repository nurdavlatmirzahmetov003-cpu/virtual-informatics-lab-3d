import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { CustomToneMapping, NeutralToneMapping, NoToneMapping, ShaderChunk } from 'three';
import { create } from 'zustand';

/**
 * Colour grade of the home scene (V4 §2.2): ACES filmic tone mapping with a
 * slight saturation boost, so the desk reads rich instead of washed out.
 *
 * Without the post chain (Low, Medium) it is three's CustomToneMapping: the
 * grade runs inside every material's own shader, so it costs no extra pass.
 * The curve is Narkowicz's fit of ACES (a few multiply-adds; three's full
 * ACES cost 2 fps on Low). With the post chain (High, Ultra) PostEffects does
 * the same with its ToneMapping and HueSaturation effects.
 */
export const GRADE_SATURATION = 1.12;
/** ACES lifts mid-tones above Neutral at the same exposure; this keeps white surfaces from clipping. */
export const GRADE_EXPOSURE = 0.8;

const CUSTOM = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
if (ShaderChunk.tonemapping_pars_fragment.includes(CUSTOM)) {
  ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
    CUSTOM,
    // Narkowicz's fit of the ACES curve: a few multiply-adds per pixel, no colour-space matrices
    `vec3 CustomToneMapping( vec3 color ) {
	vec3 x = color * ( toneMappingExposure * ${GRADE_EXPOSURE.toFixed(3)} );
	vec3 c = saturate( ( x * ( 2.51 * x + 0.03 ) ) / ( x * ( 2.43 * x + 0.59 ) + 0.14 ) );
	float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
	return saturate( mix( vec3( l ), c, ${GRADE_SATURATION.toFixed(3)} ) );
}`,
  );
}

/** Whether the mounted scene asks for the vivid grade (read by PostEffects). */
export const useSceneGrade = create<{ vivid: boolean }>(() => ({ vivid: false }));

/** Turns the vivid grade on while the calling scene is mounted. */
export function useVividGrade() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    useSceneGrade.setState({ vivid: true });
    // with the post chain on, the composer tone-maps (gl stays at NoToneMapping)
    if (gl.toneMapping !== NoToneMapping) gl.toneMapping = CustomToneMapping;
    return () => {
      useSceneGrade.setState({ vivid: false });
      if (gl.toneMapping === CustomToneMapping) gl.toneMapping = NeutralToneMapping;
    };
  }, [gl]);
}
