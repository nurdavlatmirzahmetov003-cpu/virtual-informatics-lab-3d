/**
 * Schema for the data-driven hardware catalog (filled in Phase 4).
 * UI and the recommendation engine read products only through this shape —
 * no product logic is hard-coded in components.
 */
export type HardwareCategory =
  | 'monitor'
  | 'mouse'
  | 'keyboard'
  | 'headset'
  | 'case'
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'ssd'
  | 'psu'
  | 'cooling'
  | 'desk'
  | 'chair'
  | 'speakers';

export type PerformanceTier = 'entry' | 'mainstream' | 'performance' | 'enthusiast';
export type SetupPurpose = 'gaming' | 'study' | 'programming' | 'design3d' | 'streaming' | 'universal';

/** Where a price came from. `demo` must be shown to users as "Demo price". */
export type PriceSource = { kind: 'demo' } | { kind: 'store'; name: string; url: string };

export interface Compatibility {
  socket?: 'AM4' | 'AM5' | 'LGA1700' | 'LGA1851';
  memoryType?: 'DDR4' | 'DDR5';
  formFactor?: 'ATX' | 'mATX' | 'ITX' | 'E-ATX';
  /** Max supported form factor for cases. */
  supportsFormFactors?: ReadonlyArray<'ATX' | 'mATX' | 'ITX' | 'E-ATX'>;
  lengthMm?: number;
  maxGpuLengthMm?: number;
  tdpW?: number;
  recommendedPsuW?: number;
  psuW?: number;
  coolerHeightMm?: number;
  maxCoolerHeightMm?: number;
  radiatorMm?: number;
  maxRadiatorMm?: number;
}

export interface ColorOption {
  id: 'black' | 'white' | 'graphite' | 'silver' | (string & {});
  /** Linear-space tint applied to the base-color channel only. */
  hex: string;
}

export interface HardwareItem {
  id: string;
  category: HardwareCategory;
  brand: string;
  model: string;
  priceKZT: number;
  /** ISO date (YYYY-MM-DD). */
  priceUpdatedAt: string;
  priceSource: PriceSource;
  /** Specification values with a link to the official source page. */
  specifications: Record<string, string | number | boolean>;
  specSourceUrl?: string;
  compatibility: Compatibility;
  /** GLB under /assets/models, optimised by the asset pipeline. */
  modelPath?: string;
  thumbnail?: string;
  colors: ColorOption[];
  performanceTier: PerformanceTier;
  recommendedUse: SetupPurpose[];
}
