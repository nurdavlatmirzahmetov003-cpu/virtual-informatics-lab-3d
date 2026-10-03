import { useRef } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import type { BufferGeometry, Group, Material } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';

export interface FanGeometries {
  frame: BufferGeometry;
  blades: BufferGeometry;
}

type FanProps = ThreeElements['group'] & {
  size: number;
  geometries: FanGeometries;
  /** Shared emissive material for the ARGB ring; omit for a plain fan. */
  rgb?: Material;
  /** Rotor speed in rad/s. */
  speed?: number;
  /** GPU-style fan: thin rim instead of the square case-fan frame. */
  frameless?: boolean;
};

/** 120/140 mm case fan; axis +Z (air flows toward −Z). */
export function Fan({ size, geometries, rgb, speed = 7, frameless = false, ...props }: FanProps) {
  const rotor = useRef<Group>(null);
  const reducedMotion = useReducedMotion();
  const depth = 0.025;

  useFrame((_, dt) => {
    if (rotor.current) rotor.current.rotation.z -= (reducedMotion ? speed * 0.15 : speed) * Math.min(dt, 0.05);
  });

  return (
    <group {...props}>
      {frameless ? (
        <mesh>
          <torusGeometry args={[size * 0.49, 0.002, 8, 64]} />
          <meshStandardMaterial color="#121317" roughness={0.5} metalness={0.3} />
        </mesh>
      ) : (
        <mesh geometry={geometries.frame} position-z={-depth / 2}>
          <meshStandardMaterial color="#121317" roughness={0.55} metalness={0.1} />
        </mesh>
      )}
      {/* rear struts holding the motor */}
      {[0.25, 0.75, 1.25, 1.75].map((a) => (
        <mesh key={a} position-z={-depth / 2 + 0.002} rotation-z={a * Math.PI}>
          <boxGeometry args={[size * 0.62, 0.003, 0.003]} />
          <meshStandardMaterial color="#121317" roughness={0.6} />
        </mesh>
      ))}
      <group ref={rotor}>
        <mesh geometry={geometries.blades}>
          <meshStandardMaterial color="#17181c" roughness={0.42} metalness={0.05} side={2} />
        </mesh>
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[size * 0.15, size * 0.15, 0.012, 32]} />
          <meshStandardMaterial color="#1a1b20" roughness={0.45} />
        </mesh>
        <mesh position-z={0.0062}>
          <circleGeometry args={[size * 0.11, 32]} />
          <meshStandardMaterial color="#2a2d33" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>
      {rgb && (
        <mesh position-z={depth / 2 - 0.001} material={rgb}>
          <torusGeometry args={[size * 0.465, 0.0018, 8, 64]} />
        </mesh>
      )}
    </group>
  );
}
