import { Box } from 'lucide-react';
import { ANATOMY_CATEGORIES, itemsIn, type AnatomyItem } from '@/data/hardware/anatomy';
import { useT } from '@/hooks/useT';
import { useAnatomyStore } from '@/store/anatomyStore';
import { AnatomyDetails } from './AnatomyDetails';
import { AnatomyQuiz } from './AnatomyQuiz';
import { ViewSwitch } from './AnatomyControls';
import { itemKey } from './anatomyText';
import styles from './ExplorerPage.module.css';

/** Text-only version of Computer Anatomy: every device, fact and quiz without 3D. */
export function AnatomyListView({ webgl }: { webgl: boolean }) {
  const t = useT();
  const show3d = (item: AnatomyItem) => {
    const s = useAnatomyStore.getState();
    s.setCategory(item.category);
    s.select(item.id);
    s.setView('scene');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className={styles.listPage}>
      <header className={styles.listHeader}>
        <span className={styles.eyebrow}>{t('anatomy.eyebrow')}</span>
        <h1 className={styles.listTitle}>{t('anatomy.title')}</h1>
        <p className={styles.lead}>{t('anatomy.list.lead')}</p>
        {webgl ? <ViewSwitch /> : <p className={styles.notice} role="status">{t('anatomy.noWebgl')}</p>}
      </header>

      <nav className={styles.toc} aria-label={t('anatomy.list.toc')}>
        {ANATOMY_CATEGORIES.map((c) => (
          <div key={c}>
            <h2 className={styles.tocHeading}>{t(`anatomy.categories.${c}`)}</h2>
            <ol>
              {itemsIn(c).map((item) => (
                <li key={item.id}>
                  <a href={`#anatomy-${item.id}`}>{t(itemKey(item.id, 'name'))}</a>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </nav>

      {ANATOMY_CATEGORIES.map((c) => (
        <section key={c} className={styles.listSection} aria-labelledby={`anatomy-cat-${c}`}>
          <h2 id={`anatomy-cat-${c}`} className={styles.sectionTitle}>
            {t(`anatomy.categories.${c}`)}
          </h2>
          {itemsIn(c).map((item, i) => (
            <article key={item.id} id={`anatomy-${item.id}`} className={styles.card} aria-labelledby={`anatomy-h-${item.id}`}>
              <header className={styles.cardHead}>
                <span className={styles.cardIndex}>{String(i + 1).padStart(2, '0')}</span>
                <h3 id={`anatomy-h-${item.id}`} className={styles.cardTitle}>
                  {t(itemKey(item.id, 'name'))}
                </h3>
                {webgl && (
                  <button type="button" className={styles.navButton} onClick={() => show3d(item)}>
                    <Box size={15} aria-hidden="true" />
                    {t('anatomy.list.open3d')}
                  </button>
                )}
              </header>
              <AnatomyDetails item={item} headingLevel={4} />
              <details className={styles.quizDetails}>
                <summary>{t('anatomy.sections.quiz')}</summary>
                <AnatomyQuiz item={item} />
              </details>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
