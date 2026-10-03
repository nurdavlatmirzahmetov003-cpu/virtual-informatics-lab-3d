export type WebGLSupport = 'webgl2' | 'webgl' | 'none';

let cached: WebGLSupport | undefined;

export function detectWebGL(): WebGLSupport {
  if (cached) return cached;
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      gl2.getExtension('WEBGL_lose_context')?.loseContext();
      return (cached = 'webgl2');
    }
    const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
    cached = gl ? 'webgl' : 'none';
  } catch {
    cached = 'none';
  }
  return cached;
}

/** WebGPU is a progressive enhancement only — WebGL stays the baseline. */
export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}
