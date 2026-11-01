import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/onest';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/tektur';
import '@/styles/global.css';
import { router } from '@/app/router';
import { loadLanguage } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { applyTheme, resolveTheme } from '@/lib/theme';
import { DEMO_ACTIVE } from '@/lib/storage';

const start = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );

// no flash of the wrong theme before React mounts
applyTheme(resolveTheme(useSettingsStore.getState().theme));

// V4 §8.4: a ?demo=1 link opens the demo profile (one reload into demo mode)
const url = new URL(window.location.href);
const demoLink = url.searchParams.get('demo') === '1';
if (demoLink) {
  url.searchParams.delete('demo');
  const path = `${url.pathname.slice(import.meta.env.BASE_URL.length - 1)}${url.search}${url.hash}`;
  if (DEMO_ACTIVE) window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  else void import('@/services/demo/mode').then((m) => m.enterDemo(path === '/' ? '/progress' : path));
}

// Russian/English are separate chunks: fetch the saved one before the first paint
if (!demoLink || DEMO_ACTIVE) loadLanguage(useSettingsStore.getState().language).then(start, start);

// offline (0.37): the service worker caches the app shell; only in a built site (in dev it would serve stale code)
// (`vil3d:no-sw`: the headless measurements and checks, whose numbers the background caching would skew)
const noWorker = (() => {
  try {
    return localStorage.getItem('vil3d:no-sw') === '1';
  } catch {
    return false;
  }
})();
if (import.meta.env.PROD && 'serviceWorker' in navigator && !noWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}
