/**
 * Laptop teardown (V2-5a; real models 2026-10): a licensed 15.6″ laptop
 * (dev-laptop, scaled to the 14″ layout) with real internal parts — flat
 * battery pack, SO-DIMM, M.2 SSD, blower fan, a populated board — in a real
 * internal layout: the lid comes off its hinges, the bottom cover drops off,
 * then battery, SSD, memory, Wi-Fi card, display cable, speakers, cooling
 * and the board leave from underneath and are set out on the mat in front.
 * The laptop hovers above the mat like an exploded-view drawing.
 *
 * Laptop frame: origin at the centre of the base underside, +Z the front
 * edge, base 320 × 220 × 18 mm.
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { route, type Vec3 } from '@/lib/teardown/timeline';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { Cable } from '@/scenes/LabSpace/zones/common';
import { useMonitorWallpaper } from '@/scenes/DeskScene/models/useMonitorWallpaper';
import { Card } from './pieces';
import { fitScale, useModelParts, type ModelPart } from './modelParts';
import { PartModel } from './PartModel';
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

const MOTION: Record<string, PartMotion> = {
  // hinge axis at the back edge; closed = lying on the keyboard
  lid: { at: [0, BASE, -D / 2 + 0.002], rot: [Math.PI / 2, 0, 0], path: [], turn: [-(Math.PI / 2 + 0.3), 0, 0], label: [0, 0.17, 0.01] },
  bottom_cover: { at: [0, 0.001, 0], path: [DROP, [0.43, DROP[1], 0.03], [0.43, MAT + 0.001, 0.03]], label: [0, 0.006, 0] },
  battery: fromBelow([0, 0.0055, 0.045], [-0.13, MAT + 0.0035, 0.22], [0, 0.01, 0]),
  ssd: fromBelow([0.075, 0.0095, -0.035], [-0.25, MAT + 0.0013, 0.36], [0, 0.008, 0]),
  ram: fromBelow([-0.07, 0.0095, -0.035], [-0.15, MAT + 0.0018, 0.36], [0, 0.008, 0]),
  wifi: fromBelow([0.125, 0.0095, -0.03], [-0.055, MAT + 0.0013, 0.36], [0, 0.008, 0]),
  display_cable: fromBelow([-0.06, 0.0105, -0.088], [0.04, MAT + 0.001, 0.36], [0, 0.01, 0]),
  speakers: fromBelow([0, 0.006, 0.085], [0, MAT + 0.004, 0.47], [0.13, 0.012, 0]),
  cooling: fromBelow([0.07, 0.0095, -0.04], [0.23, MAT + 0.004, 0.36], [-0.04, 0.012, 0]),
  motherboard: fromBelow([-0.02, 0.006, -0.04], [0.12, MAT + 0.001, 0.22], [0, 0.012, 0]),
};

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

/** Heat pipe from the processor plate to the blower fan (model) and its fin stack. */
function Cooling({ fan }: { fan: ModelPart }) {
  const scale = fitScale(fan.size, [0, 0, 0], [0.06, 0.07]);
  return (
    <group>
      <mesh position={[-0.12, 0, 0]}>
        <boxGeometry args={[0.032, 0.002, 0.032]} />
        <meshStandardMaterial {...COPPER} />
      </mesh>
      <Cable points={[[-0.12, 0.0015, 0], [-0.06, 0.0015, -0.02], [0.0, 0.0015, -0.04], [0.04, 0.0015, -0.045]]} radius={0.0028} color={COPPER.color} />
      <mesh position={[0.045, 0.001, -0.052]}>
        <boxGeometry args={[0.05, 0.007, 0.012]} />
        <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.35} />
      </mesh>
      <PartModel part={fan} scale={scale} at={[0.045, 0.001, -0.012]} />
    </group>
  );
}

function Mainboard({ board }: { board: ModelPart }) {
  return (
    <group>
      <PartModel part={board} scale={fitScale(board.size, [0, 0, 0], [0.24, 0.12])} />
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

/** The model's lid, stood upright (it is modelled open, leaning back) and scaled with the base. */
function Lid({ lid, scale }: { lid: ModelPart; scale: number }) {
  const lean = Math.atan2(lid.size[2], lid.size[1]);
  const height = Math.hypot(lid.size[1], lid.size[2]) * scale;
  return <PartModel part={lid} scale={scale} rot={[lean, 0, 0]} at={[0, height / 2, -0.003]} />;
}

export default function LaptopTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.laptop.parts.${id}.name` as TranslationKey);
  const laptop = useModelParts('dev-laptop');
  const battery = useModelParts('td-laptop-battery').body;
  const sodimm = useModelParts('td-sodimm').body;
  const fan = useModelParts('td-laptop-fan').body;
  const board = useModelParts('td-board').body;
  const ssd = useModelParts('ssd-samsung-990-pro-2tb').body;
  const wallpaper = useMonitorWallpaper(1536, 864);
  useEffect(() => wallpaper(laptop.lid.object), [laptop, wallpaper]);
  // the 15.6-inch model scaled to this 14-inch layout
  const scale = W / laptop.base.size[0];
  const content = useMemo<Record<string, ReactNode>>(
    () => ({
      lid: <Lid lid={laptop.lid} scale={scale} />,
      bottom_cover: <BottomCover />,
      battery: <PartModel part={battery} scale={fitScale(battery.size, [0, 0, 0], [0.24, 0.1])} />,
      ssd: <PartModel part={ssd} rot={[0, Math.PI / 2, 0]} scale={fitScale(ssd.size, [0, Math.PI / 2, 0], [0.08, 0.022])} />,
      ram: <PartModel part={sodimm} rot={[0, Math.PI / 2, 0]} scale={fitScale(sodimm.size, [0, Math.PI / 2, 0], [0.0675, 0.03])} />,
      wifi: <WifiCard />,
      display_cable: <DisplayCable />,
      speakers: <Speakers />,
      cooling: <Cooling fan={fan} />,
      motherboard: <Mainboard board={board} />,
    }),
    [laptop, battery, sodimm, fan, board, ssd, scale],
  );
  return (
    <group position-y={LAPTOP_HOVER}>
      {/* once the bottom cover is off, the top case turns to glass: the parts are seen in their places */}
      <XRay after={ORDER.indexOf('bottom_cover')}>
        <PartModel part={laptop.base} scale={scale} at={[0, (laptop.base.size[1] * scale) / 2, 0]} />
      </XRay>
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={MOTION[id]}>
          {content[id]}
        </TeardownPart>
      ))}
    </group>
  );
}
