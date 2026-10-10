import { lazy, useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { ArrowLeft, ArrowRight, Keyboard, LayoutGrid, Minus, Plus, RotateCcw } from 'lucide-react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { ButtonLink } from '@/components/ui/Button';
import { zoneById, type LabZoneId } from '@/data/lab/zones';
import { keyAction, zoneNumber } from '@/lib/lab/navigation';
import type { TranslationKey } from '@/lib/i18n';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { useLabStore } from '@/store/labStore';
import { LabMinimap } from './LabMinimap';
import styles from './LabPage.module.css';

const LabScene = lazy(() => import('@/scenes/LabSpace/LabScene'));
const key = (k: string) => k as TranslationKey;

/** Where each zone's "go deeper" button leads (zones without one have no action text). */
const ZONE_LINKS: Partial<Record<LabZoneId, string>> = {
  workstation: '/studio',
  assembly: '/labs/assembly',
  storage: '/explorer?device=hdd',
  peripherals: '/explorer',
  print_media: '/explorer?device=printer',
  network: '/labs/network',
  showcase: '/studio',
};

/** Page-wide keyboard control (ignored while typing in a field). */
function useLabKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      const action = keyAction(e.key);
      if (!action) return;
      e.preventDefault();
      const s = useLabStore.getState();
      if (action.type === 'focus') s.focusZone(action.zone);
      else if (action.type === 'overview') s.focusZone(null);
      else if (action.type === 'step') s.step(action.dir);
      else if (action.type === 'zoom') s.zoom(action.dir);
      else s.orbit(action.dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function ZonePanel() {
  const t = useT();
  const focus = useLabStore((s) => s.focus);
  const { step, focusZone } = useLabStore.getState();
  const zone = focus ? zoneById(focus) : null;
  const link = focus ? ZONE_LINKS[focus] : undefined;
  return (
    <section className={styles.panel} style={zone ? { ['--zone' as string]: zone.accent } : undefined} aria-labelledby="lab-zone-title">
      <span className={styles.eyebrow}>{zone ? `${String(zoneNumber(zone.id)).padStart(2, '0')} · ${t('lab.title')}` : t('lab.eyebrow')}</span>
      <h1 id="lab-zone-title" className={styles.title}>
        {zone ? t(key(`lab.zones.${zone.id}.name`)) : t('lab.title')}
      </h1>
      <p className={styles.lead}>{zone ? t(key(`lab.zones.${zone.id}.description`)) : t('lab.lead')}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} onClick={() => step(-1)} aria-label={t('lab.prev')} title={t('lab.prev')}>
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" className={styles.iconBtn} onClick={() => step(1)} aria-label={t('lab.next')} title={t('lab.next')}>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        {zone && (
          <button type="button" className={styles.textBtn} onClick={() => focusZone(null)}>
            <LayoutGrid size={16} aria-hidden="true" />
            {t('lab.overview')}
          </button>
        )}
      </div>
      {zone && link && (
        <ButtonLink to={link} variant="ghost" icon={<ArrowRight size={16} aria-hidden="true" />}>
          {t(key(`lab.zones.${zone.id}.action`))}
        </ButtonLink>
      )}
    </section>
  );
}

function ViewTools() {
  const t = useT();
  const [showKeys, setShowKeys] = useState(false);
  const { zoom, resetView } = useLabStore.getState();
  return (
    <div className={styles.tools}>
      <button type="button" className={styles.iconBtn} onClick={() => zoom(1)} aria-label={t('lab.zoomIn')} title={t('lab.zoomIn')}>
        <Plus size={18} aria-hidden="true" />
      </button>
      <button type="button" className={styles.iconBtn} onClick={() => zoom(-1)} aria-label={t('lab.zoomOut')} title={t('lab.zoomOut')}>
        <Minus size={18} aria-hidden="true" />
      </button>
      <button type="button" className={styles.iconBtn} onClick={resetView} aria-label={t('lab.resetView')} title={t('lab.resetView')}>
        <RotateCcw size={18} aria-hidden="true" />
      </button>
      <button type="button" className={styles.iconBtn} aria-expanded={showKeys} aria-controls="lab-keys" onClick={() => setShowKeys((v) => !v)} aria-label={t('lab.keys')} title={t('lab.keys')}>
        <Keyboard size={18} aria-hidden="true" />
      </button>
      {showKeys && (
        <ul id="lab-keys" className={styles.keys}>
          {(['digits', 'overview', 'step', 'zoom', 'orbit'] as const).map((k) => (
            <li key={k}>{t(key(`lab.keysList.${k}`))}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Polite status: which zone is shown, and whether its models are still loading. */
function Status() {
  const t = useT();
  const focus = useLabStore((s) => s.focus);
  const active = useProgress((s) => s.active);
  return (
    <>
      <p className={styles.srOnly} aria-live="polite">
        {focus ? t('lab.focused', { name: t(key(`lab.zones.${focus}.name`)) }) : t('lab.atOverview')}
      </p>
      {active && focus && (
        <p className={styles.loading} role="status">
          {t('lab.loading')}
        </p>
      )}
    </>
  );
}

export default function LabPage() {
  const t = useT();
  useDocumentTitle(t('lab.title'));
  useLabKeyboard();
  return (
    <div className={styles.stage}>
      <SceneCanvas initialCamera="LAB_OVERVIEW" label={t('lab.sceneLabel')}>
        <LabScene />
      </SceneCanvas>
      <div className={styles.overlay}>
        <ZonePanel />
        <LabMinimap />
        <ViewTools />
        <Status />
        <p className={styles.hint}>{t('lab.hint')}</p>
      </div>
    </div>
  );
}
