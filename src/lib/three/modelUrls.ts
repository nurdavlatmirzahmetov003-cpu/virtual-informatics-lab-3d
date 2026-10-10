/**
 * Model URL conventions (no three.js / React imports, so Node tests can use it).
 *
 * `speakers.glb#speaker_left` loads `speakers.glb` (cached once, textures
 * shared) and shows node `speaker_left`.
 */
export function splitModelUrl(url: string): { file: string; node?: string } {
  const [file, node] = url.split('#');
  return { file, node: node || undefined };
}

/**
 * Models built with a lighter `<name>_lod1.glb` (scripts/optimize-assets.mjs):
 * fewer triangles and ≤ 256 px textures.
 */
export const LOD_MODELS: ReadonlySet<string> = new Set(['monitor_ultrawide', 'cooler_tower', 'headset_gaming', 'motherboard_x570', 'speakers', 'mouse_gaming']);

export function lodFile(file: string): string | null {
  const name = file.match(/([^/]+)\.glb$/)?.[1];
  return name && LOD_MODELS.has(name) ? file.replace(/\.glb$/, '_lod1.glb') : null;
}

/**
 * Models with a `<name>_hd.glb` close-up level (V2-1): same geometry, 2K KTX2
 * (UASTC) textures. Loaded on demand on High/Ultra when the model fills the
 * view, and only its textures are swapped in.
 */
export const HD_MODELS: ReadonlySet<string> = new Set([
  'keyboard_mech',
  'motherboard_x570',
  'cpu_am4',
  'ram_rgb',
  'cooler_tower',
  'gpu_triple_fan',
  'ssd_m2',
  'headset_gaming',
  'speakers',
]);

export function hdFile(file: string): string | null {
  const name = file.match(/([^/]+)\.glb$/)?.[1];
  return name && HD_MODELS.has(name) ? file.replace(/\.glb$/, '_hd.glb') : null;
}
