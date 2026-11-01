/**
 * V4 §11: two fingers pan the scene on touch screens (one finger turns it,
 * a pinch zooms; OrbitControls' default touches). Mouse users keep the
 * framed view without panning, as before. A pan never loses the subject:
 * the camera is pulled back so its aim stays near where it was pointed.
 */
import type { Vector3 } from 'three';

/** A finger is the main pointer (phones, tablets). Read once per scene. */
export const touchPan = () => typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false);

/**
 * Keeps `target` within `radius` of `anchor`, moving `position` by the same
 * amount so the view keeps its angle (a pan moves both).
 */
export function keepNear(target: Vector3, position: Vector3, anchor: Vector3, radius: number) {
  const d = target.distanceTo(anchor);
  if (d <= radius) return;
  const back = anchor.clone().sub(target).multiplyScalar(1 - radius / d);
  target.add(back);
  position.add(back);
}
