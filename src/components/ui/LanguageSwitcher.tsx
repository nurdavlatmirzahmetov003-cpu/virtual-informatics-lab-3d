import { LANGUAGES, LANGUAGE_LABELS } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { useT } from '@/hooks/useT';
import styles from './Controls.module.css';

export function LanguageSwitcher() {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <div className={styles.segmented} role="group" aria-label={t('settings.language')}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          className={styles.segment}
          aria-pressed={language === lang}
          title={LANGUAGE_LABELS[lang]}
          onClick={() => setLanguage(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
