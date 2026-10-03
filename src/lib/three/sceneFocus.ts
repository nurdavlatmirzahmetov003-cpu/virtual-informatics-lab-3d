import { Vector3 } from 'three';

/**
 * Focus point for the depth-of-field effect. A scene enables it and moves
 * `target` every frame; PostEffects reads it (High/Ultra only).
 */
export const sceneFocus = {
  enabled: false,
  target: new Vector3(),
  bokehScale: 0,
};
