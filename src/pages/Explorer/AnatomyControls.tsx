import { Box, List } from 'lucide-react';
import { ANATOMY_CATEGORIES } from '@/data/hardware/anatomy';
import { useT } from '@/hooks/useT';
import { useAnatomyStore } from '@/store/anatomyStore';
import styles from './ExplorerPage.module.css';

export function CategorySwitch() {
  const t = useT();
  const category = useAnatomyStore((s) => s.category);
  const setCategory = useAnatomyStore((s) => s.setCategory);
  return (
    <div className={styles.segmented} role="group" aria-label={t('anatomy.categories.label')}>
      {ANATOMY_CATEGORIES.map((c) => (
        <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>
          {t(`anatomy.categories.${c}`)}
        </button>
      ))}
    </div>
  );
}

export function ViewSwitch() {
  const t = useT();
  const view = useAnatomyStore((s) => s.view);
  const setView = useAnatomyStore((s) => s.setView);
  return (
    <div className={styles.segmented} role="group" aria-label={t('anatomy.view.label')}>
      <button type="button" aria-pressed={view === 'scene'} onClick={() => setView('scene')}>
        <Box size={14} aria-hidden="true" />
        {t('anatomy.view.scene')}
      </button>
      <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
        <List size={14} aria-hidden="true" />
        {t('anatomy.view.list')}
      </button>
    </div>
  );
}
