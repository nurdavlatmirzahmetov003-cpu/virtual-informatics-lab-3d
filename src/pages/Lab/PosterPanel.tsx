/**
 * Explanation of a classroom poster (2026-10): what the poster shows, in
 * plain words, four facts to remember, a question to think about and, where
 * there is one, the lab that practises it.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, HelpCircle, X } from 'lucide-react';
import { POSTERS } from '@/data/lab/classroom';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { useLabStore } from '@/store/labStore';
import { BitSays } from '@/components/bit/BitSays';
import styles from './TeacherPanel.module.css';

const k = (s: string) => s as TranslationKey;

export function PosterPanel() {
  const t = useT();
  const id = useLabStore((s) => s.poster);
  const close = useLabStore((s) => s.closePoster);
  const poster = POSTERS.find((p) => p.id === id);
  if (!poster) return null;
  const key = (part: string) => k(`lab.classroom.posters.${poster.id}.${part}`);
  return (
    <aside className={styles.panel} style={{ ['--tone' as string]: poster.accent }} aria-labelledby="poster-title">
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>{t('lab.classroom.eyebrow')}</span>
          <h2 id="poster-title">{t(key('title'))}</h2>
        </div>
        <button type="button" className={styles.icon} onClick={close} aria-label={t('deviceUi.close')} title={t('deviceUi.close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <BitSays text={t(key('explain'))} more={['f1', 'f2', 'f3', 'f4'].map((f) => t(key(f)))} />
      <section className={styles.card} aria-labelledby="poster-facts">
        <h3 id="poster-facts">{t('lab.classroom.facts')}</h3>
        <ol className={styles.facts}>
          {['f1', 'f2', 'f3', 'f4'].map((f) => (
            <li key={f}>{t(key(f))}</li>
          ))}
        </ol>
      </section>
      <p className={styles.tip}>
        <HelpCircle size={16} aria-hidden="true" />
        <span>{t(key('question'))}</span>
      </p>
      {poster.link && (
        <Link to={poster.link} className={styles.cta}>
          {t('lab.classroom.practise')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </aside>
  );
}
