import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';
import { useFold } from '@/components/panel/foldState';
import { LAB_HALL, LAB_ZONES } from '@/data/lab/zones';
import { toMinimap, zoneNumber } from '@/lib/lab/navigation';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { labCameraPose, useLabStore } from '@/store/labStore';
import styles from './LabPage.module.css';

const W = 200;
const H = Math.round((W * (LAB_HALL.maxZ - LAB_HALL.minZ)) / (LAB_HALL.maxX - LAB_HALL.minX));
const scale = W / (LAB_HALL.maxX - LAB_HALL.minX);
const key = (k: string) => k as TranslationKey;

/**
 * Top-down map of the hall: every zone is a button (click or keyboard), the
 * camera is a dot with a view wedge, updated from the 3D frame loop without
 * re-rendering React.
 *
 * Collapsible (owner's request before V4 §10): the fold button or M folds it
 * into a round BitLab tab in the same corner; the tab or M brings it back.
 * Remembered like the other panels (components/panel/foldState): phones start
 * folded, full-screen folds it; picking a zone keeps it as it is.
 */
export function LabMinimap() {
  const t = useT();
  const focus = useLabStore((s) => s.focus);
  const hovered = useLabStore((s) => s.hovered);
  const { focusZone, hover } = useLabStore.getState();
  const marker = useRef<SVGGElement>(null);
  const fold = useFold('lab:map');
  const toggleMap = fold.toggle;

  // M toggles the map (not while typing, not with modifiers)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.code !== 'KeyM') return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      e.preventDefault();
      toggleMap();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMap]);

  useEffect(() => {
    if (fold.folded) return;
    let raf = 0;
    const tick = () => {
      const g = marker.current;
      if (g) {
        // the overview camera stands outside the open front: keep the dot on the map edge
        const [x, y] = toMinimap(labCameraPose.x, Math.min(labCameraPose.z, LAB_HALL.maxZ + 0.6), W, H);
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${Math.min(H + 4, y).toFixed(1)}) rotate(${((-labCameraPose.yaw * 180) / Math.PI + 180).toFixed(1)})`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fold.folded]);

  if (fold.folded) {
    return (
      <button type="button" className={styles.mapTab} onClick={fold.open} aria-expanded="false" aria-label={t('lab.mapFold.open')} title={`${t('lab.mapFold.open')} (M)`} data-map-tab>
        <BrandMark size={34} />
        <span className={styles.mapTabLabel}>{t('lab.mapFold.title')}</span>
      </button>
    );
  }

  return (
    <nav className={styles.minimap} aria-label={t('lab.minimap')} data-map-open>
      <button type="button" className={styles.mapFold} onClick={fold.close} aria-expanded="true" aria-label={t('lab.mapFold.close')} title={`${t('lab.mapFold.close')} (M)`}>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      <svg viewBox={`-6 -6 ${W + 12} ${H + 16}`} role="presentation">
        {/* walls: back and sides; the front (bottom) is open */}
        <path d={`M0 ${H} V0 H${W} V${H}`} className={styles.mapWall} />
        {LAB_ZONES.map((z) => {
          const [cx, cy] = toMinimap(z.center[0], z.center[1], W, H);
          const yaw = (Math.atan2(z.facing[0], z.facing[1]) * 180) / Math.PI;
          const [w, d] = z.size;
          const active = focus === z.id;
          return (
            <g
              key={z.id}
              transform={`translate(${cx} ${cy}) rotate(${-yaw})`}
              className={styles.mapZone}
              data-active={active}
              data-hot={hovered === z.id}
              style={{ ['--zone' as string]: z.accent }}
              onClick={() => focusZone(z.id)}
              onPointerEnter={() => hover(z.id)}
              onPointerLeave={() => hover(null)}
            >
              <rect x={(-w * scale) / 2} y={(-d * scale) / 2} width={w * scale} height={d * scale} rx={4} />
              <text y={4} transform={`rotate(${yaw})`}>{zoneNumber(z.id)}</text>
            </g>
          );
        })}
        <g ref={marker} className={styles.mapCamera} aria-hidden="true">
          <path d="M0 0 L-9 -16 A18 18 0 0 1 9 -16 Z" />
          <circle r={4} />
        </g>
      </svg>
      <ol className={styles.zoneList} aria-label={t('lab.zonesNav')}>
        {LAB_ZONES.map((z) => (
          <li key={z.id}>
            <button
              type="button"
              aria-current={focus === z.id ? 'true' : undefined}
              onClick={() => focusZone(z.id)}
              onFocus={() => hover(z.id)}
              onBlur={() => hover(null)}
              style={{ ['--zone' as string]: z.accent }}
            >
              <span aria-hidden="true">{zoneNumber(z.id)}</span>
              {t(key(`lab.zones.${z.id}.name`))}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
