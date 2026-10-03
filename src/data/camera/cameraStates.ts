/**
 * Named camera states. Every scene and scroll chapter refers to these names
 * instead of hard-coding positions, so a shot is tuned in exactly one place.
 *
 * World units are metres. The desk top sits at y = 0.75 with its centre at
 * the origin (see scenes/DeskScene/layout.ts).
 */
export type Vec3 = readonly [number, number, number];

export interface CameraState {
  position: Vec3;
  target: Vec3;
  fov: number;
  /** Depth-of-field focus distance (m) used by the post chain in Phase 2. */
  focusDistance?: number;
  /** Optional orbit limits applied while this state is active. */
  minDistance?: number;
  maxDistance?: number;
}

export const CAMERA_STATE_NAMES = [
  'HOME_WIDE',
  'DESK',
  'MONITOR',
  'KEYBOARD',
  'MOUSE',
  'PC_EXTERIOR',
  'PC_INTERIOR',
  'EXPLODED',
  'MOTHERBOARD',
  'CPU',
  'GPU',
  'RAM',
  'SSD',
  'PSU',
  'FINAL_SETUP',
] as const;

export type CameraStateName = (typeof CAMERA_STATE_NAMES)[number];

export const CAMERA_STATES: Record<CameraStateName, CameraState> = {
  // Scroll chapters 1–5 (tuned against scenes/DeskScene/layout.ts)
  HOME_WIDE: { position: [-1.4, 1.5, 2.3], target: [-0.34, 0.93, 0], fov: 36, minDistance: 1.2, maxDistance: 5 },
  MONITOR: { position: [0.02, 1.17, 1.2], target: [0.17, 1.07, -0.2], fov: 34, focusDistance: 1.4 },
  KEYBOARD: { position: [-0.1, 1.19, 0.87], target: [0.04, 0.77, 0.15], fov: 34, focusDistance: 0.85 },
  MOUSE: { position: [0.12, 0.98, 0.66], target: [0.238, 0.78, 0.18], fov: 28, focusDistance: 0.53 },
  PC_EXTERIOR: { position: [-0.09, 1.2, 1.09], target: [0.46, 1.0, -0.06], fov: 34, focusDistance: 1.28 },
  // Interior / component shots — first-pass values, tuned in the next session
  DESK: { position: [-1.0, 1.35, 1.6], target: [-0.1, 0.9, 0], fov: 36 },
  PC_INTERIOR: { position: [0.06, 1.17, 0.42], target: [0.66, 1.0, -0.09], fov: 36, focusDistance: 0.85 },
  EXPLODED: { position: [-0.5, 1.32, 0.96], target: [0.14, 1.04, -0.08], fov: 38, focusDistance: 1.1 },
  MOTHERBOARD: { position: [0.42, 1.12, -0.06], target: [0.77, 1.05, -0.14], fov: 36 },
  CPU: { position: [0.52, 1.14, -0.1], target: [0.74, 1.12, -0.15], fov: 30 },
  GPU: { position: [0.45, 0.96, 0.05], target: [0.7, 1.0, -0.12], fov: 32 },
  RAM: { position: [0.52, 1.12, 0.02], target: [0.74, 1.12, -0.08], fov: 30 },
  SSD: { position: [0.52, 1.0, -0.02], target: [0.76, 0.98, -0.08], fov: 28 },
  PSU: { position: [0.42, 0.84, 0.1], target: [0.67, 0.82, -0.06], fov: 32 },
  FINAL_SETUP: { position: [-1.3, 1.46, 2.1], target: [-0.1, 0.95, 0], fov: 36 },
};
