import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/manrope';
import '@fontsource-variable/unbounded';
import '@/styles/global.css';
import { router } from '@/app/router';
import { loadLanguage } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { applyTheme, resolveTheme } from '@/lib/theme';

const start = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );

// no flash of the wrong theme before React mounts
applyTheme(resolveTheme(useSettingsStore.getState().theme));

// Russian/English are separate chunks: fetch the saved one before the first paint
loadLanguage(useSettingsStore.getState().language).then(start, start);
