/**
 * Colour theme. `system` follows the OS (prefers-color-scheme); the resolved
 * theme is written to <html data-theme> so CSS tokens switch, and 3D scenes
 * read their palette from `SCENE_PALETTES`.
 */
export const THEME_MODES = ['dark', 'light', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export type Theme = 'dark' | 'light';

export const isThemeMode = (v: unknown): v is ThemeMode => THEME_MODES.includes(v as ThemeMode);

export function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const resolveTheme = (mode: ThemeMode, system: Theme = systemTheme()): Theme => (mode === 'system' ? system : mode);

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

export const nextThemeMode = (mode: ThemeMode): ThemeMode => THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];

/** Room / backdrop colours for the 3D scenes per theme (night lab / day lab). */
export interface ScenePalette {
  /** Backdrop gradient, top → bottom (screen space). */
  skyTop: string;
  skyBottom: string;
  /** Fog blends distant geometry into the backdrop's lower half. */
  fog: string;
  wall: string;
  wallPanel: string;
  slats: string;
  floorTint: string;
  /** Renderer exposure and image-based lighting boost. */
  exposure: number;
  envBoost: number;
}

export const SCENE_PALETTES: Record<Theme, ScenePalette> = {
  dark: {
    skyTop: '#28356a',
    skyBottom: '#141a36',
    fog: '#18203f',
    wall: '#2b3252',
    wallPanel: '#1f2541',
    slats: '#8a6644',
    floorTint: '#5d6680',
    exposure: 1.22,
    envBoost: 1.35,
  },
  light: {
    skyTop: '#e6f1ff',
    skyBottom: '#d3dff5',
    fog: '#d9e3f4',
    wall: '#e4eaf5',
    wallPanel: '#cbd6e8',
    slats: '#b98a5e',
    floorTint: '#a9b2c4',
    exposure: 1.1,
    envBoost: 1.5,
  },
};
