import { CircleCheck, CircleX, Send } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { deviceById, isHost, type Network } from '@/labs/NetworkLab';
import type { PingRun } from './useNetworkLab';
import styles from './NetworkLab.module.css';

interface Props {
  network: Network;
  from: string;
  to: string;
  onFrom: (id: string) => void;
  onTo: (id: string) => void;
  onPing: () => void;
  run: PingRun | null;
  finished: boolean;
}

export function PingBar({ network, from, to, onFrom, onTo, onPing, run, finished }: Props) {
  const t = useT();
  const sources = network.devices.filter(isHost);
  const targets = network.devices.filter((d) => d.id !== from);
  const ready = sources.some((d) => d.id === from) && targets.some((d) => d.id === to);
  const r = run?.result;
  const route = r ? r.hops.map((id) => deviceById(network, id)?.name ?? id).join(' → ') : '';

  return (
    <section className={styles.pingBar} aria-label={t('network.ping.title')}>
      <div className={styles.pingControls}>
        <span className={styles.pingBadge}>PING</span>
        <label>
          <span>{t('network.ping.from')}</span>
          <select value={from} onChange={(e) => onFrom(e.target.value)} disabled={!sources.length}>
            {sources.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('network.ping.to')}</span>
          <select value={to} onChange={(e) => onTo(e.target.value)} disabled={!targets.length}>
            {targets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={styles.pingButton} onClick={onPing} disabled={!ready}>
          <Send size={15} aria-hidden="true" /> {t('network.ping.run')}
        </button>
      </div>
      <div className={styles.pingResult} role="status" aria-live="polite" data-state={!r ? 'idle' : !finished ? 'running' : r.ok ? 'ok' : 'fail'}>
        {!r && <p className={styles.muted}>{ready ? t('network.workspace.cableHint') : t('network.ping.need')}</p>}
        {r && !finished && <p>{t('network.ping.running')}</p>}
        {r && finished && (
          <>
            {r.ok ? <CircleCheck size={18} aria-hidden="true" /> : <CircleX size={18} aria-hidden="true" />}
            <div>
              <p>
                {!r.ok && r.direction === 'reply' && <b>{t('network.ping.replyPrefix', r.params)} </b>}
                {t(`network.ping.${r.reason}` as TranslationKey, r.params)}
              </p>
              <small>
                {!r.ok && r.params.at && <>{t('network.ping.stoppedAt', { at: r.params.at })} · </>}
                {t('network.ping.route', { route })}
              </small>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
