/**
 * Print & media, network, power & cables and mobile zones.
 * [PLACEHOLDER] The devices here are procedural stand-ins at real size until
 * V2-4 brings their licensed models (DEVICE_CATALOG.md / ASSET_SOURCING.md);
 * the furniture and layout stay.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { MeshStandardMaterial } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { labelTexture, pcbTexture } from '@/lib/three/proceduralTextures';
import { Microphone, NetworkCard, Printer, Webcam } from '@/scenes/HardwareExplorer/placeholders';
import { Table } from '../furniture';
import { Cable, ScreenPanel } from './common';
import { useWallpaper } from './useWallpaper';
import type { ZoneContentProps } from './zoneData';

const dark = { color: '#1a1d23', metalness: 0.35, roughness: 0.45 } as const;
const white = { color: '#e6e8ec', metalness: 0.05, roughness: 0.4 } as const;

/* ── Print & media ─────────────────────────────────────────── */

function Printer3d() {
  return (
    <group>
      {/* frame */}
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
      {/* bed, gantry, hot end, printed part */}
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
      {/* filament spool */}
      <mesh position={[0.24, 0.42, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.07, 0.025, 12, 32]} />
        <meshStandardMaterial color="#e879f9" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Projector() {
  return (
    <group>
      <RoundedBox args={[0.3, 0.1, 0.24]} radius={0.02} position-y={0.05} castShadow>
        <meshStandardMaterial {...white} />
      </RoundedBox>
      <mesh position={[0.07, 0.05, 0.121]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.035, 0.035, 0.012, 32]} />
        <meshStandardMaterial color="#0c1018" metalness={0.3} roughness={0.1} />
      </mesh>
    </group>
  );
}

export function PrintMediaZone({ detail }: ZoneContentProps) {
  const wallpaper = useWallpaper();
  return (
    <>
      {/* projection screen on the wall behind */}
      <group position={[0.2, 1.75, -1.15]}>
        <mesh>
          <planeGeometry args={[2.0, 1.125]} />
          <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={wallpaper} emissiveIntensity={0.55} roughness={0.9} />
        </mesh>
      </group>
      <group position={[-0.55, 0, -0.35]}>
        <Table width={1.3} depth={0.7}>
          <group position={[-0.25, 0, 0]} rotation-y={0.15}>
            <Printer />
          </group>
          {detail === 'full' && (
            <group position={[0.35, 0, 0.05]} rotation-y={-0.4}>
              <Projector />
            </group>
          )}
        </Table>
      </group>
      <group position={[0.95, 0, -0.25]} rotation-y={-0.3}>
        <Table width={0.7} depth={0.65} height={0.62}>
          <Printer3d />
        </Table>
      </group>
      {detail === 'full' && (
        // interactive panel on a mobile stand
        <group position={[1.15, 0, 0.55]} rotation-y={-0.75}>
          <mesh position-y={0.55} castShadow>
            <boxGeometry args={[0.06, 1.1, 0.06]} />
            <meshStandardMaterial color="#3a3f4b" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position-y={0.02}>
            <boxGeometry args={[0.7, 0.04, 0.5]} />
            <meshStandardMaterial color="#3a3f4b" metalness={0.7} roughness={0.35} />
          </mesh>
          <group position-y={1.3}>
            <ScreenPanel width={1.24} height={0.72} depth={0.06} bezel={0.025} texture={wallpaper} />
          </group>
        </group>
      )}
    </>
  );
}

/* ── Network ──────────────────────────────────────────────── */

/** 1U device face: port grid + status LEDs (one texture shared by all units). */
function unitTexture() {
  return labelTexture(['24 × RJ-45  ·  1 Gbit/s', 'SFP+  ·  PoE'], { w: 512, h: 48, bg: '#14171d', accent: '#22d3ee' });
}

function Rack({ blink }: { blink: boolean }) {
  const face = useDisposable(() => unitTexture(), []);
  const leds = useRef<MeshStandardMaterial>(null);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    if (leds.current && blink && !reduced) leds.current.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 9) * Math.sin(clock.elapsedTime * 2.3) * 1.1;
  });
  const units = [1.22, 1.15, 1.08, 0.86, 0.79, 0.52];
  return (
    <group>
      {/* cabinet frame (front open) */}
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
      {/* patch cables */}
      {units.slice(0, 3).map((y, i) => (
        <Cable key={y} points={[[-0.15 + i * 0.05, y, 0.27], [-0.1 + i * 0.06, y - 0.08, 0.33], [0.05 + i * 0.03, units[3] + 0.01, 0.28]]} radius={0.0035} color={['#3b82f6', '#facc15', '#22c55e'][i]} />
      ))}
    </group>
  );
}

function Router() {
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

export function NetworkZone({ detail }: ZoneContentProps) {
  return (
    <>
      <group position={[-0.75, 0, -0.65]}>
        <Rack blink={detail === 'full'} />
      </group>
      <group position={[0.45, 0, -0.35]}>
        <Table width={1.4} depth={0.7}>
          <group position={[-0.3, 0, -0.05]} rotation-y={0.2}>
            <Router />
          </group>
          {detail === 'full' && (
            <>
              <group position={[0.25, 0.0005, 0.05]} rotation-y={-0.3} scale={1.6}>
                <NetworkCard />
              </group>
              <Cable points={[[-0.3, 0.02, -0.14], [-0.55, 0.0, -0.3], [-1.0, -0.4, -0.3], [-1.18, -0.05, -0.32]]} radius={0.0035} color="#3b82f6" />
            </>
          )}
        </Table>
      </group>
    </>
  );
}

/* ── Power & cables ───────────────────────────────────────── */

function Ups() {
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

/** Coiled cable hanging on a hook, with a coloured plug. */
function Coil({ color, plug }: { color: string; plug: string }) {
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

/** HDMI, DisplayPort, USB-C, USB-A, 3.5 mm audio, mains (DEVICE_CATALOG §7). */
const COILS = [
  { color: '#15171c', plug: '#2a2d33' },
  { color: '#15171c', plug: '#3f4552' },
  { color: '#e6e8ec', plug: '#cfd3da' },
  { color: '#2b2f37', plug: '#5b6270' },
  { color: '#22c55e', plug: '#15803d' },
  { color: '#0f1115', plug: '#1f2329' },
] as const;

export function PowerZone({ detail }: ZoneContentProps) {
  return (
    <>
      {/* pegboard with cable coils */}
      <group position={[0, 0, -1.1]}>
        <mesh position-y={1.45}>
          <boxGeometry args={[2.4, 1.1, 0.03]} />
          <meshStandardMaterial color="#c9a27a" roughness={0.8} />
        </mesh>
        {COILS.map((c, i) => (
          <group key={i} position={[-1.0 + i * 0.4, 1.85, 0.02]}>
            <Coil {...c} />
          </group>
        ))}
      </group>
      <group position={[-0.95, 0, -0.45]}>
        <Ups />
      </group>
      <group position={[0.35, 0, -0.35]}>
        <Table width={1.5} depth={0.65}>
          {/* surge protector strip */}
          <RoundedBox args={[0.42, 0.04, 0.06]} radius={0.012} position={[-0.25, 0.02, 0.05]} castShadow>
            <meshStandardMaterial {...white} />
          </RoundedBox>
          {detail === 'full' && (
            <>
              {/* docking station, USB hub, card reader */}
              <RoundedBox args={[0.2, 0.03, 0.08]} radius={0.01} position={[0.2, 0.015, 0.0]} castShadow>
                <meshStandardMaterial color="#2a2e36" metalness={0.6} roughness={0.35} />
              </RoundedBox>
              <RoundedBox args={[0.11, 0.015, 0.035]} radius={0.006} position={[0.45, 0.0075, 0.12]} castShadow>
                <meshStandardMaterial {...white} />
              </RoundedBox>
              <RoundedBox args={[0.06, 0.012, 0.04]} radius={0.005} position={[0.55, 0.006, -0.05]} castShadow>
                <meshStandardMaterial {...dark} />
              </RoundedBox>
              <Cable points={[[-0.04, 0.02, 0.05], [0.04, 0.03, 0.08], [0.1, 0.015, 0.0]]} radius={0.003} />
            </>
          )}
        </Table>
      </group>
    </>
  );
}

/* ── Mobile devices ───────────────────────────────────────── */

function Laptop({ wallpaper }: { wallpaper: ReturnType<typeof useWallpaper> }) {
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
function Slate({ width, height, wallpaper }: { width: number; height: number; wallpaper: ReturnType<typeof useWallpaper> }) {
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

function SingleBoard() {
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

export function MobileZone({ detail }: ZoneContentProps) {
  const wallpaper = useWallpaper();
  return (
    <Table width={3.0} depth={0.8}>
      <group position={[-1.05, 0, 0.05]} rotation-y={0.25}>
        <Laptop wallpaper={wallpaper} />
      </group>
      {detail === 'full' && (
        <>
          <group position={[-0.5, 0, 0.05]}>
            <Slate width={0.072} height={0.155} wallpaper={wallpaper} />
          </group>
          <group position={[-0.15, 0, 0.0]}>
            <Slate width={0.25} height={0.17} wallpaper={wallpaper} />
          </group>
          {/* all-in-one */}
          <group position={[0.5, 0, -0.1]} rotation-y={-0.15}>
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
          {/* smartwatch on a charging puck */}
          <group position={[1.05, 0, 0.12]}>
            <mesh position-y={0.006}>
              <cylinderGeometry args={[0.03, 0.03, 0.012, 32]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <group position={[0, 0.03, 0]} rotation-x={-0.6}>
              <ScreenPanel width={0.04} height={0.048} depth={0.011} bezel={0.003} texture={wallpaper} />
            </group>
          </group>
          <group position={[1.15, 0, -0.15]} rotation-y={-0.4}>
            <SingleBoard />
          </group>
        </>
      )}
    </Table>
  );
}

/** Peripherals: microphone and webcam stand-ins join the desk (V2-4 replaces them). */
export function PeripheralExtras() {
  return (
    <>
      <group position={[-1.32, 0.75, 0.2]} rotation-y={0.4}>
        <Microphone />
      </group>
      <group position={[0, 0.75 + 0.47, -0.31]}>
        <Webcam />
      </group>
    </>
  );
}
