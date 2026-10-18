/**
 * Furnishing of the lab hall's empty floor (0.35): plants, low book cabinets
 * under the windows, a reading lounge, a bean-bag corner and a mobile
 * whiteboard. Pure data in the LAB_HALL frame (metres, floor y = 0); the 3D
 * pieces are built and merged in scenes/LabSpace/classroom/Decor.tsx.
 *
 * Every item keeps clear of the zone platforms, the zone cameras and the
 * robot teacher's close-up (scripts/lab-space.test.mjs checks it), so the
 * tour never flies through a sofa.
 */
import { LAB_HALL } from './zones';

export type DecorKind = 'plant_tall' | 'plant_bush' | 'cabinet' | 'lounge' | 'beanbags' | 'whiteboard';

export interface DecorItem {
  kind: DecorKind;
  /** Floor position (x, z). */
  at: readonly [number, number];
  /** Rotation about Y; 0 = the item's front faces +Z (the open side of the hall). */
  yaw: number;
  /** Radius of the floor footprint (m), used by the clearance test. */
  radius: number;
}

const { minX, maxX, minZ, maxZ } = LAB_HALL;
/** Facing into the room from the left / right wall. */
const FROM_LEFT = Math.PI / 2;
const FROM_RIGHT = -Math.PI / 2;

export const DECOR: readonly DecorItem[] = [
  // tall plants in the four corners and between the back zones
  { kind: 'plant_tall', at: [minX + 0.55, minZ + 0.55], yaw: 0, radius: 0.4 },
  { kind: 'plant_tall', at: [maxX - 0.55, minZ + 0.55], yaw: 0.6, radius: 0.4 },
  { kind: 'plant_tall', at: [minX + 0.55, maxZ - 0.6], yaw: 1.2, radius: 0.4 },
  { kind: 'plant_tall', at: [maxX - 0.55, maxZ - 0.6], yaw: 2.1, radius: 0.4 },
  { kind: 'plant_bush', at: [-3.15, minZ + 0.5], yaw: 0.3, radius: 0.35 },
  { kind: 'plant_bush', at: [3.15, minZ + 0.5], yaw: 1.4, radius: 0.35 },
  // low book cabinets under the back windows of both side walls
  { kind: 'cabinet', at: [minX + 0.25, -4.6], yaw: FROM_LEFT, radius: 1.0 },
  { kind: 'cabinet', at: [maxX - 0.25, -4.6], yaw: FROM_RIGHT, radius: 1.0 },
  // reading lounge by the entrance, right; bean bags, left
  { kind: 'lounge', at: [5.9, 6.7], yaw: Math.PI, radius: 1.25 },
  { kind: 'beanbags', at: [-6.3, 6.9], yaw: Math.PI, radius: 1.0 },
  // a mobile whiteboard behind the robot teacher
  { kind: 'whiteboard', at: [4.9, 0.9], yaw: -0.35, radius: 0.65 },
];
