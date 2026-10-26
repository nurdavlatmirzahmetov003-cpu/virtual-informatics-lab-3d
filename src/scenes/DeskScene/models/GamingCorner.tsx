/**
 * The gaming corner right of the main desk (V4 §2.3): a black gaming desk
 * with an RGB light strip glowing under its edge, a desk mat and a gaming
 * chair turned towards the room. Static parts are merged per material (a few
 * draw calls); the strip's colour drifts slowly through the BitLab hues
 * unless motion is reduced.
 */
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MeshBasicMaterial, type Group } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { roundedSlab } from '@/lib/three/geometry';
import { mergeStatic } from '@/lib/three/mergeStatic';
import { Chair } from '@/scenes/SetupStudio/Chair';
import { DESK_TOP, GAMING_DESK } from '../layout';

const RGB = ['#56dbf8', '#5f7bff', '#a95cf5', '#ff5fa2'].map((c) => new Color(c));

export function GamingCorner() {
  const reduced = useReducedMotion();
  const { center, size } = GAMING_DESK;
  const [w, d] = size;
  const root = useRef<Group>(null);
  // one unlit material for the three strips, recoloured every frame
  const strip = useDisposable(() => new MeshBasicMaterial({ toneMapped: false }), []);
  const geo = useDisposable(() => ({ top: roundedSlab(w, 0.028, d, 0.03, 0.004), mat: roundedSlab(w * 0.7, 0.003, d * 0.55, 0.02, 0.001) }), [w, d]);
  useLayoutEffect(() => (root.current ? mergeStatic(root.current) : undefined), []);

  useFrame(({ clock }) => {
    // a slow walk through the brand hues, bright enough to bloom on High
    const t = reduced ? 0.6 : (clock.elapsedTime * 0.12) % RGB.length;
    const i = Math.floor(t);
    strip.color.copy(RGB[i]).lerp(RGB[(i + 1) % RGB.length], t - i).multiplyScalar(1.8);
  });

  const legX = w / 2 - 0.12;
  return (
    <group position={[center[0], 0, center[1]]}>
      <group ref={root}>
        <mesh geometry={geo.top} position-y={DESK_TOP - 0.028} castShadow receiveShadow>
          <meshStandardMaterial color="#141519" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh geometry={geo.mat} position={[0, DESK_TOP, d * 0.12]} receiveShadow>
          <meshStandardMaterial color="#1d2235" roughness={0.9} />
        </mesh>
        {/* T legs: a post and a foot each side, a beam between them */}
        {[-legX, legX].map((x) => (
          <group key={x} position-x={x}>
            <mesh position={[0, (DESK_TOP - 0.028) / 2, -d * 0.1]} castShadow>
              <boxGeometry args={[0.07, DESK_TOP - 0.028, 0.05]} />
              <meshStandardMaterial color="#0e0f12" roughness={0.4} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.02, -d * 0.1]} castShadow>
              <boxGeometry args={[0.08, 0.04, d * 0.85]} />
              <meshStandardMaterial color="#0e0f12" roughness={0.4} metalness={0.6} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, DESK_TOP - 0.16, -d * 0.1]} castShadow>
          <boxGeometry args={[w - 0.3, 0.05, 0.03]} />
          <meshStandardMaterial color="#0e0f12" roughness={0.4} metalness={0.6} />
        </mesh>
        <Chair height={1.32} upholstery="#22252f" position={[0.12, 0, d / 2 + 0.28]} rotation-y={Math.PI - 0.35} />
      </group>
      {/* RGB under-glow round the front and both sides of the top */}
      <group position-y={DESK_TOP - 0.032}>
        <mesh position={[0, 0, d / 2 - 0.012]} material={strip}>
          <boxGeometry args={[w - 0.04, 0.008, 0.008]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (w / 2 - 0.012), 0, 0]} material={strip}>
            <boxGeometry args={[0.008, 0.008, d - 0.04]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
