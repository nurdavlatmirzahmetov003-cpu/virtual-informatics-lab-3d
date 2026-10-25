/**
 * Cases built by scripts/blender/make-cases.py (V4 §1.1, §1.4). One design
 * record per case is the single source of truth. The mounts below are derived
 * from it, and `node scripts/case-designs.mjs` writes the same numbers for
 * Blender, so the model and the mounts always agree.
 *
 * Frame: case-local metres (see mounts.ts). The case stands on the desk with
 * its feet at FLOOR_Y, the same height as the 0.37 cases, so the scene's case
 * origin stays where it was.
 */
import type { BoardFormFactor } from '@/data/hardware/types';
import type { Vec3 } from '@/data/hardware/mountTypes';
import type { CaseMounts, FanMount } from './caseMounts';

/** Bottom of the feet in case-local y (0.37 mid-tower: 470 mm box on 14 mm feet). */
export const FLOOR_Y = -0.249;
/** Sheet steel / glass thickness. */
export const SHEET = 0.004;
const FAN = 0.12;
const FAN_T = 0.025;
const STANDOFF = 0.006;
const TRAY = 0.002;

export type CaseLayout = 'dual' | 'classic' | 'cube';

export interface CaseDesign {
  id: string;
  layout: CaseLayout;
  /** Outer body [width x, height y, depth z] without feet. */
  size: Vec3;
  feet: number;
  /** Dual chamber: width of the chamber behind the tray (PSU, drives, side fans). */
  rear: number;
  /** Panels that are tempered glass. */
  glass: { side: boolean; front: boolean };
  /** Front panel when it is not glass. */
  front: 'glass' | 'mesh' | 'wood';
  colors: { body: string; trim: string; accent: string; glassTint: string };
  /** Fan positions in the case. */
  fans: { side: number; bottom: number; top: number; rear: number; front: number };
  radiator: 'top' | 'front' | 'side' | null;
  formFactors: readonly BoardFormFactor[];
  /** Board top edge below the top panel's inner face. */
  boardTop: number;
  /** Fan model at every mount (products/<id>.glb). */
  fanModel: string;
}

/** Expansion slots (ATX): slot 1's centre below the board's top edge, pitch, and the bracket opening across x from the board's back. */
export const SLOTS = { firstBelowCorner: 0.185 - 0.02032, pitch: 0.02032, x: [-0.118, -0.012] as const };

const ATX_ALL: readonly BoardFormFactor[] = ['E-ATX', 'ATX', 'mATX', 'ITX'];

/** The hero: a white dual-chamber panoramic "aquarium" (Antec C8 / Lian Li O11 Vision class). */
export const PANORAMA: CaseDesign = {
  id: 'case-bitlab-panorama',
  layout: 'dual',
  size: [0.31, 0.464, 0.46],
  feet: 0.02,
  rear: 0.106,
  glass: { side: true, front: true },
  front: 'glass',
  colors: { body: '#eef0f3', trim: '#e3e6eb', accent: '#c9ced6', glassTint: '#f4f8ff' },
  fans: { side: 3, bottom: 3, top: 3, rear: 1, front: 0 },
  radiator: 'top',
  formFactors: ATX_ALL,
  boardTop: 0.035,
  fanModel: 'fan-bitlab-120',
};

export const CASE_DESIGNS: readonly CaseDesign[] = [PANORAMA];

const r = (v: number) => Math.round(v * 1e5) / 1e5;
const v3 = (x: number, y: number, z: number): Vec3 => [r(x), r(y), r(z)];

/** The inner faces of a design's panels and the planes everything is laid out from. */
export function caseFrame(d: CaseDesign) {
  const [W, H, D] = d.size;
  const bottom = FLOOR_Y + d.feet;
  const glassIn = -W / 2 + SHEET;
  const sideIn = W / 2 - SHEET;
  const trayFace = d.layout === 'dual' ? sideIn - d.rear - TRAY : sideIn - 0.018;
  return {
    W,
    H,
    D,
    bottom,
    top: bottom + H,
    floor: bottom + SHEET,
    ceiling: bottom + H - SHEET,
    front: D / 2 - SHEET,
    rearIn: -D / 2 + SHEET,
    glassIn,
    sideIn,
    trayFace,
    /** Back of the PCB: one standoff in front of the tray. */
    boardBack: trayFace - STANDOFF,
  };
}

/** A column or row of `n` fans centred on `mid` along `axis`. */
function row(n: number, mid: number, k: (t: number) => Vec3, n_: Vec3, group: FanMount['group']): FanMount[] {
  return Array.from({ length: n }, (_, i) => ({ p: k(mid + (i - (n - 1) / 2) * FAN), n: n_, group, size: FAN }));
}

export function mountsOf(d: CaseDesign): CaseMounts {
  const f = caseFrame(d);
  const corner = v3(f.boardBack, f.ceiling - d.boardTop, f.rearIn + 0.014);
  const dual = d.layout === 'dual';
  const rearX: readonly [number, number] = [f.trayFace + TRAY, f.sideIn];
  // fans
  const topY = f.ceiling - FAN_T / 2;
  const radLen = 0.394;
  const radZ = f.front - radLen / 2 - 0.002;
  const topX = f.glassIn + 0.012 + FAN / 2;
  const bottomY = f.floor + 0.003 + FAN_T / 2;
  const bottomX = f.glassIn + 0.005 + FAN / 2;
  const sideX = f.sideIn - 0.003 - FAN_T / 2;
  const sideZ = f.front - 0.0045 - FAN / 2;
  const sideMid = (bottomY + FAN_T / 2 + (topY - FAN_T / 2)) / 2;
  const fans: FanMount[] = [
    ...row(d.fans.top, radZ, (z) => v3(topX, topY, z), [0, 1, 0], 'top'),
    ...row(d.fans.bottom, 0, (z) => v3(bottomX, bottomY, z), [0, 1, 0], 'bottom'),
    ...row(d.fans.side, sideMid, (y) => v3(sideX, y, sideZ), [-1, 0, 0], 'side'),
    ...row(d.fans.rear, 0, () => v3(corner[0] - 0.047 - FAN / 2 - 0.002, corner[1] - 0.065, f.rearIn + FAN_T / 2 + 0.002), [0, 0, -1], 'rear'),
  ];
  const psu = dual
    ? { min: v3(rearX[0], f.floor, f.rearIn), max: v3(rearX[1], f.floor + 0.16, f.rearIn + 0.2) }
    : { min: v3(corner[0] - 0.16, f.floor, f.rearIn), max: v3(corner[0] + 0.006, f.floor + 0.09, f.rearIn + 0.2) };
  return {
    id: d.id,
    shell: { min: v3(-f.W / 2, FLOOR_Y, -f.D / 2), max: v3(f.W / 2, f.top, f.D / 2) },
    main: { min: v3(f.glassIn, f.floor, f.rearIn), max: v3(f.trayFace, f.ceiling, f.front) },
    rooms: dual ? [{ min: v3(rearX[0], f.floor, f.rearIn), max: v3(rearX[1], f.ceiling, f.front) }] : [],
    formFactors: d.formFactors,
    board: { corner },
    slots: { z: r(f.rearIn + 0.002), count: 7 },
    psu,
    psuRotation: dual ? [0, 0, Math.PI / 2] : undefined,
    drive: dual ? v3((rearX[0] + rearX[1]) / 2, f.floor, psu.max[2] + 0.08) : v3(f.glassIn + 0.07, psu.max[1], psu.max[2]),
    gpuClearZ: r(f.front - 0.004),
    fans,
    radiator: d.radiator === 'top' ? { p: v3(topX, f.ceiling - 0.0135, radZ), along: [0, 0, 1], normal: [0, 1, 0], maxMm: 360, replaces: 'top' } : null,
    cableHoles: {
      atx24: v3(f.trayFace, corner[1] - 0.145, corner[2] + 0.244 + 0.022),
      eps: v3(f.trayFace, corner[1] + 0.016, corner[2] + 0.038),
      gpu: v3(f.trayFace, corner[1] - 0.325, corner[2] + 0.16),
    },
    lights: [v3(f.glassIn + 0.03, f.ceiling - 0.03, f.front - 0.05), v3(f.glassIn + 0.04, f.floor + 0.05, 0), v3(corner[0] - 0.08, corner[1] - 0.12, -0.05)],
  };
}

/** Fan model of a case design (white or black frames). */
export const fanModelOf = (design: CaseDesign) => `${import.meta.env.BASE_URL}assets/models/products/${design.fanModel}.glb`;

export const DESIGN_BY_ID: Readonly<Record<string, CaseDesign>> = Object.fromEntries(CASE_DESIGNS.map((d) => [d.id, d]));

export const DESIGN_MOUNTS: Readonly<Record<string, CaseMounts>> = Object.fromEntries(CASE_DESIGNS.map((d) => [d.id, mountsOf(d)]));
