/**
 * Procedural lab furniture shared by the zones: tables, wall shelving,
 * display pedestals and a turntable. Real dimensions, PBR materials, few
 * draw calls; colours follow the light / dark theme.
 */
import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useFurnitureColors } from './furnitureColors';

/** Desk / lab table: rounded top on four slim legs, top surface at `height`. */
export function Table({ width, depth, height = 0.75, top, children }: { width: number; depth: number; height?: number; top?: string; children?: ReactNode }) {
  const c = useFurnitureColors();
  const leg = 0.035;
  return (
    <group>
      <RoundedBox args={[width, 0.035, depth]} radius={0.012} smoothness={3} position-y={height - 0.0175} castShadow receiveShadow>
        <meshStandardMaterial color={top ?? c.top} roughness={0.45} metalness={0.05} />
      </RoundedBox>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (width / 2 - 0.08), (height - 0.035) / 2, sz * (depth / 2 - 0.08)]} castShadow>
            <boxGeometry args={[leg, height - 0.035, leg]} />
            <meshStandardMaterial color={c.frame} metalness={0.7} roughness={0.35} />
          </mesh>
        )),
      )}
      <group position-y={height}>{children}</group>
    </group>
  );
}

/** Open wall shelving: `rows` boards at the given heights, backed by a panel. */
export function Shelving({ width, depth = 0.34, rows }: { width: number; depth?: number; rows: readonly number[] }) {
  const c = useFurnitureColors();
  const top = Math.max(...rows) + 0.3;
  return (
    <group>
      <mesh position={[0, top / 2, -depth / 2 + 0.01]} receiveShadow>
        <boxGeometry args={[width, top, 0.02]} />
        <meshStandardMaterial color={c.body} roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * width) / 2, top / 2, 0]} castShadow>
          <boxGeometry args={[0.03, top, depth]} />
          <meshStandardMaterial color={c.frame} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {rows.map((y) => (
        <RoundedBox key={y} args={[width, 0.025, depth]} radius={0.006} position-y={y} castShadow receiveShadow>
          <meshStandardMaterial color={c.shelf} roughness={0.5} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** Display pedestal with a glowing accent ring; children stand on its top. */
export function Pedestal({ height = 0.9, radius = 0.32, accent, children }: { height?: number; radius?: number; accent: string; children?: ReactNode }) {
  const c = useFurnitureColors();
  return (
    <group>
      <mesh position-y={height / 2} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.05, height, 48]} />
        <meshStandardMaterial color={c.body} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position-y={height - 0.012}>
        <torusGeometry args={[radius - 0.012, 0.006, 8, 64]} />
        <meshStandardMaterial color="#000" emissive={accent} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <group position-y={height}>{children}</group>
    </group>
  );
}

/** Slowly rotating plate (stops for prefers-reduced-motion). */
export function Turntable({ speed = 0.18, children }: { speed?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const reduced = useReducedMotion();
  useFrame((_, delta) => {
    if (ref.current && !reduced) ref.current.rotation.y += Math.min(delta, 0.1) * speed;
  });
  return <group ref={ref}>{children}</group>;
}
