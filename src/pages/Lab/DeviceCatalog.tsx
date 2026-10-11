import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { DEVICES, deviceKey } from '@/data/devices/devices';
import { deviceExercise } from '@/data/devices/deviceQuiz';
import { LAB_ZONES, zoneById, type LabZoneId } from '@/data/lab/zones';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { useLabStore } from '@/store/labStore';
import { useProgressStore } from '@/store/progressStore';
import styles from './DevicePanel.module.css';

const key = (k: string) => k as TranslationKey;
const ZONES_WITH_DEVICES = LAB_ZONES.filter((z) => z.devices.length > 0);

/** Searchable list of every lab device, filterable by zone; a pick opens the device. */
export function DeviceCatalog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState<LabZoneId | null>(null);
  const exercises = useProgressStore((s) => s.exercises);
  const openDevice = useLabStore((s) => s.openDevice);

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return DEVICES.map((d) => ({ d, name: t(key(deviceKey(d, 'name'))) }))
      .filter(({ d, name }) => (!zone || d.zone === zone) && (!q || name.toLocaleLowerCase().includes(q) || d.id.includes(q)))
      .sort((a, b) => LAB_ZONES.findIndex((z) => z.id === a.d.zone) - LAB_ZONES.findIndex((z) => z.id === b.d.zone) || a.name.localeCompare(b.name));
  }, [query, zone, t]);

  return (
    <aside className={styles.catalog} aria-labelledby="device-catalog-title">
      <header className={styles.head}>
        <div>
          <span className={styles.zone}>{t('deviceUi.count', { n: items.length })}</span>
          <h2 id="device-catalog-title">{t('deviceUi.catalogTitle')}</h2>
        </div>
        <button type="button" className={styles.icon} onClick={onClose} aria-label={t('deviceUi.close')} title={t('deviceUi.close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <input className={styles.search} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('deviceUi.search')} aria-label={t('deviceUi.search')} />
      <div className={styles.chips} role="group" aria-label={t('lab.zonesNav')}>
        <button type="button" aria-pressed={zone === null} onClick={() => setZone(null)}>
          {t('deviceUi.all')}
        </button>
        {ZONES_WITH_DEVICES.map((z) => (
          <button key={z.id} type="button" aria-pressed={zone === z.id} onClick={() => setZone(z.id)} style={{ ['--zone' as string]: z.accent }}>
            {t(key(`lab.zones.${z.id}.name`))}
          </button>
        ))}
      </div>
      {items.length ? (
        <ul className={styles.list}>
          {items.map(({ d, name }) => {
            const ex = deviceExercise(d);
            const done = ex ? exercises[ex.id]?.best?.percent === 100 : false;
            return (
              <li key={d.id}>
                <button type="button" onClick={() => openDevice(d.id)} style={{ ['--zone' as string]: zoneById(d.zone).accent }}>
                  <span className={styles.dot} aria-hidden="true" />
                  {name}
                  {done && (
                    <span className={styles.done} aria-label={t('deviceUi.done')} title={t('deviceUi.done')}>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.muted}>{t('deviceUi.none')}</p>
      )}
    </aside>
  );
}
