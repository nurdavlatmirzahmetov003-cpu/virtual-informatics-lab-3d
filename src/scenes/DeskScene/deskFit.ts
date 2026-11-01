/**
 * What stands on the desk is laid out from the desk's measured top surface
 * (V4 §1.2): the mat shrinks and moves until it keeps a margin from every
 * edge, and the system unit moves in until its feet are on the top.
 */
import { DESK_TOPS } from '@/data/hardware/partGeometry.generated';
import type { DeskTop } from '@/data/hardware/mountTypes';
import type { HardwareItem } from '@/data/hardware/types';
import { DESK, DESK_TOP, MAT, PC } from './layout';

/** Clearance between the mat and any desk edge. */
export const MAT_MARGIN = 0.02;
/** Clearance between the system unit's shell and the desk edge. */
export const PC_MARGIN = 0.015;

/** The procedural desk (scenes/DeskScene/models/Desk.tsx) is centred on the origin. */
export const DEFAULT_DESK_TOP: DeskTop = { y: DESK_TOP, min: [-DESK.width / 2, -DESK.depth / 2], max: [DESK.width / 2, DESK.depth / 2] };

export function deskTopOf(desk?: HardwareItem | null): DeskTop {
  return (desk && DESK_TOPS[desk.modelPath]) || DEFAULT_DESK_TOP;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface MatLayout {
  position: readonly [number, number, number];
  size: readonly [number, number];
}

/** The mat's place on `top`: the house layout, shrunk and shifted only as far as the edges demand. */
export function matOn(top: DeskTop): MatLayout {
  const room = [top.max[0] - top.min[0] - 2 * MAT_MARGIN, top.max[1] - top.min[1] - 2 * MAT_MARGIN];
  const size = [Math.min(MAT.size[0], room[0]), Math.min(MAT.size[1], room[1])] as const;
  const x = clamp(MAT.position[0], top.min[0] + MAT_MARGIN + size[0] / 2, top.max[0] - MAT_MARGIN - size[0] / 2);
  const z = clamp(MAT.position[2], top.min[1] + MAT_MARGIN + size[1] / 2, top.max[1] - MAT_MARGIN - size[1] / 2);
  return { position: [x, top.y, z], size };
}

/** How far the system unit (half-width × half-depth of its shell) must move from PC.position to stand fully on `top`. */
export function pcShiftOn(top: DeskTop, half: readonly [number, number] = [PC.size[0] / 2, PC.size[2] / 2]): [number, number] {
  const x = clamp(PC.position[0], top.min[0] + PC_MARGIN + half[0], top.max[0] - PC_MARGIN - half[0]);
  const z = clamp(PC.position[2], top.min[1] + PC_MARGIN + half[1], top.max[1] - PC_MARGIN - half[1]);
  return [x - PC.position[0], z - PC.position[2]];
}
