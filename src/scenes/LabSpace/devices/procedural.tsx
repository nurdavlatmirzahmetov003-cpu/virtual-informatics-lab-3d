/**
 * [PLACEHOLDER] Procedural lab devices at real size (V2-4a), for devices that
 * have no licensed model yet (ASSET_SOURCING.md lists candidates). Every
 * device stands on y = 0, centred in X/Z, its front towards +Z.
 */
import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useDisposable } from '@/hooks/useDisposable';
import { finnedHeatsink, tubeAlong } from '@/lib/three/geometry';
import { labelTexture } from '@/lib/three/proceduralTextures';
import { HardwareFans } from '@/scenes/DeskScene/pc/HardwareParts';

const dark = { color: '#1a1d23', metalness: 0.35, roughness: 0.45 } as const;
const black = { color: '#121418', metalness: 0.2, roughness: 0.5 } as const;
const white = { color: '#e6e8ec', metalness: 0.05, roughness: 0.4 } as const;
const alu = { color: '#b9bec7', metalness: 0.85, roughness: 0.32 } as const;

/** 240 mm AIO laid out for display: radiator with two fans, hoses, pump block. */
export function LiquidCoolerDisplay() {
  const geo = useDisposable(
    () => ({
      fins: finnedHeatsink(0.12, 0.25, 0.022, 45, 0.003),
      hoseA: tubeAlong([[-0.11, 0.03, -0.01], [-0.16, 0.05, 0.05], [-0.2, 0.035, 0.12]], 0.0045, 32),
      hoseB: tubeAlong([[-0.11, 0.03, 0.02], [-0.14, 0.06, 0.09], [-0.17, 0.035, 0.14]], 0.0045, 32),
    }),
    [],
  );
  const fanYs = useMemo(() => [-0.06, 0.06], []);
  return (
    <group>
      {/* radiator lying flat, fans up */}
      <group position={[0.02, 0.03, 0]}>
        <RoundedBox args={[0.125, 0.028, 0.27]} radius={0.004} castShadow>
          <meshStandardMaterial {...black} metalness={0.7} />
        </RoundedBox>
        <mesh geometry={geo.fins} rotation-x={Math.PI / 2}>
          <meshStandardMaterial color="#252a32" metalness={0.85} roughness={0.36} />
        </mesh>
        {/* the fans' Y row runs along the radiator (Z), their axis points up */}
        <group position-y={0.028} rotation-x={-Math.PI / 2}>
          <HardwareFans ys={fanYs} fallback={null} />
        </group>
      </group>
      {[geo.hoseA, geo.hoseB].map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <meshStandardMaterial color="#111418" roughness={0.64} />
        </mesh>
      ))}
      {/* pump block */}
      <group position={[-0.2, 0.03, 0.13]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.033, 0.035, 0.05, 48]} />
          <meshStandardMaterial {...black} metalness={0.55} roughness={0.3} />
        </mesh>
        <mesh position-y={0.0255} rotation-x={-Math.PI / 2}>
          <torusGeometry args={[0.027, 0.0015, 8, 48]} />
          <meshStandardMaterial color="#000" emissive="#38d6f5" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** A plug with a keyed head and a short cable (ATX, EPS, PCIe, SATA). */
function Plug({ w, d, color = '#121418', cable = 0.12 }: { w: number; d: number; color?: string; cable?: number }) {
  const geo = useDisposable(() => tubeAlong([[0, 0.008, d / 2], [0, 0.01, d / 2 + cable * 0.5], [0.02, 0.008, d / 2 + cable]], 0.0045, 16), [d, cable]);
  return (
    <group>
      <RoundedBox args={[w, 0.016, d]} radius={0.002} position-y={0.008} castShadow>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#15171c" roughness={0.65} />
      </mesh>
    </group>
  );
}

/** Internal cables: ATX 24-pin, EPS 8-pin, PCIe 8-pin and SATA, side by side. */
export function CableSet() {
  return (
    <group position-z={-0.05}>
      <group position-x={-0.075}>
        <Plug w={0.052} d={0.016} />
      </group>
      <group position-x={-0.015}>
        <Plug w={0.021} d={0.016} />
      </group>
      <group position-x={0.025}>
        <Plug w={0.021} d={0.016} />
      </group>
      <group position-x={0.065}>
        <Plug w={0.022} d={0.006} color="#1f2329" />
      </group>
    </group>
  );
}

/** CR2032 coin cell (20 mm). */
export function CmosBattery() {
  const face = useDisposable(() => labelTexture(['CR2032', '3V'], { w: 128, h: 128, bg: '#c5cad1', accent: '#c5cad1' }), []);
  return (
    <group>
      <mesh position-y={0.0016} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.0032, 48]} />
        <meshStandardMaterial {...alu} />
      </mesh>
      <mesh position-y={0.00325} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.0095, 48]} />
        <meshStandardMaterial map={face} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** 2.5-inch hard disk (100 × 70 × 7 mm), cover up. */
export function Hdd25() {
  const label = useDisposable(() => labelTexture(['HDD 1 TB', '2.5″ · 5400 rpm · SATA'], { w: 256, h: 128, bg: '#e9ebee', accent: '#2563eb' }), []);
  return (
    <group>
      <RoundedBox args={[0.07, 0.007, 0.1]} radius={0.002} position-y={0.0035} castShadow>
        <meshStandardMaterial {...alu} />
      </RoundedBox>
      <mesh position={[0, 0.0071, -0.01]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.06, 0.05]} />
        <meshStandardMaterial map={label} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** 5.25-inch optical drive with the tray out. */
export function OpticalDrive() {
  return (
    <group>
      <mesh position-y={0.021} castShadow>
        <boxGeometry args={[0.148, 0.042, 0.17]} />
        <meshStandardMaterial {...dark} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.021, 0.0855]}>
        <boxGeometry args={[0.148, 0.042, 0.002]} />
        <meshStandardMaterial {...black} />
      </mesh>
      {/* tray */}
      <mesh position={[0, 0.026, 0.13]} castShadow>
        <boxGeometry args={[0.13, 0.006, 0.09]} />
        <meshStandardMaterial {...black} />
      </mesh>
      <mesh position={[0, 0.0295, 0.12]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.06, 64]} />
        <meshStandardMaterial color="#0b0d10" roughness={0.6} />
      </mesh>
      <mesh position={[0.06, 0.011, 0.0868]}>
        <boxGeometry args={[0.012, 0.004, 0.001]} />
        <meshStandardMaterial color="#000" emissive="#f5b83d" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Flatbed scanner with the lid raised. */
export function Scanner() {
  return (
    <group>
      <RoundedBox args={[0.44, 0.045, 0.3]} radius={0.01} smoothness={3} position-y={0.0225} castShadow receiveShadow>
        <meshStandardMaterial {...black} />
      </RoundedBox>
      <mesh position={[0, 0.0455, 0.01]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.36, 0.25]} />
        <meshPhysicalMaterial color="#1a2c3a" roughness={0.05} metalness={0.2} clearcoat={1} />
      </mesh>
      {/* scan bar glowing under the glass */}
      <mesh position={[0, 0.0458, -0.03]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.35, 0.006]} />
        <meshStandardMaterial color="#000" emissive="#9ef0ff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <group position={[0, 0.046, -0.15]} rotation-x={-1.15}>
        <RoundedBox args={[0.44, 0.012, 0.3]} radius={0.006} position-z={0.15} castShadow>
          <meshStandardMaterial {...black} />
        </RoundedBox>
      </group>
    </group>
  );
}

/** Classroom projector (DLP) with its lens forward. */
export function Projector() {
  return (
    <group>
      <RoundedBox args={[0.3, 0.1, 0.24]} radius={0.02} position-y={0.05} castShadow>
        <meshStandardMaterial {...white} />
      </RoundedBox>
      <mesh position={[0.07, 0.05, 0.121]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.035, 0.035, 0.012, 32]} />
        <meshStandardMaterial color="#0c1018" metalness={0.3} roughness={0.1} />
      </mesh>
      <mesh position={[0.07, 0.05, 0.128]}>
        <circleGeometry args={[0.024, 32]} />
        <meshPhysicalMaterial color="#20304a" roughness={0.02} clearcoat={1} />
      </mesh>
      {[-0.1, -0.06].map((x) => (
        <mesh key={x} position={[x, 0.05, 0.1205]}>
          <boxGeometry args={[0.03, 0.05, 0.001]} />
          <meshStandardMaterial color="#9aa3b2" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

