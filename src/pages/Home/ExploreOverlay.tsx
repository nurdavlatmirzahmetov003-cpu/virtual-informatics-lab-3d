import { useEffect } from 'react';
import { ArrowLeft, Boxes, RotateCcw, Rotate3d, X } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { PARTS } from '@/scenes/DeskScene/pc/parts';
import { CHAPTERS } from '@/scenes/DeskScene/chapters';
import { DEVICES } from '@/scenes/DeskScene/devices';
import { usePcStore } from '@/store/pcStore';
import styles from './ExploreOverlay.module.css';

const key = (k: string) => k as TranslationKey;

/**
 * Controls for the free 360° view: back to story, reset camera, auto-rotate,
 * assemble / explode, and the detail panel of the selected component.
 */
export function ExploreOverlay() {
  const t = useT();
  const mode = usePcStore((s) => s.mode);
  const selected = usePcStore((s) => s.selectedPart);
  const device = usePcStore((s) => s.selectedDevice);
  const autoRotate = usePcStore((s) => s.autoRotate);
  const exploded = usePcStore((s) => s.exploded);
  const { exitExplore, resetCamera, toggleAutoRotate, toggleExploded, selectPart, enterDevice, enterExplore } = usePcStore.getState();

  useEffect(() => {
    if (mode !== 'explore') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitExplore();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, exitExplore]);

  if (mode !== 'explore') return null;
  const def = selected ? PARTS.find((p) => p.id === selected) : undefined;
  const base = selected ? `pc.parts.${selected}` : '';
  const deviceChapter = CHAPTERS.find(c => c.id === device);
  const deviceBase = device ? `story.chapters.${device}` : '';

  return (
    <div className={styles.root}>
      <div className={styles.toolbar} role="toolbar" aria-label={t('explore.enter')}>
        <button type="button" className={styles.tool} aria-label={t('explore.exit')} onClick={exitExplore}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{t('explore.exit')}</span>
        </button>
        <span className={styles.divider} aria-hidden="true" />
        <button type="button" className={styles.tool} aria-label={t('explore.reset')} onClick={resetCamera}>
          <RotateCcw size={16} aria-hidden="true" />
          <span>{t('explore.reset')}</span>
        </button>
        <button type="button" className={styles.tool} aria-label={t('explore.autoRotate')} aria-pressed={autoRotate} onClick={toggleAutoRotate}>
          <Rotate3d size={16} aria-hidden="true" />
          <span>{t('explore.autoRotate')}</span>
        </button>
        {(!device || device === 'pc' || device === 'setup') && <button type="button" className={styles.tool} aria-label={exploded ? t('explore.assemble') : t('explore.explode')} aria-pressed={exploded} onClick={toggleExploded}>
          <Boxes size={16} aria-hidden="true" />
          <span>{exploded ? t('explore.assemble') : t('explore.explode')}</span>
        </button>}
      </div>

      <aside className={styles.panel} aria-live="polite">
        {device ? <>
          <span className={styles.eyebrow}>{t('explore.deviceLabel')} · 360°</span>
          <h2 className={styles.title}>{device === 'setup' ? t('explore.viewSetup') : t(key(`${deviceBase}.title`))}</h2>
          <p className={styles.body}>{device === 'setup' ? t('explore.setupBody') : t(key(`${deviceBase}.body`))}</p>
          {device !== 'setup' && deviceChapter?.kind === 'device' && <dl className={styles.specs}>{deviceChapter.specs.map(s => <div key={s}><dt>{t(key(`${deviceBase}.specs.${s}.label`))}</dt><dd>{t(key(`${deviceBase}.specs.${s}.value`))}</dd></div>)}</dl>}
          {device === 'pc' && <button className={styles.tool} onClick={() => enterExplore('motherboard')}>{t('explore.inside')}</button>}
          <ol className={styles.parts}>{DEVICES.map((id, i) => <li key={id}><button aria-current={device === id ? 'true' : undefined} onClick={() => enterDevice(id)}><span>{i + 1}</span>{id === 'setup' ? t('story.chapters.setup.nav') : t(key(`story.chapters.${id}.nav`))}</button></li>)}</ol>
        </> : def ? (
          <>
            <div className={styles.panelHead}>
              <span className={styles.eyebrow}>
                {String(PARTS.indexOf(def) + 1).padStart(2, '0')} / {String(PARTS.length).padStart(2, '0')}
              </span>
              <button type="button" className={styles.close} onClick={() => selectPart(null)} aria-label={t('explore.close')}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <h2 className={styles.title}>{t(key(`${base}.name`))}</h2>
            <p className={styles.body}>{t(key(`${base}.body`))}</p>
            <dl className={styles.specs}>
              {def.specs.map((s) => (
                <div key={s}>
                  <dt>{t(key(`${base}.specs.${s}.label`))}</dt>
                  <dd>{t(key(`${base}.specs.${s}.value`))}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.caption}>{t('story.specsCaption')}</p>
          </>
        ) : (
          <>
            <span className={styles.eyebrow}>{t('explore.partsLabel')}</span>
            <p className={styles.body}>{t('explore.pick')}</p>
          </>
        )}
        {!device && <ol className={styles.parts}>
          {PARTS.map((p, i) => (
            <li key={p.id}>
              <button type="button" aria-current={p.id === selected ? 'true' : undefined} onClick={() => selectPart(p.id)}>
                <span>{i + 1}</span>
                {t(key(`pc.parts.${p.id}.name`))}
              </button>
            </li>
          ))}
        </ol>}
      </aside>

      <p className={styles.hint}>{t('explore.hint')}</p>
    </div>
  );
}
