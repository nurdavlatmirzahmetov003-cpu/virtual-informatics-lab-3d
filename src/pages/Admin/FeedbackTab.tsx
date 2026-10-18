/**
 * Site rating, feedback and messages to the administrator (0.36): the
 * average and the stars, every comment (spam can be deleted), and the
 * inbox of the contact form with new / read / done.
 */
import { useCallback, useEffect, useState } from 'react';
import { Inbox, Star, Trash2 } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { feedbackApi } from '@/services/feedback/api';
import { formatDateTime } from '../Progress/dates';
import { useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

const k = (s: string) => s as TranslationKey;
type List = Awaited<ReturnType<typeof feedbackApi.list>>;
type Box = Awaited<ReturnType<typeof feedbackApi.inbox>>['messages'];

export function FeedbackTab() {
  const t = useT();
  const errorText = useAdminError();
  const [list, setList] = useState<List | null>(null);
  const [inbox, setInbox] = useState<Box>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    feedbackApi.list().then(setList, (e) => setError(errorText(e)));
    feedbackApi.inbox().then((r) => setInbox(r.messages), (e) => setError(errorText(e)));
  }, [errorText]);
  useEffect(load, [load]);

  const act = (p: Promise<unknown>) => p.then(load, (e) => setError(errorText(e)));
  const s = list?.summary;

  return (
    <div className={styles.stack}>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <section className={styles.fbCard}>
        <h2>
          <Inbox size={18} aria-hidden="true" /> {t('admin.feedback.inbox')}
        </h2>
        {inbox.length === 0 && <p className={cls.muted}>{t('admin.feedback.noMessages')}</p>}
        <ul className={styles.feedList}>
          {inbox.map((m) => (
            <li key={m.id} data-status={m.status}>
              <header>
                <b>{m.name}</b>
                <span className={cls.muted}>
                  {m.login ?? t('admin.feedback.guest')} · {t(k(`contact.topics.${m.topic}`))} · {formatDateTime(m.createdAt)}
                </span>
                <span className={styles.statusBadge} data-status={m.status}>
                  {t(k(`admin.feedback.status.${m.status}`))}
                </span>
              </header>
              <p>{m.body}</p>
              {m.contact && (
                <p className={cls.muted}>
                  {t('admin.feedback.contact')}: {m.contact}
                </p>
              )}
              <div className={styles.feedActions}>
                {m.status === 'new' && (
                  <button type="button" className={auth.secondary} onClick={() => act(feedbackApi.mark(m.id, 'read'))}>
                    {t('admin.feedback.markRead')}
                  </button>
                )}
                {m.status !== 'done' ? (
                  <button type="button" className={auth.secondary} onClick={() => act(feedbackApi.mark(m.id, 'done'))}>
                    {t('admin.feedback.markDone')}
                  </button>
                ) : (
                  <button type="button" className={auth.secondary} onClick={() => act(feedbackApi.mark(m.id, 'new'))}>
                    {t('admin.feedback.reopen')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.fbCard}>
        <h2>
          <Star size={18} aria-hidden="true" /> {t('admin.feedback.summary')}
        </h2>
        {s && s.count > 0 ? (
          <p>
            <b className={styles.bigNumber}>{s.average?.toFixed(1)}</b> / 5 · {t('feedback.votes', { n: s.count })} · {s.stars.map((n, i) => `${i + 1}★ ${n}`).join(' · ')}
          </p>
        ) : (
          <p className={cls.muted}>{t('admin.feedback.empty')}</p>
        )}
        <ul className={styles.feedList}>
          {list?.items.map((f) => (
            <li key={f.id}>
              <header>
                <b>{'★'.repeat(f.rating)}</b>
                <span>{f.name || f.login || t('admin.feedback.guest')}</span>
                <span className={cls.muted}>
                  {formatDateTime(f.createdAt)} · {f.lang}
                  {f.page ? ` · ${f.page}` : ''}
                </span>
                <button type="button" className={auth.secondary} onClick={() => act(feedbackApi.remove(f.id))} aria-label={t('admin.feedback.delete')} title={t('admin.feedback.delete')}>
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </header>
              {f.liked && (
                <p>
                  <b>{t('admin.feedback.liked')}:</b> {f.liked}
                </p>
              )}
              {f.improve && (
                <p>
                  <b>{t('admin.feedback.improve')}:</b> {f.improve}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
