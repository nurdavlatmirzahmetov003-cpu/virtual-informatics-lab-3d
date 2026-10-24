/**
 * Class mode on the projector (0.37), `/lab?class=1`: a strip with the
 * address of the phone remote (and its QR code), full screen on request,
 * Bit's words as large captions for the back row — and the commands from
 * the teacher's phone carried out: zone forward / back / to a zone,
 * overview, «ask Bit» (it speaks to the whole class), «quiet».
 */
import { useEffect, useState } from 'react';
import { Maximize2, Smartphone, X } from 'lucide-react';
import type { LabZoneId } from '@/data/lab/zones';
import { useT } from '@/hooks/useT';
import { bitVoice, useVoiceStore } from '@/services/bit/voice';
import { useRemoteSocket, type RemoteCommand } from '@/services/live/remote';
import { useAuthStore } from '@/store/authStore';
import { useBitStore } from '@/store/bitStore';
import { useLabStore } from '@/store/labStore';
import { QrCode } from '../Classroom/parts';
import styles from './ClassMode.module.css';

function run(cmd: RemoteCommand) {
  const lab = useLabStore.getState();
  if (cmd.t === 'zone') lab.step(cmd.dir);
  else if (cmd.t === 'zoneTo') lab.focusZone(cmd.zone as LabZoneId);
  else if (cmd.t === 'overview') lab.focusZone(null);
  else if (cmd.t === 'quiet') bitVoice.stop();
  // Bit answers out loud, exactly as if the teacher had typed the question on the screen
  else if (cmd.t === 'ask') useBitStore.getState().send(cmd.text);
}

export function ClassMode({ onExit }: { onExit: () => void }) {
  const t = useT();
  const role = useAuthStore((s) => s.user?.role);
  const teacher = role === 'teacher' || role === 'admin';
  const [remotes, setRemotes] = useState(0);
  const { status, send } = useRemoteSocket(
    'screen',
    (m) => {
      if (m.t === 'command' && m.command) run(m.command as RemoteCommand);
      if (m.t === 'presence' && typeof m.remotes === 'number') setRemotes(m.remotes);
    },
    teacher,
  );
  const zone = useLabStore((s) => s.focus);
  const speaking = useVoiceStore((s) => s.speaking);
  const sentence = useVoiceStore((s) => s.sentence);

  // the phone shows what is on screen
  useEffect(() => {
    send({ t: 'state', zone, speaking, sentence });
  }, [zone, speaking, sentence, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const url = `${location.origin}${import.meta.env.BASE_URL}remote`;
  return (
    <>
      <aside className={styles.strip} aria-label={t('classMode.title')}>
        <b>{t('classMode.title')}</b>
        {teacher ? (
          <>
            <span className={styles.qr}>
              <QrCode text={url} label={t('classMode.scan')} size={92} />
            </span>
            <span className={styles.how}>
              <Smartphone size={16} aria-hidden="true" /> {t('classMode.how', { url })}
              <small data-on={remotes > 0 || undefined}>{remotes > 0 ? t('classMode.connected', { n: remotes }) : status === 'open' ? t('classMode.waiting') : t('classMode.offline')}</small>
            </span>
          </>
        ) : (
          <span className={styles.how}>{t('classMode.teachersOnly')}</span>
        )}
        <button type="button" onClick={() => void document.documentElement.requestFullscreen?.()} aria-label={t('classMode.fullscreen')} title={t('classMode.fullscreen')}>
          <Maximize2 size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={onExit} aria-label={t('classMode.exit')} title={t('classMode.exit')}>
          <X size={18} aria-hidden="true" />
        </button>
      </aside>
      {speaking && sentence && (
        <div className={styles.captions} role="status" aria-live="polite">
          {sentence}
        </div>
      )}
    </>
  );
}
