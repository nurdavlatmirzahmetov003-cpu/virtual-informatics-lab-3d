/**
 * Teacher ↔ student messages (V2-9): refresh-based — it reloads every
 * 30 s while open and on the refresh button; real-time comes later.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { Message } from '@/services/classroom/api';
import { fmtDateTime } from './format';
import { useErrorText } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

const POLL_MS = 30_000;

export function MessageThread({ title, otherName, load, send, bare = false }: { title: string; otherName: string; load: () => Promise<Message[]>; send: (body: string) => Promise<Message[]>; /** Inside a dialog: no panel of its own. */ bare?: boolean }) {
  const t = useT();
  const errorText = useErrorText();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLOListElement>(null);

  const refresh = useCallback(() => {
    load()
      .then((m) => {
        setMessages(m);
        setError(null);
      })
      .catch((e) => setError(errorText(e)));
  }, [load, errorText]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    list.current?.lastElementChild?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      setMessages(await send(body));
      setDraft('');
      setError(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={bare ? styles.threadBare : `${auth.panel} ${styles.thread}`}>
      <div className={styles.sheetHead}>
        <h2>{title}</h2>
        <button type="button" className={styles.iconBtn} onClick={refresh} aria-label={t('classroom.messages.refresh')} title={t('classroom.messages.refresh')}>
          <RefreshCw size={16} aria-hidden="true" />
        </button>
      </div>
      {messages && messages.length === 0 && <p className={styles.empty}>{t('classroom.messages.empty', { name: otherName })}</p>}
      <ol className={styles.bubbles} ref={list} aria-live="polite">
        {messages?.map((m) => (
          <li key={m.id} className={styles.bubble} data-mine={m.mine}>
            <p>{m.body}</p>
            <small>
              {fmtDateTime(m.createdAt)}
              {m.mine && m.readAt ? ` · ${t('classroom.messages.read')}` : ''}
            </small>
          </li>
        ))}
      </ol>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <form className={styles.compose} onSubmit={submit}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void submit();
          }}
          maxLength={2000}
          rows={2}
          placeholder={t('classroom.messages.placeholder')}
          aria-label={t('classroom.messages.placeholder')}
        />
        <button type="submit" className={auth.primary} disabled={busy || !draft.trim()} aria-label={t('classroom.messages.send')}>
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
