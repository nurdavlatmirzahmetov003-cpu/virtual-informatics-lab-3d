import { useCallback } from 'react';
import { translate, type TranslationKey, type TranslationVars } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';

/** Returns a translator bound to the current UI language. */
export function useT() {
  const language = useSettingsStore((s) => s.language);
  return useCallback((key: TranslationKey, vars?: TranslationVars) => translate(language, key, vars), [language]);
}
