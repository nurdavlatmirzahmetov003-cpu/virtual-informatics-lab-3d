import { CATALOG_BY_ID } from '@/data/hardware/catalog';
import type { HardwareCategory, HardwareItem } from '@/data/hardware/types';

/** Selected product id per category; `null` = deliberately left out. */
export type Build = Partial<Record<HardwareCategory, string | null>>;
export type ResolvedBuild = Partial<Record<HardwareCategory, HardwareItem>>;

/** Looks every id up in the catalog; unknown ids (old saves) are dropped. */
export function resolveBuild(build: Build): ResolvedBuild {
  const out: ResolvedBuild = {};
  for (const [category, id] of Object.entries(build) as Array<[HardwareCategory, string | null | undefined]>) {
    const product = id ? CATALOG_BY_ID.get(id) : undefined;
    if (product && product.category === category) out[category] = product;
  }
  return out;
}
