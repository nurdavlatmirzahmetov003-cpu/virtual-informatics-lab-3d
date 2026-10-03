import { RGB_COLORS, type Finish } from '@/data/studio/options';

/** Poly Haven "Studio Small 09" (CC0) — reflections only. */
export const STUDIO_HDRI = `${import.meta.env.BASE_URL}assets/hdr/studio_small_09_1k.hdr`;

/** Notified whenever a setup model finished loading or was repainted (shadow maps need a refresh). */
export const setupChanged = { listeners: new Set<() => void>() };
export const notifySetupChanged = () => setupChanged.listeners.forEach((l) => l());

export function rgbColorOf(finish: Finish): string | null {
  if (finish.rgb === 'off') return null;
  return finish.rgb === 'custom' ? finish.rgbCustom : RGB_COLORS[finish.rgb];
}
