/**
 * Assignments: a lab task (scored automatically from the student's best
 * attempt) or written work, with a deadline and points.
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { taskById } from '@/services/progress/catalog';
import { teacherApi } from '@/services/classroom/api';
import { assignmentStats } from '@/services/classroom/stats';
import { useAuthStore } from '@/store/authStore';
import type { TabProps } from './ClassPage';
import { ExercisePicker } from './ExercisePicker';
import { fmtDateTime, fromInputValue, toInputValue } from './format';
import { useErrorText, useExerciseTitle, useNow } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

const WEEK = 7 * 24 * 3600 * 1000;

/** Next week, 23:59 local time — a sensible default deadline. */
function defaultDue() {
  const d = new Date(Date.now() + WEEK);
  d.setHours(23, 59, 0, 0);
  return toInputValue(d.getTime());
}

export function AssignmentsTab({ detail, reload }: TabProps) {
  const t = useT();
  const errorText = useErrorText();
  const exerciseTitle = useExerciseTitle();
  const csrf = useAuthStore((s) => s.csrf);
  const [exerciseId, setExerciseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState(defaultDue);
  const [points, setPoints] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const stats = new Map(assignmentStats(detail).map((s) => [s.id, s]));

  const pick = (id: string) => {
    // follow the task in the title until the teacher writes their own
    if (!title.trim() || title === exerciseTitle(exerciseId)) setTitle(exerciseTitle(id));
    setExerciseId(id);
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      await teacherApi.createAssignment(detail.class.id, { title: title.trim(), description: description.trim(), exerciseId: exerciseId || null, dueAt: fromInputValue(due), points: Number(points) }, csrf);
      setTitle('');
      setDescription('');
      setExerciseId('');
      setError(null);
      reload();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const remove = async (id: string, name: string) => {
    if (!csrf || !window.confirm(t('classroom.assignments.deleteConfirm', { title: name }))) return;
    try {
      await teacherApi.deleteAssignment(id, csrf);
      reload();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const now = useNow();
  return (
    <div className={styles.split}>
      <section>
        {!detail.assignments.length && <p className={styles.emptyBox}>{t('classroom.assignments.none')}</p>}
        <ul className={styles.cards}>
          {detail.assignments.map((a) => {
            const st = stats.get(a.id);
            const task = a.exerciseId ? taskById(a.exerciseId) : undefined;
            const overdue = a.dueAt != null && now > a.dueAt;
            return (
              <li key={a.id} className={styles.assignment}>
                <div className={styles.assignmentHead}>
                  <h3>{a.title}</h3>
                  <span className={styles.points}>{t('classroom.assignments.pointsN', { n: a.points })}</span>
                </div>
                {task ? (
                  <Link to={task.path} className={styles.taskLink}>
                    {exerciseTitle(a.exerciseId)} <ExternalLink size={13} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className={styles.muted}>{t('classroom.assignments.written')}</span>
                )}
                {a.description && <p className={styles.desc}>{a.description}</p>}
                <div className={styles.assignmentMeta}>
                  <span data-overdue={overdue}>
                    <CalendarClock size={14} aria-hidden="true" /> {a.dueAt ? fmtDateTime(a.dueAt) : t('classroom.assignments.noDue')}
                  </span>
                  {st && (
                    <span className={styles.meter} aria-label={t('classroom.assignments.doneN', { done: st.done, total: st.total })}>
                      <i style={{ width: `${st.total ? (st.done / st.total) * 100 : 0}%` }} />
                      <small>{t('classroom.assignments.doneN', { done: st.done, total: st.total })}</small>
                    </span>
                  )}
                  <button type="button" className={styles.iconBtn} data-danger="true" onClick={() => remove(a.id, a.title)} aria-label={`${t('classroom.assignments.delete')}: ${a.title}`} title={t('classroom.assignments.delete')}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <form className={`${auth.panel} ${styles.side}`} onSubmit={create}>
        <h2>
          <Plus size={18} aria-hidden="true" /> {t('classroom.assignments.new')}
        </h2>
        <div className={auth.field}>
          <label htmlFor="as-task">{t('classroom.assignments.task')}</label>
          <ExercisePicker id="as-task" value={exerciseId} onChange={pick} />
          <small>{exerciseId ? t('classroom.assignments.autoHint') : t('classroom.assignments.writtenHint')}</small>
        </div>
        <label className={auth.field}>
          <span>{t('classroom.assignments.title')}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </label>
        <label className={auth.field}>
          <span>{t('classroom.assignments.description')}</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} />
        </label>
        <div className={styles.twoCols}>
          <label className={auth.field}>
            <span>{t('classroom.assignments.due')}</span>
            <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
          <label className={auth.field}>
            <span>{t('classroom.assignments.points')}</span>
            <input type="number" min={1} max={100} value={points} onChange={(e) => setPoints(e.target.value)} required />
          </label>
        </div>
        {error && (
          <p className={auth.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={auth.primary} disabled={!title.trim()}>
          <Plus size={16} aria-hidden="true" /> {t('classroom.assignments.create')}
        </button>
      </form>
    </div>
  );
}
