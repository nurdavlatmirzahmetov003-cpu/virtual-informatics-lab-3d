/**
 * Laptop teardown (V2-5a) — [PLACEHOLDER] procedural 14″ laptop with real
 * internal layout: the lid opens on its hinges, the bottom cover drops off,
 * then battery, SSD, memory, Wi-Fi card, display cable, speakers, cooling
 * and the board leave from underneath and are set out on the mat in front.
 * The laptop hovers above the mat like an exploded-view drawing.
 *
 * Laptop frame: origin at the centre of the base underside, +Z the front
 * edge, base 320 × 220 × 18 mm.
 */
import { useMemo, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { route, type Vec3 } from '@/lib/teardown/timeline';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { Cable, ScreenPanel } from '@/scenes/LabSpace/zones/common';
import { useWallpaper } from '@/scenes/LabSpace/zones/useWallpaper';
import { Card } from './pieces';
import { XRay } from './XRay';
import { TeardownPart, type PartMotion } from './TeardownPart';

const ORDER = TEARDOWNS.laptop.parts;
const W = 0.32;
const D = 0.22;
const BASE = 0.018;
/** Height the laptop hovers at above the mat. */
const LAPTOP_HOVER = 0.08;
const MAT = -LAPTOP_HOVER;
/** Every internal part first drops out below the base. */
const DROP: Vec3 = [0, -0.045, 0];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const fromBelow = (at: Vec3, rest: Vec3, label: Vec3): PartMotion => ({ at, path: route(DROP, sub(rest, at), 0), label });

const alu = { color: '#b9bdc4', metalness: 0.85, roughness: 0.32 } as const;
const dark = { color: '#1c1f25', metalness: 0.3, roughness: 0.5 } as const;

const MOTION: Record<string, PartMotion> = {
  // hinge axis at the back edge; closed = lying on the keyboard
  lid: { at: [0, BASE, -D / 2 + 0.002], rot: [Math.PI / 2, 0, 0], path: [], turn: [-(Math.PI / 2 + 0.3), 0, 0], label: [0, 0.17, 0.01] },
  bottom_cover: { at: [0, 0.001, 0], path: [DROP, [0.43, DROP[1], 0.03], [0.43, MAT + 0.001, 0.03]], label: [0, 0.006, 0] },
  battery: fromBelow([0, 0.0055, 0.055], [-0.13, MAT + 0.0035, 0.22], [0, 0.01, 0]),
  ssd: fromBelow([0.075, 0.0095, -0.035], [-0.25, MAT + 0.0013, 0.36], [0, 0.008, 0]),
  ram: fromBelow([-0.07, 0.0095, -0.035], [-0.15, MAT + 0.0018, 0.36], [0, 0.008, 0]),
  wifi: fromBelow([0.125, 0.0095, -0.03], [-0.055, MAT + 0.0013, 0.36], [0, 0.008, 0]),
  display_cable: fromBelow([-0.06, 0.0105, -0.088], [0.04, MAT + 0.001, 0.36], [0, 0.01, 0]),
  speakers: fromBelow([0, 0.006, 0.085], [0, MAT + 0.004, 0.47], [0.13, 0.012, 0]),
  cooling: fromBelow([0.07, 0.0095, -0.04], [0.23, MAT + 0.004, 0.36], [-0.04, 0.012, 0]),
  motherboard: fromBelow([-0.02, 0.006, -0.04], [0.12, MAT + 0.001, 0.22], [0, 0.012, 0]),
};

/** Top case: keyboard deck, palm rest, side walls, hinge barrels (stays put). */
function TopCase() {
  return (
    <group>
      <RoundedBox args={[W, 0.005, D]} radius={0.002} smoothness={2} position-y={BASE - 0.0025} castShadow>
        <meshStandardMaterial {...alu} />
      </RoundedBox>
      {[
        [0, (BASE - 0.005) / 2 + 0.002, D / 2 - 0.002, W, BASE - 0.007, 0.004],
        [0, (BASE - 0.005) / 2 + 0.002, -D / 2 + 0.002, W, BASE - 0.007, 0.004],
        [W / 2 - 0.002, (BASE - 0.005) / 2 + 0.002, 0, 0.004, BASE - 0.007, D],
        [-W / 2 + 0.002, (BASE - 0.005) / 2 + 0.002, 0, 0.004, BASE - 0.007, D],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial {...alu} />
        </mesh>
      ))}
      <mesh position={[0, BASE + 0.0002, -0.025]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.28, 0.105]} />
        <meshStandardMaterial color="#15171c" roughness={0.75} />
      </mesh>
      <mesh position={[0, BASE + 0.0002, 0.07]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.11, 0.065]} />
        <meshStandardMaterial color="#a9aeb6" metalness={0.6} roughness={0.25} />
      </mesh>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, BASE, -D / 2 + 0.004]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.005, 0.005, 0.05, 16]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}
    </group>
  );
}

function Lid() {
  const wallpaper = useWallpaper(512, 320);
  return (
    <group position={[0, 0.105, -0.003]}>
      <ScreenPanel width={W} height={0.21} depth={0.006} bezel={0.008} texture={wallpaper} />
      {/* aluminium back of the lid */}
      <mesh position-z={-0.0031} rotation-y={Math.PI}>
        <planeGeometry args={[W - 0.006, 0.204]} />
        <meshStandardMaterial {...alu} />
      </mesh>
    </group>
  );
}

function BottomCover() {
  return (
    <group>
      <RoundedBox args={[W - 0.004, 0.002, D - 0.004]} radius={0.0009} smoothness={2} castShadow>
        <meshStandardMaterial {...alu} color="#9fa4ac" />
      </RoundedBox>
      {/* intake vents */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0.03 + i * 0.012, 0.0011, -0.06]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.006, 0.07]} />
          <meshStandardMaterial color="#0b0d11" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Battery() {
  return (
    <group>
      <RoundedBox args={[0.24, 0.007, 0.07]} radius={0.002} smoothness={2} castShadow>
        <meshStandardMaterial color="#2b2f37" roughness={0.6} />
      </RoundedBox>
      {[-0.08, 0, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.0036, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.07, 0.06]} />
          <meshStandardMaterial color="#3a3f4a" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.0037, -0.036]}>
        <boxGeometry args={[0.02, 0.002, 0.008]} />
        <meshStandardMaterial color="#e6e8ec" />
      </mesh>
    </group>
  );
}

function WifiCard() {
  return (
    <group>
      <Card size={[0.022, 0.0012, 0.03]} chips={[[0, 0.002, 0.012]]} seed={5} />
      <mesh position={[0, 0.0018, 0.004]}>
        <boxGeometry args={[0.018, 0.0012, 0.016]} />
        <meshStandardMaterial color="#c7ccd4" metalness={0.85} roughness={0.3} />
      </mesh>
      <Cable points={[[-0.005, 0.002, -0.012], [-0.02, 0.003, -0.04], [-0.03, 0.003, -0.06]]} radius={0.0009} color="#1d1f24" />
      <Cable points={[[0.005, 0.002, -0.012], [0.01, 0.003, -0.04], [0.02, 0.003, -0.06]]} radius={0.0009} color="#e6e8ec" />
    </group>
  );
}

function DisplayCable() {
  return (
    <group>
      <Cable points={[[0.04, 0, 0.03], [0.0, 0.0005, 0.01], [-0.04, 0.001, -0.005], [-0.05, 0.004, -0.018]]} radius={0.0016} color="#111317" />
      <mesh position={[0.04, 0, 0.032]}>
        <boxGeometry args={[0.02, 0.003, 0.008]} />
        <meshStandardMaterial color="#c7ccd4" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Speakers() {
  return (
    <group>
      {[-0.13, 0.13].map((x) => (
        <group key={x} position-x={x}>
          <RoundedBox args={[0.036, 0.008, 0.016]} radius={0.002} smoothness={2} castShadow>
            <meshStandardMaterial color="#1a1d23" roughness={0.6} />
          </RoundedBox>
          <mesh position-y={-0.0041} rotation-x={Math.PI / 2}>
            <planeGeometry args={[0.028, 0.01]} />
            <meshStandardMaterial color="#3a3f4b" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <Cable points={[[-0.13, 0.002, -0.008], [-0.06, 0.003, -0.02], [0, 0.003, -0.025], [0.06, 0.003, -0.02], [0.13, 0.002, -0.008]]} radius={0.0007} color="#c0392b" />
    </group>
  );
}

const COPPER = { color: '#c27a4a', metalness: 0.9, roughness: 0.3 } as const;

function Cooling() {
  return (
    <group>
      <mesh position={[-0.12, 0, 0]}>
        <boxGeometry args={[0.032, 0.002, 0.032]} />
        <meshStandardMaterial {...COPPER} />
      </mesh>
      <Cable points={[[-0.12, 0.0015, 0], [-0.06, 0.0015, -0.02], [0.0, 0.0015, -0.04], [0.04, 0.0015, -0.045]]} radius={0.0028} color={COPPER.color} />
      <mesh position={[0.045, 0.001, -0.045]}>
        <boxGeometry args={[0.05, 0.007, 0.012]} />
        <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0.045, 0.001, -0.012]}>
        <cylinderGeometry args={[0.026, 0.026, 0.007, 32]} />
        <meshStandardMaterial color="#20232a" roughness={0.5} />
      </mesh>
      <mesh position={[0.045, 0.0046, -0.012]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.01, 24]} />
        <meshStandardMaterial color="#3a3f4b" />
      </mesh>
    </group>
  );
}

function Mainboard() {
  return (
    <group>
      <Card
        size={[0.24, 0.0016, 0.12]}
        seed={11}
        color="#0f3d2a"
        chips={[
          [-0.03, 0, 0.028],
          [0.02, 0.03, 0.016],
          [0.05, -0.03, 0.012],
          [-0.08, 0.035, 0.01],
          [0.09, 0.03, 0.01],
        ]}
      />
      {/* SO-DIMM and M.2 sockets stay on the board */}
      {[
        [-0.05, 0.005, 0.07, 0.006],
        [0.095, 0.005, 0.006, 0.024],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.0018, z]}>
          <boxGeometry args={[w, 0.002, d]} />
          <meshStandardMaterial color="#1b1d22" />
        </mesh>
      ))}
    </group>
  );
}

export default function LaptopTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.laptop.parts.${id}.name` as TranslationKey);
  const content = useMemo<Record<string, ReactNode>>(
    () => ({
      lid: <Lid />,
      bottom_cover: <BottomCover />,
      battery: <Battery />,
      ssd: <Card size={[0.08, 0.0012, 0.022]} chips={[[-0.02, 0, 0.016], [0.012, 0, 0.016], [0.03, 0, 0.008]]} color="#111827" seed={3} />,
      ram: <Card size={[0.0675, 0.0012, 0.03]} chips={[[-0.022, 0, 0.012], [0, 0, 0.012], [0.022, 0, 0.012]]} seed={7} />,
      wifi: <WifiCard />,
      display_cable: <DisplayCable />,
      speakers: <Speakers />,
      cooling: <Cooling />,
      motherboard: <Mainboard />,
    }),
    [],
  );
  return (
    <group position-y={LAPTOP_HOVER}>
      {/* once the bottom cover is off, the top case turns to glass: the parts are seen in their places */}
      <XRay after={ORDER.indexOf('bottom_cover')}>
        <TopCase />
      </XRay>
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={MOTION[id]}>
          {content[id]}
        </TeardownPart>
      ))}
    </group>
  );
}
