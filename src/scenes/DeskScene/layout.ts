/**
 * Physical layout of the desk setup (metres). Desk top surface is at
 * DESK_TOP; +Z points toward the viewer, −Z toward the wall.
 * Camera states in `data/camera/cameraStates.ts` are framed on these values.
 */
export const DESK_TOP = 0.75;
export const DESK = { width: 1.8, depth: 0.8, thickness: 0.035 } as const;

export const MAT = { position: [0.04, DESK_TOP, 0.16], size: [0.92, 0.38], thickness: 0.003 } as const;
export const MAT_TOP = DESK_TOP + MAT.thickness;

export const MONITOR = { position: [-0.06, DESK_TOP, -0.2], panelCenterY: 0.32 } as const;
export const KEYBOARD = { position: [-0.1, MAT_TOP, 0.17] } as const;
export const MOUSE = { position: [0.31, MAT_TOP, 0.18], yaw: -0.14 } as const;
export const PC = { position: [0.67, DESK_TOP, -0.06], size: [0.23, 0.47, 0.45], feet: 0.014 } as const;
/**
 * Where the person at the desk sits (eye height), V4 §2.1. Every device's
 * front (+Z of its model, lib/three/modelFront.ts) turns towards it within
 * ±25° — scripts/orientation.test.mjs.
 */
export const SEAT = { position: [MONITOR.position[0], 1.15, 0.85] } as const;

/** Toe-in of the speakers: a little short of aiming straight at the seat. */
const TOE_IN = 0.26;
/** Speakers mirror each other about the monitor's centre. */
const SPEAKER_GAP = 0.42;
export const SPEAKERS = {
  left: { position: [MONITOR.position[0] - SPEAKER_GAP, DESK_TOP, -0.2], yaw: TOE_IN },
  right: { position: [MONITOR.position[0] + SPEAKER_GAP, DESK_TOP, -0.2], yaw: -TOE_IN },
} as const;
export const HEADSET = { position: [-0.74, DESK_TOP, 0.06], yaw: 0.5 } as const;
/** Desk lamp at the back left corner; its arm reaches forward (+Z) over the desk. */
export const LAMP = { position: [-0.8, DESK_TOP, -0.3], yaw: 0.75 } as const;

/** Yaw (radians about +Y) that turns a model's +Z front from `position` towards the seat. */
export function yawToSeat(position: readonly [number, number, number]) {
  return Math.atan2(SEAT.position[0] - position[0], SEAT.position[2] - position[2]);
}

/** World-space centre of the PC case (useful for camera framing / lights). */
export const PC_CENTER = [PC.position[0], DESK_TOP + PC.feet + PC.size[1] / 2, PC.position[2]] as const;

/**
 * renderOrder of the big surfaces behind everything (floor, wall, slats, desk
 * top, rug). three.js draws opaque objects in material-creation order, not by
 * depth: models that load after the room would be drawn over a fully shaded
 * floor and wall. Drawing the backdrop last lets the depth test skip every
 * pixel already covered by a model (measured: ≈ +8 % FPS on Low).
 */
export const BACKDROP_ORDER = 1;
