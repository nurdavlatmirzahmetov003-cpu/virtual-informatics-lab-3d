/**
 * One convention for every model (V4 §2.1): its front faces +Z, towards the
 * chair and the camera, standing on y = 0. A few source models were exported
 * another way round; their correction lives here and is applied once when the
 * file is loaded (`fitModel`), so no scene turns a model to hide it.
 *
 * Keyed by the model file's name without level suffix (`_lod1`, `_hd`); the
 * value is the Euler rotation (radians, XYZ) that brings its front to +Z.
 * Checked by scripts/orientation.test.mjs.
 */
export const MODEL_FRONT: Readonly<Record<string, readonly [number, number, number]>> = {
  // the driver looks along +X in the source file
  'spk-creative-pebble-v3': [0, -Math.PI / 2, 0],
  // lies on its back: the bass port and terminals point up, the drivers forward-down
  'spk-edifier-r1280db': [-Math.PI / 2, 0, 0],
};

/** `…/products/spk-edifier-r1280db_lod1.glb` → `spk-edifier-r1280db` */
export function modelIdOf(file: string) {
  return (file.split('/').pop() ?? file).replace(/\.(glb|gltf)$/, '').replace(/_(lod\d|hd)$/, '');
}

/** The rotation that turns this model's front to +Z, or null when it already faces it. */
export function frontRotationOf(file: string) {
  return MODEL_FRONT[modelIdOf(file)] ?? null;
}
