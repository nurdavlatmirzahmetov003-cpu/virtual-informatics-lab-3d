/**
 * `/remote` — the teacher's phone as the remote of class mode (0.37): big
 * buttons to move the projector's camera between zones, a zone grid, the
 * lessons and quick questions for Bit (who answers out loud on the
 * projector), and a «quiet» button. Signed in to the same teacher account
 * as the projector; the screen's state (zone, what Bit is saying) shows
 * at the top.
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LayoutGrid, MessageCircle, Send, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { LAB_ZONES } from '@/data/lab/zones';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { useRemoteSocket } from '@/services/live/remote';
import { useAuthStore } from '@/store/authStore';
import styles from './Remote.module.css';

const k = (s: string) => s as TranslationKey;
/** What the teacher can ask Bit from the phone (locale texts in the site's language). */
const PROMPTS = ['labLesson', 'next', 'zone', 'cpu', 'network', 'safety'] as const;

export default function RemotePage() {
  const t = useT();
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);
  const teacher = role === 'teacher' || role === 'admin';
  const [screens, setScreens] = useState(0);
  const [state, setState] = useState<{ zone: string | null; speaking: boolean; sentence: string }>({ zone: null, speaking: false, sentence: '' });
  const [text, setText] = useState('');
  const socket = useRemoteSocket(
    'remote',
    (m) => {
      if (m.t === 'presence' && typeof m.screens === 'number') setScreens(m.screens);
      if (m.t === 'sent' && typeof m.screens === 'number') setScreens(m.screens);
      if (m.t === 'state') setState({ zone: typeof m.zone === 'string' ? m.zone : null, speaking: m.speaking === true, sentence: typeof m.sentence === 'string' ? m.sentence : '' });
    },
    teacher,
  );
  const cmd = (m: Record<string, unknown>) => socket.send(m);
  const ask = (q: string) => cmd({ t: 'ask', text: q });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) ask(text.trim());
    setText('');
  };

  if (status !== 'signedIn' || !teacher)
    return (
      <PageLayout eyebrow={t('classMode.title')} title={t('remote.title')} subtitle={t('remote.signIn')}>
        <Link to="/login" className={styles.primary}>
          {t('remote.toLogin')}
        </Link>
      </PageLayout>
    );

  const online = socket.status === 'open';
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1>{t('remote.title')}</h1>
        <span className={styles.badge} data-on={(online && screens > 0) || undefined}>
          {online ? <Wifi size={16} aria-hidden="true" /> : <WifiOff size={16} aria-hidden="true" />}
          {!online ? t('classMode.offline') : screens > 0 ? t('remote.screens', { n: screens }) : t('remote.noScreen')}
        </span>
      </header>
      {screens === 0 && online && <p className={styles.note}>{t('remote.howToScreen')}</p>}

      <section className={styles.now} aria-live="polite">
        <small>{t('remote.onScreen')}</small>
        <b>{state.zone ? t(k(`lab.zones.${state.zone}.name`)) : t('remote.overview')}</b>
        {state.speaking && state.sentence && <p>«{state.sentence}»</p>}
      </section>

      <div className={styles.pad}>
        <button type="button" onClick={() => cmd({ t: 'zone', dir: -1 })} aria-label={t('remote.prev')}>
          <ArrowLeft size={28} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => cmd({ t: 'overview' })} aria-label={t('remote.overview')}>
          <LayoutGrid size={26} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => cmd({ t: 'zone', dir: 1 })} aria-label={t('remote.next')}>
          <ArrowRight size={28} aria-hidden="true" />
        </button>
      </div>

      <section>
        <h2>{t('remote.zones')}</h2>
        <div className={styles.grid}>
          {LAB_ZONES.map((z, i) => (
            <button key={z.id} type="button" data-on={state.zone === z.id || undefined} onClick={() => cmd({ t: 'zoneTo', zone: z.id })}>
              <span>{i + 1}</span> {t(k(`lab.zones.${z.id}.name`))}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>
          <MessageCircle size={18} aria-hidden="true" /> {t('remote.bit')}
        </h2>
        <div className={styles.grid}>
          {PROMPTS.map((p) => (
            <button key={p} type="button" onClick={() => ask(t(k(`remote.prompts.${p}`)))}>
              {t(k(`remote.prompts.${p}`))}
            </button>
          ))}
        </div>
        <form className={styles.ask} onSubmit={submit}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder={t('remote.askPlaceholder')} aria-label={t('remote.askPlaceholder')} />
          <button type="submit" aria-label={t('remote.send')} disabled={!text.trim()}>
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
        <button type="button" className={styles.quiet} onClick={() => cmd({ t: 'quiet' })}>
          <VolumeX size={18} aria-hidden="true" /> {t('remote.quiet')}
        </button>
      </section>
    </div>
  );
}
