/**
 * Live activity for the admin (V2-12): who is online in every class right
 * now and the graded attempts of the whole school as they arrive — from the
 * class events socket (the admin receives every class). Class names come
 * from the admin classes list.
 */
import { useEffect, useMemo, useState } from 'react';
import { Radio } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useNow } from '@/hooks/useNow';
import type { TranslationKey } from '@/lib/i18n';
import { adminApi, type AdminClass } from '@/services/admin/api';
import { taskById } from '@/services/progress/catalog';
import { useLiveEvents } from '@/services/live/events';
import { useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

const k = (s: string) => s as TranslationKey;

export function LiveTab() {
  const t = useT();
  const now = useNow();
  const errorText = useAdminError();
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [error, setError] = useState<string | null>(null);
  const connected = useLiveEvents((s) => s.connected);
  const online = useLiveEvents((s) => s.online);
  const feed = useLiveEvents((s) => s.feed);

  useEffect(() => {
    adminApi.classes().then((r) => setClasses(r.classes), (e) => setError(errorText(e)));
  }, [errorText]);

  const names = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const students = new Set(Object.values(online).flat()).size;
  const ago = (at: number) => {
    const s = Math.max(0, Math.round((now - at) / 1000));
    return s < 60 ? t('classroom.live.justNow') : t('classroom.live.minutesAgo', { n: Math.round(s / 60) });
  };

  return (
    <div className={styles.stack}>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <section className={cls.live} data-on={connected} aria-labelledby="admin-live">
        <h2 id="admin-live">
          <Radio size={16} aria-hidden="true" /> {t('classroom.live.title')}
          <span className={cls.liveCount}>{t('admin.live.online', { n: students })}</span>
        </h2>
        {!connected && <p className={cls.muted}>{t('classroom.live.offline')}</p>}
        <div className={cls.tableWrap}>
          <table className={auth.table}>
            <thead>
              <tr>
                <th scope="col">{t('admin.live.class')}</th>
                <th scope="col">{t('admin.live.teacher')}</th>
                <th scope="col">{t('classroom.live.online')}</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.teacherName}</td>
                  <td>
                    {online[c.id]?.length ?? 0} / {c.students}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={cls.live} data-on={connected} aria-labelledby="admin-feed">
        <h2 id="admin-feed">{t('admin.live.feed')}</h2>
        {feed.length ? (
          <ul>
            {feed.map((e) => {
              const task = taskById(e.exerciseId);
              return (
                <li key={`${e.studentId}${e.at}${e.exerciseId}`} data-done={e.completed}>
                  <b>
                    {e.name} · {e.classIds.map((id) => names.get(id) ?? '—').join(', ')}
                  </b>
                  <span>{task ? t(k(task.title)) : e.exerciseId}</span>
                  <em>{e.percent}%</em>
                  <small>{ago(e.at)}</small>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={cls.muted}>{t('classroom.live.waiting')}</p>
        )}
      </section>
    </div>
  );
}
