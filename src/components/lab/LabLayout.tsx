/**
 * One layout for every lab (V4 §5.1): tool palette | workspace | task panel.
 *
 * - Wide (≥ 1280 px): three columns. The palette and the panel each live in
 *   their own sticky column and scroll inside it, so they can never slide
 *   over each other or over the workspace. Either one folds into a narrow
 *   edge tab; the choice is remembered per lab.
 * - Middle (900–1279 px): palette and workspace share a row of their own (a
 *   sticky palette stops at the end of that row), the panel sits under them.
 * - Narrow (< 900 px): the palette is a strip that folds away, the panel a
 *   bottom sheet that peeks with its title and opens over the page.
 *
 * Long lists scroll inside their own region. scripts/lab-overlap.mjs checks
 * that no text is covered or clipped at 375–1920 px.
 */
import { useCallback, useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { safeStorage, STORAGE_NAMESPACE } from '@/lib/storage';
import styles from './LabLayout.module.css';

export interface LabRegion {
  title: string;
  icon: ReactNode;
  content: ReactNode;
  /** Small text beside the title (e.g. the selected device). */
  badge?: string;
}

interface LabLayoutProps {
  /** Lab id: the folded / open state is remembered under it. */
  id: string;
  palette?: LabRegion;
  panel?: LabRegion;
  /** Column widths in px on wide screens (palette, panel); defaults 210 and 360. */
  widths?: readonly [number, number];
  children: ReactNode;
}

interface Folds {
  palette: boolean;
  panel: boolean;
  /** The bottom sheet on narrow screens. */
  sheet: boolean;
}

const KEY = `${STORAGE_NAMESPACE}:lab-layout`;
const DEFAULTS: Folds = { palette: true, panel: true, sheet: false };

function readFolds(id: string): Folds {
  try {
    const all = JSON.parse(safeStorage()?.getItem(KEY) ?? '{}') as Record<string, Partial<Folds>>;
    return { ...DEFAULTS, ...all[id] };
  } catch {
    return DEFAULTS;
  }
}

function writeFolds(id: string, folds: Folds) {
  try {
    const store = safeStorage();
    if (!store) return;
    const all = JSON.parse(store.getItem(KEY) ?? '{}') as Record<string, Folds>;
    store.setItem(KEY, JSON.stringify({ ...all, [id]: folds }));
  } catch {
    /* storage blocked: the layout still works, it just forgets */
  }
}

const NARROW = '(max-width: 899px)';

function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

export function LabLayout({ id, palette, panel, widths, children }: LabLayoutProps) {
  const t = useT();
  const narrow = useNarrow();
  const [folds, setFolds] = useState<Folds>(() => readFolds(id));
  const paletteId = useId();
  const panelId = useId();
  const toggle = useCallback(
    (key: keyof Folds) =>
      setFolds((f) => {
        const next = { ...f, [key]: !f[key] };
        writeFolds(id, next);
        return next;
      }),
    [id],
  );
  // Esc closes an open bottom sheet
  useEffect(() => {
    if (!narrow || !folds.sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggle('sheet');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [narrow, folds.sheet, toggle]);

  const paletteOpen = palette ? folds.palette : false;
  const panelOpen = panel ? (narrow ? folds.sheet : folds.panel) : false;

  return (
    <div
      className={styles.layout}
      style={widths ? ({ '--palette-base': `${widths[0]}px`, '--panel-w': `${widths[1]}px` } as CSSProperties) : undefined}
      data-palette={palette ? (paletteOpen ? 'open' : 'closed') : 'none'} data-panel={panel ? (panelOpen ? 'open' : 'closed') : 'none'} data-narrow={narrow || undefined}>
      <div className={styles.row}>
        {palette &&
          (paletteOpen ? (
            <aside className={styles.palette} id={paletteId} aria-label={palette.title}>
              <header className={styles.regionHead}>
                <span className={styles.regionIcon}>{palette.icon}</span>
                <h2>{palette.title}</h2>
                <button type="button" className={styles.fold} onClick={() => toggle('palette')} aria-expanded="true" aria-controls={paletteId} title={t('labLayout.hide', { name: palette.title })} aria-label={t('labLayout.hide', { name: palette.title })}>
                  {narrow ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
                </button>
              </header>
              <div className={styles.regionBody}>{palette.content}</div>
            </aside>
          ) : (
            <button type="button" className={styles.edgeTab} data-edge="left" onClick={() => toggle('palette')} aria-expanded="false" title={t('labLayout.show', { name: palette.title })}>
              {narrow ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
              <span className={styles.regionIcon}>{palette.icon}</span>
              <span className={styles.edgeLabel}>{palette.title}</span>
            </button>
          ))}
        <div className={styles.work}>{children}</div>
      </div>

      {panel &&
        (narrow ? (
          <>
            {/* the page can scroll past everything: the peeking sheet never hides its end */}
            <div className={styles.sheetSpacer} aria-hidden="true" />
            <section className={styles.sheet} data-open={panelOpen || undefined} data-chrome="sheet" aria-label={panel.title}>
              <button type="button" className={styles.sheetHead} onClick={() => toggle('sheet')} aria-expanded={panelOpen} aria-controls={panelId}>
                <span className={styles.sheetGrip} aria-hidden="true" />
                <span className={styles.regionIcon}>{panel.icon}</span>
                <b>{panel.title}</b>
                {panel.badge && <small>{panel.badge}</small>}
                {panelOpen ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronUp size={18} aria-hidden="true" />}
              </button>
              <div className={styles.sheetBody} id={panelId} hidden={!panelOpen}>
                {panel.content}
              </div>
            </section>
          </>
        ) : panelOpen ? (
          <aside className={styles.panel} id={panelId} aria-label={panel.title}>
            <header className={styles.regionHead}>
              <span className={styles.regionIcon}>{panel.icon}</span>
              <h2>{panel.title}</h2>
              {panel.badge && <small>{panel.badge}</small>}
              <button type="button" className={styles.fold} onClick={() => toggle('panel')} aria-expanded="true" aria-controls={panelId} title={t('labLayout.hide', { name: panel.title })} aria-label={t('labLayout.hide', { name: panel.title })}>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.regionBody}>{panel.content}</div>
          </aside>
        ) : (
          <button type="button" className={styles.edgeTab} data-edge="right" onClick={() => toggle('panel')} aria-expanded="false" title={t('labLayout.show', { name: panel.title })}>
            <ChevronLeft size={16} aria-hidden="true" />
            <span className={styles.regionIcon}>{panel.icon}</span>
            <span className={styles.edgeLabel}>{panel.title}</span>
          </button>
        ))}
    </div>
  );
}
