/**
 * Case model fits and the measured interiors of the 0.37 catalog cases. Where
 * each part goes is decided by the mounting system (mounts.ts, caseMounts.ts);
 * the interiors below are what the old cases' mounts are derived from.
 */
import type { ModelFit } from '@/lib/three/fit';
import { D, H, MB, W } from './constants';

type Fit = ModelFit;
export const fanFit: Fit = { axis: 0, size: 0.12, rotation: [Math.PI / 2, 0, 0] };
export const rotorFit: Fit = { axis: 0, size: 0.0935, rotation: [Math.PI / 2, 0, 0] };

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
