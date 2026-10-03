import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { anatomyItem, itemsIn, type AnatomyId } from '@/data/hardware/anatomy';
import { useT } from '@/hooks/useT';
import { useAnatomyStore } from '@/store/anatomyStore';
import { AnatomyDetails } from './AnatomyDetails';
import { AnatomyQuiz } from './AnatomyQuiz';
import { itemKey } from './anatomyText';
import styles from './ExplorerPage.module.css';

type Tab = 'info' | 'quiz';

/** Info panel of the focused device (mount with `key={id}` so tabs reset per device). */
export function AnatomyPanel({ id }: { id: AnatomyId }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('info');
  const select = useAnatomyStore((s) => s.select);
  const item = anatomyItem(id);
  const siblings = itemsIn(item.category);
  const index = siblings.findIndex((s) => s.id === id);
  const step = (d: number) => select(siblings[(index + d + siblings.length) % siblings.length].id);

  return (
    <aside className={styles.panel} aria-labelledby="anatomy-panel-title">
      <div className={styles.panelHead}>
        <span className={styles.eyebrow}>
          {t(`anatomy.categories.${item.category}`)} · {t('anatomy.counter', { index: index + 1, total: siblings.length })}
        </span>
        <button type="button" className={styles.iconButton} onClick={() => select(null)} aria-label={t('anatomy.close')}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <h2 id="anatomy-panel-title" className={styles.panelTitle}>
        {t(itemKey(id, 'name'))}
      </h2>

      <div className={styles.tabs} role="tablist" aria-label={t('anatomy.title')}>
        {(['info', 'quiz'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`anatomy-tab-${k}`}
            aria-selected={tab === k}
            aria-controls="anatomy-tabpanel"
            onClick={() => setTab(k)}
          >
            {t(`anatomy.tabs.${k}`)}
          </button>
        ))}
      </div>

      <div id="anatomy-tabpanel" role="tabpanel" aria-labelledby={`anatomy-tab-${tab}`} className={styles.panelBody}>
        {tab === 'info' ? <AnatomyDetails item={item} /> : <AnatomyQuiz key={id} item={item} />}
      </div>

      <div className={styles.panelNav}>
        <button type="button" className={styles.navButton} onClick={() => step(-1)}>
          <ChevronLeft size={16} aria-hidden="true" />
          {t('anatomy.prev')}
        </button>
        <button type="button" className={styles.navButton} onClick={() => step(1)}>
          {t('anatomy.next')}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
