import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { ModelLoader } from '@/components/3d/ModelLoader';
import type { ModelFit } from '@/lib/three/fit';
import type { HardwareItem } from '@/data/hardware/types';
import { isTieredModel } from '@/lib/three/modelUrls';
import type { PartId } from './parts';
import { fanFit, rotorFit } from './fits';
import { isSata, ON_BOARD, type FanMount, type Installed, type Vec3 } from './mounts';
import { pcRig } from './pcRig';
import { LiquidCooler } from './LiquidCooler';

const url = (name: string) => `${import.meta.env.BASE_URL}assets/models/hardware/${name}.glb`;
const productUrl = (product: HardwareItem) => `${import.meta.env.BASE_URL}assets/models/${product.modelPath}`;

/**
 * Installed pose of the part models: a quarter turn about Z lays a board,
 * card or stick against the tray (component side −X, top edge +Y, I/O /
 * bracket at −Z); PSUs and SATA drives keep their own pose. No pin, no offset:
 * ModelLoader centres the model, and the mounting system (mounts.ts) puts the
 * centre where its anchors say.
 */
const BOARD_POSE: ModelFit = { axis: 1, rotation: ON_BOARD };
const OWN_POSE: ModelFit = { axis: 0 };

/** The fan models face +Z (air leaves towards −Z); a mount's `n` is the airflow. */
const FAN_AIR = new Vector3(0, 0, -1);
function fanQuaternion(n: Vec3) {
  return new Quaternion().setFromUnitVectors(FAN_AIR, new Vector3(...n).normalize());
}

/**
 * 120/140 mm fans at their mounts. Deliberately not instanced (measured in
 * Phase 9 on Intel UHD / D3D11): instanced copies need their own shader
 * variants and spinning rotors would rewrite the instance buffer every frame,
 * which stalled the GPU — all to save a few draw calls.
 * `origin`: the case-local point the parent group sits at.
 */
export function HardwareFans({ fans, origin = [0, 0, 0], fallback = null }: { fans: readonly FanMount[]; origin?: Vec3; fallback?: ReactNode }) {
  const poses = useMemo(
    () => fans.map((f) => ({ key: `${f.group}:${f.p.join(',')}`, position: [f.p[0] - origin[0], f.p[1] - origin[1], f.p[2] - origin[2]] as const, quaternion: fanQuaternion(f.n), scale: f.size / 0.12 })),
    [fans, origin],
  );
  return (
    <>
      {poses.map((p, i) => (
        <group key={p.key} position={[...p.position]} quaternion={p.quaternion} scale={p.scale}>
          <ModelLoader url={url('fan_frame')} fit={fanFit} fallback={i === 0 ? fallback : null} />
          <Rotor />
        </group>
      ))}
    </>
  );
}

function Rotor() {
  const rotor = useRef<Group>(null);
  const reduced = useReducedMotion();
  useFrame((_, delta) => {
    if (rotor.current && !reduced) rotor.current.rotation.z -= Math.min(delta, 0.05) * 8 * pcRig.fanSpeed;
  });
  return (
    <group ref={rotor} position-z={0.0018}>
      <ModelLoader url={url('fan_rotor')} fit={rotorFit} castShadow={false} fallback={null} />
    </group>
  );
}

/** The sticks of a kit in their DIMM slots (one cached file, see HardwareFans on instancing). */
function RamSticks({ sticks, product }: { sticks: readonly Vec3[]; product: HardwareItem }) {
  return (
    <>
      {sticks.map((p, i) => (
        <ModelLoader key={i} url={productUrl(product)} fit={BOARD_POSE} position={[...p]} fallback={null} />
      ))}
    </>
  );
}

const BUILD_KEY: Record<Exclude<PartId, 'fans'>, 'motherboard' | 'cpu' | 'cooler' | 'ram' | 'gpu' | 'ssd' | 'psu'> = {
  motherboard: 'motherboard',
  cpu: 'cpu',
  cooler: 'cooler',
  ram: 'ram',
  gpu: 'gpu',
  ssd: 'ssd',
  psu: 'psu',
};

/**
 * One installed component, drawn centred on its group (PCPart puts the group
 * where the mounting system installed it). `at`: that position, case-local.
 */
export function HardwarePart({ id, inst, at, product, rgbColor, deferDetail = false }: { id: PartId; inst: Installed; at: Vec3; product?: HardwareItem; rgbColor?: string | null; deferDetail?: boolean }) {
  if (id === 'fans') return <HardwareFans fans={inst.fans.filter((f) => f.group !== 'rear')} origin={at} />;
  const placed = inst[BUILD_KEY[id]];
  if (!placed || !product) return null;
  if (id === 'cooler' && inst.cooler?.liquid) return <LiquidCooler pump={inst.cooler} rgbColor={rgbColor} />;
  if (!isTieredModel(product.modelPath)) return null;
  if (id === 'ram' && inst.ram) return <RamSticks sticks={inst.ram.sticks} product={product} />;
  const pose = id === 'psu' || (id === 'ssd' && isSata(product)) ? OWN_POSE : BOARD_POSE;
  return <ModelLoader key={product.id} url={productUrl(product)} fit={pose} fallback={null} deferDetail={deferDetail} />;
}
