/**
 * The admin's notice for everyone (V2-10 site settings), e.g. planned
 * maintenance. Shown under the top bar in the interface language (Kazakh
 * when that one is empty); closing hides this text until it changes.
 * While shown, its height joins --topbar-h, so every page moves down
 * instead of hiding its heading under it.
 */
import { useEffect, useRef, useState } from 'react';
import { Info, TriangleAlert, X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useSettingsStore } from '@/store/settingsStore';
import { useSiteStore } from '@/store/siteStore';
import styles from './SiteBanner.module.css';

const KEY = 'vil3d:banner-closed';
const readClosed = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function SiteBanner() {
  const t = useT();
  const banner = useSiteStore((s) => s.banner);
  const language = useSettingsStore((s) => s.language);
  const [closed, setClosed] = useState(readClosed);
  const text = banner ? banner[language] || banner.kk || banner.ru || banner.en : '';
  const visible = !!banner && !!text && closed !== text;
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement.style;
    const el = box.current;
    if (!visible || !el) return;
    const measure = () => root.setProperty('--banner-h', `${Math.ceil(el.getBoundingClientRect().height) + 16}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.removeProperty('--banner-h');
    };
  }, [visible, text]);

  if (!visible || !banner) return null;
  const Icon = banner.tone === 'warning' ? TriangleAlert : Info;
  return (
    <div ref={box} className={styles.banner} data-tone={banner.tone} role="status">
      <Icon size={17} aria-hidden="true" />
      <p>{text}</p>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.setItem(KEY, text);
          } catch {
            // private mode: closes for this page view only
          }
          setClosed(text);
        }}
        aria-label={t('admin.banner.close')}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
