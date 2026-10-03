/**
 * [PLACEHOLDER] Procedural office / gaming chair: five-star base with
 * casters, gas lift, padded seat and backrest, armrests. Real proportions
 * (seat ≈ 48 cm high); `height` scales the whole chair. Replace with a
 * licensed GLB (TODO.md).
 */
import { RoundedBox } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { useDisposable } from '@/hooks/useDisposable';
import { fabricTexture } from '@/lib/three/proceduralTextures';

const BASE_HEIGHT = 1.3;

export function Chair({ height = BASE_HEIGHT, upholstery = '#1c1d21', ...props }: ThreeElements['group'] & { height?: number; upholstery?: string }) {
  const fabric = useDisposable(() => fabricTexture([3, 3]), []);
  const frame = { color: '#202227', metalness: 0.7, roughness: 0.35 } as const;
  const pad = { color: upholstery, roughness: 0.9, roughnessMap: fabric, metalness: 0 } as const;
  return (
    <group {...props} scale={height / BASE_HEIGHT}>
      {/* five-star base with casters */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation-y={a}>
            <RoundedBox args={[0.05, 0.035, 0.32]} radius={0.012} position={[0, 0.075, 0.16]} castShadow>
              <meshStandardMaterial {...frame} />
            </RoundedBox>
            <mesh position={[0, 0.03, 0.31]} rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.028, 0.028, 0.03, 20]} />
              <meshStandardMaterial color="#0d0e10" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
      {/* gas lift */}
      <mesh position-y={0.24} castShadow>
        <cylinderGeometry args={[0.028, 0.034, 0.3, 24]} />
        <meshStandardMaterial color="#9aa0a8" metalness={0.95} roughness={0.25} />
      </mesh>
      {/* seat */}
      <RoundedBox args={[0.52, 0.09, 0.5]} radius={0.04} smoothness={4} position-y={0.46} castShadow receiveShadow>
        <meshStandardMaterial {...pad} />
      </RoundedBox>
      {/* backrest, slightly reclined */}
      <group position={[0, 0.5, -0.24]} rotation-x={-0.12}>
        <RoundedBox args={[0.5, 0.78, 0.09]} radius={0.04} smoothness={4} position-y={0.43} castShadow>
          <meshStandardMaterial {...pad} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.12, 0.06]} radius={0.03} position={[0, 0.25, 0.06]} castShadow>
          <meshStandardMaterial {...pad} />
        </RoundedBox>
      </group>
      {/* armrests */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.29, 0.5, 0]}>
          <RoundedBox args={[0.03, 0.2, 0.05]} radius={0.01} position-y={0.1} castShadow>
            <meshStandardMaterial {...frame} />
          </RoundedBox>
          <RoundedBox args={[0.08, 0.025, 0.26]} radius={0.01} position-y={0.21} castShadow>
            <meshStandardMaterial color="#141518" roughness={0.7} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
