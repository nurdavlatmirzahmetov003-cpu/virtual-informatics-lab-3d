export const QUALITY_LEVELS = ['low', 'medium', 'high', 'ultra'] as const;
export type QualityLevel = (typeof QUALITY_LEVELS)[number];
export type QualityMode = QualityLevel | 'auto';

export interface QualityPreset {
  level: QualityLevel;
  /** devicePixelRatio clamp: [min, max] passed to the R3F canvas. */
  dpr: [number, number];
  /** Context attribute — changing it remounts the canvas. */
  antialias: boolean;
  shadows: boolean;
  shadowMapSize: number;
  /** Post-processing chain (bloom, vignette, tone mapping). */
  postprocessing: boolean;
  /** MSAA samples for the post-processing composer. */
  multisampling: number;
  /**
   * SMAA pass in the post chain (on top of MSAA): smooths specular and
   * sub-pixel edges MSAA cannot (thin fins, grilles). Needs post-processing.
   */
  smaa: boolean;
  /** Anisotropic filtering for model and scene textures (capped by the GPU). */
  anisotropy: number;
  bloom: boolean;
  /** Focus blur on the active object (scroll story). */
  depthOfField: boolean;
  /**
   * Physical glass (renders the scene a second time for refraction — ~60 ms on
   * integrated GPUs, so Ultra only); otherwise alpha-blended reflective glass.
   */
  transmission: boolean;
  /** Resolution scale of the transmission (glass refraction) buffer. */
  transmissionScale: number;
  /** RectAreaLight for screen light spill; otherwise a cheap point light. */
  areaLights: boolean;
  /** Resolution of the generated environment cube map. */
  environmentResolution: number;
  /** 0: light model only when small on screen (< ~55 px); 1: < 90 px; 2 (Low): light models only. */
  lodBias: number;
  /**
   * Longest texture side uploaded to the GPU. GLB textures are ≤ 1024 px from
   * the pipeline and the desk wood is 2048 px, so only Low (512) downsizes.
   */
  maxTextureSize: 512 | 1024 | 2048;
  contactShadowResolution: number;
  /** 2K close-up textures (`_hd.glb`), loaded on demand when a model fills the view. */
  hdTextures: boolean;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    level: 'low',
    dpr: [0.75, 1],
    // MSAA is cheap at DPR ≤ 1 and removes the worst staircase edges (AUDIT_V2 A1)
    antialias: true,
    shadows: false,
    shadowMapSize: 512,
    postprocessing: false,
    multisampling: 0,
    smaa: false,
    anisotropy: 4,
    bloom: false,
    depthOfField: false,
    transmission: false,
    transmissionScale: 0.5,
    areaLights: false,
    environmentResolution: 128,
    lodBias: 2,
    maxTextureSize: 512,
    contactShadowResolution: 256,
    hdTextures: false,
  },
  medium: {
    level: 'medium',
    dpr: [1, 1.25],
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    postprocessing: false,
    multisampling: 0,
    smaa: false,
    anisotropy: 8,
    bloom: false,
    depthOfField: false,
    transmission: false,
    transmissionScale: 0.5,
    areaLights: false,
    environmentResolution: 256,
    lodBias: 1,
    maxTextureSize: 2048,
    contactShadowResolution: 512,
    hdTextures: false,
  },
  high: {
    level: 'high',
    // High is auto-picked only for discrete GPUs: render HiDPI screens at up to 2×
    dpr: [1, 2],
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    postprocessing: true,
    multisampling: 4,
    smaa: true,
    anisotropy: 16,
    bloom: true,
    depthOfField: true,
    transmission: false,
    transmissionScale: 0.5,
    areaLights: true,
    environmentResolution: 512,
    lodBias: 0,
    maxTextureSize: 2048,
    contactShadowResolution: 1024,
    hdTextures: true,
  },
  ultra: {
    level: 'ultra',
    dpr: [1, 2],
    antialias: true,
    shadows: true,
    shadowMapSize: 4096,
    postprocessing: true,
    multisampling: 8,
    smaa: true,
    anisotropy: 16,
    bloom: true,
    depthOfField: true,
    transmission: true,
    transmissionScale: 1,
    areaLights: true,
    environmentResolution: 1024,
    lodBias: 0,
    maxTextureSize: 2048,
    contactShadowResolution: 2048,
    hdTextures: true,
  },
};

export function stepQuality(level: QualityLevel, delta: -1 | 1): QualityLevel {
  const i = QUALITY_LEVELS.indexOf(level) + delta;
  return QUALITY_LEVELS[Math.min(QUALITY_LEVELS.length - 1, Math.max(0, i))];
}

export function isQualityMode(value: unknown): value is QualityMode {
  return value === 'auto' || (QUALITY_LEVELS as readonly unknown[]).includes(value);
}
