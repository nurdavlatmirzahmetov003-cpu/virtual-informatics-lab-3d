import { useSyncExternalStore } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Honour `prefers-reduced-motion` and the site's own «calm» option (0.37): shorter camera moves, no auto-rotation. */
export function useReducedMotion(): boolean {
  const system = useMediaQuery('(prefers-reduced-motion: reduce)');
  const calm = useSettingsStore((s) => s.a11y.calm);
  return system || calm;
}
