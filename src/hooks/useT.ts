import { useCallback } from 'react';
import { translate, type TranslationKey, type TranslationVars } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { useSiteStore } from '@/store/siteStore';

/** Returns a translator bound to the current UI language (and to the admin's text edits). */
export function useT() {
  const language = useSettingsStore((s) => s.language);
  const contentVersion = useSiteStore((s) => s.contentVersion);
  // contentVersion: a new translator when the admin's texts arrive, so every user of it re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((key: TranslationKey, vars?: TranslationVars) => translate(language, key, vars), [language, contentVersion]);
}
