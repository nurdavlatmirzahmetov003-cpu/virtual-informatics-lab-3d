/**
 * "Live" strip of a class (V2-12): how many students are online now and the
 * graded attempts of this class as they arrive (from the class events
 * socket), newest first. The journal itself refreshes on each attempt.
 */
import { Radio } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { useNow } from '@/hooks/useNow';
import { taskById } from '@/services/progress/catalog';
import { useLiveEvents } from '@/services/live/events';
import styles from './Classroom.module.css';

const k = (s: string) => s as TranslationKey;

/** Green dot next to a student who is online now. */
export function OnlineDot({ classId, studentId }: { classId: string; studentId: string }) {
  const t = useT();
  const online = useLiveEvents((s) => s.online[classId]?.includes(studentId) ?? false);
  if (!online) return null;
  return <span className={styles.onlineDot} title={t('classroom.live.online')} aria-label={t('classroom.live.online')} />;
}

export function LivePanel({ classId, students }: { classId: string; students: number }) {
  const t = useT();
  const now = useNow();
  const connected = useLiveEvents((s) => s.connected);
  const online = useLiveEvents((s) => s.online[classId]?.length ?? 0);
  const feed = useLiveEvents((s) => s.feed);
  const mine = feed.filter((e) => e.classIds.includes(classId)).slice(0, 5);
  const ago = (at: number) => {
    const s = Math.max(0, Math.round((now - at) / 1000));
    return s < 60 ? t('classroom.live.justNow') : t('classroom.live.minutesAgo', { n: Math.round(s / 60) });
  };
  return (
    <section className={styles.live} aria-labelledby="live-title" data-on={connected}>
      <h2 id="live-title">
        <Radio size={16} aria-hidden="true" /> {t('classroom.live.title')}
        <span className={styles.liveCount}>{t('classroom.live.onlineN', { n: online, of: students })}</span>
      </h2>
      {mine.length ? (
        <ul>
          {mine.map((e) => {
            const task = taskById(e.exerciseId);
            return (
              <li key={`${e.studentId}${e.at}${e.exerciseId}`} data-done={e.completed}>
                <b>{e.name}</b>
                <span>{task ? t(k(task.title)) : e.exerciseId}</span>
                <em>{e.percent}%</em>
                <small>{ago(e.at)}</small>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.muted}>{connected ? t('classroom.live.waiting') : t('classroom.live.offline')}</p>
      )}
    </section>
  );
}
