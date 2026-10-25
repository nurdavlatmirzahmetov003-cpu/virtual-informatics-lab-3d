import { Vector3 } from 'three';
import { CAMERA_STATES } from '@/data/camera/cameraStates';
import { CASE_ORIGIN } from './constants';
import { pcRig } from './pcRig';

export type PartId = 'motherboard' | 'cpu' | 'cooler' | 'ram' | 'gpu' | 'ssd' | 'psu' | 'fans';

/**
 * One PC component of the story and the exploded view. Where it sits comes
 * from the mounting system (mounts.ts → pcRig.at): the centre of its bounding
 * box in the case, for the build on screen.
 */
export interface PartDef {
  id: PartId;
  /** Exploded layout: the slot its centre flies to, in the EXPLODED camera's normalised screen space (x, y ∈ −1…1). */
  slot?: readonly [number, number];
  /** …or a small case-local offset (parts that stay in or by the case). */
  nudge?: readonly [number, number, number];
  /** Comfortable camera distance when this part is focused. */
  focusDistance: number;
  /** Spec keys under pc.parts.<id>.specs. */
  specs: readonly string[];
  /** Magnification in the exploded layout so tiny parts stay readable (1 = true size). */
  magnify?: number;
}

/**
 * Exploded layout in the EXPLODED camera's screen space: each part's centre
 * goes to a slot given in normalised screen coordinates at a fixed depth in
 * front of the camera, so the parts land in a clean grid between the info
 * panel (left) and the case (right). The motherboard stays in the case as the
 * reference.
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

/** Order = the order the scroll story walks through them. */
export const PARTS: readonly PartDef[] = [
  { id: 'motherboard', nudge: [-0.03, 0.02, 0], focusDistance: 0.5, specs: ['formFactor', 'socket', 'slots'] },
  { id: 'cpu', slot: [0.08, 0.46], magnify: 2, focusDistance: 0.24, specs: ['cores', 'clock', 'tdp'] },
  { id: 'cooler', slot: [-0.1, 0.28], focusDistance: 0.42, specs: ['type', 'pipes', 'fan'] },
  { id: 'ram', slot: [0.25, 0.34], focusDistance: 0.3, specs: ['capacity', 'type', 'speed'] },
  { id: 'gpu', slot: [0.0, -0.1], focusDistance: 0.55, specs: ['vram', 'bus', 'power'] },
  { id: 'ssd', slot: [0.24, 0.02], magnify: 1.7, focusDistance: 0.24, specs: ['form', 'interface', 'speed'] },
  { id: 'psu', slot: [-0.06, -0.52], focusDistance: 0.45, specs: ['power', 'efficiency', 'cables'] },
  { id: 'fans', nudge: [-0.02, 0.0, 0.2], focusDistance: 0.6, specs: ['size', 'count', 'speed'] },
];

export const PART_INDEX = Object.fromEntries(PARTS.map((p, i) => [p.id, i])) as Record<PartId, number>;

/** Case-local offset of a part placed at `at` in the exploded layout. */
export function explodeOffset(part: PartDef, at: readonly [number, number, number]): [number, number, number] {
  if (!part.slot) return [...(part.nudge ?? [0, 0, 0])] as [number, number, number];
  const w = slotWorld(part.slot[0], part.slot[1]);
  return [w.x - CASE_ORIGIN[0] - at[0], w.y - CASE_ORIGIN[1] - at[1], w.z - CASE_ORIGIN[2] - at[2]];
}

/** World position of a part's centre for a given explode amount (0…1), in the build on screen. */
export function partWorldCenter(part: PartDef, explode: number, out = new Vector3()) {
  const at = pcRig.at[part.id] ?? [0, 0, 0];
  const e = explodeOffset(part, at);
  const o = pcRig.origin;
  return out.set(o[0] + at[0] + e[0] * explode, o[1] + at[1] + e[1] * explode, o[2] + at[2] + e[2] * explode);
}
