/**
 * V4 §8.4: in demo mode, a «DEMO» chip next to the logo. It opens a small
 * panel: what the demo is, «Reset demo» (one click, the sample data as at
 * the start) and «Leave demo» (back to the real profile).
 */
import { useEffect, useRef, useState } from 'react';
import { LogOut, RotateCcw, Sparkles } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { DEMO_ACTIVE } from '@/lib/storage';
import { exitDemo, resetDemo } from '@/services/demo/mode';
import styles from './DemoChip.module.css';

export function DemoChip() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!DEMO_ACTIVE) return null;
  return (
    <div className={styles.root} ref={box}>
      <button type="button" className={styles.chip} aria-expanded={open} aria-controls="demo-panel" onClick={() => setOpen(!open)} title={t('demo.badge')}>
        <Sparkles size={14} aria-hidden="true" /> DEMO
      </button>
      {open && (
        <div id="demo-panel" className={styles.panel} role="dialog" aria-label={t('demo.badge')}>
          <b>{t('demo.badge')}</b>
          <p>{t('demo.note')}</p>
          <button type="button" className={styles.action} onClick={resetDemo}>
            <RotateCcw size={16} aria-hidden="true" /> {t('demo.reset')}
          </button>
          <button type="button" className={styles.action} onClick={() => exitDemo()}>
            <LogOut size={16} aria-hidden="true" /> {t('demo.exit')}
          </button>
        </div>
      )}
    </div>
  );
}
