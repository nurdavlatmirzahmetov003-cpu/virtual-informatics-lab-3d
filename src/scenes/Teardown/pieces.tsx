/**
 * Small procedural building blocks the teardowns still use next to their
 * model parts: circuit cards with chips (Wi-Fi card, power board PCB) and a
 * tiny front-camera module. Real size, base on y = 0.
 */
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

