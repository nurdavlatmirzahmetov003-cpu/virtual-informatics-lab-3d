import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAnatomyStore } from '@/store/anatomyStore';
import { shadowRequest } from './shadowRequest';

/**
 * The anatomy display is static, so the shadow map is rebuilt only for a
 * short window after the category changes or a model finishes loading
 * (shadow auto-update is off, see QualityController).
 */
export function AnatomyShadows() {
  const gl = useThree((s) => s.gl);
  const category = useAnatomyStore((s) => s.category);

  useEffect(() => {
    shadowRequest.until = performance.now() + 1500;
  }, [category]);

  useFrame(() => {
    gl.shadowMap.autoUpdate = false;
    if (performance.now() < shadowRequest.until) gl.shadowMap.needsUpdate = true;
  });
  return null;
}
