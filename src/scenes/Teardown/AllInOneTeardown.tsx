/**
 * All-in-one teardown (V2-5b) — [PLACEHOLDER] procedural 24″ all-in-one,
 * laid face down on the mat as a technician would. The stand comes off the
 * back, the back cover lifts away, then the parts behind the screen —
 * speakers, cooling, memory, SSD, the compact board and the power board —
 * are set out in front.
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
import { TeardownPart, type PartMotion } from './TeardownPart';

const ORDER = TEARDOWNS.all_in_one.parts;
const W = 0.54;
const D = 0.33;
const PANEL = 0.012;
const PLATE = PANEL + 0.0015;
const COVER_H = 0.03;
const TOP = PLATE + COVER_H;

const out = (at: Vec3, rest: Vec3, label: Vec3, clear = 0.06): PartMotion => ({ at, path: route([0, 0.06, 0], rel(at, rest), clear), label });

const MOTION: Record<string, PartMotion> = {
  // the stand is laid flat beside the computer
  stand: { at: [0, TOP, -0.03], path: route([0, 0.08, 0], rel([0, TOP, -0.03], [-0.47, 0.006, -0.13]), 0.12), turn: [Math.PI / 2, 0, 0], label: [0, 0.03, 0] },
  back_cover: out([0, PLATE + COVER_H / 2, 0], [0, COVER_H / 2, -0.43], [0, COVER_H / 2 + 0.01, 0.05], 0.1),
  speakers: out([0, PLATE, 0.125], [0, 0.0005, 0.45], [0.17, 0.025, 0]),
  cooling: out([0.06, PLATE, -0.06], [0.24, 0.003, 0.3], [0.07, 0.03, -0.01]),
  ram: out([-0.045, PLATE + 0.0055, 0], [-0.09, 0.002, 0.55], [0, 0.01, 0]),
  ssd: out([0.03, PLATE + 0.0045, 0.025], [0.09, 0.002, 0.55], [0, 0.01, 0]),
  motherboard: out([0, PLATE + 0.001, -0.02], [0, 0.001, 0.3], [0, 0.012, -0.04]),
  power_board: out([-0.18, PLATE + 0.001, -0.01], [-0.25, 0.001, 0.3], [0, 0.035, 0]),
};

/** The screen lying face down, its chin and the steel frame behind the panel. */
function Panel() {
  return (
    <group>
      <RoundedBox args={[W, PANEL, D]} radius={0.004} smoothness={3} position-y={PANEL / 2} castShadow receiveShadow>
        <meshStandardMaterial color="#e5e7eb" metalness={0.35} roughness={0.35} />
      </RoundedBox>
      <mesh position-y={PANEL + 0.0007}>
        <boxGeometry args={[W - 0.03, 0.0014, D - 0.03]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.85} roughness={0.35} />
      </mesh>
      {/* display flex to the board */}
      <Cable points={[[-0.08, PLATE + 0.001, -0.12], [-0.06, PLATE + 0.003, -0.09], [-0.04, PLATE + 0.004, -0.07]]} radius={0.0018} color="#111317" />
    </group>
  );
}

function Stand() {
  return (
    <group>
      <RoundedBox args={[0.13, 0.018, 0.05]} radius={0.004} smoothness={2} position-y={0.009} castShadow>
        <meshStandardMaterial color="#c4c8cf" metalness={0.85} roughness={0.3} />
      </RoundedBox>
      <group position={[0, 0.012, 0.012]} rotation-x={-0.22}>
        <RoundedBox args={[0.1, 0.22, 0.01]} radius={0.004} smoothness={2} position-y={0.11} castShadow>
          <meshStandardMaterial color="#c4c8cf" metalness={0.85} roughness={0.3} />
        </RoundedBox>
      </group>
    </group>
  );
}

function BackCover() {
  return (
    <group>
      <RoundedBox args={[W - 0.04, COVER_H, D - 0.04]} radius={0.01} smoothness={3} castShadow>
        <meshStandardMaterial color="#f1f2f4" metalness={0.1} roughness={0.45} />
      </RoundedBox>
      {/* exhaust vents along the top edge */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-0.13 + i * 0.02, COVER_H / 2 + 0.0002, -0.13]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.01, 0.03]} />
          <meshStandardMaterial color="#1b1d22" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
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

function Cooling() {
  return (
    <group>
      <mesh position={[-0.06, 0.004, 0.03]}>
        <boxGeometry args={[0.04, 0.003, 0.04]} />
        <meshStandardMaterial {...COPPER} />
      </mesh>
      <Cable points={[[-0.06, 0.006, 0.03], [0.0, 0.008, 0.0], [0.05, 0.008, -0.03], [0.07, 0.008, -0.055]]} radius={0.0035} color={COPPER.color} />
      <mesh position={[0.07, 0.009, -0.01]}>
        <cylinderGeometry args={[0.035, 0.035, 0.016, 40]} />
        <meshStandardMaterial color="#20232a" roughness={0.5} />
      </mesh>
      <mesh position={[0.07, 0.0172, -0.01]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.013, 32]} />
        <meshStandardMaterial color="#3a3f4b" />
      </mesh>
      <mesh position={[0.07, 0.009, -0.06]}>
        <boxGeometry args={[0.075, 0.016, 0.022]} />
        <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}

function PowerBoard() {
  return (
    <group>
      <Card size={[0.1, 0.0016, 0.18]} color="#1e3a5f" seed={51} chips={[[0.025, 0.06, 0.012]]} />
      {[
        [-0.025, -0.05, 0.009, 0.022],
        [-0.025, -0.02, 0.007, 0.018],
        [0.02, -0.06, 0.006, 0.014],
      ].map(([x, z, r, h], i) => (
        <mesh key={i} position={[x, h / 2 + 0.0008, z]} castShadow>
          <cylinderGeometry args={[r, r, h, 24]} />
          <meshStandardMaterial color={i === 0 ? '#1d4ed8' : '#111827'} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.02, 0.011, 0.01]} castShadow>
        <boxGeometry args={[0.03, 0.02, 0.028]} />
        <meshStandardMaterial color="#e8c35a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.02, 0.006, 0.05]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.009, 0.004, 10, 24]} />
        <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

export default function AllInOneTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.all_in_one.parts.${id}.name` as TranslationKey);
  const content = useMemo<Record<string, ReactNode>>(
    () => ({
      stand: <Stand />,
      back_cover: <BackCover />,
      speakers: <Speakers />,
      cooling: <Cooling />,
      ram: <Card size={[0.0675, 0.0012, 0.03]} chips={[[-0.022, 0, 0.012], [0, 0, 0.012], [0.022, 0, 0.012]]} seed={57} />,
      ssd: <Card size={[0.08, 0.0012, 0.022]} chips={[[-0.02, 0, 0.016], [0.012, 0, 0.016], [0.03, 0, 0.008]]} color="#111827" seed={59} />,
      motherboard: (
        <group>
          <Card size={[0.17, 0.0016, 0.13]} color="#0f3d2a" seed={61} chips={[[0.0, -0.01, 0.03], [0.05, 0.04, 0.014], [-0.06, -0.045, 0.012]]} />
          {/* SO-DIMM and M.2 sockets stay on the board */}
          <mesh position={[-0.045, 0.0018, 0.0]}>
            <boxGeometry args={[0.07, 0.002, 0.006]} />
            <meshStandardMaterial color="#1b1d22" />
          </mesh>
        </group>
      ),
      power_board: <PowerBoard />,
    }),
    [],
  );
  return (
    <group>
      <Panel />
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={MOTION[id]}>
          {content[id]}
        </TeardownPart>
      ))}
    </group>
  );
}
