import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { assemblyRig } from '@/scenes/SetupStudio/assembly/assemblyRig';
import { HERO_ORDER as HERO_PIECES, heroPresence } from './hero/heroCycle';
import { setupChanged } from '@/scenes/SetupStudio/setupShared';
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
  const lastHero = useRef('');
  const frame = useRef(0);

  // a hero model loaded or was repainted
  useEffect(() => {
    const changed = () => {
      last.current = '';
    };
    setupChanged.listeners.add(changed);
    return () => {
      setupChanged.listeners.delete(changed);
    };
  }, []);

  useFrame(() => {
    // R3F reconfiguration can restore autoUpdate after a quality/UI render.
    // Enforce the scene's on-demand policy before every renderer pass.
    gl.shadowMap.autoUpdate = false;
    const r = storyRig;
    const sig = [r.monitorYaw, r.keyboardLift, r.keyboardTilt, r.mouseSpin, r.mouseLift, pcRig.explode, pcRig.glassOpen]
      .map((v) => v.toFixed(4))
      .join('|');
    const hero = [heroPresence.away, ...HERO_PIECES.map((k) => assemblyRig.pieces[k])].map((v) => v.toFixed(3)).join('|');
    frame.current++;
    // hero pieces in flight: every third frame is enough for a shadow (it settles exactly once they land)
    if (sig !== last.current || (hero !== lastHero.current && frame.current % 3 === 0)) {
      last.current = sig;
      lastHero.current = hero;
      gl.shadowMap.needsUpdate = true;
    }
  });
  return null;
}
