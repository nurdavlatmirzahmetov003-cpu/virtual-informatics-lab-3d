import { CASE_DESIGNS, capacityOf, type CaseDesign } from '@/scenes/DeskScene/pc/caseDesigns';
import type { FinishId, HardwareItem, PerformanceTier, SetupPurpose } from './types';

/**
 * The Setup Studio cases (V4 §1.4): BitLab's own models, one per design in
 * caseDesigns.ts (built by scripts/blender/make-showcase.py, CC0). Their
 * specifications and compatibility are read off the same mounts the scene
 * installs parts on, so a case never promises room it does not have. BitLab
 * lettering, no brand logos; prices are demo prices.
 */
const CHECKED = '2026-10-26';

const FINISH: Record<CaseDesign['finish'], FinishId> = { white: 'white', black: 'black', grey: 'graphite', pink: 'pink', wood: 'wood' };

function tier(d: CaseDesign): PerformanceTier {
  if (d.priceKZT >= 100_000) return 'enthusiast';
  if (d.priceKZT >= 60_000) return 'performance';
  if (d.priceKZT >= 45_000) return 'mainstream';
  return 'entry';
}

const USE: Record<PerformanceTier, readonly SetupPurpose[]> = {
  entry: ['study', 'programming', 'universal'],
  mainstream: ['gaming', 'study', 'programming', 'universal'],
  performance: ['gaming', 'design3d', 'streaming', 'programming', 'universal'],
  enthusiast: ['gaming', 'design3d', 'streaming'],
};

export const BITLAB_CASES: readonly HardwareItem[] = CASE_DESIGNS.map((d) => {
  const c = capacityOf(d);
  const t = tier(d);
  return {
    id: d.id,
    category: 'case',
    brand: 'BitLab',
    model: d.name,
    priceKZT: d.priceKZT,
    priceUpdatedAt: CHECKED,
    priceSource: { kind: 'demo' },
    specSourceUrl: '',
    specCheckedAt: CHECKED,
    specifications: [
      { key: 'boards', value: d.formFactors.join(' / ') },
      { key: 'maxGpu', value: c.maxGpuLengthMm, unit: 'mm' },
      { key: 'maxCooler', value: c.maxCoolerHeightMm, unit: 'mm' },
      { key: 'fans', value: `${c.fans} × 120 mm ARGB` },
    ],
    compatibility: { supportsFormFactors: d.formFactors, maxGpuLengthMm: c.maxGpuLengthMm, maxCoolerHeightMm: c.maxCoolerHeightMm, maxRadiatorMm: c.maxRadiatorMm },
    modelPath: `products/${d.id}.glb`,
    colors: [FINISH[d.finish]],
    rgb: true,
    performanceTier: t,
    recommendedUse: USE[t],
  };
});
