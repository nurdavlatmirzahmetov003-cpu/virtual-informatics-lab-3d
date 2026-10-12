/**
 * Tablet teardown (V2-5b) — [PLACEHOLDER] procedural 11″ tablet: two battery
 * cells either side of a long narrow board, a speaker in every corner, the
 * USB-C port on its own small board. It lies face up (landscape); the
 * display lifts off and is laid behind it, the insides are set out in front.
 *
 * Frame: origin at the centre of the back, +Z towards the camera,
 * tablet 250 × 175 × 6.3 mm.
 */
import { useMemo, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { rel, route, type Vec3 } from '@/lib/teardown/timeline';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { useWallpaper } from '@/scenes/LabSpace/zones/useWallpaper';
import { BatteryPack, CameraModule, Card, FlatScreen, Shield } from './pieces';
import { TeardownPart, type PartMotion } from './TeardownPart';

const ORDER = TEARDOWNS.tablet.parts;
const W = 0.25;
const L = 0.175;
const T = 0.0063;
const LIFT: Vec3 = [0, 0.05, 0];
const REST = 0.0004;
const BASE = 0.0012;

const up = (at: Vec3, rest: Vec3, label: Vec3, clear = 0.015): PartMotion => ({ at, path: route(LIFT, rel(at, rest), clear), label });

const MOTION: Record<string, PartMotion> = {
  display: up([0, T - 0.0014, 0], [0, REST, -0.215], [0, 0.006, -0.06], 0.03),
  battery: up([0, BASE, 0.01], [-0.08, REST, 0.205], [0, 0.008, 0]),
  cameras: up([-0.05, BASE, -0.075], [0.21, REST, 0.15], [0, 0.01, 0]),
  mainboard: up([0, BASE + 0.0006, 0.005], [0.115, REST, 0.205], [0, 0.008, -0.04]),
  speakers: up([0, BASE, 0], [0.02, REST, 0.33], [-0.114, 0.01, 0.074]),
  usb_port: up([W / 2 - 0.009, BASE, 0], [0.21, REST, 0.25], [0, 0.008, 0]),
};

function Frame() {
  return (
    <group>
      <RoundedBox args={[W, 0.0012, L]} radius={0.0005} smoothness={2} position-y={0.0006} castShadow>
        <meshStandardMaterial color="#9aa0aa" metalness={0.85} roughness={0.3} />
      </RoundedBox>
      <mesh position-y={0.00125} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W - 0.006, L - 0.006]} />
        <meshStandardMaterial color="#2a2e36" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`z${s}`} position={[0, T / 2, s * (L / 2 - 0.0015)]}>
          <boxGeometry args={[W, T - 0.0014, 0.003]} />
          <meshStandardMaterial color="#b9bdc4" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`x${s}`} position={[s * (W / 2 - 0.0015), T / 2, 0]}>
          <boxGeometry args={[0.003, T - 0.0014, L]} />
          <meshStandardMaterial color="#b9bdc4" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Display() {
  const wallpaper = useWallpaper(512, 360);
  return <FlatScreen w={W - 0.002} d={L - 0.002} h={0.0014} texture={wallpaper} bezel={0.006} />;
}

/** Two cells either side of the board, joined by a flex. */
function Battery() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position-x={s * 0.062}>
          <BatteryPack w={0.085} d={0.135} h={0.0036} />
        </group>
      ))}
      <mesh position={[0, 0.0012, -0.055]}>
        <boxGeometry args={[0.04, 0.0003, 0.006]} />
        <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Mainboard() {
  return (
    <group>
      <Card size={[0.03, 0.0012, 0.14]} color="#0f3d2a" seed={33} chips={[[0, -0.05, 0.012], [0, 0.03, 0.01], [0, 0.055, 0.008]]} />
      <Shield size={[0.022, 0.0014, 0.03]} at={[0, 0.0013, -0.012]} />
    </group>
  );
}

function Cameras() {
  return (
    <group>
      <group position-x={-0.035}>
        <CameraModule r={0.005} h={0.0028} />
      </group>
      <group position={[0.05, 0, -0.006]}>
        <CameraModule r={0.002} h={0.0024} />
      </group>
    </group>
  );
}

const CORNERS: readonly Vec3[] = [
  [-0.114, 0, -0.074],
  [0.114, 0, -0.074],
  [-0.114, 0, 0.074],
  [0.114, 0, 0.074],
];

function Speakers() {
  return (
    <group>
      {CORNERS.map((c, i) => (
        <RoundedBox key={i} args={[0.018, 0.0035, 0.016]} radius={0.001} smoothness={2} position={[c[0], 0.00175, c[2]]} castShadow>
          <meshStandardMaterial color="#1a1d23" roughness={0.55} />
        </RoundedBox>
      ))}
    </group>
  );
}

function UsbPort() {
  return (
    <group>
      <Card size={[0.012, 0.001, 0.028]} color="#0f3d2a" seed={41} chips={[[0, 0.007, 0.004]]} />
      <mesh position={[0.004, 0.0016, -0.004]}>
        <boxGeometry args={[0.006, 0.0032, 0.009]} />
        <meshStandardMaterial color="#c7ccd4" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

export default function TabletTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.tablet.parts.${id}.name` as TranslationKey);
  const content = useMemo<Record<string, ReactNode>>(
    () => ({
      display: <Display />,
      battery: <Battery />,
      cameras: <Cameras />,
      mainboard: <Mainboard />,
      speakers: <Speakers />,
      usb_port: <UsbPort />,
    }),
    [],
  );
  return (
    <group>
      <Frame />
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={MOTION[id]}>
          {content[id]}
        </TeardownPart>
      ))}
    </group>
  );
}
