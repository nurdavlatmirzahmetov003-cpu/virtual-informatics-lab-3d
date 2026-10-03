/**
 * Named camera states. Every scene and scroll chapter refers to these names
 * instead of hard-coding positions, so a shot is tuned in exactly one place.
 *
 * World units are metres. The desk top sits at y ≈ 0.75 with its centre at
 * the origin. Values for the desk/PC shots are first-pass estimates and are
 * tuned in Phase 2 once the real models are placed.
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
  HOME_WIDE: { position: [-2.4, 1.7, 3.6], target: [0.15, 0.95, 0], fov: 38, minDistance: 1.6, maxDistance: 7 },
  DESK: { position: [-1.2, 1.45, 2.1], target: [0.1, 0.9, 0], fov: 36 },
  MONITOR: { position: [0.1, 1.25, 1.05], target: [0, 1.1, -0.25], fov: 32, focusDistance: 1.3 },
  KEYBOARD: { position: [-0.2, 1.15, 0.75], target: [-0.05, 0.78, 0.2], fov: 32, focusDistance: 0.65 },
  MOUSE: { position: [0.62, 0.98, 0.55], target: [0.42, 0.78, 0.22], fov: 30, focusDistance: 0.4 },
  PC_EXTERIOR: { position: [0.2, 1.35, 1.4], target: [0.98, 1.1, -0.18], fov: 34, focusDistance: 1.4 },
  PC_INTERIOR: { position: [0.45, 1.2, -0.15], target: [1.0, 1.15, -0.18], fov: 40, focusDistance: 0.6 },
  MOTHERBOARD: { position: [0.6, 1.2, -0.12], target: [1.12, 1.15, -0.18], fov: 36 },
  CPU: { position: [0.78, 1.32, -0.2], target: [1.12, 1.28, -0.23], fov: 30 },
  GPU: { position: [0.7, 1.0, -0.05], target: [1.08, 1.02, -0.2], fov: 32 },
  RAM: { position: [0.78, 1.3, -0.02], target: [1.12, 1.28, -0.05], fov: 30 },
  SSD: { position: [0.8, 1.18, -0.1], target: [1.13, 1.16, -0.16], fov: 28 },
  PSU: { position: [0.7, 0.85, 0.05], target: [1.0, 0.72, -0.16], fov: 32 },
  FINAL_SETUP: { position: [-2.0, 1.6, 3.0], target: [0.2, 1.0, 0], fov: 36 },
};
