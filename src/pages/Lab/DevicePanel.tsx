import { lazy, Suspense, useMemo, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { anatomyItem } from '@/data/hardware/anatomy';
import { deviceById, deviceKey, deviceSpecs, type Device } from '@/data/devices/devices';
import { deviceExercise } from '@/data/devices/deviceQuiz';
import { zoneById } from '@/data/lab/zones';
import { ChoiceQuiz } from '@/components/quiz/ChoiceQuiz';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { useLabStore } from '@/store/labStore';
import { useProgressStore } from '@/store/progressStore';
import { hasDeviceModel } from '@/scenes/LabSpace/devices/deviceAssets';
import styles from './DevicePanel.module.css';

const DeviceViewer3D = lazy(() => import('./DeviceViewer3D'));
const key = (k: string) => k as TranslationKey;
type Level = 'student' | 'adult';
type Tab = 'info' | 'quiz';

function Info({ device, level }: { device: Device; level: Level }) {
  const t = useT();
  const specs = deviceSpecs(device, (id) => anatomyItem(id).specs);
  const base = deviceKey(device, 'specs');
  return (
    <div className={styles.info}>
      <p className={styles.explain}>{t(key(deviceKey(device, level === 'student' ? 'student' : 'adult')))}</p>
      <section>
        <h3>{t('deviceUi.sections.purpose')}</h3>
        <p>{t(key(deviceKey(device, 'purpose')))}</p>
      </section>
      <section>
        <h3>{t('deviceUi.sections.specs')}</h3>
        <dl className={styles.specs}>
          {specs.map((s) => (
            <div key={s}>
              <dt>{t(key(`${base}.${s}.label`))}</dt>
              <dd>{t(key(`${base}.${s}.value`))}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h3>{t('deviceUi.sections.ports')}</h3>
        {device.ports.length ? (
          <ul className={styles.ports}>
            {device.ports.map((p) => (
              <li key={p}>{t(key(`deviceUi.portTypes.${p}`))}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>{t('deviceUi.sections.noPorts')}</p>
        )}
      </section>
      <section>
        <h3>{t('deviceUi.sections.use')}</h3>
        <p>{t(key(`devices.${device.id}.use`))}</p>
      </section>
    </div>
  );
}

/**
 * Info panel of the open device: 360° viewer, explanation at the student or
 * adult level, purpose, specs, ports, real-world use and a graded test.
 */
export function DevicePanel() {
  const t = useT();
  const id = useLabStore((s) => s.device);
  const close = useLabStore((s) => s.closeDevice);
  const device = id ? deviceById(id) : undefined;
  const [tab, setTab] = useState<Tab>('info');
  const [level, setLevel] = useState<Level>('student');
  const [spin, setSpin] = useState(true);
  const exercise = useMemo(() => (device ? deviceExercise(device) : null), [device]);
  const best = useProgressStore((s) => (exercise ? s.exercises[exercise.id]?.best?.percent : undefined));
  if (!device) return null;
  const zone = zoneById(device.zone);
  const name = t(key(deviceKey(device, 'name')));
  const answers = device.anatomy ? anatomyItem(device.anatomy).answers : device.answers;

  return (
    <aside className={styles.panel} style={{ ['--zone' as string]: zone.accent }} aria-labelledby="device-title">
      <header className={styles.head}>
        <div>
          <span className={styles.zone}>{t('deviceUi.zoneOf', { zone: t(key(`lab.zones.${zone.id}.name`)) })}</span>
          <h2 id="device-title">{name}</h2>
        </div>
        <button type="button" className={styles.icon} onClick={close} aria-label={t('deviceUi.close')} title={t('deviceUi.close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      {hasDeviceModel(device.id) && (
        <div className={styles.viewer}>
          <Suspense fallback={null}>
            <DeviceViewer3D key={device.id} id={device.id} autoRotate={spin} label={t('deviceUi.viewerLabel', { name })} />
          </Suspense>
          <button type="button" className={styles.spin} onClick={() => setSpin((v) => !v)} aria-pressed={spin}>
            {spin ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {t('deviceUi.autoRotate')}
          </button>
          <p className={styles.hint}>{t('deviceUi.viewer')}</p>
        </div>
      )}

      {device.full ? (
        <>
          <div className={styles.tabs} role="tablist">
            {(['info', 'quiz'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {t(`deviceUi.tabs.${k}`)}
                {k === 'quiz' && best === 100 ? ' ✓' : ''}
              </button>
            ))}
          </div>
          {tab === 'info' ? (
            <>
              <div className={styles.levels} role="radiogroup" aria-label={t('deviceUi.level')}>
                {(['student', 'adult'] as const).map((l) => (
                  <button key={l} type="button" role="radio" aria-checked={level === l} onClick={() => setLevel(l)}>
                    {t(`deviceUi.levels.${l}`)}
                  </button>
                ))}
              </div>
              <Info device={device} level={level} />
            </>
          ) : (
            exercise &&
            answers && (
              <div className={styles.quiz}>
                {device.anatomy && <p className={styles.muted}>{t('deviceUi.quizShared')}</p>}
                <ChoiceQuiz key={exercise.id} answers={answers} keyBase={deviceKey(device, 'quiz')} exercise={exercise} />
              </div>
            )
          )}
        </>
      ) : (
        <div className={styles.info}>
          <p className={styles.explain}>{t(key(`devices.${device.id}.student`))}</p>
          <p className={styles.muted}>{t('deviceUi.soon')}</p>
        </div>
      )}
    </aside>
  );
}
