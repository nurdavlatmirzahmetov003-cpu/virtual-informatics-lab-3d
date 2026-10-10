/**
 * Lab navigation and loading policy (V2-3). Pure functions over the zone
 * data, shared by the 3D camera, the minimap, the keyboard handler and tests.
 */
import { LAB_HALL, LAB_OVERVIEW, LAB_ZONE_IDS, LAB_ZONES, zoneById, type LabZone, type LabZoneId, type Vec3 } from '@/data/lab/zones';

export interface Shot {
  position: Vec3;
  target: Vec3;
}

/** Camera shot of a focused zone: in front of it, at standing eye height. */
export function zoneShot(zone: LabZone): Shot {
  const [cx, cz] = zone.center;
  const [fx, fz] = zone.facing;
  const { distance, height, targetY } = zone.view;
  return { target: [cx, targetY, cz], position: [cx + fx * distance, height, cz + fz * distance] };
}

export const overviewShot = (): Shot => ({ position: LAB_OVERVIEW.position, target: LAB_OVERVIEW.target });

export const shotFor = (focus: LabZoneId | null): Shot => (focus ? zoneShot(zoneById(focus)) : overviewShot());

/** Previous / next zone in tour order; from the overview, next starts at the first zone. */
export function stepZone(current: LabZoneId | null, dir: 1 | -1): LabZoneId {
  const n = LAB_ZONE_IDS.length;
  if (current === null) return dir === 1 ? LAB_ZONE_IDS[0] : LAB_ZONE_IDS[n - 1];
  return LAB_ZONE_IDS[(LAB_ZONE_IDS.indexOf(current) + dir + n) % n];
}

/** 1-based number shown on signs, the minimap and used as a keyboard shortcut. */
export const zoneNumber = (id: LabZoneId) => LAB_ZONE_IDS.indexOf(id) + 1;

export type LabKeyAction =
  | { type: 'focus'; zone: LabZoneId }
  | { type: 'overview' }
  | { type: 'step'; dir: 1 | -1 }
  | { type: 'zoom'; dir: 1 | -1 }
  | { type: 'orbit'; dir: 1 | -1 };

/**
 * Keyboard control (WCAG 2.1.1): digits 1–9 fly to a zone, 0 / Escape / Home
 * return to the overview, PageUp/PageDown or [ ] step through zones, + / −
 * zoom, ← → orbit. Returns null for keys the lab does not handle.
 */
export function keyAction(key: string): LabKeyAction | null {
  if (/^[1-9]$/.test(key)) {
    const zone = LAB_ZONE_IDS[Number(key) - 1];
    return zone ? { type: 'focus', zone } : null;
  }
  switch (key) {
    case '0':
    case 'Escape':
    case 'Home':
      return { type: 'overview' };
    case 'PageDown':
    case ']':
      return { type: 'step', dir: 1 };
    case 'PageUp':
    case '[':
      return { type: 'step', dir: -1 };
    case '+':
    case '=':
      return { type: 'zoom', dir: 1 };
    case '-':
    case '_':
      return { type: 'zoom', dir: -1 };
    case 'ArrowLeft':
      return { type: 'orbit', dir: -1 };
    case 'ArrowRight':
      return { type: 'orbit', dir: 1 };
    default:
      return null;
  }
}

const dist2 = (a: readonly [number, number], b: readonly [number, number]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/** Zones whose platform centre is within `radius` (m) of a floor point (x, z), nearest first. */
export function zonesNear(point: readonly [number, number], radius: number): LabZoneId[] {
  return LAB_ZONES.filter((z) => dist2(z.center, point) <= radius * radius)
    .sort((a, b) => dist2(a.center, point) - dist2(b.center, point))
    .map((z) => z.id);
}

/** Radius around the focused zone whose neighbours are prefetched (files only, not mounted). */
export const PREFETCH_RADIUS = 6.6;

/**
 * Loading policy (PLAN_V2 V2-3 §3): only the focused zone mounts its full
 * models; its neighbours are prefetched into the HTTP cache; every other zone
 * shows its light preview (furniture plus at most two lightest-level models).
 * Leaving a zone unmounts its models and assetCache frees them.
 */
export function loadPlan(focus: LabZoneId | null): { full: LabZoneId[]; prefetch: LabZoneId[] } {
  if (!focus) return { full: [], prefetch: [] };
  const neighbours = zonesNear(zoneById(focus).center, PREFETCH_RADIUS).filter((id) => id !== focus);
  return { full: [focus], prefetch: neighbours };
}

/** World (x, z) → minimap coordinates (0…width, 0…height), north (−Z) up. */
export function toMinimap(x: number, z: number, width: number, height: number): [number, number] {
  const u = (x - LAB_HALL.minX) / (LAB_HALL.maxX - LAB_HALL.minX);
  const v = (z - LAB_HALL.minZ) / (LAB_HALL.maxZ - LAB_HALL.minZ);
  return [u * width, v * height];
}

/** Keep an orbit target inside the hall (no flying through walls). */
export function clampToHall([x, y, z]: Vec3, margin = 0.6): Vec3 {
  const c = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return [c(x, LAB_HALL.minX + margin, LAB_HALL.maxX - margin), c(y, 0.2, LAB_HALL.height - 0.4), c(z, LAB_HALL.minZ + margin, LAB_HALL.maxZ - margin)];
}
