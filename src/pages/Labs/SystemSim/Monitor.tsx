/**
 * The simulated monitor: what the student would actually see — BIOS POST
 * text, a black screen, the monitor's own "No Signal" box, "Boot device not
 * found", the OS starting, the desktop with an office window or a game.
 */
import type { ReactNode } from 'react';
import { useT } from '@/hooks/useT';
import { CPU_POWER, gameFps, type Build } from '@/labs/SystemSim';
import type { SimView } from './useSimRunner';
import styles from './SystemSim.module.css';

function Bios({ build, view }: { build: Build; view: SimView }) {
  const t = useT();
  const storage = { none: 'storageNone', hdd: 'storageHdd', sata: 'storageSata', nvme: 'storageNvme' } as const;
  const lines = [
    t('sim.bios.brand'),
    t(build.cpu === 'ryzen' ? 'sim.bios.cpuRyzen' : 'sim.bios.cpuIntel'),
    t('sim.bios.memory', { gb: build.ram * 16, ch: t(build.ram === 2 ? 'sim.bios.dual' : 'sim.bios.single') }),
    build.gpu === 'rtx' ? t('sim.bios.gpuRtx') : CPU_POWER[build.cpu].igpu ? t('sim.bios.gpuIgpu') : '',
    t(`sim.bios.${storage[build.storage]}`),
  ].filter(Boolean);
  return (
    <div className={styles.bios}>
      {lines.map((l, i) => (
        <p key={i} style={{ animationDelay: `${i * 0.18}s` }}>
          {l}
        </p>
      ))}
      {view.post?.warnings.includes('cpuFan') && <p className={styles.biosWarn}>{t('sim.bios.fan')}</p>}
      {view.phase === 'result' && view.post?.outcome === 'noBoot' && <p className={styles.biosError}>{t('sim.bios.noBoot')}</p>}
    </div>
  );
}

export function Monitor({ build, view }: { build: Build; view: SimView }) {
  const t = useT();
  const p = view.post;
  const sample = view.run && view.shown ? view.run.samples[view.shown - 1] : null;
  // a throttled CPU costs frames
  const fps = gameFps(build, sample?.throttling && view.run ? view.run.performance : 1);
  let content: ReactNode = <div className={styles.off}>{t('sim.screen.off')}</div>;

  if (view.phase === 'post' || view.phase === 'result') {
    if (!p?.picture) content = view.phase === 'result' && p?.outcome === 'wrongPort' ? <div className={styles.noSignal}>{t('sim.bios.noSignal')}</div> : <div className={styles.black} />;
    else content = <Bios build={build} view={view} />;
  }
  if (view.phase === 'booting') {
    content = (
      <div className={styles.boot}>
        <span className={styles.logo} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className={styles.bootBar}>
          <span style={{ width: `${view.boot * 100}%` }} />
        </span>
        <small>
          {t('sim.screen.booting')} {Math.round(view.boot * (p?.bootSeconds ?? 0))} / {Math.round(p?.bootSeconds ?? 0)} s
        </small>
      </div>
    );
  }
  if (view.phase === 'desktop' || view.phase === 'load') {
    const game = view.phase === 'load' && view.workload === 'game';
    const office = view.phase === 'load' && view.workload === 'office';
    const shownFps = fps;
    content = (
      <div className={styles.desktop}>
        {game ? (
          <div className={styles.game}>
            <span className={styles.fps} data-bad={shownFps < 30}>
              {t('sim.screen.game', { fps: shownFps })}
            </span>
            {shownFps < 30 && <span className={styles.slow}>{t('sim.screen.slow')}</span>}
          </div>
        ) : office ? (
          <div className={styles.window}>
            <span />
            <p>{t('sim.screen.office')}</p>
          </div>
        ) : (
          <div className={styles.icons} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        )}
        <div className={styles.taskbar} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }
  if (view.phase === 'shutdown') content = <div className={styles.dead}>{t('sim.screen.shutdown')}</div>;

  const on = view.phase !== 'off' && view.phase !== 'shutdown';
  return (
    <div className={styles.monitor}>
      <div className={styles.screen} role="img" aria-label={t('sim.panel.what')}>
        {content}
      </div>
      <div className={styles.chin}>
        <span className={styles.led} data-on={on && !!p?.picture} />
      </div>
      <div className={styles.stand} aria-hidden="true" />
    </div>
  );
}
