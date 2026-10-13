/**
 * Students of the class: register a list (one name per line → generated
 * logins and passwords), reset a password, take a student out of the class,
 * look at all their lab attempts. Class settings (rename, delete) at the end.
 */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, KeyRound, MessageSquare, Trash2, UserMinus, UserPlus, Save } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { teacherApi, type Member, type WorkAttempt } from '@/services/classroom/api';
import { cellKey, cellStatus, studentTotals } from '@/services/classroom/stats';
import { useAuthStore } from '@/store/authStore';
import type { TabProps } from './ClassPage';
import { fmtDateTime, fmtSeconds } from './format';
import { Modal, StatusChip } from './parts';
import { useErrorText, useExerciseTitle, useNow } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

const MAX_NAMES = 60;

function WorkDialog({ detail, student, onClose }: Pick<TabProps, 'detail'> & { student: Member; onClose: () => void }) {
  const t = useT();
  const exerciseTitle = useExerciseTitle();
  const [attempts, setAttempts] = useState<WorkAttempt[] | null>(null);
  const errorText = useErrorText();
  const [error, setError] = useState<string | null>(null);
  const classId = detail.class.id;
  useEffect(() => {
    teacherApi
      .work(classId, student.id)
      .then((r) => setAttempts(r.attempts))
      .catch((e) => setError(errorText(e)));
  }, [classId, student.id, errorText]);
  const now = useNow();
  return (
    <Modal title={t('classroom.work.title', { name: student.displayName })} onClose={onClose} wide>
      <h3 className={styles.subTitle}>{t('classroom.work.assignments')}</h3>
      <ul className={styles.workList}>
        {detail.assignments.map((a) => {
          const cell = detail.cells[cellKey(a.id, student.id)];
          return (
            <li key={a.id}>
              <span>{a.title}</span>
              <StatusChip status={cellStatus(cell, a, now)} />
              <b>
                {cell?.final ?? '—'}/{a.points}
              </b>
            </li>
          );
        })}
      </ul>
      <h3 className={styles.subTitle}>{t('classroom.work.attempts')}</h3>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      {attempts?.length === 0 && <p className={styles.empty}>{t('classroom.work.none')}</p>}
      {!!attempts?.length && (
        <div className={styles.tableWrap}>
          <table className={auth.table}>
            <thead>
              <tr>
                <th>{t('classroom.work.task')}</th>
                <th>%</th>
                <th>{t('classroom.grade.time')}</th>
                <th>{t('classroom.grade.errors')}</th>
                <th>{t('classroom.grade.hints')}</th>
                <th>{t('classroom.grade.when')}</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>{exerciseTitle(a.exerciseId) || a.exerciseId}</td>
                  <td>
                    <span className={styles.pct} data-ok={a.status === 'completed'}>
                      {a.percent}%
                    </span>
                  </td>
                  <td>{fmtSeconds(a.seconds)}</td>
                  <td>{a.errors}</td>
                  <td>{a.hints}</td>
                  <td className={styles.nowrap}>{fmtDateTime(a.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

function ClassSettings({ detail, reload }: Pick<TabProps, 'detail' | 'reload'>) {
  const t = useT();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const csrf = useAuthStore((s) => s.csrf);
  const [name, setName] = useState(detail.class.name);
  const [error, setError] = useState<string | null>(null);
  const rename = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      await teacherApi.updateClass(detail.class.id, { name }, csrf);
      setError(null);
      reload();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async () => {
    if (!csrf || !window.confirm(t('classroom.settings.deleteConfirm', { name: detail.class.name }))) return;
    try {
      await teacherApi.deleteClass(detail.class.id, csrf);
      navigate('/teacher');
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <form className={auth.panel} onSubmit={rename}>
      <h2>{t('classroom.settings.title')}</h2>
      <label className={auth.field}>
        <span>{t('classroom.teacher.className')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      </label>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.row}>
        <button type="submit" className={auth.secondary} disabled={!name.trim() || name.trim() === detail.class.name}>
          <Save size={16} aria-hidden="true" /> {t('classroom.settings.rename')}
        </button>
        <button type="button" className={styles.danger} onClick={remove}>
          <Trash2 size={16} aria-hidden="true" /> {t('classroom.settings.delete')}
        </button>
      </div>
      <p className={styles.hint}>{t('classroom.settings.deleteHint')}</p>
    </form>
  );
}

export function StudentsTab({ detail, reload, go, showCredentials }: TabProps) {
  const t = useT();
  const errorText = useErrorText();
  const csrf = useAuthStore((s) => s.csrf);
  const [names, setNames] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [work, setWork] = useState<Member | null>(null);
  const list = useMemo(
    () =>
      names
        .split(/\r?\n/)
        .map((n) => n.trim())
        .filter(Boolean),
    [names],
  );
  const totals = useMemo(() => new Map(studentTotals(detail).map((x) => [x.id, x])), [detail]);
  const closeWork = useCallback(() => setWork(null), []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf || !list.length || list.length > MAX_NAMES) return;
    setBusy(true);
    try {
      const r = await teacherApi.addStudents(detail.class.id, list, csrf);
      setNames('');
      setError(null);
      showCredentials(r.created);
      reload();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const reset = async (s: Member) => {
    if (!csrf || !window.confirm(t('classroom.students.resetConfirm', { name: s.displayName }))) return;
    try {
      const r = await teacherApi.resetPassword(detail.class.id, s.id, csrf);
      showCredentials([r.credential]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async (s: Member) => {
    if (!csrf || !window.confirm(t('classroom.students.removeConfirm', { name: s.displayName }))) return;
    try {
      await teacherApi.removeStudent(detail.class.id, s.id, csrf);
      reload();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <div className={styles.split}>
      <section className={auth.panel}>
        <h2>{t('classroom.students.title', { n: detail.students.length })}</h2>
        {error && (
          <p className={auth.error} role="alert">
            {error}
          </p>
        )}
        {!detail.students.length ? (
          <p className={styles.empty}>{t('classroom.students.none')}</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={auth.table}>
              <thead>
                <tr>
                  <th>{t('classroom.students.name')}</th>
                  <th>{t('auth.login')}</th>
                  <th>{t('classroom.students.done')}</th>
                  <th>{t('classroom.students.lastSeen')}</th>
                  <th>
                    <span className="visually-hidden">{t('classroom.students.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.students.map((s) => {
                  const total = totals.get(s.id);
                  const unread = detail.unread[s.id] ?? 0;
                  return (
                    <tr key={s.id} data-disabled={s.disabled}>
                      <td>{s.displayName}</td>
                      <td className={styles.mono}>{s.login}</td>
                      <td>
                        {total?.done ?? 0}/{detail.assignments.length}
                        {total?.percent != null && <small className={styles.muted}> · {total.percent}%</small>}
                      </td>
                      <td className={styles.nowrap}>{s.lastLoginAt ? fmtDateTime(s.lastLoginAt) : t('classroom.students.never')}</td>
                      <td>
                        <div className={styles.actions}>
                          <button type="button" className={styles.iconBtn} onClick={() => setWork(s)} title={t('classroom.students.work')} aria-label={`${t('classroom.students.work')}: ${s.displayName}`}>
                            <Eye size={16} aria-hidden="true" />
                          </button>
                          <button type="button" className={styles.iconBtn} onClick={() => go('messages', { student: s.id })} title={t('classroom.students.message')} aria-label={`${t('classroom.students.message')}: ${s.displayName}`}>
                            <MessageSquare size={16} aria-hidden="true" />
                            {unread > 0 && <span className={styles.dot}>{unread}</span>}
                          </button>
                          <button type="button" className={styles.iconBtn} onClick={() => reset(s)} title={t('classroom.students.reset')} aria-label={`${t('classroom.students.reset')}: ${s.displayName}`}>
                            <KeyRound size={16} aria-hidden="true" />
                          </button>
                          <button type="button" className={styles.iconBtn} data-danger="true" onClick={() => remove(s)} title={t('classroom.students.remove')} aria-label={`${t('classroom.students.remove')}: ${s.displayName}`}>
                            <UserMinus size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className={styles.side}>
        <form className={auth.panel} onSubmit={add}>
          <h2>
            <UserPlus size={18} aria-hidden="true" /> {t('classroom.students.add')}
          </h2>
          <label className={auth.field}>
            <span>{t('classroom.students.list')}</span>
            <textarea value={names} onChange={(e) => setNames(e.target.value)} rows={8} placeholder={t('classroom.students.listPlaceholder')} spellCheck={false} />
            <small>{t('classroom.students.listHint', { n: list.length, max: MAX_NAMES })}</small>
          </label>
          <button type="submit" className={auth.primary} disabled={busy || !list.length || list.length > MAX_NAMES}>
            <UserPlus size={16} aria-hidden="true" /> {busy ? t('classroom.students.creating') : t('classroom.students.create', { n: list.length })}
          </button>
          <p className={styles.hint}>{t('classroom.students.orCode', { code: detail.class.joinCode })}</p>
        </form>
        <ClassSettings key={detail.class.name} detail={detail} reload={reload} />
      </div>

      {work && <WorkDialog detail={detail} student={work} onClose={closeWork} />}
    </div>
  );
}
