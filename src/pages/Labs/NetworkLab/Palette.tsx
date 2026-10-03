import { useEffect, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { DEVICE_SPECS, DEVICE_TYPES, MAX_DEVICES, roleOf, type DeviceType, type Network } from '@/labs/NetworkLab';
import { DEVICE_ICONS, DEVICE_TONE } from './deviceIcons';
import { VIEW, clampToView, clientToView } from './geometry';
import type { NetworkLabActions } from './useNetworkLab';
import styles from './NetworkLab.module.css';

const tk = (key: string) => key as TranslationKey;

interface Ghost {
  type: DeviceType;
  x: number;
  y: number;
  startX: number;
  startY: number;
  pointerId: number;
}

/** A free spot for click-to-add: walks a loose grid until nothing overlaps. */
function freeSpot(net: Network, type: DeviceType) {
  const { width, height } = DEVICE_SPECS[type];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 130 + col * 185;
      const y = 110 + row * 140;
      const clear = net.devices.every((d) => Math.abs(d.x - x) > (width + DEVICE_SPECS[d.type].width) / 2 + 12 || Math.abs(d.y - y) > (height + DEVICE_SPECS[d.type].height) / 2 + 30);
      if (clear) return clampToView({ type }, x, y);
    }
  }
  return clampToView({ type }, VIEW.width / 2, VIEW.height / 2);
}

export function Palette({ network, actions, svgRef }: { network: Network; actions: NetworkLabActions; svgRef: RefObject<SVGSVGElement | null> }) {
  const t = useT();
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const full = network.devices.length >= MAX_DEVICES;

  useEffect(() => {
    if (!ghost) return;
    const move = (e: PointerEvent) => e.pointerId === ghost.pointerId && setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
    const up = (e: PointerEvent) => {
      if (e.pointerId !== ghost.pointerId) return;
      const moved = Math.hypot(e.clientX - ghost.startX, e.clientY - ghost.startY) > 6;
      const drop = moved ? clientToView(svgRef.current, e.clientX, e.clientY, true) : null;
      if (drop) {
        const p = clampToView({ type: ghost.type }, drop.x, drop.y);
        actions.add(ghost.type, p.x, p.y);
      } else if (!moved) {
        const p = freeSpot(network, ghost.type);
        actions.add(ghost.type, p.x, p.y);
      }
      setGhost(null);
    };
    const cancel = () => setGhost(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [ghost, actions, network, svgRef]);

  const start = (e: ReactPointerEvent, type: DeviceType) => {
    if (e.button !== 0 || full) return;
    e.preventDefault();
    setGhost({ type, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId });
  };

  const GhostIcon = ghost && Math.hypot(ghost.x - ghost.startX, ghost.y - ghost.startY) > 6 ? DEVICE_ICONS[ghost.type] : null;

  return (
    <aside className={styles.palette} aria-label={t('network.palette.title')}>
      <header>
        <h2>{t('network.palette.title')}</h2>
        <p>{full ? t('network.palette.full', { max: MAX_DEVICES }) : t('network.palette.hint')}</p>
      </header>
      <ul>
        {DEVICE_TYPES.map((type) => {
          const Icon = DEVICE_ICONS[type];
          return (
            <li key={type}>
              <button
                type="button"
                className={styles.paletteItem}
                style={{ ['--tone' as string]: DEVICE_TONE[type] }}
                disabled={full}
                onPointerDown={(e) => start(e, type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const p = freeSpot(network, type);
                    actions.add(type, p.x, p.y);
                  }
                }}
              >
                <span className={styles.paletteIcon}>
                  <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className={styles.paletteText}>
                  <b>{t(tk(`network.devices.${type}`))}</b>
                  <small>{t(tk(`network.role.${roleOf(type)}`))}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {ghost &&
        GhostIcon &&
        createPortal(
          <div className={styles.ghost} style={{ left: ghost.x, top: ghost.y, ['--tone' as string]: DEVICE_TONE[ghost.type] }} aria-hidden="true">
            <GhostIcon size={20} strokeWidth={1.7} />
            {t(tk(`network.devices.${ghost.type}`))}
          </div>,
          document.body,
        )}
    </aside>
  );
}
