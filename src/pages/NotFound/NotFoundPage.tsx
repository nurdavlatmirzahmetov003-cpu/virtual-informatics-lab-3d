/**
 * The 404 page (0.37): Bit is lost too, says so kindly, and offers the
 * places students look for most. `RouteError` is the same friendly screen
 * for a page that failed to load or crashed (the router's error element).
 */
import { Link, useRouteError } from 'react-router-dom';
import { Box, Gamepad2, Home, Microscope, RotateCcw } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { BitFace } from '@/components/bit/BitFace';
import { useT } from '@/hooks/useT';
import styles from './NotFound.module.css';

const PLACES = [
  { to: '/', icon: Home, key: 'nav.home' },
  { to: '/lab', icon: Box, key: 'nav.lab' },
  { to: '/labs', icon: Microscope, key: 'nav.labs' },
  { to: '/games', icon: Gamepad2, key: 'arcade.eyebrow' },
] as const;

function Places() {
  const t = useT();
  return (
    <nav className={styles.places} aria-label={t('notFound.where')}>
      {PLACES.map(({ to, icon: Icon, key }) => (
        <Link key={to} to={to} className={styles.place}>
          <Icon size={20} aria-hidden="true" /> {t(key)}
        </Link>
      ))}
    </nav>
  );
}

export default function NotFoundPage() {
  const t = useT();
  return (
    <PageLayout eyebrow="404" title={t('notFound.title')} subtitle={t('notFound.body')}>
      <div className={styles.card}>
        <span className={styles.face} aria-hidden="true">
          <BitFace size={88} mood="thinking" />
        </span>
        <p className={styles.say}>{t('notFound.bit')}</p>
      </div>
      <h2 className={styles.where}>{t('notFound.where')}</h2>
      <Places />
    </PageLayout>
  );
}

/** A page that could not load (a new version was published, the connection dropped) or crashed. */
export function RouteError() {
  const t = useT();
  const error = useRouteError() as { message?: string } | undefined;
  // a lazy chunk from an older build: one reload fetches the new one
  const stale = /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(error?.message ?? '');
  return (
    <div className={styles.errorPage}>
      <PageLayout eyebrow={t('notFound.errorEyebrow')} title={t('notFound.errorTitle')} subtitle={stale ? t('notFound.errorStale') : t('notFound.errorBody')}>
        <div className={styles.card}>
          <span className={styles.face} aria-hidden="true">
            <BitFace size={88} mood="thinking" />
          </span>
          <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
            <RotateCcw size={16} aria-hidden="true" /> {t('notFound.reload')}
          </button>
        </div>
        <Places />
      </PageLayout>
    </div>
  );
}
