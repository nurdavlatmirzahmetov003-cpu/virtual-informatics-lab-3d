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
    skyTop: '#16203d',
    skyBottom: '#090c17',
    fog: '#0c1020',
    wall: '#1a2033',
    wallPanel: '#10131d',
    slats: '#6a4e36',
    floorTint: '#4a5161',
    exposure: 1.12,
    envBoost: 1.2,
  },
  light: {
    skyTop: '#dfe9f8',
    skyBottom: '#c3cfe2',
    fog: '#ccd6e6',
    wall: '#d4dbe7',
    wallPanel: '#b9c2d1',
    slats: '#a07a55',
    floorTint: '#9aa3b3',
    exposure: 1.05,
    envBoost: 1.45,
  },
};
