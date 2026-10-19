/**
 * The lab's helper robots (0.37): where they stand and the routes they drive.
 * Pure data in the LAB_HALL frame (metres, floor y = 0). Routes go through the
 * open floor between the zones; scripts/lab-space.test.mjs checks they keep
 * clear of every platform, the decor and the robot teacher.
 */
import { LAB_ZONES, type LabZone, type LabZoneId, type Vec2 } from './zones';

/** Cleaning robot: a loop round the showcase, through the open aisles (m). */
export const CLEANER_ROUTE: readonly Vec2[] = [
  [-3.4, -3.0],
  [3.4, -3.0],
  [3.6, -0.6],
  [2.6, 1.4],
  [0.8, 2.75],
  [-1.2, 2.75],
  [-3.4, 1.0],
  [-3.6, -1.2],
];
export const CLEANER_SPEED = 0.32;

/** Courier: from the entrance to the showcase with a parcel, unloads, drives back. */
export const COURIER_ROUTE: readonly Vec2[] = [
  [1.25, 7.3],
  [1.25, 4.2],
  [1.4, 2.55],
];
export const COURIER_SPEED = 0.45;
/** Where the delivered parcels pile up, beside the showcase platform. */
export const PARCEL_STACK: Vec2 = [2.15, 2.35];

/** Builder: behind the PC build bench (assembly zone space), working on the board. */
export const BUILDER = { zone: 'assembly' as LabZoneId, local: [-0.95, 0, -1.12] as const, yaw: 0 };

/**
 * One advisor per zone with something to present, on the right side of its
 * platform halfway back (zone space: +X right, +Z towards the visitor), turned
 * towards the visitor and the table — at the front corner it stood in front of
 * the zone camera.
 */
export const ADVISOR_ZONES: readonly LabZoneId[] = ['workstation', 'assembly', 'storage', 'peripherals', 'print_media', 'network', 'power', 'mobile', 'showcase'];

export function advisorPlace(zone: LabZone): { local: readonly [number, number, number]; yaw: number } {
  const [w, d] = zone.size;
  // the showcase is round: the advisor stands at its front, off the pedestals
  if (zone.id === 'showcase') return { local: [-1.5, 0.05, 0.6], yaw: 0.6 };
  return { local: [w / 2 - 0.24, 0.05, Math.min(0.25, d / 2 - 0.4)], yaw: -0.7 };
}

/** World position (x, z) of a point given in a zone's own space. */
export function zoneToWorld(zone: LabZone, local: readonly [number, number, number]): Vec2 {
  const yaw = Math.atan2(zone.facing[0], zone.facing[1]);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [zone.center[0] + local[0] * c + local[2] * s, zone.center[1] - local[0] * s + local[2] * c];
}

/** The routes as segments, for the clearance test. */
export const ROUTES = { cleaner: CLEANER_ROUTE, courier: COURIER_ROUTE } as const;

export const advisorWorld = () => ADVISOR_ZONES.map((id) => {
  const z = LAB_ZONES.find((x) => x.id === id)!;
  return { id, at: zoneToWorld(z, advisorPlace(z).local) };
});
