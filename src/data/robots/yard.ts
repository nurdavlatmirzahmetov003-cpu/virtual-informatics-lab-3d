/**
 * V4 §4.3: the robots' yard (lab zone 11) laid out in the zone's own space —
 * origin at the platform centre, +X right, +Z towards the visitor, metres,
 * the platform top at y = 0. The 3D yard draws these, the walking grid is
 * built from them (lib/robots/grid.ts) and scripts/robots.test.mjs checks
 * that nothing overlaps and every robot can reach its spots.
 *
 *   back edge:   ten garages in a row, each with its robot's colour and name
 *   left:        a mini football pitch with two goals
 *   middle:      the play corner (a dance floor of glowing tiles)
 *   right:       the work spots — crates, a workbench, a bookshelf, a board
 *   front right: the rest lounge (sofa, beanbag, low table, a plant)
 */
import { zoneById } from '@/data/lab/zones';
import { ROBOT_IDS, type RobotId } from './roster';

export type P2 = readonly [number, number];

const zone = zoneById('robots');
/** Half sizes of the platform (m). */
export const YARD_HALF: P2 = [zone.size[0] / 2, zone.size[1] / 2];

/** An axis-aligned box on the platform the robots walk round (centre, half size, height). */
export interface Prop {
  id: string;
  at: P2;
  half: P2;
  h: number;
}

/* ── garages ───────────────────────────────────────────────── */

export const GARAGE = { width: 0.72, depth: 0.7, height: 1.25, wall: 0.04 } as const;

export interface Garage {
  robot: RobotId;
  /** Centre of the charging pad, where the robot sleeps (facing +Z, out of the garage). */
  pad: P2;
  /** Just outside the door: where a robot turns in. */
  door: P2;
}

const GARAGE_Z = -YARD_HALF[1] + GARAGE.depth / 2 + 0.02;
export const GARAGES: readonly Garage[] = ROBOT_IDS.map((robot, i) => {
  const x = -YARD_HALF[0] + GARAGE.width / 2 + i * GARAGE.width;
  return { robot, pad: [x, GARAGE_Z], door: [x, GARAGE_Z + GARAGE.depth / 2 + 0.28] };
});
export const garageOf = (id: RobotId) => GARAGES.find((g) => g.robot === id)!;

/** The garages' walls as obstacles: the back wall and a divider between neighbours (open at the front). */
export function garageWalls(): Prop[] {
  const back = -YARD_HALF[1] + 0.02 + GARAGE.wall / 2;
  const walls: Prop[] = [{ id: 'garage-back', at: [0, back], half: [YARD_HALF[0], GARAGE.wall / 2], h: GARAGE.height }];
  for (let i = 0; i <= GARAGES.length; i++) {
    const x = -YARD_HALF[0] + i * GARAGE.width;
    walls.push({ id: `garage-divider-${i}`, at: [Math.min(YARD_HALF[0] - 0.02, Math.max(-YARD_HALF[0] + 0.02, x)), GARAGE_Z], half: [GARAGE.wall / 2, GARAGE.depth / 2], h: GARAGE.height });
  }
  return walls;
}

/* ── football ──────────────────────────────────────────────── */

/** The pitch's playing area (lines) and its goals, centred on the goal lines at its short ends. */
export const PITCH = {
  min: [-3.25, -0.7] as P2,
  max: [0.15, 1.2] as P2,
  goalWidth: 0.8,
  goalDepth: 0.2,
  goalHeight: 0.42,
  ball: 0.07,
} as const;
export const PITCH_CENTRE: P2 = [(PITCH.min[0] + PITCH.max[0]) / 2, (PITCH.min[1] + PITCH.max[1]) / 2];

/** The goals' frames as obstacles (side bars and the back net); the mouth is open. */
export function goalFrames(): Prop[] {
  const z = PITCH_CENTRE[1];
  const w = PITCH.goalWidth / 2;
  return [-1, 1].flatMap((side) => {
    const line = side < 0 ? PITCH.min[0] : PITCH.max[0];
    const back = line + side * PITCH.goalDepth;
    return [
      { id: `goal-${side}-net`, at: [back, z] as P2, half: [0.02, w] as P2, h: PITCH.goalHeight },
      { id: `goal-${side}-top`, at: [line + (side * PITCH.goalDepth) / 2, z - w] as P2, half: [PITCH.goalDepth / 2, 0.02] as P2, h: PITCH.goalHeight },
      { id: `goal-${side}-bottom`, at: [line + (side * PITCH.goalDepth) / 2, z + w] as P2, half: [PITCH.goalDepth / 2, 0.02] as P2, h: PITCH.goalHeight },
    ];
  });
}

/* ── play corner, work props, lounge ───────────────────────── */

export const DANCE_FLOOR = { at: [1.3, -0.4] as P2, tiles: 3, tile: 0.38 } as const;

export const PROPS: readonly Prop[] = [
  { id: 'crates', at: [3.3, -0.56], half: [0.2, 0.17], h: 0.5 },
  { id: 'workbench', at: [3.38, 0.0], half: [0.17, 0.28], h: 0.5 },
  { id: 'bookshelf', at: [3.45, 0.62], half: [0.13, 0.3], h: 0.95 },
  { id: 'board', at: [1.9, 0.5], half: [0.3, 0.04], h: 1.0 },
  { id: 'terminal', at: [-3.47, 1.8], half: [0.1, 0.1], h: 1.0 },
  { id: 'sofa', at: [3.28, 1.43], half: [0.24, 0.36], h: 0.55 },
  { id: 'table', at: [2.75, 1.2], half: [0.12, 0.12], h: 0.3 },
  { id: 'beanbag', at: [1.95, 1.92], half: [0.2, 0.2], h: 0.35 },
  { id: 'plant', at: [3.4, 1.98], half: [0.14, 0.14], h: 1.2 },
];

/** Every obstacle on the platform. */
export const YARD_OBSTACLES: readonly Prop[] = [...garageWalls(), ...goalFrames(), ...PROPS];

/* ── where each robot works and rests ─────────────────────── */

export interface WorkPlan {
  /** Spots it walks between while working; at each it plays its work animation for `dwell` seconds. */
  spots: readonly P2[];
  dwell: number;
  /** Which way it faces at its spots (yaw, radians; 0 = +Z, towards the visitor). */
  face?: number;
}

export const WORK: Record<RobotId, WorkPlan> = {
  // greets at the yard's front walkway and shows the way along it
  guide: { spots: [[-2.6, 1.8], [0.55, 1.8]], dwell: 5, face: 0 },
  // a vacuuming loop round the pitch and the walkways
  cleaner: { spots: [[-2.9, -1.07], [0.5, -1.07], [0.8, 0.6], [0.45, 1.85], [-1.2, 1.85], [-2.9, 1.85]], dwell: 1.5 },
  // from the crates to the workbench with a box, and back
  cargo: { spots: [[2.78, -0.56], [2.55, 0.33]], dwell: 3, face: Math.PI / 2 },
  // presents towards the lounge, by the pitch
  presenter: { spots: [[0.75, 0.9]], dwell: 8, face: Math.PI / 2 },
  // builds at the workbench
  assembler: { spots: [[2.95, 0.0]], dwell: 9, face: Math.PI / 2 },
  // explains at the board
  teacher: { spots: [[2.15, 0.82], [1.65, 0.82]], dwell: 6, face: 0 },
  // watches the safety terminal and walks the front
  guard: { spots: [[-3.1, 1.65], [-0.6, 1.8]], dwell: 6, face: -Math.PI / 2 },
  // walks along the garages and checks them
  inspector: { spots: [[1.0, -1.07], [2.4, -1.07], [-1.0, -1.07], [-2.4, -1.07]], dwell: 3, face: Math.PI },
  // at the bookshelf
  librarian: { spots: [[3.06, 0.62]], dwell: 7, face: -Math.PI / 2 },
  // on the pitch's touchline with the whistle
  coach: { spots: [[-1.55, 1.45], [-1.55, -0.62]], dwell: 5, face: Math.PI },
};

/** Seats in the lounge, where robots rest after a match. */
export const LOUNGE_SPOTS: readonly P2[] = [
  [2.2, 1.3],
  [2.45, 1.85],
  [1.4, 1.85],
  [1.35, 1.35],
  [1.0, 1.85],
];
