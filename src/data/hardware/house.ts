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
  compatibility: { supportsFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 360, maxCoolerHeightMm: 168, maxRadiatorMm: 360 },
  modelPath: 'products/case-bitlab-aero.glb',
  colors: ['white'],
  rgb: true,
  performanceTier: 'mainstream',
  recommendedUse: ['gaming', 'study', 'programming', 'design3d', 'streaming', 'universal'],
};
