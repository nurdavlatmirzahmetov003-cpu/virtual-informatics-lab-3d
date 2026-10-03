import { productsIn } from '@/data/hardware/catalog';
import type { HardwareCategory, HardwareItem, PerformanceTier, SetupPurpose } from '@/data/hardware/types';
import type { SetupStyle } from '@/data/studio/options';
import { resolveBuild, type Build, type ResolvedBuild } from './build';
import { checkCompatibility } from './compatibility';
import { estimatePower } from './power';

const TIER: Record<PerformanceTier, number> = { entry: 1, mainstream: 2, performance: 3, enthusiast: 4 };

/** Share of the budget each part deserves for a purpose (renormalised over the parts in the build). */
const WEIGHTS: Record<SetupPurpose, Partial<Record<HardwareCategory, number>>> = {
  gaming: { gpu: 30, cpu: 13, monitor: 13, motherboard: 7, ram: 5, ssd: 4, psu: 5, case: 4, cooling: 3, keyboard: 4, mouse: 3, headset: 4, speakers: 2, desk: 6, chair: 7 },
  study: { cpu: 18, monitor: 18, motherboard: 13, ram: 9, ssd: 8, psu: 7, case: 6, cooling: 3, keyboard: 4, mouse: 3, gpu: 14, headset: 4, speakers: 4, desk: 8, chair: 8 },
  programming: { cpu: 20, monitor: 18, motherboard: 10, ram: 11, ssd: 8, psu: 6, case: 5, cooling: 4, keyboard: 7, mouse: 3, gpu: 12, headset: 3, speakers: 3, desk: 9, chair: 10 },
  design3d: { gpu: 24, cpu: 20, monitor: 14, motherboard: 8, ram: 10, ssd: 7, psu: 6, case: 4, cooling: 5, keyboard: 3, mouse: 3, headset: 2, speakers: 3, desk: 7, chair: 8 },
  streaming: { gpu: 24, cpu: 18, monitor: 11, motherboard: 7, ram: 7, ssd: 5, psu: 6, case: 4, cooling: 4, keyboard: 4, mouse: 3, headset: 6, speakers: 2, desk: 6, chair: 7 },
  universal: { gpu: 20, cpu: 16, monitor: 14, motherboard: 8, ram: 7, ssd: 6, psu: 6, case: 5, cooling: 3, keyboard: 4, mouse: 3, headset: 4, speakers: 4, desk: 7, chair: 8 },
};

/** Parts given up first when the budget runs short. */
const DOWNGRADE_ORDER: readonly HardwareCategory[] = [
  'chair', 'desk', 'speakers', 'headset', 'monitor', 'gpu', 'keyboard', 'mouse', 'cpu',
  'ram', 'ssd', 'case', 'cooling', 'motherboard', 'psu',
];
const DROPPABLE: readonly HardwareCategory[] = ['chair', 'desk', 'speakers', 'headset', 'gpu'];

/** Where leftover budget goes first, per purpose. */
const UPGRADE_ORDER: Record<SetupPurpose, readonly HardwareCategory[]> = {
  gaming: ['gpu', 'monitor', 'cpu', 'ram', 'ssd', 'headset', 'mouse', 'keyboard', 'chair', 'desk'],
  study: ['monitor', 'cpu', 'ram', 'ssd', 'keyboard', 'chair', 'desk'],
  programming: ['cpu', 'ram', 'monitor', 'keyboard', 'ssd', 'chair', 'desk', 'gpu'],
  design3d: ['gpu', 'cpu', 'ram', 'monitor', 'ssd', 'chair', 'desk'],
  streaming: ['gpu', 'cpu', 'headset', 'monitor', 'ram', 'ssd', 'chair', 'desk'],
  universal: ['gpu', 'cpu', 'monitor', 'ram', 'ssd', 'keyboard', 'mouse', 'chair', 'desk'],
};

function score(p: HardwareItem, purpose: SetupPurpose, style: SetupStyle) {
  let s = TIER[p.performanceTier] * 10;
  if (p.recommendedUse.includes(purpose)) s += 8;
  if (style === 'white' && p.colors.includes('white')) s += 4;
  if (style === 'rgb' && p.rgb) s += 3;
  if (style === 'noRgb' && !p.rgb) s += 2;
  return s;
}

const byPrice = (a: HardwareItem, b: HardwareItem) => a.priceKZT - b.priceKZT;

/** Best-scoring product within the allowance, else the cheapest that qualifies. */
function pick(candidates: HardwareItem[], allowance: number, purpose: SetupPurpose, style: SetupStyle) {
  if (candidates.length === 0) return undefined;
  const affordable = candidates.filter((p) => p.priceKZT <= allowance);
  if (affordable.length === 0) return [...candidates].sort(byPrice)[0];
  return affordable.reduce((best, p) => {
    const d = score(p, purpose, style) - score(best, purpose, style);
    return d > 0 || (d === 0 && p.priceKZT > best.priceKZT) ? p : best;
  });
}

/** Optional parts that make sense for this purpose and budget. */
function partsFor(purpose: SetupPurpose, budget: number): Set<HardwareCategory> {
  const parts = new Set<HardwareCategory>(['monitor', 'keyboard', 'mouse', 'case', 'cpu', 'cooling', 'motherboard', 'ram', 'ssd', 'psu']);
  const graphicsHeavy = purpose === 'gaming' || purpose === 'design3d' || purpose === 'streaming';
  if (graphicsHeavy || budget >= 800_000) parts.add('gpu');
  if (budget >= 500_000) parts.add(purpose === 'gaming' || purpose === 'streaming' ? 'headset' : 'speakers');
  if (budget >= 900_000) parts.add('headset').add('speakers');
  if (budget >= 1_200_000) parts.add('desk').add('chair');
  return parts;
}

const hardErrors = (build: Build) => checkCompatibility(resolveBuild(build)).filter((i) => i.severity === 'error');

/**
 * Deterministic starter build for a purpose, budget and style: allocates the
 * budget by purpose weights, picks parts in dependency order so they fit
 * together (socket → board → memory, GPU → case → PSU), then trades down —
 * and finally drops extras — until the total fits the budget, and finally
 * spends any leftover on the parts that matter most for the purpose.
 */
export function recommendBuild(purpose: SetupPurpose, budget: number, style: SetupStyle): Build {
  const parts = partsFor(purpose, budget);
  const weights = WEIGHTS[purpose];
  const weightSum = [...parts].reduce((s, c) => s + (weights[c] ?? 0), 0);
  const allowance = (c: HardwareCategory) => (budget * (weights[c] ?? 0)) / weightSum;
  const chosen: ResolvedBuild = {};
  const choose = (c: HardwareCategory, candidates: HardwareItem[]) => {
    const p = pick(candidates, allowance(c), purpose, style);
    if (p) chosen[c] = p;
  };

  // A tight budget cannot also carry a graphics card: start from a CPU with integrated graphics.
  const tight = budget < 700_000;
  choose('cpu', productsIn('cpu').filter((c) => !tight || c.compatibility.integratedGraphics));
  const socket = chosen.cpu?.compatibility.socket;
  // Without a graphics card the CPU must have integrated graphics.
  if (chosen.cpu && !chosen.cpu.compatibility.integratedGraphics) parts.add('gpu');
  choose('motherboard', productsIn('motherboard').filter((b) => b.compatibility.socket === socket));
  const memoryType = chosen.motherboard?.compatibility.memoryType;
  choose('ram', productsIn('ram').filter((r) => r.compatibility.memoryType === memoryType));
  if (parts.has('gpu')) choose('gpu', productsIn('gpu'));
  const gpuLength = chosen.gpu?.compatibility.lengthMm ?? 0;
  const formFactor = chosen.motherboard?.compatibility.formFactor;
  choose('case', productsIn('case').filter((c) => (c.compatibility.maxGpuLengthMm ?? 0) >= gpuLength && (!formFactor || c.compatibility.supportsFormFactors?.includes(formFactor))));
  const maxCooler = chosen.case?.compatibility.maxCoolerHeightMm ?? Infinity;
  const heat = chosen.cpu?.compatibility.peakPowerW ?? 0;
  choose('cooling', productsIn('cooling').filter((k) =>
    (!socket || k.compatibility.sockets?.includes(socket)) &&
    (k.compatibility.coolerHeightMm ?? 0) <= maxCooler &&
    (!k.compatibility.coolingCapacityW || k.compatibility.coolingCapacityW >= heat)));
  const { requiredW } = estimatePower(chosen);
  choose('psu', productsIn('psu').filter((p) => (p.compatibility.psuW ?? 0) >= requiredW));
  for (const c of ['ssd', 'monitor', 'keyboard', 'mouse', 'headset', 'speakers', 'desk', 'chair'] as const) {
    if (parts.has(c)) choose(c, productsIn(c));
  }

  const build: Build = {};
  for (const [c, p] of Object.entries(chosen) as Array<[HardwareCategory, HardwareItem]>) build[c] = p.id;
  const total = () => Object.values(resolveBuild(build)).reduce((s, p) => s + (p?.priceKZT ?? 0), 0);

  // Trade down one step at a time, never introducing an incompatibility.
  const tradeDown = () => {
    for (let pass = 0; pass < 40 && total() > budget; pass++) {
      let changed = false;
      for (const c of DOWNGRADE_ORDER) {
        if (total() <= budget) break;
        const current = build[c] ? resolveBuild({ [c]: build[c] })[c] : undefined;
        if (!current) continue;
        const cheaper = productsIn(c).filter((p) => p.priceKZT < current.priceKZT).sort(byPrice).reverse();
        for (const alt of cheaper) {
          const trial = { ...build, [c]: alt.id };
          if (hardErrors(trial).length === 0) {
            build[c] = alt.id;
            changed = true;
            break;
          }
        }
      }
      if (!changed) break;
    }
  };
  tradeDown();

  for (const c of DROPPABLE) {
    if (total() <= budget) break;
    if (!build[c]) continue;
    const trial = { ...build, [c]: null };
    if (hardErrors(trial).length === 0) build[c] = null;
  }
  // A dropped graphics card no longer needs the big power supply.
  tradeDown();

  // Spend what is left: step the purpose's key parts up, fixing the PSU when a stronger part needs more power.
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;
    for (const c of UPGRADE_ORDER[purpose]) {
      const current = build[c] ? resolveBuild({ [c]: build[c] })[c] : undefined;
      if (!current) continue;
      const better = productsIn(c)
        .filter((p) => score(p, purpose, style) > score(current, purpose, style) && p.priceKZT > current.priceKZT)
        .sort(byPrice);
      for (const alt of better) {
        const trial: Build = { ...build, [c]: alt.id };
        const errors = hardErrors(trial);
        if (errors.length === 1 && errors[0].code === 'psuWeak') {
          const need = estimatePower(resolveBuild(trial)).requiredW;
          const psu = productsIn('psu').filter((p) => (p.compatibility.psuW ?? 0) >= need).sort(byPrice)[0];
          if (psu) trial.psu = psu.id;
        }
        const cost = Object.values(resolveBuild(trial)).reduce((sum, p) => sum + (p?.priceKZT ?? 0), 0);
        if (cost <= budget && hardErrors(trial).length === 0) {
          Object.assign(build, trial);
          changed = true;
          break;
        }
      }
    }
    if (!changed) break;
  }

  for (const c of ['gpu', 'headset', 'speakers', 'desk', 'chair'] as const) if (build[c] === undefined) build[c] = null;
  return build;
}
