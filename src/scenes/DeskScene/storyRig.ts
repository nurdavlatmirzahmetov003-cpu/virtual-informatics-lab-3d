import { Vector3 } from 'three';
import { CAMERA_STATES, type CameraStateName } from '@/data/camera/cameraStates';

/**
 * Mutable values driven by the single GSAP scroll timeline and read every
 * frame by the 3D scene. Keeping them outside React avoids re-rendering the
 * scene on scroll; GSAP writes, `useFrame` reads.
 */
export interface StoryRig {
  // camera
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
  fov: number;
  // depth of field
  fx: number;
  fy: number;
  fz: number;
  bokeh: number;
  // object choreography
  monitorYaw: number;
  keyboardLift: number;
  keyboardTilt: number;
  mouseSpin: number;
  mouseLift: number;
  pcGlow: number;
  /** PC chapters: glass panel removal, interior lighting, exploded layout (0…1). */
  glassOpen: number;
  interior: number;
  explode: number;
  /** 0 on the opening hero shot → 1 once the first chapter is reached. */
  heroBlend: number;
  /** 0 → 1 across the whole story (progress bar, idle motion). */
  progress: number;
}

export function cameraValues(name: CameraStateName) {
  const s = CAMERA_STATES[name];
  return {
    px: s.position[0],
    py: s.position[1],
    pz: s.position[2],
    tx: s.target[0],
    ty: s.target[1],
    tz: s.target[2],
    fov: s.fov,
  };
}

export const storyRig: StoryRig = {
  ...cameraValues('HOME_WIDE'),
  fx: 0,
  fy: 0.9,
  fz: 0,
  bokeh: 0,
  monitorYaw: 0,
  keyboardLift: 0,
  keyboardTilt: 0,
  mouseSpin: 0,
  mouseLift: 0,
  pcGlow: 0,
  glassOpen: 0,
  interior: 0,
  explode: 0,
  heroBlend: 0,
  progress: 0,
};

/**
 * Camera hand-over between the story camera and the free 360° camera: whoever
 * owns the camera writes its current look-at target here every frame.
 */
export const cameraHandoff = { target: new Vector3() };
