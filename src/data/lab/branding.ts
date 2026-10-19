/**
 * BitLab branding in the lab hall (0.37): where the corner banners, the zone
 * flags and the wall logo go. Pure data in the LAB_HALL frame (metres); the
 * visibility audit (scripts/lab-visibility.test.mjs) checks nothing hides them.
 */
import { LAB_HALL, type LabZone, type Vec2, type Vec3 } from './zones';

const { minX, maxX, minZ } = LAB_HALL;

export interface Banner {
  id: string;
  /** Centre of the cloth. */
  at: Vec3;
  yaw: number;
  size: readonly [number, number];
}

/** Two on the back wall beside its outer posters, two on the side walls between the front zones and the windows; high, above the corner plants. */
export const BRANDING_BANNERS: readonly Banner[] = [
  { id: 'back-left', at: [minX + 0.65, 2.85, minZ + 0.06], yaw: 0, size: [0.7, 2.0] },
  { id: 'back-right', at: [maxX - 0.65, 2.85, minZ + 0.06], yaw: 0, size: [0.7, 2.0] },
  { id: 'left-front', at: [minX + 0.06, 2.85, 5.6], yaw: Math.PI / 2, size: [0.7, 2.0] },
  { id: 'right-front', at: [maxX - 0.06, 2.85, 5.6], yaw: -Math.PI / 2, size: [0.7, 2.0] },
];

/** The logo on the back wall, left of the room's name (ROOM_SIGN) as the clock is right of it. */
export const BRANDING_LOGO = { center: [-2.75, 3.72, minZ + 0.05] as Vec3, size: [1.2, 0.375] as const };

/**
 * A zone's flag: on the back-left corner of its platform, cloth pointing
 * along the zone's +X, low like a table pennant: under the sight line from the
 * zone camera to the wall posters (tall flags hid them — the visibility audit
 * caught it) and out of the camera's way. The stage has its own branding.
 */
export const flagZones = (zones: readonly LabZone[]) => zones.filter((z) => z.id !== 'stage');

export function flagPlace(zone: LabZone): { at: Vec2; yaw: number; top: number } {
  const [w, d] = zone.size;
  const yaw = Math.atan2(zone.facing[0], zone.facing[1]);
  const lx = -w / 2 + 0.12;
  const lz = -d / 2 + 0.12;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { at: [zone.center[0] + lx * c + lz * s, zone.center[1] - lx * s + lz * c], yaw, top: 1.25 };
}
