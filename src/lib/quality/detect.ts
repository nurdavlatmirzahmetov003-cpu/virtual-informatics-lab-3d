import type { QualityLevel } from './presets';

export interface GpuInfo {
  renderer: string;
  vendor: string;
}

export interface DeviceProfile {
  gpu?: GpuInfo;
  cores: number;
  memoryGB?: number;
  mobile: boolean;
  dpr: number;
  screenPixels: number;
}

/** Reads the unmasked GPU renderer string where the browser exposes it. */
export function readGpuInfo(): GpuInfo | undefined {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return undefined;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    const vendor = String(gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : gl.VENDOR) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { renderer, vendor };
  } catch {
    return undefined;
  }
}

export function readDeviceProfile(): DeviceProfile {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const smallScreen = Math.min(window.screen.width, window.screen.height) < 820;
  return {
    gpu: readGpuInfo(),
    cores: nav.hardwareConcurrency || 4,
    memoryGB: nav.deviceMemory,
    mobile: coarse && smallScreen,
    dpr: window.devicePixelRatio || 1,
    screenPixels: window.screen.width * window.screen.height * (window.devicePixelRatio || 1) ** 2,
  };
}

const SOFTWARE = /swiftshader|llvmpipe|software|basic render/i;
const STRONG_GPU = /rtx|radeon rx [5-9]\d{3}|radeon rx \d{4}|arc a[57]\d{2}|apple m[1-9] (pro|max|ultra)|apple m[2-9]/i;
const MID_GPU = /gtx|radeon|apple m1|apple gpu|iris xe|arc/i;
const WEAK_GPU = /intel.*(hd|uhd)|mali|adreno [1-5]\d{2}|powervr|videocore/i;

/**
 * Conservative default. "Ultra" is never chosen automatically — it is an
 * explicit opt-in. Runtime FPS monitoring can step further down later.
 */
export function detectQuality(profile: DeviceProfile = readDeviceProfile()): QualityLevel {
  const renderer = profile.gpu?.renderer ?? '';

  if (SOFTWARE.test(renderer)) return 'low';
  // Phones get the light scene (light models, ≤ 512 px textures, no shadows):
  // a few MB instead of ~10, cool and smooth on a small screen. Tablets are
  // not "mobile" here and get Medium. The user can always pick a higher level.
  if (profile.mobile) return 'low';
  if (profile.memoryGB !== undefined && profile.memoryGB <= 2) return 'low';
  if (WEAK_GPU.test(renderer)) return 'medium';
  if (STRONG_GPU.test(renderer)) return 'high';
  if (MID_GPU.test(renderer)) return profile.cores >= 6 ? 'high' : 'medium';
  return profile.cores >= 8 ? 'high' : 'medium';
}
