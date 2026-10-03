import { lazy, useEffect, useMemo } from 'react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { itemsIn } from '@/data/hardware/anatomy';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { detectWebGL } from '@/lib/webgl';
import { useAnatomyStore } from '@/store/anatomyStore';
import { CategorySwitch, ViewSwitch } from './AnatomyControls';
import { AnatomyListView } from './AnatomyListView';
import { AnatomyPanel } from './AnatomyPanel';
import { itemKey } from './anatomyText';
import styles from './ExplorerPage.module.css';

const AnatomyScene = lazy(() => import('@/scenes/HardwareExplorer/AnatomyScene'));

/** 3D view: scene + device list + info panel of the focused device. */
function AnatomyStage() {
  const t = useT();
  const category = useAnatomyStore((s) => s.category);
  const selected = useAnatomyStore((s) => s.selected);
  const { select, hover } = useAnatomyStore.getState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useAnatomyStore.getState().select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.stage}>
      <SceneCanvas initialCamera="ANATOMY_EXTERNAL" label={t('anatomy.sceneLabel')}>
        <AnatomyScene />
      </SceneCanvas>

      <div className={styles.overlay}>
        <header className={styles.intro}>
          <span className={styles.eyebrow}>{t('anatomy.eyebrow')}</span>
          <h1 className={styles.title}>{t('anatomy.title')}</h1>
          <p className={styles.lead}>{t('anatomy.lead')}</p>
          <div className={styles.switches}>
            <CategorySwitch />
            <ViewSwitch />
          </div>
        </header>

        <nav className={styles.itemList} aria-label={t(`anatomy.categories.${category}`)}>
          <ol>
            {itemsIn(category).map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={selected === item.id ? 'true' : undefined}
                  onClick={() => select(item.id)}
                  onPointerEnter={() => hover(item.id)}
                  onPointerLeave={() => hover(null)}
                  onFocus={() => hover(item.id)}
                  onBlur={() => hover(null)}
                >
                  <span>{i + 1}</span>
                  {t(itemKey(item.id, 'name'))}
                </button>
              </li>
            ))}
          </ol>
          {selected ? (
            <button type="button" className={styles.overviewButton} onClick={() => select(null)}>
              {t('anatomy.overview')}
            </button>
          ) : (
            <p className={styles.pick}>{t('anatomy.pick')}</p>
          )}
        </nav>

        {selected && <AnatomyPanel key={selected} id={selected} />}
        <p className={styles.hint}>{t('anatomy.hint')}</p>
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  const t = useT();
  useDocumentTitle(t('anatomy.title'));
  const webgl = useMemo(() => detectWebGL() !== 'none', []);
  const view = useAnatomyStore((s) => s.view);

  // leaving the page returns to the overview
  useEffect(() => () => useAnatomyStore.getState().select(null), []);

  return view === 'list' || !webgl ? <AnatomyListView webgl={webgl} /> : <AnatomyStage />;
}
