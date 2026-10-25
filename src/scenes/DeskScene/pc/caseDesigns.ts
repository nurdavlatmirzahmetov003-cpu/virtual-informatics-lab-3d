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
/** Classic PSU shroud height above the floor (an ATX PSU is 86 mm). */
const SHROUD = 0.1;

/** `dual`: board chamber + a chamber behind the tray (PSU, side fans); `classic`: one chamber, the PSU under a shroud, intake fans behind the front panel. */
export type CaseLayout = 'dual' | 'classic';

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
  /** Front panel: glass, a perforated mesh, oak slats over mesh, or a solid panel with a light bar. */
  front: 'glass' | 'mesh' | 'wood' | 'solid';
  colors: { body: string; trim: string; accent: string; glassTint: string };
  /** Fan positions in the case. */
  fans: { side: number; bottom: number; top: number; rear: number; front: number };
  radiator: 'top' | 'front' | 'side' | null;
  formFactors: readonly BoardFormFactor[];
  /** Board top edge below the top panel's inner face. */
  boardTop: number;
  /** Fan model at every mount (products/<id>.glb). */
  fanModel: string;
  /** Catalog name and demo price (Setup Studio). */
  name: string;
  priceKZT: number;
  finish: 'white' | 'black' | 'grey' | 'pink' | 'wood';
}

/** Expansion slots (ATX): slot 1's centre below the board's top edge, pitch, and the bracket opening across x from the board's back. */
export const SLOTS = { firstBelowCorner: 0.185 - 0.02032, pitch: 0.02032, x: [-0.118, -0.012] as const };

const ATX_ALL: readonly BoardFormFactor[] = ['E-ATX', 'ATX', 'mATX', 'ITX'];

const WHITE_FAN = 'fan-bitlab-120';
const BLACK_FAN = 'fan-bitlab-120-black';
const NO_FANS = { side: 0, bottom: 0, top: 0, rear: 0, front: 0 };

/** The hero: a white dual-chamber panoramic "aquarium" (Antec C8 / Lian Li O11 Vision class). */
export const PANORAMA: CaseDesign = {
  id: 'case-bitlab-panorama',
  name: 'Panorama',
  priceKZT: 72_000,
  finish: 'white',
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
  fanModel: WHITE_FAN,
};

/** The V4 catalog (§1.4): every case is built from its record by make-showcase.py, so model and mounts agree. */
export const CASE_DESIGNS: readonly CaseDesign[] = [
  PANORAMA,
  // the same panoramic body in black, smoked glass and black fans
  { ...PANORAMA, id: 'case-bitlab-panorama-black', name: 'Panorama Black', finish: 'black', colors: { body: '#1d2026', trim: '#2a2e36', accent: '#454b56', glassTint: '#c9d0dc' }, fanModel: BLACK_FAN },
  // pastel pink panoramic, white fans
  { ...PANORAMA, id: 'case-bitlab-blossom', name: 'Panorama Blossom', priceKZT: 74_000, finish: 'pink', fans: { side: 3, bottom: 2, top: 3, rear: 1, front: 0 }, colors: { body: '#f6d9e4', trim: '#efc6d6', accent: '#e2a3bc', glassTint: '#fff4f8' } },
  // full-tower showcase: taller and deeper, four side fans, E-ATX
  {
    id: 'case-bitlab-tower', name: 'Tower Showcase', priceKZT: 115_000, finish: 'grey', layout: 'dual',
    size: [0.335, 0.575, 0.5], feet: 0.024, rear: 0.112, glass: { side: true, front: true }, front: 'glass',
    colors: { body: '#d5d8dd', trim: '#bcc1c9', accent: '#8b919b', glassTint: '#eef3fa' },
    fans: { side: 4, bottom: 3, top: 3, rear: 1, front: 0 }, radiator: 'top', formFactors: ATX_ALL, boardTop: 0.04, fanModel: WHITE_FAN,
  },
  // compact glass cube for micro-ATX and mini-ITX boards
  {
    id: 'case-bitlab-cube', name: 'Cube', priceKZT: 58_000, finish: 'white', layout: 'dual',
    size: [0.29, 0.4, 0.44], feet: 0.018, rear: 0.1, glass: { side: true, front: true }, front: 'glass',
    colors: { body: '#e3eaf2', trim: '#d0d9e4', accent: '#a7b4c4', glassTint: '#f2f7ff' },
    fans: { side: 2, bottom: 2, top: 3, rear: 1, front: 0 }, radiator: 'top', formFactors: ['mATX', 'ITX'], boardTop: 0.035, fanModel: WHITE_FAN,
  },
  // compact mid-tower: glass side, solid front with a light bar
  {
    id: 'case-bitlab-core', name: 'Core', priceKZT: 38_000, finish: 'grey', layout: 'classic',
    size: [0.225, 0.462, 0.472], feet: 0.016, rear: 0, glass: { side: true, front: false }, front: 'solid',
    colors: { body: '#2c3038', trim: '#3a3f49', accent: '#6b7280', glassTint: '#dfe5ee' },
    fans: { ...NO_FANS, front: 2, top: 2, rear: 1 }, radiator: 'top', formFactors: ATX_ALL, boardTop: 0.035, fanModel: BLACK_FAN,
  },
  // airflow: black mesh front with three ARGB intake fans behind it
  {
    id: 'case-bitlab-flow', name: 'Flow RGB', priceKZT: 46_000, finish: 'black', layout: 'classic',
    size: [0.232, 0.478, 0.476], feet: 0.018, rear: 0, glass: { side: true, front: false }, front: 'mesh',
    colors: { body: '#15171c', trim: '#23262d', accent: '#3b404a', glassTint: '#cfd6e0' },
    fans: { ...NO_FANS, front: 3, top: 3, rear: 1 }, radiator: 'top', formFactors: ATX_ALL, boardTop: 0.035, fanModel: BLACK_FAN,
  },
  // Scandinavian: chalk-white body, oak slats over a mesh front
  {
    id: 'case-bitlab-grove', name: 'Grove', priceKZT: 68_000, finish: 'wood', layout: 'classic',
    size: [0.232, 0.47, 0.476], feet: 0.02, rear: 0, glass: { side: true, front: false }, front: 'wood',
    colors: { body: '#ebe8e1', trim: '#dcd7cd', accent: '#b98a5a', glassTint: '#f6f4ef' },
    fans: { ...NO_FANS, front: 3, top: 2, rear: 1 }, radiator: 'top', formFactors: ATX_ALL, boardTop: 0.035, fanModel: WHITE_FAN,
  },
];

const r = (v: number) => Math.round(v * 1e5) / 1e5;
const v3 = (x: number, y: number, z: number): Vec3 => [r(x), r(y), r(z)];

/** The inner faces of a design's panels and the planes everything is laid out from. */
export function caseFrame(d: CaseDesign) {
  const [W, H, D] = d.size;
  const bottom = FLOOR_Y + d.feet;
  const glassIn = -W / 2 + SHEET;
  const sideIn = W / 2 - SHEET;
  const trayFace = d.layout === 'dual' ? sideIn - d.rear - TRAY : sideIn - 0.018;
  const front = D / 2 - SHEET;
  const floor = bottom + SHEET;
  // classic: intake fans right behind the front panel, the PSU shroud ends in front of them
  const frontFanZ = front - 0.006 - FAN_T / 2;
  return {
    W,
    H,
    D,
    bottom,
    top: bottom + H,
    floor: bottom + SHEET,
    ceiling: bottom + H - SHEET,
    front,
    rearIn: -D / 2 + SHEET,
    frontFanZ,
    shroudTop: d.layout === 'classic' ? floor + SHROUD : floor,
    shroudFront: frontFanZ - FAN_T / 2 - 0.004,
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
  // dual: the radiator runs to the front glass; classic: it stops behind the front fans
  const radFront = dual ? f.front - 0.002 : f.frontFanZ - FAN_T / 2 - 0.003;
  const radZ = radFront - radLen / 2;
  const topX = f.glassIn + 0.012 + FAN / 2;
  const bottomY = f.floor + 0.003 + FAN_T / 2;
  const bottomX = f.glassIn + 0.005 + FAN / 2;
  const sideX = f.sideIn - 0.003 - FAN_T / 2;
  const sideZ = f.front - 0.0045 - FAN / 2;
  const sideMid = (bottomY + FAN_T / 2 + (topY - FAN_T / 2)) / 2;
  const frontX = (f.glassIn + f.trayFace) / 2;
  const fans: FanMount[] = [
    ...row(d.fans.top, radZ, (z) => v3(topX, topY, z), [0, 1, 0], 'top'),
    ...row(d.fans.bottom, 0, (z) => v3(bottomX, bottomY, z), [0, 1, 0], 'bottom'),
    ...row(d.fans.side, sideMid, (y) => v3(sideX, y, sideZ), [-1, 0, 0], 'side'),
    ...row(d.fans.front, (f.floor + f.ceiling) / 2, (y) => v3(frontX, y, f.frontFanZ), [0, 0, -1], 'front'),
    ...row(d.fans.rear, 0, () => v3(corner[0] - 0.047 - FAN / 2 - 0.002, corner[1] - 0.065, f.rearIn + FAN_T / 2 + 0.002), [0, 0, -1], 'rear'),
  ];
  const psu = dual
    ? { min: v3(rearX[0], f.floor, f.rearIn), max: v3(rearX[1], f.floor + 0.16, f.rearIn + 0.2) }
    : { min: v3(corner[0] - 0.16, f.floor, f.rearIn), max: v3(corner[0] + 0.004, f.shroudTop - 0.002, f.rearIn + 0.2) };
  // classic: besides the board chamber above the shroud, the shroud itself and the strip of the front fans
  const rooms = dual
    ? [{ min: v3(rearX[0], f.floor, f.rearIn), max: v3(rearX[1], f.ceiling, f.front) }]
    : [
        { min: v3(f.glassIn, f.floor, f.rearIn), max: v3(f.trayFace, f.shroudTop, f.shroudFront) },
        { min: v3(f.glassIn, f.floor, f.shroudFront), max: v3(f.trayFace, f.ceiling, f.front) },
      ];
  return {
    id: d.id,
    shell: { min: v3(-f.W / 2, FLOOR_Y, -f.D / 2), max: v3(f.W / 2, f.top, f.D / 2) },
    main: { min: v3(f.glassIn, f.shroudTop, f.rearIn), max: v3(f.trayFace, f.ceiling, f.front) },
    rooms,
    formFactors: d.formFactors,
    board: { corner },
    slots: { z: r(f.rearIn + 0.002), count: 7 },
    psu,
    psuRotation: dual ? [0, 0, Math.PI / 2] : undefined,
    // dual: in the rear chamber in front of the PSU; classic: on the shroud, in front of the PSU's end
    drive: dual ? v3((rearX[0] + rearX[1]) / 2, f.floor, psu.max[2] + 0.08) : v3(f.glassIn + 0.065, f.shroudTop, f.shroudFront - 0.09),
    gpuClearZ: r(dual ? f.front - 0.004 : f.frontFanZ - FAN_T / 2 - 0.004),
    fans,
    radiator: d.radiator === 'top' ? { p: v3(topX, f.ceiling - 0.0135, radZ), along: [0, 0, 1], normal: [0, 1, 0], maxMm: 360, replaces: 'top' } : null,
    cableHoles: {
      atx24: v3(f.trayFace, corner[1] - 0.145, corner[2] + 0.244 + 0.022),
      eps: v3(f.trayFace, corner[1] + 0.016, corner[2] + 0.038),
      gpu: v3(f.trayFace, Math.max(corner[1] - 0.325, f.shroudTop + 0.035), corner[2] + 0.16),
    },
    lights: [v3(f.glassIn + 0.03, f.ceiling - 0.03, f.front - 0.05), v3(f.glassIn + 0.04, f.shroudTop + 0.05, 0), v3(corner[0] - 0.08, corner[1] - 0.12, -0.05)],
  };
}

/** What a case takes, read off its mounts (catalog specs and the studio's compatibility checks). */
export function capacityOf(d: CaseDesign) {
  const m = mountsOf(d);
  return {
    // a card from its bracket (the slot plane) to the front clearance
    maxGpuLengthMm: Math.floor((m.gpuClearZ - m.slots.z) * 1000) - 10,
    // an air cooler from the board's surface to the glass, less the socket and a margin
    maxCoolerHeightMm: Math.floor((m.board.corner[0] - m.main.min[0]) * 1000) - 12,
    maxRadiatorMm: m.radiator?.maxMm ?? 0,
    fans: Object.values(d.fans).reduce((a, b) => a + b, 0),
  };
}

export const DESIGN_BY_ID: Readonly<Record<string, CaseDesign>> = Object.fromEntries(CASE_DESIGNS.map((d) => [d.id, d]));

export const DESIGN_MOUNTS: Readonly<Record<string, CaseMounts>> = Object.fromEntries(CASE_DESIGNS.map((d) => [d.id, mountsOf(d)]));
