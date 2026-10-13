/** Class announcements: the teacher publishes, every student of the class reads them. */
import { useState, type FormEvent } from 'react';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { teacherApi, type Announcement } from '@/services/classroom/api';
import { useAuthStore } from '@/store/authStore';
import type { TabProps } from './ClassPage';
import { fmtDateTime } from './format';
import { useErrorText } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

export function AnnouncementList({ items, onDelete, classNames }: { items: Announcement[]; onDelete?: (a: Announcement) => void; classNames?: Record<string, string> }) {
  const t = useT();
  if (!items.length) return <p className={styles.empty}>{t('classroom.announcements.none')}</p>;
  return (
    <ul className={styles.feed}>
      {items.map((a) => (
        <li key={a.id} className={styles.post}>
          <div className={styles.postHead}>
            <Megaphone size={16} aria-hidden="true" />
            <h3>{a.title}</h3>
            {onDelete && (
              <button type="button" className={styles.iconBtn} data-danger="true" onClick={() => onDelete(a)} aria-label={`${t('classroom.announcements.delete')}: ${a.title}`} title={t('classroom.announcements.delete')}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          <p className={styles.postBody}>{a.body}</p>
          <small className={styles.muted}>
            {a.author} · {fmtDateTime(a.createdAt)}
            {classNames?.[a.classId] ? ` · ${classNames[a.classId]}` : ''}
          </small>
        </li>
      ))}
    </ul>
  );
}

export function AnnouncementsTab({ detail, reload }: TabProps) {
  const t = useT();
  const errorText = useErrorText();
  const csrf = useAuthStore((s) => s.csrf);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const post = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      await teacherApi.announce(detail.class.id, title.trim(), body.trim(), csrf);
      setTitle('');
      setBody('');
      setError(null);
      reload();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async (a: Announcement) => {
    if (!csrf || !window.confirm(t('classroom.announcements.deleteConfirm', { title: a.title }))) return;
    try {
      await teacherApi.deleteAnnouncement(a.id, csrf);
      reload();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <div className={styles.split}>
      <section>
        <AnnouncementList items={detail.announcements} onDelete={remove} />
      </section>
      <form className={`${auth.panel} ${styles.side}`} onSubmit={post}>
        <h2>
          <Megaphone size={18} aria-hidden="true" /> {t('classroom.announcements.new')}
        </h2>
        <label className={auth.field}>
          <span>{t('classroom.announcements.title')}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </label>
        <label className={auth.field}>
          <span>{t('classroom.announcements.body')}</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} rows={6} required />
        </label>
        {error && (
          <p className={auth.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={auth.primary} disabled={!title.trim() || !body.trim()}>
          <Send size={16} aria-hidden="true" /> {t('classroom.announcements.publish')}
        </button>
      </form>
    </div>
  );
}
