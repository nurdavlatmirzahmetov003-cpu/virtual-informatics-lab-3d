/**
 * World layout of the assembly bench: the parts tray, the anti-static mat,
 * the case, and every install target. Drawing/interaction only — the order
 * and scoring rules live in labs/AssemblyLab.
 */
import { Euler, Quaternion, Vector3 } from 'three';
import type { StepId, TargetId } from '@/labs/AssemblyLab';
import { DESK_TOP } from '@/scenes/DeskScene/layout';
import { CASE_ORIGIN } from '@/scenes/DeskScene/pc/constants';
import { hddBay } from '@/scenes/DeskScene/pc/caseMounts';
import { showcaseInstalled } from '@/lib/studio/showcaseInstall';
import type { PartId } from '@/scenes/DeskScene/pc/parts';

const v = (a: readonly number[]) => new Vector3(a[0], a[1], a[2]);
/** The showcase build as the mounting system installs it: every target below comes from it (V4 §1.2). */
export const INST = showcaseInstalled();
const intake = INST.fans.filter((f) => f.group !== 'rear');
/** Installed centre of each part (case-local). */
export const AT: Record<PartId, Vector3> = {
  motherboard: v(INST.motherboard!.p),
  cpu: v(INST.cpu!.p),
  cooler: v(INST.cooler!.p),
  ram: v(INST.ram!.p),
  gpu: v(INST.gpu!.p),
  ssd: v(INST.ssd!.p),
  psu: v(INST.psu!.p),
  fans: intake.reduce((sum, f) => sum.add(v(f.p)), new Vector3()).divideScalar(Math.max(1, intake.length)),
};

export const CASE = v(CASE_ORIGIN);
/** The motherboard's installed centre in case space; the board assembly's origin. */
export const MB_ANCHOR = AT.motherboard.clone();

/** Anti-static mat on the desk, between the tray and the case. */
export const MAT = { center: new Vector3(0.21, DESK_TOP + 0.002, 0.15), size: [0.42, 0.34] as const };

/** In the case the board stands on the tray (identity); on the mat it lies component side up. */
export const CASE_ROT = new Quaternion();
export const BENCH_ROT = new Quaternion().setFromEuler(new Euler(0, 0, -Math.PI / 2));

/** Board assembly origin when lying on the mat (component side up, board centred on the mat). */
export const BENCH_POS = MAT.center.clone().add(new Vector3(0, 0.026, 0));
/** …and when screwed onto the standoffs inside the case. */
export const CASE_POS = CASE.clone().add(MB_ANCHOR);

/** Parts that sit on the motherboard and travel with it. */
export const BOARD_PARTS = ['cpu', 'cooler', 'ram', 'ssd'] as const satisfies readonly PartId[];
export type BoardPart = (typeof BOARD_PARTS)[number];

/** A board-mounted part's offset from the board origin (case space). */
export const boardOffset = (id: PartId) => AT[id].clone().sub(MB_ANCHOR);

/** The 3D model each step drags around. */
export const STEP_PART: Record<StepId, PartId | 'board' | 'storage' | 'cables'> = {
  motherboard: 'board',
  cpu: 'cpu',
  cooler: 'cooler',
  ram: 'ram',
  nvme: 'ssd',
  mountBoard: 'board',
  psu: 'psu',
  gpu: 'gpu',
  storage: 'storage',
  fans: 'fans',
  cables: 'cables',
};

/** Extra 3.5" drive: flat on the PSU shroud of the showcase case (it used to sink through the case floor). */
export const DRIVE_BAY = v(hddBay(INST.mounts));

/** Visual centre of each draggable, relative to its own origin (case orientation): parts are centred on their origin. */
const ZERO = new Vector3();
export const VISUAL_CENTER: Record<StepId, Vector3> = {
  motherboard: ZERO,
  cpu: ZERO,
  cooler: ZERO,
  ram: ZERO,
  nvme: ZERO,
  mountBoard: ZERO,
  psu: ZERO,
  gpu: ZERO,
  storage: new Vector3(0, 0.013, 0),
  fans: ZERO,
  cables: ZERO,
};

/** Ghost box size per step (case orientation, metres). */
export const GHOST_SIZE: Record<StepId, [number, number, number]> = {
  motherboard: [0.014, 0.305, 0.244],
  cpu: [0.008, 0.042, 0.042],
  cooler: [0.155, 0.125, 0.125],
  ram: [0.036, 0.134, 0.04],
  nvme: [0.006, 0.024, 0.08],
  mountBoard: [0.014, 0.305, 0.244],
  psu: [0.15, 0.086, 0.16],
  gpu: [0.14, 0.058, 0.323],
  storage: [0.1016, 0.026, 0.147],
  fans: [0.026, 0.37, 0.122],
  cables: [0.16, 0.34, 0.3],
};

export interface Pose {
  position: Vector3;
  rotation: Quaternion;
}

/** Where the board assembly is right now (tray → mat → case). */
export function boardPose(installed: readonly StepId[]): Pose {
  if (installed.includes('mountBoard')) return { position: CASE_POS.clone(), rotation: CASE_ROT.clone() };
  if (installed.includes('motherboard')) return { position: BENCH_POS.clone(), rotation: BENCH_ROT.clone() };
  return { position: TRAY.motherboard.clone(), rotation: BENCH_ROT.clone() };
}

/** Orientation a step's part is carried in: board parts follow the board, the rest are in case orientation. */
export function stepRotation(step: StepId, installed: readonly StepId[]): Quaternion {
  if (step === 'motherboard') return BENCH_ROT.clone();
  if (step === 'mountBoard') return boardPose(installed).rotation;
  if (step === 'cpu' || step === 'cooler' || step === 'ram' || step === 'nvme') return boardPose(installed).rotation;
  return CASE_ROT.clone();
}

const local = (step: StepId) => (step === 'nvme' ? boardOffset('ssd') : boardOffset(step as PartId));

/** World position of a target's visual centre for the current progress. */
export function targetPosition(target: TargetId, installed: readonly StepId[]): Vector3 {
  const board = boardPose(installed);
  const onBoard = (step: StepId) => local(step).add(VISUAL_CENTER[step]).applyQuaternion(board.rotation).add(board.position);
  switch (target) {
    case 'mat':
      return BENCH_POS.clone().add(VISUAL_CENTER.motherboard.clone().applyQuaternion(BENCH_ROT));
    case 'socket':
      return onBoard('cpu');
    case 'cpuTop':
      return onBoard('cooler');
    case 'dimm':
      return onBoard('ram');
    case 'm2':
      return onBoard('nvme');
    case 'standoffs':
      return CASE_POS.clone().add(VISUAL_CENTER.mountBoard);
    case 'psuBay':
      return CASE.clone().add(AT.psu);
    case 'pcie':
      return CASE.clone().add(AT.gpu);
    case 'driveBay':
      return CASE.clone().add(DRIVE_BAY).add(VISUAL_CENTER.storage);
    case 'fanMounts':
      return CASE.clone().add(AT.fans);
    case 'headers':
      return CASE.clone().add(new Vector3(0.02, 0.02, 0));
  }
}

/** Where each part waits on the desk (visual centre, world). */
const Y = DESK_TOP;
export const TRAY: Record<StepId, Vector3> = {
  motherboard: new Vector3(-0.44, Y + 0.035, -0.12),
  cpu: new Vector3(-0.57, Y + 0.03, 0.21),
  cooler: new Vector3(-0.44, Y + 0.095, 0.2),
  ram: new Vector3(-0.3, Y + 0.045, 0.23),
  nvme: new Vector3(-0.18, Y + 0.025, 0.26),
  mountBoard: new Vector3(-0.44, Y + 0.035, -0.12),
  psu: new Vector3(-0.02, Y + 0.055, -0.2),
  gpu: new Vector3(-0.16, Y + 0.045, 0.04),
  storage: new Vector3(-0.05, Y + 0.025, 0.26),
  fans: new Vector3(0.16, Y + 0.2, -0.27),
  cables: new Vector3(-0.2, Y + 0.04, -0.16),
};

/** Snap radius: release within this distance of the right target installs the part. */
export const SNAP = 0.09;
/** Ghost guide appears inside this distance. */
export const NEAR = 0.24;
/** Released near another step's target = "wrong slot". */
export const WRONG = 0.07;
