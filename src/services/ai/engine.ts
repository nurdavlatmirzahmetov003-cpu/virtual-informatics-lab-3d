/**
 * Catalog-only recommendation engine. Turns a structured AssistantRequest
 * into a compatible build of catalog ids as close to the budget as possible
 * (lib/studio/recommend.ts does the budget allocation and trade-offs).
 * The LLM path uses the same function — an LLM never picks the final build
 * on its own.
 */
import { CATALOG_BY_ID, productsIn } from '@/data/hardware/catalog';
import type { HardwareCategory, HardwareItem } from '@/data/hardware/types';
import { CATEGORIES } from '@/data/studio/options';
import { resolveBuild, type Build } from '@/lib/studio/build';
import { checkCompatibility } from '@/lib/studio/compatibility';
import { recommendBuild, type RecommendOptions } from '@/lib/studio/recommend';
import { explainBuild } from './explain';
import type { AssistantRequest, AssistantSuggestion, BuildChange } from './types';

const WIRELESS_VALUES = new Set(['lightspeed', 'lightspeedBt', 'lightspeedBtJack', 'boltBt', 'btWired', 'dongleBt']);
const spec = (p: HardwareItem, key: string) => p.specifications.find((s) => s.key === key)?.value;
const num = (v: unknown) => (typeof v === 'number' ? v : Number.parseFloat(String(v ?? '').replace(',', '.')));

/** "32 GB (2 × 16 GB)" → 32; "2 TB" in the model name → 2048 GB. */
const ramGb = (p: HardwareItem) => num(spec(p, 'capacity'));
function storageTb(p: HardwareItem) {
  const m = p.model.match(/(\d+(?:[.,]\d+)?)\s*(TB|GB)/i);
  if (!m) return 0;
  const v = num(m[1]);
  return m[2].toUpperCase() === 'TB' ? v : v / 1024;
}

const brandMatches = (p: HardwareItem, brand: string) => {
  const b = brand.toLowerCase();
  return p.brand.toLowerCase().startsWith(b) || p.brand.toLowerCase().includes(b) || p.model.toLowerCase().includes(b);
};

interface Requirement {
  category: HardwareCategory;
  /** Human label for the "not in the catalog" notice. */
  label: string;
  test: (p: HardwareItem) => boolean;
}

/** Every concrete wish becomes a product filter for its category. */
function requirements(r: AssistantRequest): Requirement[] {
  const list: Requirement[] = [];
  const m = r.monitor;
  if (m?.minHz) list.push({ category: 'monitor', label: `${m.minHz} Hz`, test: (p) => num(spec(p, 'refresh')) >= m.minHz! });
  if (m?.resolution === '4k') list.push({ category: 'monitor', label: '4K', test: (p) => String(spec(p, 'resolution')).includes('3840') });
  if (m?.resolution === 'qhd') list.push({ category: 'monitor', label: '2560 × 1440', test: (p) => /2560|3440/.test(String(spec(p, 'resolution'))) });
  if (m?.ultrawide) list.push({ category: 'monitor', label: '21:9', test: (p) => String(spec(p, 'resolution')).includes('21:9') });
  for (const [category, brand] of Object.entries(r.brands ?? {}) as Array<[HardwareCategory, string]>) {
    list.push({ category, label: brand, test: (p) => brandMatches(p, brand) });
  }
  for (const device of r.wireless ?? []) {
    list.push({ category: device, label: 'wireless', test: (p) => WIRELESS_VALUES.has(String(spec(p, 'connection'))) });
  }
  if (r.minRamGb) list.push({ category: 'ram', label: `${r.minRamGb} GB RAM`, test: (p) => ramGb(p) >= r.minRamGb! });
  if (r.minStorageTb) list.push({ category: 'ssd', label: `${r.minStorageTb} TB SSD`, test: (p) => storageTb(p) >= r.minStorageTb! - 0.01 });
  return list;
}

const price = (build: Build) => Object.values(resolveBuild(build)).reduce((sum, p) => sum + (p?.priceKZT ?? 0), 0);
const hardErrors = (build: Build) => checkCompatibility(resolveBuild(build)).filter((i) => i.severity === 'error');

/** Catalog ids only, each in its own category, and no compatibility errors. */
export function isValidBuild(build: Build): boolean {
  const idsValid = Object.entries(build).every(([category, id]) => id === null || id === undefined || CATALOG_BY_ID.get(id)?.category === category);
  return idsValid && hardErrors(build).length === 0;
}

export function suggestSetup(request: AssistantRequest): AssistantSuggestion {
  const reqs = requirements(request);
  const unavailable: string[] = [];
  const allow: NonNullable<RecommendOptions['allow']> = {};
  for (const category of new Set(reqs.map((q) => q.category))) {
    const products = productsIn(category);
    // keep every wish some product meets, then drop the latest ones until a product meets them all together
    const kept = reqs.filter((q) => q.category === category);
    const dropped = kept.filter((q) => !products.some(q.test));
    const active = kept.filter((q) => !dropped.includes(q));
    while (active.length && !products.some((p) => active.every((q) => q.test(p)))) dropped.push(active.pop()!);
    unavailable.push(...dropped.map((q) => q.label));
    if (active.length) allow[category] = (p: HardwareItem) => active.every((q) => q.test(p));
  }
  // A brand or capacity wish on an optional part means the user wants that part.
  const include = new Set(request.include ?? []);
  for (const c of Object.keys(allow) as HardwareCategory[]) if (c === 'headset' || c === 'speakers' || c === 'desk' || c === 'chair' || c === 'gpu') include.add(c);
  for (const c of request.exclude ?? []) include.delete(c);

  // LLM-chosen ids must exist and fit their category to be honoured.
  const pins: Build = {};
  for (const [category, id] of Object.entries(request.pins ?? {}) as Array<[HardwareCategory, string | null]>) {
    if (id && CATALOG_BY_ID.get(id)?.category === category) pins[category] = id;
  }

  const options: RecommendOptions = { secondary: request.purposes.slice(1), allow, include: [...include], exclude: request.exclude };
  const make = (budget: number): Build => {
    const build = { ...recommendBuild(request.purpose, budget, request.style, options), ...pins };
    for (const c of request.exclude ?? []) build[c] = null;
    return build;
  };
  // Pinned / required parts can push the total over: re-plan with less room until it fits.
  let available = request.budget;
  let build = make(available);
  for (let i = 0; i < 12 && price(build) > request.budget && available > 100_000; i++) {
    available = Math.max(100_000, available - (price(build) - request.budget));
    build = make(available);
  }
  // Pins that break compatibility are dropped in favour of the engine's choice.
  if (hardErrors(build).length && Object.keys(pins).length) {
    build = { ...recommendBuild(request.purpose, request.budget, request.style, options) };
  }
  const total = price(build);
  return {
    request,
    build,
    total,
    overBudget: Math.max(0, total - request.budget),
    unavailable: [...new Set(unavailable)],
    explanations: explainBuild(resolveBuild(build), request, total),
  };
}

/** What the suggestion changes in the user's current build. */
export function diffBuilds(current: Build, next: Build): BuildChange[] {
  return CATEGORIES.flatMap((category) => {
    const from = current[category] ?? null;
    const to = next[category] ?? null;
    return from === to ? [] : [{ category, from, to }];
  });
}
