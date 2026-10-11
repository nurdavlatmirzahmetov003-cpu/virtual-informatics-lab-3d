/**
 * [PLACEHOLDER] Procedural devices of the network, power and mobile zones
 * (V2-4b brings their licensed models). Real size; base at y = 0, front +Z.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { MeshStandardMaterial, Texture } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { labelTexture, pcbTexture } from '@/lib/three/proceduralTextures';
import { Cable, ScreenPanel } from '../zones/common';

const dark = { color: '#1a1d23', metalness: 0.35, roughness: 0.45 } as const;
const white = { color: '#e6e8ec', metalness: 0.05, roughness: 0.4 } as const;

/** The rack as seen from afar (hall overview): its shell and the face of its units, two draw calls. */
export function RackShell() {
  const face = useDisposable(() => labelTexture(['24 × RJ-45', 'SFP+  ·  PoE'], { w: 256, h: 96, bg: '#14171d', accent: '#22d3ee' }), []);
  return (
    <group>
      <mesh position-y={0.8} castShadow>
        <boxGeometry args={[0.62, 1.6, 0.6]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, 1.0, 0.301]}>
        <planeGeometry args={[0.54, 0.75]} />
        <meshStandardMaterial map={face} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** 22U server rack, front open, switches and a patch panel, blinking link LEDs. */
export function Rack({ blink = true }: { blink?: boolean }) {
  const face = useDisposable(() => labelTexture(['24 × RJ-45  ·  1 Gbit/s', 'SFP+  ·  PoE'], { w: 512, h: 48, bg: '#14171d', accent: '#22d3ee' }), []);
  const leds = useRef<MeshStandardMaterial>(null);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    if (leds.current && blink && !reduced) leds.current.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 9) * Math.sin(clock.elapsedTime * 2.3) * 1.1;
  });
  const units = [1.22, 1.15, 1.08, 0.86, 0.79, 0.52];
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.3, 0.8, 0]} castShadow>
          <boxGeometry args={[0.02, 1.6, 0.6]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}
      {[0.01, 1.59].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.62, 0.02, 0.6]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}
      <mesh position={[0, 0.8, -0.29]}>
        <boxGeometry args={[0.6, 1.6, 0.02]} />
        <meshStandardMaterial color="#101217" roughness={0.7} />
      </mesh>
      {units.map((y) => (
        <group key={y} position={[0, y, 0.02]}>
          <mesh>
            <boxGeometry args={[0.56, 0.044, 0.5]} />
            <meshStandardMaterial color="#20242c" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position-z={0.2505}>
            <planeGeometry args={[0.54, 0.04]} />
            <meshStandardMaterial map={face} roughness={0.5} />
          </mesh>
          <mesh position={[0.24, 0, 0.252]}>
            <boxGeometry args={[0.04, 0.006, 0.002]} />
            <meshStandardMaterial ref={y === units[0] ? leds : undefined} color="#000" emissive="#4ade80" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {units.slice(0, 3).map((y, i) => (
        <Cable key={y} points={[[-0.15 + i * 0.05, y, 0.27], [-0.1 + i * 0.06, y - 0.08, 0.33], [0.05 + i * 0.03, units[3] + 0.01, 0.28]]} radius={0.0035} color={['#3b82f6', '#facc15', '#22c55e'][i]} />
      ))}
    </group>
  );
}

/** Wi-Fi router with four antennas. */
export function Router() {
  return (
    <group>
      <RoundedBox args={[0.26, 0.045, 0.17]} radius={0.012} position-y={0.0225} castShadow>
        <meshStandardMaterial {...white} />
      </RoundedBox>
      {[-0.1, -0.035, 0.035, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.13, -0.075]} rotation-x={-0.12} castShadow>
          <capsuleGeometry args={[0.007, 0.16, 4, 12]} />
          <meshStandardMaterial {...white} />
        </mesh>
      ))}
      <mesh position={[0, 0.046, 0.05]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.12, 0.006]} />
        <meshStandardMaterial color="#000" emissive="#38d6f5" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Desktop network switch (8 ports). */
export function NetworkSwitch() {
  const face = useDisposable(() => labelTexture(['8 × RJ-45 · 1 Gbit/s'], { w: 256, h: 40, bg: '#14171d', accent: '#22d3ee' }), []);
  return (
    <group>
      <RoundedBox args={[0.2, 0.03, 0.1]} radius={0.004} position-y={0.015} castShadow>
        <meshStandardMaterial {...dark} metalness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.015, 0.0505]}>
        <planeGeometry args={[0.19, 0.022]} />
        <meshStandardMaterial map={face} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Tower UPS with its status screen. */
export function Ups() {
  const face = useDisposable(() => labelTexture(['UPS 1500 VA', '230 V · 900 W · 100%'], { w: 256, h: 96, accent: '#facc15' }), []);
  return (
    <group>
      <RoundedBox args={[0.17, 0.4, 0.42]} radius={0.012} position-y={0.2} castShadow receiveShadow>
        <meshStandardMaterial {...dark} />
      </RoundedBox>
      <mesh position={[0, 0.31, 0.2105]}>
        <planeGeometry args={[0.12, 0.045]} />
        <meshStandardMaterial map={face} emissiveMap={face} emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/** A port opening on a gadget's front: x offset, width, height (m) and the colour of its insert. */
type PortHole = readonly [x: number, w: number, h: number, insert?: string];

/** Common port openings (width, height in m) for the gadget fronts. */
const USB_A = [0.0125, 0.0045] as const;
const USB_C = [0.009, 0.0032] as const;

/** Small accessory box (dock, hub, card reader): size in metres, colour, port openings on the front. */
export function Gadget({ size, color = '#2a2e36', glow, ports = [] }: { size: readonly [number, number, number]; color?: string; glow?: string; ports?: readonly PortHole[] }) {
  const [w, h, d] = size;
  return (
    <group>
      <RoundedBox args={[...size]} radius={Math.min(0.01, h / 2.2)} position-y={h / 2} castShadow>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.38} />
      </RoundedBox>
      {ports.map(([x, pw, ph, insert = '#0b0d11'], i) => (
        <mesh key={i} position={[x, h / 2, d / 2 + 0.0006]}>
          <planeGeometry args={[pw, ph]} />
          <meshStandardMaterial color={insert} roughness={0.6} />
        </mesh>
      ))}
      {glow && (
        <mesh position={[w / 2 - 0.012, h / 2 + 0.002, d / 2 + 0.0006]}>
          <circleGeometry args={[0.002, 12]} />
          <meshStandardMaterial color="#000" emissive={glow} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** Port layouts of the power-zone gadgets (front faces). */
const DOCK_PORTS: readonly PortHole[] = [
  [-0.075, ...USB_C], [-0.058, ...USB_C], [-0.036, ...USB_A, '#2563eb'], [-0.017, ...USB_A, '#2563eb'],
  [0.006, 0.015, 0.006], [0.028, 0.013, 0.0055], [0.05, 0.014, 0.011], [0.072, 0.0055, 0.0055],
];
const HUB_PORTS: readonly PortHole[] = [-0.039, -0.013, 0.013, 0.039].map((x) => [x, ...USB_A, '#2563eb'] as const);
const READER_PORTS: readonly PortHole[] = [
  [-0.008, 0.026, 0.0024],
  [0.017, 0.012, 0.0016],
];

export const DockingStation = () => <Gadget size={[0.2, 0.03, 0.08]} glow="#38d6f5" ports={DOCK_PORTS} />;
export const UsbHub = () => <Gadget size={[0.11, 0.015, 0.035]} color="#e6e8ec" glow="#4ade80" ports={HUB_PORTS} />;
export const CardReader = () => <Gadget size={[0.06, 0.012, 0.04]} color="#1a1d23" glow="#38d6f5" ports={READER_PORTS} />;

/** Cable colours / plug tints of the cable coils (HDMI, DisplayPort, USB-C, USB-A, audio). */
const COILS = {
  hdmi_cable: ['#15171c', '#2a2d33'],
  displayport_cable: ['#15171c', '#3f4552'],
  usb_c_cable: ['#e6e8ec', '#cfd3da'],
  usb_a_cable: ['#2b2f37', '#5b6270'],
  audio_cable: ['#22c55e', '#15803d'],
  ethernet_cable: ['#3b82f6', '#cfe0ff'],
} as const;

/** A coiled cable hanging on a hook, with its plug. */
export function CableCoil({ kind }: { kind: keyof typeof COILS }) {
  const [color, plug] = COILS[kind];
  return (
    <group>
      <mesh position={[0, 0, 0.04]}>
        <cylinderGeometry args={[0.006, 0.006, 0.06, 8]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.12, 0.06]}>
        <torusGeometry args={[0.1, 0.008, 8, 40]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <RoundedBox args={[0.03, 0.05, 0.016]} radius={0.004} position={[0.06, -0.26, 0.06]} castShadow>
        <meshStandardMaterial color={plug} roughness={0.45} metalness={0.3} />
      </RoundedBox>
    </group>
  );
}

export function Laptop({ wallpaper }: { wallpaper: Texture }) {
  return (
    <group>
      <RoundedBox args={[0.32, 0.016, 0.22]} radius={0.006} position-y={0.008} castShadow>
        <meshStandardMaterial color="#b9bdc4" metalness={0.85} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.0165, 0.01]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.28, 0.1]} />
        <meshStandardMaterial color="#1b1d22" roughness={0.7} />
      </mesh>
      <group position={[0, 0.016, -0.108]} rotation-x={-0.32}>
        <group position-y={0.105}>
          <ScreenPanel width={0.32} height={0.21} depth={0.008} bezel={0.008} texture={wallpaper} />
        </group>
      </group>
    </group>
  );
}

/** A slate (phone / tablet) leaning on a small stand. */
export function Slate({ width, height, wallpaper }: { width: number; height: number; wallpaper: Texture }) {
  return (
    <group>
      <mesh position={[0, 0.006, -0.02]}>
        <boxGeometry args={[width * 0.6, 0.012, 0.08]} />
        <meshStandardMaterial color="#3a3f4b" metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={[0, 0.012 + (height / 2) * Math.cos(0.3), -0.02]} rotation-x={-0.3}>
        <ScreenPanel width={width} height={height} depth={0.008} bezel={0.004} texture={wallpaper} />
      </group>
    </group>
  );
}

export function AllInOne({ wallpaper }: { wallpaper: Texture }) {
  return (
    <group>
      <mesh position={[0, 0.005, 0.02]}>
        <boxGeometry args={[0.22, 0.01, 0.18]} />
        <meshStandardMaterial color="#c4c8cf" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.12, -0.04]} rotation-x={-0.12}>
        <boxGeometry args={[0.05, 0.24, 0.012]} />
        <meshStandardMaterial color="#c4c8cf" metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0, 0.33, -0.05]}>
        <ScreenPanel width={0.62} height={0.4} depth={0.03} bezel={0.012} texture={wallpaper} />
      </group>
    </group>
  );
}

export function Smartwatch({ wallpaper }: { wallpaper: Texture }) {
  return (
    <group>
      <mesh position-y={0.006}>
        <cylinderGeometry args={[0.03, 0.03, 0.012, 32]} />
        <meshStandardMaterial {...white} />
      </mesh>
      <group position={[0, 0.03, 0]} rotation-x={-0.6}>
        <ScreenPanel width={0.04} height={0.048} depth={0.011} bezel={0.003} texture={wallpaper} />
      </group>
    </group>
  );
}

export function SingleBoard() {
  const pcb = useDisposable(() => pcbTexture('#14532d', 256, 192, 9), []);
  return (
    <group>
      <mesh position-y={0.002} castShadow>
        <boxGeometry args={[0.085, 0.0016, 0.056]} />
        <meshStandardMaterial map={pcb} roughness={0.6} />
      </mesh>
      {[
        [0.03, 0.009, 0.0, 0.021, 0.016, 0.017],
        [0.03, 0.009, -0.019, 0.021, 0.016, 0.014],
        [-0.005, 0.004, 0.0, 0.014, 0.004, 0.014],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={i < 2 ? '#c0c4cc' : '#111'} metalness={i < 2 ? 0.8 : 0.2} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** Fibre ONT (modem): white box, status LEDs, the yellow fibre patch cord with its green SC/APC plug at the back. */
export function Modem() {
  const face = useDisposable(() => labelTexture(['PWR  PON  LOS  LAN'], { w: 256, h: 32, bg: '#e9ebef', accent: '#22c55e' }), []);
  return (
    <group>
      <RoundedBox args={[0.18, 0.034, 0.13]} radius={0.01} position-y={0.017} castShadow>
        <meshStandardMaterial {...white} />
      </RoundedBox>
      <mesh position={[0, 0.017, 0.0655]}>
        <planeGeometry args={[0.15, 0.019]} />
        <meshStandardMaterial map={face} roughness={0.45} />
      </mesh>
      {[-0.05, -0.025, 0, 0.025].map((x, i) => (
        <mesh key={x} position={[x + 0.012, 0.0345, 0.05]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.0025, 12]} />
          <meshStandardMaterial color="#000" emissive={i === 2 ? '#f59e0b' : '#4ade80'} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
      <RoundedBox args={[0.01, 0.012, 0.03]} radius={0.002} position={[-0.04, 0.017, -0.075]} castShadow>
        <meshStandardMaterial color="#16a34a" roughness={0.4} />
      </RoundedBox>
      <Cable points={[[-0.04, 0.017, -0.09], [-0.04, 0.012, -0.14], [-0.1, 0.004, -0.17], [-0.16, 0.004, -0.12]]} radius={0.0018} color="#facc15" />
    </group>
  );
}

/** Desktop USB Wi-Fi adapter on its stand with two antennas and the USB cable. */
export function WifiAdapter() {
  return (
    <group>
      <mesh position-y={0.004} castShadow>
        <cylinderGeometry args={[0.032, 0.036, 0.008, 32]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <RoundedBox args={[0.05, 0.075, 0.022]} radius={0.006} position-y={0.0455} castShadow>
        <meshStandardMaterial {...dark} metalness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.07, 0.0115]}>
        <circleGeometry args={[0.0025, 12]} />
        <meshStandardMaterial color="#000" emissive="#38d6f5" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.018, 0.14, -0.004]} rotation-z={-s * 0.18} castShadow>
          <capsuleGeometry args={[0.005, 0.11, 4, 12]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}
      <Cable points={[[0, 0.015, -0.012], [0, 0.006, -0.05], [0.05, 0.004, -0.08], [0.11, 0.004, -0.06]]} radius={0.0022} color="#1a1d23" />
      <RoundedBox args={[0.016, 0.008, 0.03]} radius={0.002} position={[0.125, 0.004, -0.055]} rotation-y={-0.9} castShadow>
        <meshStandardMaterial color="#b8bec8" metalness={0.85} roughness={0.3} />
      </RoundedBox>
    </group>
  );
}

/** Ceiling access point: a white disc with its status ring (shown leaning on a stand). */
export function AccessPoint() {
  return (
    <group>
      <mesh position-y={0.016} castShadow>
        <cylinderGeometry args={[0.1, 0.095, 0.032, 48]} />
        <meshStandardMaterial {...white} />
      </mesh>
      <mesh position-y={0.0325} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.022, 0.028, 40]} />
        <meshStandardMaterial color="#000" emissive="#38bdf8" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh position-y={0.0322} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.085, 48]} />
        <meshStandardMaterial color="#f4f5f7" roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Two-bay NAS: black tower, drive trays with handles, status LEDs, power button. */
export function Nas() {
  const face = useDisposable(() => labelTexture(['NAS', 'RAID 1 · 2 × 4 TB'], { w: 256, h: 96, bg: '#14171d', accent: '#22d3ee' }), []);
  return (
    <group>
      <RoundedBox args={[0.11, 0.17, 0.22]} radius={0.008} position-y={0.085} castShadow receiveShadow>
        <meshStandardMaterial {...dark} />
      </RoundedBox>
      {[-0.024, 0.024].map((x) => (
        <group key={x} position={[x, 0.085, 0.1105]}>
          <mesh>
            <planeGeometry args={[0.042, 0.14]} />
            <meshStandardMaterial color="#262a32" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.05, 0.002]}>
            <boxGeometry args={[0.03, 0.012, 0.004]} />
            <meshStandardMaterial color="#3a3f4b" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.06, 0.001]}>
            <circleGeometry args={[0.002, 10]} />
            <meshStandardMaterial color="#000" emissive="#4ade80" emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.12, -0.1105]} rotation-y={Math.PI}>
        <planeGeometry args={[0.09, 0.034]} />
        <meshStandardMaterial map={face} roughness={0.5} />
      </mesh>
    </group>
  );
}
