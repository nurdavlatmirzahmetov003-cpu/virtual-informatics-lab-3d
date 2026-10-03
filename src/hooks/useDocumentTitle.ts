import { useEffect } from 'react';
import { translate } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';

/** Sets `<title>` to "<page> — <app title>" in the current language. */
export function useDocumentTitle(pageTitle?: string) {
  const language = useSettingsStore((s) => s.language);
  useEffect(() => {
    const app = translate(language, 'app.title');
    document.title = pageTitle && pageTitle !== app ? `${pageTitle} — ${app}` : app;
  }, [language, pageTitle]);
}
