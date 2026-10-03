import { Vector3 } from 'three';
import { CAMERA_STATES } from '@/data/camera/cameraStates';
import { BOARD_FACE, CASE_ORIGIN, CPU, FRONT_FANS, GPU, MB, PSU, RAM, SSD } from './constants';

export type PartId = 'motherboard' | 'cpu' | 'cooler' | 'ram' | 'gpu' | 'ssd' | 'psu' | 'fans';

export interface PartDef {
  id: PartId;
  /** Case-local origin of the part when installed. */
  anchor: readonly [number, number, number];
  /** Case-local offset in the exploded layout (added to the anchor). */
  explode: readonly [number, number, number];
  /** Part-local visual centre (hotspot, camera focus). */
  center: readonly [number, number, number];
  /** Comfortable camera distance when this part is focused. */
  focusDistance: number;
  /** Spec keys under pc.parts.<id>.specs. */
  specs: readonly string[];
  /** Magnification in the exploded layout so tiny parts stay readable (1 = true size). */
  magnify?: number;
}

/**
 * Exploded layout in the EXPLODED camera's screen space: each part's visual
 * centre goes to a slot given in normalised screen coordinates (x, y ∈ −1…1)
 * at a fixed depth in front of the camera. Parts therefore land in a clean
 * grid between the info panel (left) and the case (right) on any layout
 * change. The motherboard stays in the case as the reference.
 */
const SHOT = CAMERA_STATES.EXPLODED;
const SLOT_DEPTH = 1.05;
const REF_ASPECT = 16 / 9;
const camPos = new Vector3(...SHOT.position);
const forward = new Vector3(...SHOT.target).sub(camPos).normalize();
const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
const up = new Vector3().crossVectors(right, forward).normalize();
const halfH = SLOT_DEPTH * Math.tan(((SHOT.fov / 2) * Math.PI) / 180);
const halfW = halfH * REF_ASPECT;

function slotWorld(x: number, y: number) {
  return camPos.clone().addScaledVector(forward, SLOT_DEPTH).addScaledVector(right, x * halfW).addScaledVector(up, y * halfH);
}

type PartSpec = Omit<PartDef, 'explode'> & { slot?: readonly [number, number]; nudge?: readonly [number, number, number] };

function layout(p: PartSpec): PartDef {
  let explode: [number, number, number];
  if (p.slot) {
    const world = slotWorld(p.slot[0], p.slot[1]);
    explode = [
      world.x - CASE_ORIGIN[0] - p.anchor[0] - p.center[0],
      world.y - CASE_ORIGIN[1] - p.anchor[1] - p.center[1],
      world.z - CASE_ORIGIN[2] - p.anchor[2] - p.center[2],
    ];
  } else {
    explode = [...(p.nudge ?? [0, 0, 0])] as [number, number, number];
  }
  return { id: p.id, anchor: p.anchor, center: p.center, focusDistance: p.focusDistance, specs: p.specs, magnify: p.magnify, explode };
}

/** Order = the order the scroll story walks through them. */
export const PARTS: readonly PartDef[] = [
  layout({ id: 'motherboard', anchor: [MB.x, MB.y, MB.z], nudge: [-0.03, 0.02, 0], center: [-0.01, 0, 0], focusDistance: 0.5, specs: ['formFactor', 'socket', 'slots'] }),
  layout({ id: 'cpu', anchor: [BOARD_FACE, CPU.y, CPU.z], slot: [0.08, 0.46], center: [-0.003, 0, 0], magnify: 2, focusDistance: 0.24, specs: ['cores', 'clock', 'tdp'] }),
  layout({ id: 'cooler', anchor: [BOARD_FACE, CPU.y, CPU.z], slot: [-0.1, 0.28], center: [-0.08, 0, 0.01], focusDistance: 0.42, specs: ['type', 'pipes', 'fan'] }),
  layout({ id: 'ram', anchor: [BOARD_FACE, RAM.y, RAM.z], slot: [0.25, 0.34], center: [-0.02, 0, RAM.pitch * 1.5], focusDistance: 0.3, specs: ['capacity', 'type', 'speed'] }),
  layout({ id: 'gpu', anchor: [BOARD_FACE, GPU.y, GPU.z0], slot: [0.0, -0.1], center: [-GPU.height / 2, 0, GPU.len / 2], focusDistance: 0.55, specs: ['vram', 'bus', 'power'] }),
  layout({ id: 'ssd', anchor: [BOARD_FACE, SSD.y, SSD.z], slot: [0.24, 0.02], center: [-0.002, 0, 0], magnify: 1.7, focusDistance: 0.24, specs: ['form', 'interface', 'speed'] }),
  layout({ id: 'psu', anchor: [PSU.x, PSU.y, PSU.z], slot: [-0.06, -0.52], center: [0, 0, 0], focusDistance: 0.45, specs: ['power', 'efficiency', 'cables'] }),
  layout({ id: 'fans', anchor: [FRONT_FANS.x, 0, FRONT_FANS.z], nudge: [-0.02, 0.0, 0.2], center: [0, 0.005, 0], focusDistance: 0.6, specs: ['size', 'count', 'speed'] }),
];

export const PART_INDEX = Object.fromEntries(PARTS.map((p, i) => [p.id, i])) as Record<PartId, number>;

/** World position of a part's visual centre for a given explode amount (0…1). */
export function partWorldCenter(part: PartDef, explode: number, out = new Vector3()) {
  return out.set(
    CASE_ORIGIN[0] + part.anchor[0] + part.explode[0] * explode + part.center[0],
    CASE_ORIGIN[1] + part.anchor[1] + part.explode[1] * explode + part.center[1],
    CASE_ORIGIN[2] + part.anchor[2] + part.explode[2] * explode + part.center[2],
  );
}
