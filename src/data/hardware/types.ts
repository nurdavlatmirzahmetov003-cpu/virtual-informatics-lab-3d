/**
 * Schema of the data-driven hardware catalog. UI, the 3D studio and the
 * compatibility / pricing / recommendation logic (src/lib/studio) read
 * products only through this shape — no product logic lives in components.
 */
export type HardwareCategory =
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'headset'
  | 'speakers'
  | 'desk'
  | 'chair'
  | 'case'
  | 'cpu'
  | 'cooling'
  | 'motherboard'
  | 'ram'
  | 'gpu'
  | 'ssd'
  | 'psu';

export type PerformanceTier = 'entry' | 'mainstream' | 'performance' | 'enthusiast';
export type SetupPurpose = 'gaming' | 'study' | 'programming' | 'design3d' | 'streaming' | 'universal';

export type Socket = 'AM5' | 'LGA1700' | 'LGA1851';
export type MemoryType = 'DDR4' | 'DDR5';
export type BoardFormFactor = 'E-ATX' | 'ATX' | 'mATX' | 'ITX';

/**
 * Where a price came from. `demo` is an illustrative value that could not be
 * verified against a Kazakhstan store and must be labelled "Demo price".
 */
export type PriceSource = { kind: 'demo' } | { kind: 'store'; name: string; url: string };

/** Only the fields a category needs are set (see lib/studio/compatibility.ts). */
export interface Compatibility {
  /** CPU / motherboard socket. */
  socket?: Socket;
  /** Cooler mounting support. */
  sockets?: readonly Socket[];
  /** RAM kit type, or the type a motherboard's DIMM slots take. */
  memoryType?: MemoryType;
  /** Motherboard form factor. */
  formFactor?: BoardFormFactor;
  /** Case: motherboard form factors that fit. */
  supportsFormFactors?: readonly BoardFormFactor[];
  /** CPU: has integrated graphics (can run without a graphics card). */
  integratedGraphics?: boolean;
  /** CPU default TDP / processor base power (W). */
  tdpW?: number;
  /** Peak power draw: CPU max turbo power, GPU total graphics/board power (W). */
  peakPowerW?: number;
  /** GPU: minimum system PSU stated by the GPU vendor (W). */
  recommendedPsuW?: number;
  /** PSU rated output (W). */
  psuW?: number;
  /** GPU card length (mm). */
  lengthMm?: number;
  /** Case: longest graphics card that fits (mm). */
  maxGpuLengthMm?: number;
  /** Air cooler height (mm). */
  coolerHeightMm?: number;
  /** Case: tallest air cooler that fits (mm). */
  maxCoolerHeightMm?: number;
  /** Air cooler rated heat load (W), when the maker publishes one. */
  coolingCapacityW?: number;
  /** All-in-one liquid cooler radiator size (mm). */
  radiatorMm?: number;
  /** Case: largest radiator it mounts (mm). */
  maxRadiatorMm?: number;
}

export type SpecUnit =
  | 'inch'
  | 'hz'
  | 'ms'
  | 'g'
  | 'mm'
  | 'cm'
  | 'kg'
  | 'h'
  | 'w'
  | 'ghz'
  | 'gb'
  | 'tb'
  | 'mts'
  | 'mbps'
  | 'dpi'
  | 'year';

/**
 * One displayed specification. Labels come from `studio.specs.<key>`, units
 * from `studio.units.<unit>`; `translate` marks a value that is a key under
 * `studio.values` (e.g. "wireless") instead of literal text.
 */
export interface SpecEntry {
  key: string;
  value: string | number;
  unit?: SpecUnit;
  translate?: boolean;
}

export type FinishId = 'black' | 'white' | 'graphite' | 'silver' | 'grey' | 'wood';

export interface HardwareItem {
  id: string;
  category: HardwareCategory;
  brand: string;
  model: string;
  priceKZT: number;
  /** ISO date (YYYY-MM-DD). */
  priceUpdatedAt: string;
  priceSource: PriceSource;
  specifications: readonly SpecEntry[];
  /** Official page the specifications were checked against. */
  specSourceUrl: string;
  /** ISO date the specifications were checked. */
  specCheckedAt: string;
  compatibility: Compatibility;
  /**
   * GLB under /assets/models (optimised by the asset pipeline) or
   * `procedural:<name>` for project-built stand-ins. Several products of a
   * category may share one model until per-product GLBs exist.
   */
  modelPath: string;
  /** Real-world size (m) along the category's fit axis, so the 3D scale matches the product. */
  modelSize?: number;
  /** Product photo/render; the UI falls back to a category icon. */
  thumbnail?: string;
  /** Finishes the manufacturer sells. */
  colors: readonly FinishId[];
  /** RGB lighting built in. */
  rgb?: boolean;
  performanceTier: PerformanceTier;
  recommendedUse: readonly SetupPurpose[];
}
