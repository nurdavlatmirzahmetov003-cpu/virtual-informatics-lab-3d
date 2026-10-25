import { BITLAB_CASES } from './cases';
import type { HardwareItem } from './types';

/**
 * BitLab's own models (0.37): not retail products, so they stay out of the
 * Setup Studio catalog (no price, no recommendations); the home hero and the
 * labs build with them. The model is made by scripts/blender/make-bitlab-aero.py.
 */
export const BITLAB_AERO: HardwareItem = {
  id: 'case-bitlab-aero',
  category: 'case',
  brand: 'BitLab',
  model: 'Aero',
  priceKZT: 0,
  priceUpdatedAt: '2026-10-19',
  priceSource: { kind: 'demo' },
  specifications: [
    { key: 'boards', value: 'ATX / mATX / ITX' },
    { key: 'maxGpu', value: 360, unit: 'mm' },
    { key: 'maxCooler', value: 168, unit: 'mm' },
  ],
  specSourceUrl: '',
  specCheckedAt: '2026-10-19',
  compatibility: { supportsFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 360, maxCoolerHeightMm: 168, maxRadiatorMm: 280 },
  modelPath: 'products/case-bitlab-aero.glb',
  colors: ['white'],
  rgb: true,
  performanceTier: 'mainstream',
  recommendedUse: ['gaming', 'study', 'programming', 'design3d', 'streaming', 'universal'],
};

/**
 * The V4 showcase build (scripts/blender/make-showcase.py): a white
 * dual-chamber panoramic case with BitLab's own white board, card, RAM and
 * 360 mm AIO. Retail-like specifications, BitLab lettering instead of brand
 * logos. Real catalog parts fill the rest (CPU, SSD, PSU).
 */
const HOUSE = { priceKZT: 0, priceUpdatedAt: '2026-10-25', priceSource: { kind: 'demo' }, specSourceUrl: '', specCheckedAt: '2026-10-25', performanceTier: 'enthusiast', recommendedUse: ['gaming', 'study', 'programming', 'design3d', 'streaming', 'universal'] } as const;

/** The hero case: the white panoramic design of the Setup Studio catalog (cases.ts). */
export const BITLAB_PANORAMA: HardwareItem = BITLAB_CASES.find((c) => c.id === 'case-bitlab-panorama')!;

export const MB_BITLAB_AERO: HardwareItem = {
  ...HOUSE,
  id: 'mb-bitlab-aero',
  category: 'motherboard',
  brand: 'BitLab',
  model: 'B650E AERO',
  specifications: [
    { key: 'socket', value: 'AM5 (AMD B650E)' },
    { key: 'formFactor', value: 'ATX' },
    { key: 'memory', value: '4 × DDR5' },
    { key: 'm2', value: '1 × PCIe 5.0 + 1 × PCIe 4.0' },
  ],
  compatibility: { socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX' },
  modelPath: 'products/mb-bitlab-aero.glb',
  colors: ['white'],
};

export const GPU_BITLAB_AERO: HardwareItem = {
  ...HOUSE,
  id: 'gpu-bitlab-aero',
  category: 'gpu',
  brand: 'BitLab',
  model: 'AERO 16G',
  specifications: [
    { key: 'vram', value: '16 GB GDDR7' },
    { key: 'tgp', value: 320, unit: 'w' },
    { key: 'length', value: 322, unit: 'mm' },
    { key: 'psu', value: 850, unit: 'w' },
  ],
  compatibility: { lengthMm: 322, peakPowerW: 320, recommendedPsuW: 850 },
  modelPath: 'products/gpu-bitlab-aero.glb',
  colors: ['white'],
  rgb: true,
};

export const RAM_BITLAB_AERO: HardwareItem = {
  ...HOUSE,
  id: 'ram-bitlab-aero',
  category: 'ram',
  brand: 'BitLab',
  model: 'AERO RGB DDR5-6000 32 GB (2 × 16 GB)',
  specifications: [
    { key: 'capacity', value: '32 GB (2 × 16 GB)' },
    { key: 'memType', value: 'DDR5' },
    { key: 'speed', value: 6000, unit: 'mts' },
    { key: 'timings', value: 'CL30, 1.35 V' },
  ],
  compatibility: { memoryType: 'DDR5' },
  modelPath: 'products/ram-bitlab-aero.glb',
  colors: ['white'],
  rgb: true,
};

export const COOL_BITLAB_AERO: HardwareItem = {
  ...HOUSE,
  id: 'cool-bitlab-aero-360',
  category: 'cooling',
  brand: 'BitLab',
  model: 'AERO 360 ARGB',
  specifications: [
    { key: 'coolerType', value: 'aio', translate: true },
    { key: 'radiator', value: 360, unit: 'mm' },
    { key: 'sockets', value: 'AM5 / AM4 / LGA1851 / LGA1700' },
  ],
  compatibility: { sockets: ['AM5', 'LGA1700', 'LGA1851'], radiatorMm: 360, coolingCapacityW: 300 },
  modelPath: 'products/cool-bitlab-aero-360.glb',
  colors: ['white'],
  rgb: true,
};

export const PSU_BITLAB_AERO: HardwareItem = {
  ...HOUSE,
  id: 'psu-bitlab-aero',
  category: 'psu',
  brand: 'BitLab',
  model: 'AERO 850 W',
  specifications: [
    { key: 'power', value: 850, unit: 'w' },
    { key: 'efficiency', value: '80 PLUS Platinum' },
    { key: 'modular', value: 'modularFull', translate: true },
    { key: 'formFactor', value: 'ATX 3.1' },
  ],
  compatibility: { psuW: 850 },
  modelPath: 'products/psu-bitlab-aero.glb',
  colors: ['white'],
};

/** Not in the Studio catalog (the panoramic case is: see cases.ts). */
export const HOUSE_PARTS: readonly HardwareItem[] = [BITLAB_AERO, MB_BITLAB_AERO, GPU_BITLAB_AERO, RAM_BITLAB_AERO, COOL_BITLAB_AERO, PSU_BITLAB_AERO];
