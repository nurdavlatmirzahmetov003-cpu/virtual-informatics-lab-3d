/**
 * [PLACEHOLDER] ATX power supply (150 × 86 × 160 mm): powder-coated steel
 * housing, 135 mm fan behind a wire guard on the bottom, honeycomb exhaust
 * with AC inlet and switch at the rear, modular connector panel at the
 * front, spec label on the side. Case frame, centred on its origin.
 */
import { RoundedBox } from '@react-three/drei';
import { useDisposable } from '@/hooks/useDisposable';
import { fanBladesGeometry } from '@/lib/three/geometry';
import { PSU } from './constants';
import type { PcTextures } from './usePcTextures';

const { w: PW, h: PH, l: PL } = PSU;

export function Psu({ tex }: { tex: PcTextures }) {
  const geo = useDisposable(() => ({ blades: fanBladesGeometry(0.06, 9) }), []);
  const steel = { color: '#17181c', metalness: 0.55, roughness: 0.45 } as const;

  return (
    <group>
      <RoundedBox args={[PW, PH, PL]} radius={0.003} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial {...steel} />
      </RoundedBox>

      {/* bottom intake: fan + concentric wire guard */}
      <group position-y={-PH / 2 - 0.0005} rotation-x={Math.PI / 2}>
        <mesh geometry={geo.blades} position-z={-0.008}>
          <meshStandardMaterial color="#0f1013" roughness={0.5} side={2} />
        </mesh>
        {[0.02, 0.035, 0.05, 0.064].map((r) => (
          <mesh key={r}>
            <torusGeometry args={[r, 0.0011, 6, 64]} />
            <meshStandardMaterial color="#26282d" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation-z={(i * Math.PI) / 4}>
            <boxGeometry args={[0.13, 0.0018, 0.0018]} />
            <meshStandardMaterial color="#26282d" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* rear: honeycomb exhaust, AC inlet, rocker switch */}
      <group position-z={-PL / 2 - 0.0006}>
        <mesh position-x={-0.02} rotation-y={Math.PI}>
          <planeGeometry args={[0.1, 0.07]} />
          <meshStandardMaterial color="#0d0e11" metalness={0.5} roughness={0.5} alphaMap={tex.vent} alphaTest={0.5} side={2} />
        </mesh>
        <mesh position={[0.05, 0.012, -0.004]}>
          <boxGeometry args={[0.03, 0.022, 0.008]} />
          <meshStandardMaterial color="#0b0c0e" roughness={0.7} />
        </mesh>
        <mesh position={[0.05, -0.022, -0.003]}>
          <boxGeometry args={[0.013, 0.009, 0.006]} />
          <meshStandardMaterial color="#1c1d21" roughness={0.6} />
        </mesh>
      </group>

      {/* front: modular connector panel */}
      <group position-z={PL / 2 + 0.0005}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[-0.055 + (i % 4) * 0.034, i < 4 ? 0.016 : -0.016, 0.002]}>
            <boxGeometry args={[0.022, 0.011, 0.004]} />
            <meshStandardMaterial color="#060607" roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* spec label on the glass-facing side */}
      <mesh position-x={-PW / 2 - 0.0006} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.11, 0.055]} />
        <meshStandardMaterial map={tex.psuLabel} roughness={0.55} />
      </mesh>
    </group>
  );
}
