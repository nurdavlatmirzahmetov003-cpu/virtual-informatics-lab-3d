import { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSettingsStore } from '@/store/settingsStore';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { applyTheme } from '@/lib/theme';
import { useSceneStatus } from '@/store/sceneStatusStore';
import { AchievementToaster } from '@/components/achievements/AchievementToaster';
import { BitLauncher } from '@/components/bit/BitLauncher';
import { Captions } from '@/components/bit/Captions';
import { useAuthStore } from '@/store/authStore';
import { setLiveEvents } from '@/services/live/events';
import { useSiteStore } from '@/store/siteStore';
import { SiteBanner } from './SiteBanner';
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

  // accessibility options as attributes on <html>; global.css reads them (0.37)
  const a11y = useSettingsStore((s) => s.a11y);
  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute('data-contrast', a11y.contrast);
    root.toggleAttribute('data-readable', a11y.readable);
    root.toggleAttribute('data-calm', a11y.calm);
  }, [a11y]);

  // who is signed in (or guest mode when the server is not running)
  // and what the admin set for the whole site: banner, edited texts
  useEffect(() => {
    void useAuthStore.getState().init();
    void useSiteStore.getState().load();
  }, []);

  // V2-12: signed-in browsers keep the class events socket (presence; live feed for teachers)
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  useEffect(() => setLiveEvents(signedIn), [signedIn]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t('app.skipToContent')}
      </a>
      <TopBar />
      <SiteBanner />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Suspense fallback={<div className={styles.pageLoading} aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>
      {sceneExpected && <Suspense fallback={null}><LoaderOverlay /></Suspense>}
      <AchievementToaster />
      <BitLauncher />
      {a11y.captions && <Captions />}
    </>
  );
}
