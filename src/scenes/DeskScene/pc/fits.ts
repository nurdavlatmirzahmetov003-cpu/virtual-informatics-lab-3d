/**
 * Where every PC part sits (V2-2b, 0.37): the fits ModelLoader applies to the
 * part and case models. Pure data, shared by the 3D components and by
 * scripts/pc-fit.test.mjs, which checks every case × part combination.
 */
import type { ModelFit } from '@/lib/three/fit';
import { BOARD_FACE, D, H, MB, SSD, W } from './constants';
import type { PartId } from './parts';

type Fit = ModelFit;
export const fits: Record<Exclude<PartId, 'fans'>, Fit> = {
  motherboard: { axis: 1, size: 0.305, rotation: [0, -Math.PI / 2, 0], offset: [-0.024, 0, 0] },
  cpu: { axis: 1, size: 0.04, rotation: [0, -Math.PI / 2, 0], offset: [-0.003, 0, 0] },
  cooler: { axis: 0, size: 0.148, rotation: [0, 0, -Math.PI / 2], offset: [-0.078, 0, 0.01] },
  ram: { axis: 1, size: 0.133, rotation: [Math.PI / 2, 0, Math.PI / 2], offset: [-0.029, 0, 0] },
  gpu: { axis: 2, size: 0.323, rotation: [0, -Math.PI / 2, 0], offset: [-0.07, 0, 0.1615] },
  ssd: { axis: 2, size: 0.08, rotation: [0, -Math.PI / 2, 0], offset: [-0.002, 0, 0] },
  psu: { axis: 0, size: 0.15 },
};
export const files = { motherboard: 'motherboard_x570', cpu: 'cpu_am4', cooler: 'cooler_tower', ram: 'ram_rgb', gpu: 'gpu_triple_fan', ssd: 'ssd_m2', psu: 'psu' };
export const fanFit: Fit = { axis: 0, size: 0.12, rotation: [Math.PI / 2, 0, 0] };
export const rotorFit: Fit = { axis: 0, size: 0.0935, rotation: [Math.PI / 2, 0, 0] };

/**
 * Per-product models (V2-2b) are real size in a canonical pose (component side
 * up, see scripts/blender/configs/products): a quarter turn about Z lays them
 * against the board (component side −X, top edge up, I/O / bracket at the back).
 * `pin x max` puts the back of the part on its anchor, the offset is the height
 * of the socket / slot it sits in.
 */
export const ON_BOARD = [0, 0, Math.PI / 2] as const;
export const productFits: Record<Exclude<PartId, 'fans'>, Fit> = {
  // ATX and mATX share the top edge and the I/O edge
  motherboard: { axis: 1, rotation: ON_BOARD, pin: { x: 'max', y: 'max', z: 'min' }, offset: [0, MB.h / 2, -MB.d / 2] },
  cpu: { axis: 1, rotation: ON_BOARD, pin: { x: 'max' }, offset: [-0.004, 0, 0] },
  cooler: { axis: 1, rotation: ON_BOARD, pin: { x: 'max' }, offset: [-0.0105, 0, 0] },
  ram: { axis: 1, rotation: ON_BOARD, pin: { x: 'max' }, offset: [-0.002, 0, 0] },
  gpu: { axis: 1, rotation: ON_BOARD, pin: { x: 'max', z: 'min' }, offset: [-0.004, 0, 0] },
  ssd: { axis: 1, rotation: ON_BOARD, pin: { x: 'max' }, offset: [-0.001, 0, 0] },
  psu: { axis: 0 },
};
/** Where a 2.5″ SATA drive goes (x, z; height from the case's shroud, see sataFitFor), not in the M.2 slot. */
export const SATA_AT = [-W / 2 + 0.07, -H / 2 + 0.098, D / 2 - 0.13] as const;

/**
 * Catalog case models (V2-2b) already fill the case box at real size, front +Z,
 * glass side −X (the glass stays procedural). Their motherboard trays sit
 * deeper than the scene's (cable room behind the tray), so each model moves
 * along +X until its tray face (measured in Blender) is one standoff (6 mm)
 * behind the board — otherwise the board would hide inside the tray.
 */
export const STANDOFF = 0.006;
export const TRAY_FACE_X: Readonly<Record<string, number>> = {
  'case-corsair-4000d-airflow': 0.094,
  'case-deepcool-cc560-v2': 0.094,
  'case-fractal-north': 0.083,
  'case-nzxt-h5-flow-2024': 0.083,
  'case-lianli-o11d-evo': 0.089,
  // built with its tray exactly one standoff behind the board
  'case-bitlab-aero': MB.x + STANDOFF,
};
export const caseFit = (id: string) => ({ axis: 1 as const, offset: [MB.x + STANDOFF - (TRAY_FACE_X[id] ?? MB.x + STANDOFF), 0, 0] as const });


/**
 * Inside of a case, in case-local metres after `caseFit` (0.37). Measured in
 * Blender by casting rays into each case model (the cases stand on feet, so
 * their floor is 2–3 cm above the bottom of their box). The procedural chassis
 * uses the scene's own box. `shroud`: top of the PSU cover and the depth it
 * spans; `front`: inner face of the front panel (fans sit behind it).
 */
export interface CaseInterior {
  floor: number;
  top: number;
  front: number;
  rear: number;
  shroud: { top: number; z: readonly [number, number] } | null;
}

const T_SHEET = 0.004;
const PROCEDURAL: CaseInterior = { floor: -H / 2 + T_SHEET, top: H / 2 - T_SHEET, front: D / 2 - 0.012, rear: -D / 2 + T_SHEET, shroud: { top: -H / 2 + T_SHEET + 0.094, z: [-D / 2, D / 2 - 0.075] } };
/** Shells shared by several catalog cases (same source model, other paint). */
const SHELL_4000D: CaseInterior = { floor: -0.203, top: 0.234, front: 0.172, rear: -0.21, shroud: { top: -0.109, z: [-0.21, 0.13] } };
const SHELL_H5: CaseInterior = { floor: -0.205, top: 0.231, front: 0.194, rear: -0.2, shroud: { top: -0.106, z: [-0.21, 0.19] } };
/** BitLab Aero: modelled for these anchors (scripts/blender/make-bitlab-aero.py). */
const AERO: CaseInterior = { floor: -0.219, top: 0.231, front: 0.217, rear: -0.221, shroud: { top: -0.115, z: [-0.221, 0.12] } };
const SHELL_O11: CaseInterior = { floor: -0.214, top: 0.232, front: 0.221, rear: -0.22, shroud: { top: -0.109, z: [-0.12, 0.21] } };

export const CASE_INTERIORS: Readonly<Record<string, CaseInterior>> = {
  'case-corsair-4000d-airflow': SHELL_4000D,
  'case-deepcool-cc560-v2': SHELL_4000D,
  'case-fractal-north': SHELL_H5,
  'case-nzxt-h5-flow-2024': SHELL_H5,
  'case-lianli-o11d-evo': SHELL_O11,
  'case-bitlab-aero': AERO,
};

export const caseInterior = (caseId?: string | null): CaseInterior => (caseId && CASE_INTERIORS[caseId]) || PROCEDURAL;

/** Gap kept between a part and the panel it rests on. */
const REST = 0.001;

/** PSU anchor (PSU in constants.ts) → how far the PSU drops or rises to stand on this case's floor. */
export function psuFit(interior: CaseInterior, psuAnchorY: number, own: boolean): Fit {
  const lift = interior.floor + REST - psuAnchorY;
  return own ? { axis: 0, pin: { y: 'min' }, offset: [0, lift, 0] } : { axis: 0, size: 0.15, align: 'floor', offset: [0, lift, 0] };
}

/** A 2.5″ SATA drive lies flat on the PSU shroud, in front of the board (on the floor if there is no shroud). */
export function sataFitFor(interior: CaseInterior): Fit {
  const y = (interior.shroud?.top ?? interior.floor) + REST;
  // fully on the shroud: its front edge 5 mm behind the shroud's front edge
  const z = Math.min(D / 2 - 0.13, (interior.shroud?.z[1] ?? interior.front - 0.02) - 0.055);
  return { axis: 0, align: 'floor', offset: [SATA_AT[0] - BOARD_FACE, y - SSD.y, z - SSD.z] };
}

/**
 * Front intake fans: as many 120 mm fans as fit between the shroud (where it
 * reaches the front) or the floor and the top panel, centred in that space,
 * just behind the front panel.
 */
export function frontFans(interior: CaseInterior, fan = 0.12) {
  const shroudAtFront = interior.shroud && interior.shroud.z[1] > interior.front - 0.03;
  const bottom = (shroudAtFront ? interior.shroud!.top : interior.floor) + 0.006;
  const top = interior.top - 0.006;
  const count = Math.max(1, Math.min(3, Math.floor((top - bottom) / fan)));
  const mid = (top + bottom) / 2;
  const ys = Array.from({ length: count }, (_, i) => mid + (i - (count - 1) / 2) * fan);
  return { ys: ys.reverse(), z: interior.front - 0.0135 };
}

/**
 * The extra 3.5″ drive of the PC Assembly Lab (an HDD, 102 × 26 × 147 mm, lying
 * flat): on top of the shroud towards its front edge, beside the board side.
 */
export function driveBay(interior: CaseInterior): readonly [number, number, number] {
  const rest = interior.shroud ?? { top: interior.floor, z: [interior.rear, interior.front - 0.04] as const };
  return [-W / 2 + 0.08, rest.top + REST, rest.z[1] - 0.0735 - 0.005];
}

/** Rear exhaust fan: centre depth, just inside the rear panel. */
export const rearFanZ = (interior: CaseInterior) => interior.rear + 0.0135;
