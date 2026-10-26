/**
 * Foldable info and Bit panels (V4 §6). Any panel over a 3D view (or beside
 * a lab) can fold into a small edge tab with Bit's face, so the scene is
 * seen whole; the tab shows an unread dot when the panel's content changed
 * while it was folded. Click the tab or press Alt+I to bring it back.
 *
 * - The state is remembered per panel id (localStorage).
 * - With nothing remembered, small screens (< 900 px) start folded.
 * - Entering full-screen folds every panel.
 * - Alt+I toggles the page's main panel (the last one mounted with `primary`).
 *
 *   const fold = useFold('lab:zone', { primary: true, contentKey: zoneId });
 *   return fold.folded ? <FoldTab fold={fold} title="…" /> : <section>…<FoldButton fold={fold} /></section>;
 */
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { BitFace } from '@/components/bit/BitFace';
import { useT } from '@/hooks/useT';
import type { Fold } from './foldState';
import styles from './Foldable.module.css';


/** The fold button inside an open panel (top right, or where the page puts it). */
export function FoldButton({ fold, side = 'left', className }: { fold: Fold; side?: 'left' | 'right' | 'bottom'; className?: string }) {
  const t = useT();
  const Icon = side === 'left' ? ChevronLeft : side === 'right' ? ChevronRight : ChevronUp;
  return (
    <button type="button" className={[styles.fold, className].filter(Boolean).join(' ')} onClick={fold.close} aria-expanded="true" title={`${t('panels.fold')} (Alt+I)`} aria-label={t('panels.fold')} data-fold-button>
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}

/** What a folded panel leaves: a tab on the screen edge with Bit's face and the panel's name. */
export function FoldTab({ fold, title, side = 'left', className }: { fold: Fold; title: string; side?: 'left' | 'right'; className?: string }) {
  const t = useT();
  return (
    <button
      type="button"
      className={[styles.tab, className].filter(Boolean).join(' ')}
      data-side={side}
      onClick={fold.open}
      aria-expanded="false"
      title={`${t('panels.unfold', { name: title })} (Alt+I)`}
      aria-label={t('panels.unfold', { name: title })}
    >
      <span className={styles.face}>
        <BitFace size={30} />
        {fold.unread && <span className={styles.dot} aria-label={t('panels.unread')} />}
      </span>
      <span className={styles.label}>{title}</span>
    </button>
  );
}
