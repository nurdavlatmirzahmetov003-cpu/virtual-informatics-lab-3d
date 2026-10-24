/**
 * Accessibility options (0.37) behind one top-bar button: captions for
 * Bit's voice, high contrast, a readable font and «calm» (no animations).
 * A small disclosure panel: Esc or a click elsewhere closes it, the focus
 * returns to the button.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { useSettingsStore, type A11ySettings } from '@/store/settingsStore';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import styles from './Controls.module.css';

const OPTIONS: readonly (keyof A11ySettings)[] = ['captions', 'contrast', 'readable', 'calm'];
const k = (s: string) => s as TranslationKey;

export function A11yMenu() {
  const t = useT();
  const a11y = useSettingsStore((s) => s.a11y);
  const setA11y = useSettingsStore((s) => s.setA11y);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const on = OPTIONS.filter((o) => a11y[o]).length;

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={box} className={styles.menuBox}>
      <button
        ref={button}
        type="button"
        className={styles.iconButton}
        aria-label={t('a11y.title')}
        title={t('a11y.title')}
        aria-expanded={open}
        aria-controls={id}
        data-on={on > 0 || undefined}
        onClick={() => setOpen(!open)}
      >
        <Accessibility size={16} aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className={styles.menu} role="group" aria-label={t('a11y.title')}>
          <p className={styles.menuTitle}>{t('a11y.title')}</p>
          {OPTIONS.map((o) => (
            <label key={o} className={styles.switchRow}>
              <input type="checkbox" checked={a11y[o]} onChange={(e) => setA11y({ [o]: e.target.checked })} />
              <span>
                <b>{t(k(`a11y.${o}.name`))}</b>
                <small>{t(k(`a11y.${o}.hint`))}</small>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
