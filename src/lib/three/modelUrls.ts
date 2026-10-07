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
