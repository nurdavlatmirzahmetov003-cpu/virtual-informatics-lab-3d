/**
 * Bit's button, on every page (AppShell). Tiny: the panel, its texts and
 * the speech code load on the first open (hovering the button warms them).
 */
import { lazy, Suspense, useEffect } from 'react';
import { useT } from '@/hooks/useT';
import { useBitStore } from '@/store/bitStore';
import { BitFace } from './BitFace';
import styles from './Bit.module.css';

const loadPanel = () => import('./BitPanel');
const BitPanel = lazy(loadPanel);

export function BitLauncher() {
  const t = useT();
  const open = useBitStore((s) => s.open);
  const openBit = useBitStore((s) => s.openBit);
  const close = useBitStore((s) => s.close);

  // Alt+B toggles Bit from anywhere (keyboard users, and "Jarvis, …" without the mouse)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyB') {
        e.preventDefault();
        if (useBitStore.getState().open) close();
        else openBit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, openBit]);

  return (
    <>
      {!open && (
        <button
          type="button"
          className={styles.launcher}
          onClick={() => openBit()}
          onPointerEnter={() => void loadPanel()}
          onFocus={() => void loadPanel()}
          aria-label={t('bit.open')}
          title={`${t('bit.open')} (Alt+B)`}
        >
          <BitFace size={34} />
          <span className={styles.launcherLabel}>{t('bit.name')}</span>
        </button>
      )}
      {open && (
        <Suspense fallback={null}>
          <BitPanel />
        </Suspense>
      )}
    </>
  );
}
