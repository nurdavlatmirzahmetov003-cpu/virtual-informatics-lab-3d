/**
 * "Other models" (0.37): which Setup Studio catalog category a lab device
 * belongs to, the catalog products of that category that have their own 3D
 * model, and the rows of the spec comparison. Pure data and functions.
 */
import { CATALOG } from '@/data/hardware/catalog';
import type { HardwareCategory, HardwareItem, SpecEntry } from '@/data/hardware/types';

export const DEVICE_CATEGORY: Readonly<Record<string, HardwareCategory>> = {
  monitor: 'monitor',
  keyboard: 'keyboard',
  mouse: 'mouse',
  headset: 'headset',
  speakers: 'speakers',
  case: 'case',
  gpu: 'gpu',
  cpu: 'cpu',
  motherboard: 'motherboard',
  ram: 'ram',
  psu: 'psu',
  cooler_air: 'cooling',
  cooler_liquid: 'cooling',
  ssd_sata: 'ssd',
  ssd_nvme: 'ssd',
};

const hasOwnModel = (p: HardwareItem) => /^products\/[^/]+\.glb$/.test(p.modelPath);

/** Catalog products a device can be compared with (own 3D model), cheapest first; empty when there is no choice. */
export function variantsOf(deviceId: string): HardwareItem[] {
  const category = DEVICE_CATEGORY[deviceId];
  if (!category) return [];
  const list = CATALOG.filter((p) => p.category === category && hasOwnModel(p)).sort((a, b) => a.priceKZT - b.priceKZT);
  return list.length > 1 ? list : [];
}

export interface ComparisonRow {
  key: string;
  /** One cell per product, in the same order; null when that product does not list the spec. */
  cells: (SpecEntry | null)[];
}

/** Spec rows in the order they first appear; a spec only one product lists is left out (nothing to compare). */
export function comparisonRows(products: readonly HardwareItem[]): ComparisonRow[] {
  const keys: string[] = [];
  for (const p of products) for (const s of p.specifications) if (!keys.includes(s.key)) keys.push(s.key);
  return keys
    .map((key) => ({ key, cells: products.map((p) => p.specifications.find((s) => s.key === key) ?? null) }))
    .filter((r) => r.cells.filter(Boolean).length > 1);
}

/** Number of catalog products with their own model: what "Other models" can show in all. */
export const productModelCount = () => CATALOG.filter(hasOwnModel).length;
