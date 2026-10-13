import { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSettingsStore } from '@/store/settingsStore';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { applyTheme } from '@/lib/theme';
import { useSceneStatus } from '@/store/sceneStatusStore';
import { AchievementToaster } from '@/components/achievements/AchievementToaster';
import { useAuthStore } from '@/store/authStore';
import { TopBar } from './TopBar';
import styles from './AppShell.module.css';

// Keep Three/drei out of networking, algorithms, assignments and results.
const LoaderOverlay = lazy(() => import('@/components/ui/LoaderOverlay').then(m => ({default:m.LoaderOverlay})));

export function AppShell() {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const sceneExpected = useSceneStatus(s=>s.expected);

  const theme = useTheme();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => applyTheme(theme), [theme]);

  // who is signed in (or guest mode when the server is not running)
  useEffect(() => {
    void useAuthStore.getState().init();
  }, []);

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
      {sceneExpected && <Suspense fallback={null}><LoaderOverlay /></Suspense>}
      <AchievementToaster />
    </>
  );
}
