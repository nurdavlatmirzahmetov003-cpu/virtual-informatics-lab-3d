/**
 * «Plug it in» (0.37): the Connection Lab's desk seen from behind, against
 * the clock. Drag a free cable end into a socket in 3D, or tap the end in
 * the list and then the socket. Every plug and pull is a move; ConnectLab's
 * `tryPlug` referees it on the server too.
 */
import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { CircleCheck, Hand } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { PC_SCENARIO, endsOf } from '@/labs/ConnectLab';
import { useConnectLabStore } from '@/store/connectLabStore';
import { portName } from '@/pages/Live/text';
import type { HandsOnView } from './types';
import styles from './HandsOn.module.css';

const ConnectStage = lazy(() => import('@/scenes/ConnectLab/ConnectStage'));
const k = (s: string) => s as TranslationKey;
const ENDS = endsOf(PC_SCENARIO);

export default function PlugGame({ move }: HandsOnView) {
  const t = useT();
  const sendRef = useRef(move);
  useEffect(() => {
    sendRef.current = move;
  }, [move]);
  useEffect(() => {
    useConnectLabStore.getState().playGame((m) => sendRef.current(m));
    return () => useConnectLabStore.getState().playGame(null);
  }, []);
  const plugged = useConnectLabStore((s) => s.plugs.pc.plugged);
  const carrying = useConnectLabStore((s) => s.carrying);
  const message = useConnectLabStore((s) => s.message);
  const names = useMemo(() => Object.fromEntries(PC_SCENARIO.ports.map((p) => [p.id, portName(t, p)])), [t]);
  const endName = (end: string) => {
    const [cable, side] = end.split('.');
    return side ? `${t(k(`connect.cables.${cable}`))} · ${t(k(`connect.ends.${side}`))}` : t(k(`connect.cables.${cable}`));
  };
  const say =
    message?.kind === 'ok'
      ? t('connect.ui.ok', { cable: endName(message.end), port: names[message.port] })
      : message?.kind === 'error'
        ? t(k(`connect.why.${message.reason}`), { plug: t(k(`connect.ports.${ENDS.find((e) => e.id === message.end)?.kind ?? ''}`)), port: names[message.port] })
        : carrying
          ? t('games3d.plug.carrying', { cable: endName(carrying) })
          : t('games3d.plug.start');

  return (
    <div className={styles.game}>
      <div className={`${styles.stage} ${styles.tall}`}>
        <Suspense fallback={<span className={styles.loading} />}>
          <ConnectStage task="pc" names={names} label={t('games3d.plug.scene')} />
        </Suspense>
      </div>
      <p className={styles.say} data-tone={message?.kind === 'error' ? 'warn' : message?.kind === 'ok' ? 'ok' : 'info'} role="status" aria-live="polite">
        {say}
      </p>
      <section className={styles.tray} aria-label={t('games3d.plug.ends')}>
        <h3>{t('games3d.plug.ends')}</h3>
        <div className={styles.tiles}>
          {ENDS.map((e) => {
            const port = plugged[e.id];
            return (
              <button
                key={e.id}
                type="button"
                className={styles.tile}
                data-state={port ? 'done' : carrying === e.id ? 'picked' : 'idle'}
                aria-pressed={carrying === e.id}
                onClick={() => (carrying === e.id ? useConnectLabStore.getState().drop() : useConnectLabStore.getState().pick(e.id, false))}
              >
                {port ? <CircleCheck size={14} aria-hidden="true" /> : carrying === e.id ? <Hand size={14} aria-hidden="true" /> : null}
                {endName(e.id)}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
