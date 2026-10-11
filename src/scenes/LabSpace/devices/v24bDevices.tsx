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

/** Small accessory box (dock, hub, card reader): size in metres, colour. */
export function Gadget({ size, color = '#2a2e36', glow }: { size: readonly [number, number, number]; color?: string; glow?: string }) {
  return (
    <group>
      <RoundedBox args={[...size]} radius={Math.min(0.01, size[1] / 2.2)} position-y={size[1] / 2} castShadow>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.38} />
      </RoundedBox>
      {glow && (
        <mesh position={[size[0] / 2 - 0.012, size[1] / 2, size[2] / 2 + 0.0005]}>
          <circleGeometry args={[0.002, 12]} />
          <meshStandardMaterial color="#000" emissive={glow} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

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
