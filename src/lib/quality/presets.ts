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
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    level: 'low',
    dpr: [0.75, 1],
    antialias: false,
    shadows: false,
    shadowMapSize: 512,
    postprocessing: false,
    multisampling: 0,
    bloom: false,
    depthOfField: false,
    transmission: false,
    transmissionScale: 0.5,
    areaLights: false,
    environmentResolution: 128,
    lodBias: 2,
    maxTextureSize: 512,
    contactShadowResolution: 256,
  },
  medium: {
    level: 'medium',
    dpr: [1, 1.25],
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    postprocessing: false,
    multisampling: 0,
    bloom: false,
    depthOfField: false,
    transmission: false,
    transmissionScale: 0.5,
    areaLights: false,
    environmentResolution: 256,
    lodBias: 1,
    maxTextureSize: 2048,
    contactShadowResolution: 512,
  },
  high: {
    level: 'high',
    dpr: [1, 1.5],
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    postprocessing: true,
    multisampling: 4,
    bloom: true,
    depthOfField: true,
    transmission: false,
    transmissionScale: 0.5,
    areaLights: true,
    environmentResolution: 512,
    lodBias: 0,
    maxTextureSize: 2048,
    contactShadowResolution: 1024,
  },
  ultra: {
    level: 'ultra',
    dpr: [1, 2],
    antialias: true,
    shadows: true,
    shadowMapSize: 4096,
    postprocessing: true,
    multisampling: 8,
    bloom: true,
    depthOfField: true,
    transmission: true,
    transmissionScale: 1,
    areaLights: true,
    environmentResolution: 1024,
    lodBias: 0,
    maxTextureSize: 2048,
    contactShadowResolution: 2048,
  },
};

export function stepQuality(level: QualityLevel, delta: -1 | 1): QualityLevel {
  const i = QUALITY_LEVELS.indexOf(level) + delta;
  return QUALITY_LEVELS[Math.min(QUALITY_LEVELS.length - 1, Math.max(0, i))];
}

export function isQualityMode(value: unknown): value is QualityMode {
  return value === 'auto' || (QUALITY_LEVELS as readonly unknown[]).includes(value);
}
