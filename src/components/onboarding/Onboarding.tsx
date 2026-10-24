/**
 * A short first-visit welcome (0.37): three cards — the 3D lab, the labs
 * and games, and Bit — shown once on the home page, then never again in
 * this browser. Esc, «Skip» or the last card close it; it is a modal
 * dialog that keeps the focus inside while open.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Box, Gamepad2, X } from 'lucide-react';
import { BitFace } from '@/components/bit/BitFace';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { STORAGE_NAMESPACE, safeStorage } from '@/lib/storage';
import styles from './Onboarding.module.css';

const KEY = `${STORAGE_NAMESPACE}:onboarded`;
const STEPS = ['lab', 'play', 'bit'] as const;
const k = (s: string) => s as TranslationKey;

const onboarded = () => {
  try {
    return safeStorage()?.getItem(KEY) === '1';
  } catch {
    return true;
  }
};

const remember = () => {
  try {
    safeStorage()?.setItem(KEY, '1');
  } catch {
    /* private mode: shown again next time, nothing else */
  }
};

export function Onboarding() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const card = useRef<HTMLDivElement>(null);

  // a moment after the page appears, so the hero is seen first
  useEffect(() => {
    if (onboarded()) return;
    const id = window.setTimeout(() => setOpen(true), 1800);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    if (open) card.current?.querySelector<HTMLElement>('[data-primary]')?.focus();
  }, [open, step]);

  if (!open) return null;
  const close = () => {
    remember();
    setOpen(false);
  };
  const id = STEPS[step];
  const last = step === STEPS.length - 1;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
    if (e.key !== 'Tab') return;
    // keep Tab inside the dialog
    const items = [...(card.current?.querySelectorAll<HTMLElement>('button, a') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i <= 0) {
      e.preventDefault();
      items.at(-1)?.focus();
    } else if (!e.shiftKey && i === items.length - 1) {
      e.preventDefault();
      items[0]?.focus();
    }
  };

  return (
    <div className={styles.backdrop} onKeyDown={onKey}>
      <div ref={card} className={styles.card} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <button type="button" className={styles.close} onClick={close} aria-label={t('onboarding.skip')}>
          <X size={18} aria-hidden="true" />
        </button>
        <span className={styles.art} aria-hidden="true">
          {id === 'lab' ? <Box size={44} /> : id === 'play' ? <Gamepad2 size={44} /> : <BitFace size={64} mood="speaking" />}
        </span>
        <p className={styles.step}>{t('onboarding.step', { n: step + 1, total: STEPS.length })}</p>
        <h2 id="onboarding-title">{t(k(`onboarding.${id}.title`))}</h2>
        <p className={styles.text}>{t(k(`onboarding.${id}.text`))}</p>
        <div className={styles.dots} aria-hidden="true">
          {STEPS.map((s, i) => (
            <i key={s} data-on={i === step || undefined} />
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={close}>
            {t('onboarding.skip')}
          </button>
          {last ? (
            <Link to="/lab" className={styles.primary} data-primary onClick={close}>
              {t('onboarding.start')} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" className={styles.primary} data-primary onClick={() => setStep(step + 1)}>
              {t('onboarding.next')} <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
