/**
 * Validation of anything that comes back from a language model. Used on the
 * server before answering and again in the browser: only known purposes,
 * styles, categories and catalog ids survive; everything else is dropped.
 */
import { CATALOG_BY_ID } from '@/data/hardware/catalog';
import type { HardwareCategory, SetupPurpose } from '@/data/hardware/types';
import { BUDGET_LIMITS, CATEGORIES, PURPOSES, STYLES, type SetupStyle } from '@/data/studio/options';
import type { Build } from '@/lib/studio/build';
import type { AssistantRequest, WirelessDevice } from './types';

/** Shape the server returns (and asks the LLM for). */
export interface LlmAnswer {
  budget?: number;
  purposes?: SetupPurpose[];
  style?: SetupStyle;
  monitor?: AssistantRequest['monitor'];
  brands?: AssistantRequest['brands'];
  wireless?: WirelessDevice[];
  minRamGb?: number;
  minStorageTb?: number;
  include?: HardwareCategory[];
  exclude?: HardwareCategory[];
  /** Catalog ids per category the model recommends. */
  pins?: Build;
  /** Short remark for the user. */
  note?: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);
const listOf = <T extends string>(list: readonly T[], v: unknown): T[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is T => oneOf(list, x)))] : []);
const posNum = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max ? v : undefined);
const RESOLUTIONS = ['fhd', 'qhd', '4k'] as const;
const WIRELESS = ['mouse', 'keyboard', 'headset'] as const;

export function sanitizeLlmAnswer(raw: unknown): LlmAnswer | null {
  if (!isObj(raw)) return null;
  const out: LlmAnswer = {};
  const budget = posNum(raw.budget, BUDGET_LIMITS.max);
  if (budget && budget >= BUDGET_LIMITS.min) out.budget = Math.round(budget);
  const purposes = listOf(PURPOSES, raw.purposes);
  if (purposes.length) out.purposes = purposes;
  if (oneOf(STYLES, raw.style)) out.style = raw.style;
  if (isObj(raw.monitor)) {
    const m: NonNullable<LlmAnswer['monitor']> = {};
    const hz = posNum(raw.monitor.minHz, 1000);
    if (hz) m.minHz = Math.round(hz);
    if (oneOf(RESOLUTIONS, raw.monitor.resolution)) m.resolution = raw.monitor.resolution;
    if (raw.monitor.ultrawide === true) m.ultrawide = true;
    if (Object.keys(m).length) out.monitor = m;
  }
  if (isObj(raw.brands)) {
    const brands: NonNullable<LlmAnswer['brands']> = {};
    for (const [c, b] of Object.entries(raw.brands)) {
      if (oneOf(CATEGORIES, c) && typeof b === 'string' && /^[\w .!+-]{2,24}$/.test(b)) brands[c] = b.trim();
    }
    if (Object.keys(brands).length) out.brands = brands;
  }
  const wireless = listOf(WIRELESS, raw.wireless);
  if (wireless.length) out.wireless = wireless;
  const ram = posNum(raw.minRamGb, 256);
  if (ram) out.minRamGb = ram;
  const storage = posNum(raw.minStorageTb, 16);
  if (storage) out.minStorageTb = storage;
  const include = listOf(CATEGORIES, raw.include);
  if (include.length) out.include = include;
  const exclude = listOf(CATEGORIES, raw.exclude);
  if (exclude.length) out.exclude = exclude;
  if (isObj(raw.pins)) {
    const pins: Build = {};
    for (const [c, id] of Object.entries(raw.pins)) {
      if (oneOf(CATEGORIES, c) && typeof id === 'string' && CATALOG_BY_ID.get(id)?.category === c) pins[c] = id;
    }
    if (Object.keys(pins).length) out.pins = pins;
  }
  if (typeof raw.note === 'string') out.note = raw.note.slice(0, 600);
  return out;
}

/** Applies a validated LLM answer on top of the locally parsed request. */
export function mergeAnswer(base: AssistantRequest, answer: LlmAnswer): AssistantRequest {
  const purposes = answer.purposes?.length ? answer.purposes : base.purposes;
  return {
    ...base,
    budget: answer.budget ?? base.budget,
    purposes,
    purpose: purposes[0],
    style: answer.style ?? base.style,
    monitor: answer.monitor ? { ...base.monitor, ...answer.monitor } : base.monitor,
    brands: answer.brands ? { ...base.brands, ...answer.brands } : base.brands,
    wireless: answer.wireless ?? base.wireless,
    minRamGb: answer.minRamGb ?? base.minRamGb,
    minStorageTb: answer.minStorageTb ?? base.minStorageTb,
    include: answer.include ?? base.include,
    exclude: answer.exclude ?? base.exclude,
    pins: answer.pins,
  };
}
