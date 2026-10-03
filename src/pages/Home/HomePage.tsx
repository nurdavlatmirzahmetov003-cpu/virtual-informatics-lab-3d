import { lazy } from 'react';
import { ArrowRight } from 'lucide-react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { ButtonLink } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import styles from './HomePage.module.css';

// Phase 2 swaps this for the cinematic DeskScene.
const FoundationScene = lazy(() => import('@/scenes/FoundationScene/FoundationScene'));

export default function HomePage() {
  const t = useT();
  useDocumentTitle();

  return (
    <section className={styles.root}>
      <SceneCanvas initialCamera="HOME_WIDE" label={t('home.title')}>
        <FoundationScene />
      </SceneCanvas>

      <div className={styles.overlay}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{t('home.eyebrow')}</span>
          <h1 className={styles.title}>{t('home.title')}</h1>
          <p className={styles.subtitle}>{t('home.subtitle')}</p>
          <div className={styles.actions}>
            <ButtonLink to="/labs" icon={<ArrowRight size={18} aria-hidden="true" />}>
              {t('home.cta')}
            </ButtonLink>
            <ButtonLink to="/studio" variant="ghost">
              {t('home.secondary')}
            </ButtonLink>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.note}>{t('home.buildNote')}</p>
          <p className={styles.hint}>{t('home.orbitHint')}</p>
        </div>
      </div>
    </section>
  );
}
