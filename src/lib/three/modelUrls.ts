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

/**
 * Catalog products (V2-2a, `products/<id>.glb`) ship three levels from
 * scripts/optimize-assets.mjs: `<id>.glb` (≤ 2K textures, High/Ultra),
 * `<id>_lod1.glb` (Medium) and `<id>_lod2.glb` (Low).
 */
export function isTieredModel(file: string): boolean {
  return /(^|\/)products\/[^/]+\.glb$/.test(file) && !/_lod\d\.glb$/.test(file);
}

/**
 * Which file a model shows up close (`near`) and, if any, the lighter file
 * that stands in while it is small on screen (`far`).
 * lodBias: 0 High/Ultra, 1 Medium, 2 Low. `lightOnly`: the lightest level only.
 */
export function modelLevels(file: string, lodBias: number, lightOnly = false): { near: string; far: string | null } {
  if (isTieredModel(file)) {
    const tiers = [file, file.replace(/\.glb$/, '_lod1.glb'), file.replace(/\.glb$/, '_lod2.glb')];
    const i = lightOnly ? 2 : Math.min(2, Math.max(0, lodBias));
    return { near: tiers[i], far: i < 2 ? tiers[i + 1] : null };
  }
  const light = lodFile(file);
  if (!light) return { near: file, far: null };
  return lodBias >= 2 || lightOnly ? { near: light, far: null } : { near: file, far: light };
}
