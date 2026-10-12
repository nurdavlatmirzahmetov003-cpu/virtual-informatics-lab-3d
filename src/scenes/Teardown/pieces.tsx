/**
 * Small procedural building blocks shared by the teardown models
 * ([PLACEHOLDER] until licensed models are split in Blender): circuit cards
 * with chips, camera modules, glossy screens. Real size, base on y = 0.
 */
import { RoundedBox } from '@react-three/drei';
import type { Texture } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { pcbTexture } from '@/lib/three/proceduralTextures';
import type { Vec3 } from '@/lib/teardown/timeline';

/** A circuit card (centred on its origin): PCB with black chips at [x, z, size]. */
export function Card({ size, chips, color = '#14532d', seed }: { size: Vec3; chips: readonly (readonly [number, number, number])[]; color?: string; seed: number }) {
  const pcb = useDisposable(() => pcbTexture(color, 128, 64, seed), [color, seed]);
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[...size]} />
        <meshStandardMaterial map={pcb} roughness={0.55} />
      </mesh>
      {chips.map(([x, z, w], i) => (
        <mesh key={i} position={[x, size[1] / 2 + 0.0006, z]}>
          <boxGeometry args={[w, 0.0012, Math.min(w, size[2] * 0.7)]} />
          <meshStandardMaterial color="#111317" metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** A metal shield can over chips (phones, tablets). */
export function Shield({ size, at }: { size: Vec3; at: Vec3 }) {
  return (
    <mesh position={[...at]}>
      <boxGeometry args={[...size]} />
      <meshStandardMaterial color="#c3c8cf" metalness={0.9} roughness={0.28} />
    </mesh>
  );
}

/** A camera module: housing with a glass lens on top. */
export function CameraModule({ r = 0.006, h = 0.005 }: { r?: number; h?: number }) {
  return (
    <group>
      <mesh position-y={h / 2} castShadow>
        <boxGeometry args={[r * 2.4, h, r * 2.4]} />
        <meshStandardMaterial color="#1b1d22" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position-y={h + 0.0006}>
        <cylinderGeometry args={[r, r, 0.0012, 32]} />
        <meshPhysicalMaterial color="#0b1220" metalness={0.2} roughness={0.05} clearcoat={1} />
      </mesh>
      <mesh position-y={h + 0.0013} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[r * 0.35, r * 0.55, 24]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** A flat glossy screen lying face up: dark glass slab with the wallpaper on top. */
export function FlatScreen({ w, d, h, texture, bezel = 0.003 }: { w: number; d: number; h: number; texture: Texture; bezel?: number }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={Math.min(0.004, h / 2.2)} smoothness={3} position-y={h / 2} castShadow>
        <meshStandardMaterial color="#0d0f13" metalness={0.4} roughness={0.25} />
      </RoundedBox>
      <mesh position-y={h + 0.0002} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w - bezel * 2, d - bezel * 2]} />
        <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.9} roughness={0.12} />
      </mesh>
    </group>
  );
}

/** Lithium battery pouch with a printed label and its connector flex. */
export function BatteryPack({ w, d, h }: { w: number; d: number; h: number }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={Math.min(0.002, h / 2.2)} smoothness={2} position-y={h / 2} castShadow>
        <meshStandardMaterial color="#2b2f37" roughness={0.6} />
      </RoundedBox>
      <mesh position-y={h + 0.0001} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w * 0.82, d * 0.7]} />
        <meshStandardMaterial color="#3a404c" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[w * 0.3, h + 0.0003, -d / 2 + 0.004]}>
        <boxGeometry args={[Math.min(0.012, w * 0.2), 0.0006, 0.008]} />
        <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}
