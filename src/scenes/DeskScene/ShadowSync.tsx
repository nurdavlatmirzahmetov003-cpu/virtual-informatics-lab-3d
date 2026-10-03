import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { pcRig } from './pc/pcRig';
import { storyRig } from './storyRig';

/**
 * Re-renders the shadow map only on frames where a shadow-casting object
 * actually moved (shadow auto-update is off, see QualityController). Camera
 * moves never need it: the key light is directional and static.
 */
export function ShadowSync() {
  const gl = useThree((s) => s.gl);
  const last = useRef('');

  useFrame(() => {
    const r = storyRig;
    const sig = [r.monitorYaw, r.keyboardLift, r.keyboardTilt, r.mouseSpin, r.mouseLift, pcRig.explode, pcRig.glassOpen]
      .map((v) => v.toFixed(4))
      .join('|');
    if (sig !== last.current) {
      last.current = sig;
      gl.shadowMap.needsUpdate = true;
    }
  });
  return null;
}
