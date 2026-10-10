import { NavLink } from 'react-router-dom';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { QualitySelect } from '@/components/ui/QualitySelect';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './TopBar.module.css';

const NAV: ReadonlyArray<{ to: string; label: TranslationKey; end?: boolean }> = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/explorer', label: 'nav.explorer' },
  { to: '/labs', label: 'nav.labs' },
  { to: '/studio', label: 'nav.studio' },
  { to: '/progress', label: 'nav.progress' },
];

export function TopBar() {
  const t = useT();
  return (
    <header className={styles.root}>
      <NavLink to="/" className={styles.brand} aria-label={t('app.title')}>
        <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
          <path d="M18 20h28L18 44h28" />
        </svg>
        <span className={styles.brandText}>{t('app.short')}</span>
      </NavLink>

      <nav className={styles.nav} aria-label={t('nav.primary')}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => [styles.link, isActive && styles.active].filter(Boolean).join(' ')}
          >
            {t(item.label)}
          </NavLink>
        ))}
      </nav>

      <div className={styles.controls}>
        <QualitySelect />
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
