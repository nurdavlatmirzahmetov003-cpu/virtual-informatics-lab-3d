import { useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group, type Object3D } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { ModelLoader } from '@/components/3d/ModelLoader';
import type { ModelFit } from '@/lib/three/fit';
import type { HardwareItem } from '@/data/hardware/types';
import { isTieredModel } from '@/lib/three/modelUrls';
import type { PartId } from './parts';
import { fanFit, rotorFit } from './fits';
import { isIntakeFan, isSata, ON_BOARD, type FanMount, type Installed, type Vec3 } from './mounts';
import { pcRig } from './pcRig';
import { LiquidCooler } from './LiquidCooler';
import { DESIGN_BY_ID } from './caseDesigns';
import { FanArray } from './ShowcaseCase';
import { applyShowcaseMaterials, fanModelOf, RgbFxContext } from './showcaseFx';

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
/** Stable fit objects for turned parts (ModelLoader re-fits whenever `fit` changes). */
const TURNED = new Map<string, ModelFit>();
function turnedPose(r?: Vec3): ModelFit {
  if (!r) return OWN_POSE;
  const key = r.join(',');
  if (!TURNED.has(key)) TURNED.set(key, { axis: 0, rotation: r });
  return TURNED.get(key)!;
}

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
  if (OWN.test(product.modelPath)) return <>{sticks.map((p, i) => <OwnModel key={i} product={product} fit={BOARD_POSE} position={p} />)}</>;
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
  if (id === 'fans') {
    const design = DESIGN_BY_ID[inst.mounts.id];
    if (design) return <FanArray fans={inst.fans.filter(isIntakeFan)} origin={at} model={fanModelOf(design)} />;
    return <HardwareFans fans={inst.fans.filter((f) => f.group !== 'rear')} origin={at} />;
  }
  const placed = inst[BUILD_KEY[id]];
  if (!placed || !product) return null;
  if (id === 'cooler' && inst.cooler?.liquid) return <LiquidCooler pump={inst.cooler} rgbColor={rgbColor} product={product} />;
  if (!isTieredModel(product.modelPath)) return null;
  if (id === 'ram' && inst.ram) return <RamSticks sticks={inst.ram.sticks} product={product} />;
  const pose = id === 'psu' ? turnedPose(placed.r) : id === 'ssd' && isSata(product) ? OWN_POSE : BOARD_POSE;
  if (id === 'cpu') {
    return (
      <>
        <ModelLoader key={product.id} url={productUrl(product)} fit={pose} fallback={null} deferDetail={deferDetail} />
        <PasteDot cpu={placed} />
      </>
    );
  }
  if (OWN.test(product.modelPath)) return <OwnModel product={product} fit={pose} deferDetail={deferDetail} />;
  return <ModelLoader key={product.id} url={productUrl(product)} fit={pose} fallback={null} deferDetail={deferDetail} />;
}

/** A latch that is open while its part is on the way and snaps shut as it lands (`e`: 1 away … 0 seated). */
const latchOpen = (id: PartId) => {
  const e = pcRig.parts?.[id];
  if (e === undefined || pcRig.hidden.has(id)) return 0;
  return e > 0.02 ? 1 : e / 0.02;
};
/** Hinged details of the AERO board (node origin on the hinge; axes in the node's frame, i.e. glTF board axes). */
const HINGES: Record<string, { axis: Vector3; angle: () => number }> = {
  socket_lever: { axis: new Vector3(0, 0, -1), angle: () => pcRig.socketLever * 1.75 },
  dimm_latch_top: { axis: new Vector3(0, 0, -1), angle: () => latchOpen('ram') * 0.45 },
  dimm_latch_bottom: { axis: new Vector3(0, 0, -1), angle: () => -latchOpen('ram') * 0.45 },
  pcie_latch: { axis: new Vector3(1, 0, 0), angle: () => latchOpen('gpu') * 0.5 },
};

/** Thermal paste: a grey dot on the CPU's lid during assembly (hidden under the cooler afterwards, and in the exploded view). */
function PasteDot({ cpu }: { cpu: { size: Vec3 } }) {
  const dot = useRef<Group>(null);
  useFrame(() => {
    const d = dot.current;
    if (!d) return;
    const p = pcRig.paste;
    d.visible = p > 0.01 && pcRig.explode < 0.01;
    d.scale.set(1, Math.max(0.05, p), Math.max(0.05, p));
  });
  return (
    <group ref={dot} position-x={-cpu.size[0] / 2 - 0.0004} visible={false}>
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.009, 0.0105, 0.0012, 32]} />
        <meshStandardMaterial color="#9aa0a8" roughness={0.35} metalness={0.4} />
      </mesh>
    </group>
  );
}

/** BitLab's own models (make-showcase.py): their `RGB` materials animate, `rotor_*` nodes spin, hinged details open and close. */
const OWN = /\/(mb|gpu|ram|cool)-bitlab-/;
export function OwnModel({ product, fit, deferDetail = false, position }: { product: HardwareItem; fit?: ModelFit; deferDetail?: boolean; position?: Vec3 }) {
  const rotors = useRef<Object3D[]>([]);
  const hinges = useRef<Array<{ node: Object3D; rest: Quaternion; axis: Vector3; angle: () => number }>>([]);
  const reduced = useReducedMotion();
  const fx = useContext(RgbFxContext);
  const onLoaded = useCallback(
    (root: Object3D) => {
      rotors.current = applyShowcaseMaterials(root, fx, (m) => m);
      const list: typeof hinges.current = [];
      root.traverse((o) => {
        const h = HINGES[o.name];
        if (h) list.push({ node: o, rest: o.quaternion.clone(), axis: h.axis, angle: h.angle });
      });
      hinges.current = list;
    },
    [fx],
  );
  const q = useMemo(() => new Quaternion(), []);
  useFrame((_, delta) => {
    for (const h of hinges.current) h.node.quaternion.copy(h.rest).multiply(q.setFromAxisAngle(h.axis, h.angle()));
    if (reduced) return;
    for (const r of rotors.current) r.rotation.x -= Math.min(delta, 0.05) * 11 * pcRig.fanSpeed;
  });
  return <ModelLoader key={product.id} url={productUrl(product)} fit={fit} fallback={null} deferDetail={deferDetail} onLoaded={onLoaded} position={position ? [...position] : undefined} />;
}
