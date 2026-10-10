import { useSyncExternalStore } from 'react';
import { resolveTheme, SCENE_PALETTES, systemTheme, type ScenePalette, type Theme } from '@/lib/theme';
import { useSettingsStore } from '@/store/settingsStore';

function subscribeSystem(onChange: () => void) {
  const mq = window.matchMedia?.('(prefers-color-scheme: light)');
  mq?.addEventListener('change', onChange);
  return () => mq?.removeEventListener('change', onChange);
}

/** The theme in effect: the saved choice, or the OS preference for `system`. */
export function useTheme(): Theme {
  const mode = useSettingsStore((s) => s.theme);
  const system = useSyncExternalStore(subscribeSystem, systemTheme, () => 'dark' as Theme);
  return resolveTheme(mode, system);
}

export const useScenePalette = (): ScenePalette => SCENE_PALETTES[useTheme()];
