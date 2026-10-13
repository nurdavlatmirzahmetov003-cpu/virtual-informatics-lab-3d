/**
 * Read-outs next to the monitor: the beep heard at POST, a thermometer, the
 * system power against the PSU rating, a live temperature graph with the
 * throttle and shutdown lines, flashing alerts, and "What happened?" —
 * the explanation of the outcome.
 */
import { AlertTriangle, Thermometer, Volume2, Zap } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { AMBIENT, BOOT_SECONDS, T_SHUTDOWN, T_THROTTLE, gameFps, type Build } from '@/labs/SystemSim';
import type { SimView } from './useSimRunner';
import styles from './SystemSim.module.css';

const key = (k: string) => k as TranslationKey;
const MIN_C = 20;
const MAX_C = 115;
const yOf = (c: number) => 100 - ((Math.min(MAX_C, Math.max(MIN_C, c)) - MIN_C) / (MAX_C - MIN_C)) * 100;

function Graph({ view }: { view: SimView }) {
  const t = useT();
  const pts = view.run ? view.run.samples.slice(0, view.shown) : [];
  const path = pts.map((s, i) => `${i ? 'L' : 'M'}${(s.t / 60) * 300} ${yOf(s.tempC)}`).join(' ');
  return (
    <figure className={styles.graph}>
      <figcaption>{t('sim.panel.graph')}</figcaption>
      <svg viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label={t('sim.panel.graph')}>
        <rect x="0" y={yOf(T_SHUTDOWN)} width="300" height={yOf(T_THROTTLE) - yOf(T_SHUTDOWN)} className={styles.hotZone} />
        <rect x="0" y="0" width="300" height={yOf(T_SHUTDOWN)} className={styles.deadZone} />
        <line x1="0" x2="300" y1={yOf(T_THROTTLE)} y2={yOf(T_THROTTLE)} className={styles.limit} />
        <line x1="0" x2="300" y1={yOf(T_SHUTDOWN)} y2={yOf(T_SHUTDOWN)} className={styles.limitHard} />
        {path && <path d={path} className={styles.curve} vectorEffect="non-scaling-stroke" />}
      </svg>
      <small>{t('sim.panel.limit')}</small>
    </figure>
  );
}

export function Instruments({ build, view }: { build: Build; view: SimView }) {
  const t = useT();
  const sample = view.run && view.shown ? view.run.samples[view.shown - 1] : null;
  const temp = sample?.tempC ?? (view.phase === 'desktop' || view.phase === 'booting' ? view.idleC ?? AMBIENT + 10 : view.phase === 'off' ? AMBIENT : AMBIENT + 8);
  const watts = sample?.watts ?? (view.phase === 'off' ? 0 : 90);
  const throttling = !!sample?.throttling && view.phase === 'load';
  const hot = temp >= T_THROTTLE;
  const overload = view.phase === 'shutdown' && view.run?.shutdown?.reason === 'psu';
  const p = view.post;
  const done = view.phase === 'load' && view.run && view.shown >= view.run.samples.length;

  let whyTitle: string | null = null;
  let why: string | null = null;
  if (view.phase === 'result' && p) {
    whyTitle = t(key(`sim.outcome.${p.outcome}.title`));
    why = t(key(`sim.outcome.${p.outcome}.why`));
  } else if ((view.phase === 'desktop' || view.phase === 'booting') && p) {
    whyTitle = t('sim.outcome.desktop.title');
    why = t('sim.outcome.desktop.why', { storage: t(key(`sim.parts.storage.${build.storage}`)), s: Math.round(p.bootSeconds) });
  } else if (view.phase === 'shutdown' && view.run?.shutdown) {
    const last = view.run.samples.at(-1)!;
    whyTitle = t('sim.screen.shutdown');
    why = t(key(`sim.shutdown.${view.run.shutdown.reason}.why`), { t: Math.round(last.t), c: Math.round(last.tempC), w: last.watts, psu: build.psu });
  } else if (done && view.run) {
    const fps = gameFps(build, view.run.throttled ? view.run.performance : 1);
    const last = view.run.samples.at(-1)!;
    whyTitle = t(key(`sim.workloads.${view.workload}`));
    why =
      view.workload === 'game' && fps < 30
        ? t('sim.result.lowFps', { fps })
        : view.run.throttled
          ? t('sim.result.throttled', { lost: Math.round((1 - view.run.performance) * 100) })
          : t('sim.result.ok', { work: t(key(`sim.workloads.${view.workload}`)), c: Math.round(last.tempC), w: last.watts });
  }

  return (
    <div className={styles.instruments}>
      {(throttling || hot || overload) && (
        <p className={styles.alert} role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          {overload ? t('sim.panel.overload') : temp >= T_SHUTDOWN - 2 ? t('sim.panel.hot') : t('sim.panel.throttling')}
        </p>
      )}

      <div className={styles.meters}>
        <div className={styles.thermo} data-hot={hot}>
          <span className={styles.meterLabel}>
            <Thermometer size={14} aria-hidden="true" /> {t('sim.panel.temp')}
          </span>
          <span className={styles.tube}>
            <span style={{ height: `${100 - yOf(temp)}%` }} />
          </span>
          <strong>{Math.round(temp)} °C</strong>
        </div>
        <div className={styles.power} data-over={watts > build.psu}>
          <span className={styles.meterLabel}>
            <Zap size={14} aria-hidden="true" /> {t('sim.panel.power')}
          </span>
          <span className={styles.powerBar}>
            <span style={{ width: `${Math.min(100, (watts / build.psu) * 100)}%` }} />
          </span>
          <strong>{t('sim.panel.psuOf', { w: watts, psu: build.psu })}</strong>
        </div>
      </div>

      <Graph view={view} />

      {p && view.phase !== 'off' && (
        <p className={styles.beep}>
          <Volume2 size={15} aria-hidden="true" />
          <span>
            <small>{t('sim.beeps.heard')}</small> {t(key(`sim.beeps.${p.beep}`))}
          </span>
        </p>
      )}

      {why && (
        <section className={styles.why} data-tone={view.phase === 'result' || view.phase === 'shutdown' ? 'bad' : 'ok'} aria-live="polite">
          <h3>{t('sim.panel.what')}</h3>
          <strong>{whyTitle}</strong>
          <p>{why}</p>
        </section>
      )}

      <section className={styles.compare}>
        <h3>{t('sim.panel.compare')}</h3>
        {(Object.keys(BOOT_SECONDS) as Array<keyof typeof BOOT_SECONDS>).map((s) => (
          <div key={s} data-on={build.storage === s}>
            <span>{t(key(`sim.parts.storage.${s}`))}</span>
            <span className={styles.cmpBar}>
              <span style={{ width: `${(BOOT_SECONDS[s] / BOOT_SECONDS.hdd) * 100}%` }} />
            </span>
            <span>{BOOT_SECONDS[s]} s</span>
          </div>
        ))}
      </section>
    </div>
  );
}
