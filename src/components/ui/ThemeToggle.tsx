import { Monitor, Moon, Sun } from 'lucide-react';
import { nextThemeMode } from '@/lib/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useT } from '@/hooks/useT';
import styles from './Controls.module.css';

const ICONS = { dark: Moon, light: Sun, system: Monitor } as const;

/** One button cycling dark → light → system; the label names the current mode. */
export function ThemeToggle() {
  const t = useT();
  const mode = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const Icon = ICONS[mode];
  const label = t('settings.themeCurrent', { theme: t(`theme.${mode}`) });

  return (
    <button type="button" className={styles.iconButton} aria-label={label} title={label} onClick={() => setTheme(nextThemeMode(mode))}>
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
