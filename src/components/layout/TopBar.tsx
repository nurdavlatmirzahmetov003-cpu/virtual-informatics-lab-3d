import { NavLink } from 'react-router-dom';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { QualitySelect } from '@/components/ui/QualitySelect';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BrandMark } from '@/components/brand/BrandMark';
import { BRAND } from '@/config/brand';
import { AccountButton } from './AccountButton';
import styles from './TopBar.module.css';

const NAV: ReadonlyArray<{ to: string; label: TranslationKey; end?: boolean }> = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/lab', label: 'nav.lab' },
  { to: '/explorer', label: 'nav.explorer' },
  { to: '/labs', label: 'nav.labs' },
  { to: '/studio', label: 'nav.studio' },
  { to: '/games', label: 'nav.games' },
  { to: '/progress', label: 'nav.progress' },
];

export function TopBar() {
  const t = useT();
  return (
    <header className={styles.root}>
      <NavLink to="/" className={styles.brand} aria-label={t('app.title')}>
        <BrandMark size={32} className={styles.mark} />
        <span className={styles.brandText}>
          <b>{BRAND.wordmark[0]}</b>
          <span className={styles.brandLight}>{BRAND.wordmark[1]}</span>
        </span>
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
        <AccountButton />
      </div>
    </header>
  );
}
