/**
 * Named mounts of every case model (V4 §1.2), case-local metres (see
 * mounts.ts for the frame). The reference mid-tower and the catalog cases of
 * 0.37 derive theirs from the measured interiors in fits.ts; cases built by
 * scripts/blender/make-cases.py come with their own (caseDesigns.ts).
 */
import type { BoardFormFactor } from '@/data/hardware/types';
import type { Vec3 } from '@/data/hardware/mountTypes';
import { BOARD_FACE, D, FAN, FRONT_FANS, H, MB, PSU, W } from './constants';
import { CASE_INTERIORS, caseInterior, driveBay, frontFans, rearFanZ, SATA_AT, type CaseInterior } from './fits';
import { DESIGN_MOUNTS } from './caseDesigns';

export interface Box {
  min: Vec3;
  max: Vec3;
}

/** A fan position: centre, airflow direction (unit axis), and the group it belongs to. */
export interface FanMount {
  p: Vec3;
  n: Vec3;
  group: 'front' | 'side' | 'bottom' | 'top' | 'rear';
  /** Fan size, metres (120 or 140 mm). */
  size: number;
}

export interface CaseMounts {
  id: string;
  /** Outer box of the case model (feet included), for placing it on the desk. */
  shell: Box;
  /** Main chamber: everything on the board side must stay inside (glass excluded). */
  main: Box;
  /** Further spaces parts may use (the rear chamber of a dual-chamber case). */
  rooms: readonly Box[];
  formFactors: readonly BoardFormFactor[];
  /** Motherboard: top-rear corner of the PCB's back face, on top of the reference standoff; board normal −X. */
  board: { corner: Vec3 };
  /** Rear plane of the expansion slots (card brackets end here) and their count. */
  slots: { z: number; count: number };
  /** PSU bay: the PSU stands on min.y with its back on min.z, centred across x. */
  psu: Box;
  /** Euler turn of the PSU in its bay (dual chamber: on its side, fan towards the side panel). */
  psuRotation?: Vec3;
  /** A 2.5″ / 3.5″ drive's resting point (centre of its bottom face). */
  drive: Vec3;
  /** A graphics card must end before this z (front fans or front panel). */
  gpuClearZ: number;
  fans: readonly FanMount[];
  /** AIO radiator: centre of the radiator's fan side, long axis, airflow, max length (mm), and which fan group it takes. */
  radiator: { p: Vec3; along: Vec3; normal: Vec3; maxMm: number; replaces: FanMount['group'] | null } | null;
  /** Grommets where cables pass from the main chamber to the back: by the 24-pin, above the board for the CPU power, under the board for the card. */
  cableHoles: { atx24?: Vec3; eps?: Vec3; gpu?: Vec3 };
  /** Interior glow: small lights in the case (Medium and up), case-local positions. */
  lights?: readonly Vec3[];
}

function fromInterior(id: string, inside: CaseInterior): CaseMounts {
  const front = frontFans(inside);
  const fanX = FRONT_FANS.x;
  const shroudTop = inside.shroud?.top ?? inside.floor;
  const sataZ = Math.min(D / 2 - 0.13, (inside.shroud?.z[1] ?? inside.front - 0.02) - 0.055);
  return {
    id,
    shell: { min: [-W / 2, -H / 2 - 0.014, -D / 2], max: [W / 2, H / 2, D / 2] },
    main: { min: [-W / 2, inside.floor, inside.rear], max: [MB.x + 0.006, inside.top, inside.front] },
    rooms: [],
    formFactors: ['E-ATX', 'ATX', 'mATX', 'ITX'],
    board: { corner: [MB.x, MB.y + MB.h / 2, MB.z - MB.d / 2] },
    // card brackets end 12 mm inside the shell's back (on the slot rail)
    slots: { z: -D / 2 + 0.012, count: 7 },
    psu: { min: [PSU.x - PSU.w / 2, inside.floor, inside.rear], max: [PSU.x + PSU.w / 2, shroudTop, inside.rear + 0.2] },
    drive: [SATA_AT[0], shroudTop, sataZ],
    gpuClearZ: front.z - FAN * 0.11,
    fans: [
      ...front.ys.map((y): FanMount => ({ p: [fanX, y, front.z], n: [0, 0, -1], group: 'front', size: FAN })),
      // beside the board's tallest parts (VRM heatsinks, 47 mm) and above its first expansion slot
      { p: [MB.x - 0.047 - FAN / 2 - 0.002, MB.y + MB.h / 2 - 0.065, rearFanZ(inside)], n: [0, 0, -1], group: 'rear', size: FAN },
    ],
    // by the glass, clear of the RAM; 280 mm long so its end tanks clear the front and rear fans
    radiator: { p: [-W / 2 + 0.004 + 0.064, H / 2 - 0.04, 0], along: [0, 0, 1], normal: [0, 1, 0], maxMm: 280, replaces: null },
    cableHoles: { atx24: [BOARD_FACE + 0.004, MB.y, MB.z + MB.d / 2 + 0.035] },
  };
}

/** The scene's own procedural mid-tower. */
export const LEGACY_MOUNTS: CaseMounts = fromInterior('procedural', caseInterior());

export const CASE_MOUNTS: Readonly<Record<string, CaseMounts>> = {
  ...Object.fromEntries(Object.entries(CASE_INTERIORS).map(([id, inside]) => [id, fromInterior(id, inside)])),
  ...DESIGN_MOUNTS,
};

/** The Assembly Lab's 3.5″ drive bay in a case. */
export const hddBay = (mounts: CaseMounts): Vec3 => (mounts.id in DESIGN_MOUNTS ? mounts.drive : driveBay(caseInterior(mounts.id === 'procedural' ? null : mounts.id)));
