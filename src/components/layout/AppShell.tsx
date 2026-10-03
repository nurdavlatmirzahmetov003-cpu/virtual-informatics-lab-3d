import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSettingsStore } from '@/store/settingsStore';
import { useT } from '@/hooks/useT';
import { LoaderOverlay } from '@/components/ui/LoaderOverlay';
import { TopBar } from './TopBar';
import styles from './AppShell.module.css';

export function AppShell() {
  const t = useT();
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t('app.skipToContent')}
      </a>
      <TopBar />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Suspense fallback={<div className={styles.pageLoading} aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>
      <LoaderOverlay />
    </>
  );
}
