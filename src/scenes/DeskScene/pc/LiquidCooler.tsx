/** Parametric AIO: pump block, braided hoses, radiator and spinning licensed fans. */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { MeshStandardMaterial } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { finnedHeatsink, tubeAlong } from '@/lib/three/geometry';
import { HardwareFans } from './HardwareParts';
import { CPU, H } from './constants';
import { pcRig } from './pcRig';

export function LiquidCooler({ radiatorMm, rgbColor }: { radiatorMm: number; rgbColor?: string | null }) {
  const length = radiatorMm / 1000;
  const y = H / 2 - 0.04 - CPU.y;
  const z = -CPU.z;
  const light = useRef<MeshStandardMaterial>(null);
  const geo = useDisposable(() => ({
    hoseA: tubeAlong([[-.037, .02, -.026],[-.073, -.025, -.11],[-.1,y-.045,z-length/2+.025],[-.1,y,z-length/2+.025]], .004, 40),
    hoseB: tubeAlong([[-.037, .02, .026],[-.092, -.055, -.1],[-.08,y-.045,z-length/2+.025],[-.08,y,z-length/2+.025]], .004, 40),
    fins: finnedHeatsink(.105,length-.025,.023,45,.003),
  }), [length,y,z]);
  const fanYs = useMemo(() => Array.from({ length: Math.round(length / .12) }, (_, i) => -length / 2 + .06 + i * .12), [length]);
  useFrame(() => { if (light.current) light.current.emissiveIntensity = rgbColor === null ? 0 : pcRig.rgbPower * 1.3; });
  return <group>
    <mesh position={[-.025,0,0]} rotation-z={Math.PI/2} castShadow><cylinderGeometry args={[.033,.033,.037,48]} /><meshStandardMaterial color="#16191f" metalness={.55} roughness={.3} /></mesh>
    <mesh position={[-.046,0,0]} rotation-y={-Math.PI/2}><circleGeometry args={[.029,48]} /><meshStandardMaterial color="#080b11" metalness={.3} roughness={.15} /></mesh>
    <mesh position={[-.047,0,0]} rotation-y={-Math.PI/2}><torusGeometry args={[.028,.001,8,48]} /><meshStandardMaterial ref={light} color="#223340" emissive={rgbColor ?? '#38d6f5'} emissiveIntensity={0} /></mesh>
    {[geo.hoseA,geo.hoseB].map((g,i)=><mesh key={i} geometry={g} castShadow><meshStandardMaterial color="#111418" roughness={.64} metalness={.05} /></mesh>)}
    <group position={[-.073,y,z]}>
      <RoundedBox args={[.13,.03,length+.02]} radius={.005} smoothness={2} castShadow><meshStandardMaterial color="#171a20" metalness={.75} roughness={.4} /></RoundedBox>
      <mesh geometry={geo.fins} rotation-x={Math.PI/2} position-y={-.016}><meshStandardMaterial color="#252a32" metalness={.85} roughness={.36} /></mesh>
      {/* rotated so the fans' Y row runs along the radiator (local y → parent z) */}
      <group position-y={-.035} rotation-x={Math.PI/2}><HardwareFans ys={fanYs} fallback={null} /></group>
    </group>
  </group>;
}
