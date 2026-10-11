/**
 * [PLACEHOLDER] Procedural lab devices at real size (V2-4a), for devices that
 * have no licensed model yet (ASSET_SOURCING.md lists candidates). Every
 * device stands on y = 0, centred in X/Z, its front towards +Z.
 */
import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { DoubleSide } from 'three';
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

/** Thermal paste syringe lying on the mat. */
export function ThermalPaste() {
  return (
    <group rotation-y={0.4}>
      <mesh position={[0, 0.009, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.07, 24]} />
        <meshStandardMaterial color="#d8dde4" transparent opacity={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.009, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.0065, 0.0065, 0.05, 24]} />
        <meshStandardMaterial color="#9aa1aa" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.042, 0.009, 0]} rotation-z={-Math.PI / 2} castShadow>
        <coneGeometry args={[0.005, 0.016, 20]} />
        <meshStandardMaterial color="#d8dde4" roughness={0.2} />
      </mesh>
      <mesh position={[-0.042, 0.009, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.011, 0.011, 0.004, 24]} />
        <meshStandardMaterial {...black} />
      </mesh>
      {/* a dab on a small plate */}
      <mesh position={[0.0, 0.002, 0.035]}>
        <boxGeometry args={[0.04, 0.003, 0.04]} />
        <meshStandardMaterial {...alu} />
      </mesh>
      <mesh position={[0.0, 0.0055, 0.035]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.005, 20, 12]} />
        <meshStandardMaterial color="#a8adb5" roughness={0.6} />
      </mesh>
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

/** Portable drive in a rubber bumper with a USB-C lead. */
export function ExternalDrive() {
  const cable = useDisposable(() => tubeAlong([[0, 0.006, 0.062], [0.02, 0.006, 0.09], [0.06, 0.004, 0.1], [0.09, 0.004, 0.07]], 0.0022, 24), []);
  return (
    <group>
      <RoundedBox args={[0.082, 0.014, 0.118]} radius={0.006} smoothness={3} position-y={0.007} castShadow>
        <meshStandardMaterial color="#1f3c6e" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.0142, -0.03]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.0025, 16]} />
        <meshStandardMaterial color="#000" emissive="#4ade80" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh geometry={cable} castShadow>
        <meshStandardMaterial color="#15171c" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** USB-A flash drive with its cap beside it. */
export function UsbFlash() {
  return (
    <group rotation-y={-0.3}>
      <RoundedBox args={[0.018, 0.008, 0.04]} radius={0.003} position={[0, 0.004, 0]} castShadow>
        <meshStandardMaterial color="#38d6f5" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.0035, 0.026]} castShadow>
        <boxGeometry args={[0.012, 0.0045, 0.013]} />
        <meshStandardMaterial {...alu} />
      </mesh>
      <RoundedBox args={[0.016, 0.009, 0.018]} radius={0.003} position={[0.028, 0.0045, 0.012]} castShadow>
        <meshStandardMaterial color="#38d6f5" roughness={0.4} />
      </RoundedBox>
    </group>
  );
}

/** SD card and a microSD card. */
export function SdCards() {
  const sd = useDisposable(() => labelTexture(['SDXC 128 GB', 'U3 · V30 · A2'], { w: 192, h: 256, bg: '#111827', accent: '#f5b83d' }), []);
  return (
    <group>
      <mesh position={[-0.012, 0.0011, 0]} castShadow>
        <boxGeometry args={[0.024, 0.0021, 0.032]} />
        <meshStandardMaterial color="#111827" roughness={0.5} />
      </mesh>
      <mesh position={[-0.012, 0.0023, 0.002]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.022, 0.026]} />
        <meshStandardMaterial map={sd} roughness={0.5} />
      </mesh>
      <mesh position={[0.016, 0.0005, 0.004]} castShadow>
        <boxGeometry args={[0.011, 0.001, 0.015]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** A 12 cm disc in an open jewel case, data side up (iridescent). */
export function OpticalDisc() {
  return (
    <group>
      <mesh position-y={0.005} castShadow>
        <boxGeometry args={[0.142, 0.01, 0.125]} />
        <meshPhysicalMaterial color="#e8eef6" transparent opacity={0.35} roughness={0.05} transmission={0} clearcoat={1} />
      </mesh>
      <group position={[0, 0.0105, 0]} rotation-x={-Math.PI / 2}>
        <mesh>
          <ringGeometry args={[0.0075, 0.06, 96]} />
          <meshPhysicalMaterial color="#d7dde6" metalness={1} roughness={0.12} iridescence={1} iridescenceIOR={1.6} iridescenceThicknessRange={[200, 900]} side={DoubleSide} />
        </mesh>
      </group>
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

/** Pen tablet with its stylus. */
export function GraphicsTablet() {
  return (
    <group>
      <RoundedBox args={[0.3, 0.009, 0.2]} radius={0.004} smoothness={3} position-y={0.0045} castShadow>
        <meshStandardMaterial {...black} />
      </RoundedBox>
      <mesh position={[0.02, 0.0092, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.22, 0.14]} />
        <meshStandardMaterial color="#1f2329" roughness={0.75} />
      </mesh>
      {[0.044, 0.024, 0.004, -0.016].map((z) => (
        <mesh key={z} position={[-0.125, 0.0095, z]}>
          <boxGeometry args={[0.018, 0.002, 0.014]} />
          <meshStandardMaterial color="#2a2e36" roughness={0.5} />
        </mesh>
      ))}
      {/* stylus */}
      <group position={[0.06, 0.016, 0.03]} rotation={[0, 0.5, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.0055, 0.0045, 0.15, 20]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        <mesh position-y={-0.08}>
          <coneGeometry args={[0.0045, 0.012, 20]} />
          <meshStandardMaterial color="#9aa3b2" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** Two-handed controller: body, grips, sticks, D-pad, face buttons, triggers. */
export function Gamepad() {
  const face = [
    ['#4ade80', 0.035, 0.004],
    ['#fb7185', 0.047, -0.008],
    ['#60a5fa', 0.023, -0.008],
    ['#facc15', 0.035, -0.02],
  ] as const;
  return (
    <group>
      <RoundedBox args={[0.15, 0.03, 0.065]} radius={0.014} smoothness={4} position-y={0.024} castShadow>
        <meshStandardMaterial color="#1c1f26" roughness={0.55} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.058, 0.02, 0.03]} rotation-x={0.5} castShadow>
          <capsuleGeometry args={[0.019, 0.035, 6, 16]} />
          <meshStandardMaterial color="#1c1f26" roughness={0.55} />
        </mesh>
      ))}
      {[[-0.035, 0.008], [0.015, 0.024]].map(([x, z], i) => (
        <group key={i} position={[x, 0.041, z]}>
          <mesh>
            <cylinderGeometry args={[0.009, 0.01, 0.006, 24]} />
            <meshStandardMaterial color="#2b2f38" roughness={0.6} />
          </mesh>
          <mesh position-y={0.005}>
            <cylinderGeometry args={[0.011, 0.011, 0.003, 24]} />
            <meshStandardMaterial color="#111318" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* D-pad */}
      <mesh position={[-0.02, 0.0395, 0.024]}>
        <boxGeometry args={[0.018, 0.004, 0.006]} />
        <meshStandardMaterial color="#2b2f38" />
      </mesh>
      <mesh position={[-0.02, 0.0395, 0.024]}>
        <boxGeometry args={[0.006, 0.004, 0.018]} />
        <meshStandardMaterial color="#2b2f38" />
      </mesh>
      {face.map(([c, x, z]) => (
        <mesh key={c} position={[x, 0.0395, z]}>
          <cylinderGeometry args={[0.005, 0.005, 0.004, 16]} />
          <meshStandardMaterial color={c} roughness={0.35} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.03, 0.012, 0.018]} radius={0.004} position={[s * 0.045, 0.034, -0.032]} castShadow>
          <meshStandardMaterial color="#2b2f38" roughness={0.5} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** Mono laser printer: body, output tray, paper cassette, control panel. */
export function LaserPrinter() {
  const panel = useDisposable(() => labelTexture(['Ready', '35 ppm · Duplex'], { w: 256, h: 96, accent: '#38d6f5' }), []);
  return (
    <group>
      <RoundedBox args={[0.38, 0.24, 0.36]} radius={0.015} smoothness={3} position-y={0.12} castShadow receiveShadow>
        <meshStandardMaterial {...white} />
      </RoundedBox>
      {/* recessed output bay on top */}
      <mesh position={[0, 0.2405, -0.02]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.25, 0.2]} />
        <meshStandardMaterial color="#2a2d33" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.244, -0.02]} rotation-x={-Math.PI / 2 + 0.05}>
        <planeGeometry args={[0.21, 0.18]} />
        <meshStandardMaterial color="#fbfbf8" roughness={0.9} />
      </mesh>
      {/* paper cassette */}
      <mesh position={[0, 0.035, 0.181]}>
        <boxGeometry args={[0.32, 0.05, 0.004]} />
        <meshStandardMaterial color="#cfd3da" roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.2, 0.181]}>
        <planeGeometry args={[0.09, 0.034]} />
        <meshStandardMaterial map={panel} emissiveMap={panel} emissive="#ffffff" emissiveIntensity={0.35} />
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

/** FDM 3D printer (≈ 42 cm cube) with a print on the bed. */
export function Printer3d() {
  return (
    <group>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.2, 0.25, sz * 0.2]} castShadow>
            <boxGeometry args={[0.02, 0.5, 0.02]} />
            <meshStandardMaterial {...dark} />
          </mesh>
        )),
      )}
      <mesh position-y={0.5} castShadow>
        <boxGeometry args={[0.42, 0.02, 0.42]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <RoundedBox args={[0.42, 0.06, 0.42]} radius={0.01} position-y={0.03} castShadow receiveShadow>
        <meshStandardMaterial {...dark} />
      </RoundedBox>
      <mesh position-y={0.14}>
        <boxGeometry args={[0.3, 0.008, 0.3]} />
        <meshStandardMaterial color="#2d3440" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.03]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.8} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.06, 0.07, 0.06]} radius={0.008} position={[0.04, 0.3, 0]} castShadow>
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0.04, 0.175, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.06, 6]} />
        <meshStandardMaterial color="#38d6f5" roughness={0.35} />
      </mesh>
      <mesh position={[0.24, 0.42, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.07, 0.025, 12, 32]} />
        <meshStandardMaterial color="#e879f9" roughness={0.6} />
      </mesh>
    </group>
  );
}
