/**
 * All-in-one teardown (V2-5b; real models 2026-10): a licensed 24″
 * all-in-one (dev-all-in-one: screen body, back cover, stand) laid face down
 * on the mat as a technician would, with real internal parts — blower fan,
 * SO-DIMM, M.2 SSD, a populated board and a power board built from real
 * components. The stand comes off the back, the back cover lifts away, then
 * the parts behind the screen are set out in front.
 *
 * Frame: origin at the centre of the screen glass (lying face down), +Y the
 * back of the computer, +Z the bottom edge (its chin, towards the camera).
 */
import { useMemo, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { rel, route, type Vec3 } from '@/lib/teardown/timeline';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { Cable } from '@/scenes/LabSpace/zones/common';
import { Card } from './pieces';
import { fitScale, groundOffset, placePoint, rotatedSize, useModelParts, type ModelPart } from './modelParts';
import { PartModel } from './PartModel';
import { TeardownPart, type PartMotion } from './TeardownPart';

const ORDER = TEARDOWNS.all_in_one.parts;
/** Footprint width of the computer lying face down. */
const W = 0.54;
/** The upright model laid face down: screen down, its chin towards +Z. */
const LAY: Vec3 = [Math.PI / 2, Math.PI, 0];

const out = (at: Vec3, rest: Vec3, label: Vec3, clear = 0.06): PartMotion => ({ at, path: route([0, 0.06, 0], rel(at, rest), clear), label });

/** Turns that lay a part flat; the one leaving it lowest is used for the stand. */
const FLAT: readonly Vec3[] = [
  [Math.PI / 2, 0, 0],
  [-Math.PI / 2, 0, 0],
  [0, 0, Math.PI / 2],
];

function motions(model: Record<string, ModelPart>, scale: number, offset: Vec3, plate: number): Record<string, PartMotion> {
  const at = (id: string) => placePoint(model[id].at, LAY, scale, offset, 'YXZ');
  const stand = rotatedSize(model.stand.size, LAY, 'YXZ');
  const turn = FLAT.reduce((best, t) => (rotatedSize(stand, t)[1] < rotatedSize(stand, best)[1] ? t : best));
  const standAt = at('stand');
  const coverAt = at('back_cover');
  const cover = rotatedSize(model.back_cover.size, LAY, 'YXZ');
  return {
    // the stand is laid flat beside the computer
    stand: { at: standAt, path: route([0, 0.08, 0], rel(standAt, [-0.47, (rotatedSize(stand, turn)[1] * scale) / 2, -0.13]), 0.12), turn, label: [0, 0.03, 0] },
    back_cover: out(coverAt, [0, (cover[1] * scale) / 2, -0.43], [0, (cover[1] * scale) / 2 + 0.01, 0.05], 0.1),
    speakers: out([0, plate, 0.125], [0, 0.0005, 0.45], [0.17, 0.025, 0]),
    cooling: out([0.06, plate, -0.06], [0.24, 0.003, 0.3], [0.07, 0.03, -0.01]),
    ram: out([-0.045, plate + 0.0055, 0], [-0.09, 0.002, 0.55], [0, 0.01, 0]),
    ssd: out([0.03, plate + 0.0045, 0.025], [0.09, 0.002, 0.55], [0, 0.01, 0]),
    motherboard: out([0, plate + 0.001, -0.02], [0, 0.001, 0.3], [0, 0.012, -0.04]),
    power_board: out([-0.18, plate + 0.001, -0.01], [-0.25, 0.001, 0.3], [0, 0.035, 0]),
  };
}

function Speakers() {
  return (
    <group>
      {[-0.17, 0.17].map((x) => (
        <group key={x} position-x={x}>
          <RoundedBox args={[0.07, 0.016, 0.025]} radius={0.003} smoothness={2} position-y={0.008} castShadow>
            <meshStandardMaterial color="#1a1d23" roughness={0.55} />
          </RoundedBox>
          <mesh position-y={0.0162} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.009, 24]} />
            <meshStandardMaterial color="#3a3f4b" roughness={0.7} />
          </mesh>
        </group>
      ))}
      <Cable points={[[-0.135, 0.004, -0.01], [0, 0.005, -0.03], [0.135, 0.004, -0.01]]} radius={0.0012} color="#c0392b" />
    </group>
  );
}

const COPPER = { color: '#c27a4a', metalness: 0.9, roughness: 0.3 } as const;

/** Heat pipe from the processor plate to the blower fan (model) and its fin stack. */
function Cooling({ fan }: { fan: ModelPart }) {
  const scale = fitScale(fan.size, [0, 0, 0], [0.07, 0.08], 0.016);
  return (
    <group>
      <mesh position={[-0.06, 0.004, 0.03]}>
        <boxGeometry args={[0.04, 0.003, 0.04]} />
        <meshStandardMaterial {...COPPER} />
      </mesh>
      <Cable points={[[-0.06, 0.006, 0.03], [0.0, 0.008, 0.0], [0.05, 0.008, -0.03], [0.07, 0.008, -0.055]]} radius={0.0035} color={COPPER.color} />
      <PartModel part={fan} scale={scale} at={[0.07, (fan.size[1] * scale) / 2 + 0.001, -0.01]} />
      <mesh position={[0.07, 0.009, -0.065]}>
        <boxGeometry args={[0.075, 0.016, 0.022]} />
        <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** The power supply board: a PCB carrying real components (inductor, capacitors, regulators). */
function PowerBoard({ parts }: { parts: Record<string, ModelPart> }) {
  const place = (id: string, x: number, z: number, k: number, copy = false) => (
    <PartModel key={`${id}${x}${z}`} part={parts[id]} scale={k} at={[x, (parts[id].size[1] * k) / 2 + 0.0008, z]} copy={copy} />
  );
  return (
    <group>
      <Card size={[0.1, 0.0016, 0.18]} color="#1e3a5f" seed={51} chips={[[0.025, 0.06, 0.012]]} />
      {place('cap_cyl', -0.025, -0.05, 2.4)}
      {place('cap_cyl', -0.025, -0.02, 2, true)}
      {place('cap_film', 0.02, -0.06, 2.2)}
      {place('inductor', 0.02, 0.0, 2.6)}
      {place('to220', -0.02, 0.05, 1.8)}
      {place('to92', 0.03, 0.05, 2)}
      {place('cap_ceramic', -0.03, 0.075, 2)}
      {place('resistor', 0.02, 0.075, 1.6)}
    </group>
  );
}

export default function AllInOneTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.all_in_one.parts.${id}.name` as TranslationKey);
  const model = useModelParts('dev-all-in-one');
  const fan = useModelParts('td-laptop-fan').body;
  const sodimm = useModelParts('td-sodimm').body;
  const board = useModelParts('td-board').body;
  const ssd = useModelParts('ssd-samsung-990-pro-2tb').body;
  const components = useModelParts('td-components');
  const scale = W / Math.max(model.body.size[0], model.back_cover.size[0]);
  const offset = useMemo(() => groundOffset([model.body], LAY, scale, 'YXZ'), [model, scale]);
  // the internals sit on the back of the panel
  const plate = rotatedSize(model.body.size, LAY, 'YXZ')[1] * scale * 0.5;
  const motion = useMemo(() => motions(model, scale, offset, plate), [model, scale, offset, plate]);
  const content = useMemo<Record<string, ReactNode>>(
    () => ({
      stand: <PartModel part={model.stand} rot={LAY} order="YXZ" scale={scale} />,
      back_cover: <PartModel part={model.back_cover} rot={LAY} order="YXZ" scale={scale} />,
      speakers: <Speakers />,
      cooling: <Cooling fan={fan} />,
      ram: <PartModel part={sodimm} rot={[0, Math.PI / 2, 0]} scale={fitScale(sodimm.size, [0, Math.PI / 2, 0], [0.0675, 0.03])} />,
      ssd: <PartModel part={ssd} rot={[0, Math.PI / 2, 0]} scale={fitScale(ssd.size, [0, Math.PI / 2, 0], [0.08, 0.022])} />,
      motherboard: (
        <group>
          <PartModel part={board} scale={fitScale(board.size, [0, 0, 0], [0.17, 0.13])} />
          {/* SO-DIMM and M.2 sockets stay on the board */}
          <mesh position={[-0.045, 0.0018, 0.0]}>
            <boxGeometry args={[0.07, 0.002, 0.006]} />
            <meshStandardMaterial color="#1b1d22" />
          </mesh>
        </group>
      ),
      power_board: <PowerBoard parts={components} />,
    }),
    [model, fan, sodimm, board, ssd, components, scale],
  );
  return (
    <group>
      <PartModel part={model.body} rot={LAY} order="YXZ" scale={scale} at={placePoint(model.body.at, LAY, scale, offset, 'YXZ')} />
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={motion[id]}>
          {content[id]}
        </TeardownPart>
      ))}
    </group>
  );
}
