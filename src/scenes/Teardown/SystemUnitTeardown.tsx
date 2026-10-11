/**
 * System unit teardown (V2-5a): the showcase build (catalog case and
 * components, V2-2b models) taken apart in a technician's order — glass
 * panel off, graphics card, memory, cooler, processor, SSD, the PSU out of
 * the back, the front fans, and the motherboard last. Parts land on the
 * bench in front of the open side, laid flat, component side up.
 *
 * Case-local frame (scenes/DeskScene/pc/constants): −X is the glass side,
 * +Z the front. The whole case is turned so the glass side faces the camera.
 */
import { useContext, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MeshStandardMaterial } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { extrudeFront, fanBladesGeometry, fanFrameShape } from '@/lib/three/geometry';
import { route, type Vec3 } from '@/lib/teardown/timeline';
import { showcaseBuild } from '@/lib/studio/showcase';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { Chassis } from '@/scenes/DeskScene/pc/Chassis';
import { BOARD_FACE, CPU, D, FAN, FRONT_FANS, GPU, H, MB, PSU, RAM, SSD, W } from '@/scenes/DeskScene/pc/constants';
import { HardwarePart } from '@/scenes/DeskScene/pc/HardwareParts';
import type { PartId } from '@/scenes/DeskScene/pc/parts';
import { pcRig } from '@/scenes/DeskScene/pc/pcRig';
import { usePcTextures } from '@/scenes/DeskScene/pc/usePcTextures';
import { RigContext } from './rig';
import { TeardownPart, type PartMotion } from './TeardownPart';

const ORDER = TEARDOWNS.system_unit.parts;
/** Bench top in case-local Y (the case stands on its feet). */
const FLOOR = -H / 2 - 0.014;
const REST = FLOOR + 0.002;
/** Lay a board-mounted part flat: its component side (−X) turns up. */
const FLAT: Vec3 = [0, 0, -Math.PI / 2];
const OUT = -0.07; // pull straight out of the slot through the open side

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

function boardPart(at: Vec3, rest: Vec3, label: Vec3, clear = 0.1): PartMotion {
  return { at, path: route([OUT, 0, 0], sub(rest, at), clear), turn: FLAT, label };
}

/** Installed poses (from the PC layout) and resting places on the bench. */
const MOTION: Record<string, PartMotion> = {
  // the glass slides off sideways and stands to the left of the case
  panel: { at: [-W / 2 - 0.004, 0, 0], path: [[-0.07, 0, 0], [-0.07, 0, -0.74]], label: [-0.01, H / 2 - 0.05, 0] },
  gpu: boardPart([BOARD_FACE, GPU.y, GPU.z0], [-0.42, REST, -0.6], [-0.03, 0, 0.12]),
  ram: boardPart([BOARD_FACE, RAM.y, RAM.z], [-0.7, REST, 0.11], [-0.035, 0, 0.02]),
  cooler: { at: [BOARD_FACE, CPU.y, CPU.z], path: route([-0.04, 0, 0], sub([-0.6, REST - 0.0105, 0.27], [BOARD_FACE, CPU.y, CPU.z]), 0.12), turn: FLAT, label: [-0.17, 0, 0] },
  cpu: boardPart([BOARD_FACE, CPU.y, CPU.z], [-0.7, REST, -0.26], [-0.02, 0, 0]),
  ssd: boardPart([BOARD_FACE, SSD.y, SSD.z], [-0.7, REST, -0.08], [-0.01, 0, 0]),
  // the PSU slides out of the back of its shroud and is set down behind the case
  psu: { at: [PSU.x, PSU.y, PSU.z], path: [[0, 0, -0.33], [0, -0.018, -0.33]], label: [0, PSU.h / 2 + 0.03, 0] },
  // the fan column comes out of the front and stands beside it
  fans: { at: [FRONT_FANS.x, 0, FRONT_FANS.z], path: [[0, 0, 0.26], [0, FLOOR + 0.18, 0.26]], label: [0, 0.22, 0.03] },
  motherboard: boardPart([MB.x, MB.y, MB.z], [-0.42, REST, -0.05], [-0.05, MB.h / 2 - 0.03, 0], 0.16),
};

/** Glass side panel (the chassis' own glass stays hidden while it is out). */
function GlassPanel() {
  return (
    <RoundedBox args={[0.005, H - 0.006, D - 0.006]} radius={0.002} smoothness={2}>
      <meshPhysicalMaterial color="#1b2330" metalness={0.2} roughness={0.06} transparent opacity={0.35} envMapIntensity={1.2} />
    </RoundedBox>
  );
}

/** Keeps the shared PC rig (glass, cables, lights) in step with the teardown. */
function RigSync() {
  const rig = useContext(RigContext)!;
  useFrame(() => {
    pcRig.parts = null;
    pcRig.hidden.clear();
    pcRig.glassOpen = 1; // the chassis glass is replaced by <GlassPanel>
    // cables would float once parts move: tuck them away from the 2nd step on
    pcRig.explode = rig.shown * rig.count > 1.01 ? 1 : 0;
    pcRig.cables = 1;
    pcRig.interior = pcRig.glow = 1;
    pcRig.fanSpeed = rig.shown > 0 ? 0 : 1;
    pcRig.rgbPower = 1;
  });
  return null;
}

const PRODUCT_OF: Record<Exclude<PartId, 'fans'>, 'motherboard' | 'cpu' | 'cooling' | 'ram' | 'gpu' | 'ssd' | 'psu'> = {
  motherboard: 'motherboard', cpu: 'cpu', cooler: 'cooling', ram: 'ram', gpu: 'gpu', ssd: 'ssd', psu: 'psu',
};

export default function SystemUnitTeardown() {
  const t = useT();
  const build = useMemo(() => showcaseBuild(), []);
  const tex = usePcTextures();
  const res = useDisposable(() => {
    const rgb = new MeshStandardMaterial({ color: '#000000', emissive: '#4fdcff', emissiveIntensity: 1.4, roughness: 0.4 });
    return { fanFrame: extrudeFront(fanFrameShape(FAN, FAN * 0.47), 0.025, { bevel: 0.0015 }), fanBlades: fanBladesGeometry(FAN * 0.45), rgb };
  }, []);
  const name = (id: string) => t(`teardown.system_unit.parts.${id}.name` as TranslationKey);

  return (
    // glass side towards the camera, front of the case to the right
    <group rotation-y={Math.PI / 2} position-y={-FLOOR}>
      <RigSync />
      <Chassis tex={tex} fan={{ frame: res.fanFrame, blades: res.fanBlades }} rgb={res.rgb} product={build.case} />
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={MOTION[id]}>
          {id === 'panel' ? (
            <GlassPanel />
          ) : (
            <HardwarePart id={id as PartId} fallback={null} product={id === 'fans' ? build.case : build[PRODUCT_OF[id as Exclude<PartId, 'fans'>]]} />
          )}
        </TeardownPart>
      ))}
    </group>
  );
}
