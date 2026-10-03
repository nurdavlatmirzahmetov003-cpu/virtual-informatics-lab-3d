/**
 * Setup Studio configuration vocabulary: categories, purposes, budgets,
 * styles and finishes. Labels live in locales (`studio.*`); colour values
 * here are what the 3D materials are tinted with.
 */
import type { HardwareCategory, SetupPurpose } from '@/data/hardware/types';

export const CATEGORY_GROUPS: ReadonlyArray<{ id: 'peripherals' | 'pc' | 'furniture'; categories: readonly HardwareCategory[] }> = [
  { id: 'peripherals', categories: ['monitor', 'keyboard', 'mouse', 'headset', 'speakers'] },
  { id: 'pc', categories: ['case', 'cpu', 'cooling', 'motherboard', 'ram', 'gpu', 'ssd', 'psu'] },
  { id: 'furniture', categories: ['desk', 'chair'] },
];

export const CATEGORIES: readonly HardwareCategory[] = CATEGORY_GROUPS.flatMap((g) => g.categories);

/**
 * Categories a working computer needs. The rest may stay empty: a CPU with
 * integrated graphics runs without a graphics card, and audio / furniture
 * are extras.
 */
export const REQUIRED_CATEGORIES: ReadonlySet<HardwareCategory> = new Set([
  'monitor',
  'keyboard',
  'mouse',
  'case',
  'cpu',
  'cooling',
  'motherboard',
  'ram',
  'ssd',
  'psu',
]);

export const PURPOSES: readonly SetupPurpose[] = ['gaming', 'study', 'programming', 'design3d', 'streaming', 'universal'];

export const BUDGET_PRESETS: readonly number[] = [300_000, 500_000, 800_000, 1_200_000, 2_000_000];
export const BUDGET_LIMITS = { min: 100_000, max: 10_000_000 } as const;

export type SetupStyle = 'black' | 'white' | 'rgb' | 'noRgb';
export const STYLES: readonly SetupStyle[] = ['black', 'white', 'rgb', 'noRgb'];

export type CaseFinish = 'black' | 'white' | 'graphite' | 'silver';
export type RgbMode = 'off' | 'white' | 'cyan' | 'blue' | 'purple' | 'red' | 'custom';
export type DeskSurface = 'darkWood' | 'lightWood' | 'black' | 'white';
export type PeripheralTheme = 'black' | 'white' | 'mixed';

export interface Finish {
  case: CaseFinish;
  rgb: RgbMode;
  /** #rrggbb used when rgb = 'custom'. */
  rgbCustom: string;
  desk: DeskSurface;
  peripherals: PeripheralTheme;
}

export const CASE_FINISHES: Record<CaseFinish, { color: string; metalness: number; roughness: number }> = {
  black: { color: '#17181c', metalness: 0.45, roughness: 0.5 },
  white: { color: '#e4e6ea', metalness: 0.15, roughness: 0.42 },
  graphite: { color: '#3c3f45', metalness: 0.55, roughness: 0.45 },
  silver: { color: '#b9bdc4', metalness: 0.85, roughness: 0.3 },
};

export const RGB_COLORS: Record<Exclude<RgbMode, 'off' | 'custom'>, string> = {
  white: '#f2f6ff',
  cyan: '#38d6f5',
  blue: '#3b6bff',
  purple: '#a855f7',
  red: '#ff3b4f',
};

export const RGB_MODES: readonly RgbMode[] = ['off', 'white', 'cyan', 'blue', 'purple', 'red', 'custom'];
export const CASE_FINISH_IDS: readonly CaseFinish[] = ['black', 'white', 'graphite', 'silver'];
export const DESK_SURFACES: readonly DeskSurface[] = ['darkWood', 'lightWood', 'black', 'white'];
export const PERIPHERAL_THEMES: readonly PeripheralTheme[] = ['black', 'white', 'mixed'];

/** Finish a visual style starts from; the colour step can override every part. */
export const STYLE_FINISH: Record<SetupStyle, Omit<Finish, 'rgbCustom'>> = {
  black: { case: 'black', rgb: 'off', desk: 'darkWood', peripherals: 'black' },
  white: { case: 'white', rgb: 'white', desk: 'white', peripherals: 'white' },
  rgb: { case: 'black', rgb: 'cyan', desk: 'black', peripherals: 'black' },
  noRgb: { case: 'graphite', rgb: 'off', desk: 'lightWood', peripherals: 'mixed' },
};
