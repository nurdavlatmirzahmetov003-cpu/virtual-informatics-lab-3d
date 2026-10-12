/**
 * Smartphone teardown (V2-5b) — [PLACEHOLDER] procedural 6.1″ phone with a
 * real internal layout: board and cameras at the top, battery in the middle,
 * speaker and vibration motor at the bottom. It lies face up on the mat; the
 * SIM tray slides out of the side, the display lifts off to the left and the
 * insides come out upwards and are set out on the right.
 *
 * Frame: origin at the centre of the phone's back, +Z towards the bottom
 * edge (the camera), phone 74 × 156 × 8.2 mm.
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

const ORDER = TEARDOWNS.smartphone.parts;
const W = 0.074;
const L = 0.156;
const T = 0.0082;
const LIFT: Vec3 = [0, 0.035, 0];
const REST = 0.0004;

const up = (at: Vec3, rest: Vec3, label: Vec3, clear = 0.01): PartMotion => ({ at, path: route(LIFT, rel(at, rest), clear), label });

const MOTION: Record<string, PartMotion> = {
  // pushed out of the right side with a pin, then set down beside the phone
  sim_tray: { at: [W / 2 - 0.0035, 0.0042, -0.012], path: [[0.03, 0, 0], [0.03, 0.02, 0], [0.085 - (W / 2 - 0.0035), 0.02, -0.074 + 0.012], [0.085 - (W / 2 - 0.0035), REST - 0.0042, -0.074 + 0.012]], label: [0, 0.004, 0] },
  display: up([0, T - 0.0016, 0], [-0.115, REST, 0], [0, 0.006, -0.03], 0.02),
  battery: up([0, 0.0016, 0.02], [0.165, REST, 0.035], [0, 0.008, 0]),
  cameras: up([-0.019, 0.0016, -0.058], [0.085, REST, -0.025], [0.004, 0.01, 0]),
  mainboard: up([0.004, 0.0024, -0.048], [0.165, REST, -0.055], [0, 0.008, 0]),
  speaker: up([0.016, 0.0016, 0.068], [0.085, REST, 0.065], [0, 0.008, 0]),
  vibration: up([-0.018, 0.0016, 0.066], [0.085, REST, 0.025], [0, 0.008, 0]),
};

/** Mid-frame and back glass: what stays on the mat. */
function Frame() {
  return (
    <group>
      <RoundedBox args={[W, 0.0012, L]} radius={0.0005} smoothness={2} position-y={0.0006} castShadow>
        <meshStandardMaterial color="#5b6472" metalness={0.3} roughness={0.15} />
      </RoundedBox>
      {/* inner floor */}
      <mesh position-y={0.00125} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W - 0.004, L - 0.004]} />
        <meshStandardMaterial color="#2a2e36" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* aluminium rails */}
      {[
        [0, L / 2 - 0.0012, W, 0.0024],
        [0, -L / 2 + 0.0012, W, 0.0024],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, T / 2, z]}>
          <boxGeometry args={[w, T - 0.0016, d]} />
          <meshStandardMaterial color="#b9bdc4" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (W / 2 - 0.0012), T / 2, 0]}>
          <boxGeometry args={[0.0024, T - 0.0016, L]} />
          <meshStandardMaterial color="#b9bdc4" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      {/* USB-C port in the bottom rail */}
      <mesh position={[0, T / 2, L / 2 + 0.0001]}>
        <planeGeometry args={[0.009, 0.0032]} />
        <meshStandardMaterial color="#0b0d11" />
      </mesh>
    </group>
  );
}

function SimTray() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.007, 0.0012, 0.03]} />
        <meshStandardMaterial color="#b9bdc4" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[-0.0005, 0.0007, 0.002]}>
        <boxGeometry args={[0.0055, 0.0004, 0.0125]} />
        <meshStandardMaterial color="#d4a017" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Display() {
  const wallpaper = useWallpaper(320, 640);
  return (
    <group rotation-y={Math.PI / 2}>
      {/* the wallpaper is landscape; the panel is portrait */}
      <FlatScreen w={L - 0.001} d={W - 0.001} h={0.0016} texture={wallpaper} bezel={0.002} />
    </group>
  );
}

function Mainboard() {
  return (
    <group>
      <Card size={[0.05, 0.0012, 0.05]} color="#0f3d2a" seed={21} chips={[[0.012, -0.008, 0.012], [-0.01, 0.012, 0.008]]} />
      <Shield size={[0.022, 0.0016, 0.018]} at={[0.008, 0.0014, -0.006]} />
      {/* the SoC under its own shield, marked */}
      <mesh position={[0.008, 0.0023, -0.006]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.012, 0.012]} />
        <meshStandardMaterial color="#1b1d22" metalness={0.4} roughness={0.35} />
      </mesh>
      <Shield size={[0.016, 0.0014, 0.014]} at={[-0.012, 0.0013, 0.013]} />
    </group>
  );
}

function Cameras() {
  return (
    <group>
      <group position={[-0.004, 0, -0.006]}>
        <CameraModule r={0.0052} h={0.0034} />
      </group>
      <group position={[-0.004, 0, 0.012]}>
        <CameraModule r={0.0044} h={0.0032} />
      </group>
      {/* front camera */}
      <group position={[0.019, 0, -0.012]}>
        <CameraModule r={0.002} h={0.0026} />
      </group>
    </group>
  );
}

function Speaker() {
  return (
    <group>
      <RoundedBox args={[0.022, 0.004, 0.011]} radius={0.001} smoothness={2} position-y={0.002} castShadow>
        <meshStandardMaterial color="#1a1d23" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0.0041, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.014, 0.006]} />
        <meshStandardMaterial color="#404652" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Vibration() {
  return (
    <group>
      <RoundedBox args={[0.02, 0.0035, 0.009]} radius={0.001} smoothness={2} position-y={0.00175} castShadow>
        <meshStandardMaterial color="#c3c8cf" metalness={0.9} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0.006, 0.0036, 0]}>
        <boxGeometry args={[0.006, 0.0004, 0.004]} />
        <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

export default function SmartphoneTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.smartphone.parts.${id}.name` as TranslationKey);
  const content = useMemo<Record<string, ReactNode>>(
    () => ({
      sim_tray: <SimTray />,
      display: <Display />,
      battery: <BatteryPack w={0.058} d={0.075} h={0.0045} />,
      cameras: <Cameras />,
      mainboard: <Mainboard />,
      speaker: <Speaker />,
      vibration: <Vibration />,
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
