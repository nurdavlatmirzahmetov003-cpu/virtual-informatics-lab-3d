import { CATEGORIES } from '@/data/studio/options';
import type { HardwareCategory, HardwareItem } from '@/data/hardware/types';
import type { ResolvedBuild } from './build';

export interface PriceLine {
  category: HardwareCategory;
  product: HardwareItem;
}

export interface PriceSummary {
  lines: PriceLine[];
  total: number;
  /** Positive when the build costs more than the budget. */
  overBudget: number;
  /** Share of the budget used (0…∞). */
  budgetUse: number;
  /** True when any price is an unverified demo value. */
  hasDemoPrices: boolean;
}

export function priceBuild(build: ResolvedBuild, budget: number): PriceSummary {
  const lines = CATEGORIES.flatMap((category) => {
    const product = build[category];
    return product ? [{ category, product }] : [];
  });
  const total = lines.reduce((sum, l) => sum + l.product.priceKZT, 0);
  return {
    lines,
    total,
    overBudget: Math.max(0, total - budget),
    budgetUse: budget > 0 ? total / budget : 0,
    hasDemoPrices: lines.some((l) => l.product.priceSource.kind === 'demo'),
  };
}

/** "1 234 567 ₸" — narrow no-break spaces as thousands separators, independent of locale. */
export function formatKZT(value: number): string {
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')}\u00a0₸`;
}
