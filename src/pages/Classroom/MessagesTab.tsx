/** Messages with each student of the class (`?student=` picks the thread). */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@/hooks/useT';
import { teacherApi } from '@/services/classroom/api';
import { useAuthStore } from '@/store/authStore';
import type { TabProps } from './ClassPage';
import { MessageThread } from './MessageThread';
import styles from './Classroom.module.css';

export function MessagesTab({ detail, reload, go }: TabProps) {
  const t = useT();
  const csrf = useAuthStore((s) => s.csrf);
  const [params] = useSearchParams();
  const classId = detail.class.id;
  const selected = detail.students.find((s) => s.id === params.get('student')) ?? null;
  const studentId = selected?.id ?? '';

  const load = useCallback(async () => {
    const r = await teacherApi.messages(classId, studentId);
    reload(); // unread badges
    return r.messages;
  }, [classId, studentId, reload]);
  const send = useCallback(async (body: string) => (await teacherApi.send(classId, studentId, body, csrf ?? '')).messages, [classId, studentId, csrf]);

  if (!detail.students.length) return <p className={styles.emptyBox}>{t('classroom.journal.noStudents')}</p>;
  return (
    <div className={styles.messages}>
      <ul className={styles.people} aria-label={t('classroom.messages.people')}>
        {detail.students.map((s) => {
          const unread = detail.unread[s.id] ?? 0;
          return (
            <li key={s.id}>
              <button type="button" className={styles.person} aria-current={s.id === studentId} onClick={() => go('messages', { student: s.id })}>
                <span>{s.displayName}</span>
                {unread > 0 && <span className={styles.badge}>{unread}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {selected ? (
        <MessageThread key={selected.id} title={selected.displayName} otherName={selected.displayName} load={load} send={send} />
      ) : (
        <p className={styles.emptyBox}>{t('classroom.messages.pick')}</p>
      )}
    </div>
  );
}
