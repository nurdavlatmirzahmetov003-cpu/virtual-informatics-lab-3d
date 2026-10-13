/**
 * The class journal: students × assignments with the final score in each
 * cell. A cell opens the grading dialog — the lab's automatic score, the
 * counted attempt (time, mistakes, hints), the student's answer, and the
 * teacher's own score and comment.
 */
import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Undo2, Save } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { teacherApi, type Assignment, type Member } from '@/services/classroom/api';
import { cellKey, cellStatus, studentTotals } from '@/services/classroom/stats';
import { useAuthStore } from '@/store/authStore';
import type { TabProps } from './ClassPage';
import { fmtDateTime, fmtSeconds } from './format';
import { Modal, StatusChip } from './parts';
import { useErrorText, useExerciseTitle, useNow } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

function GradeDialog({ detail, assignment, student, onClose, onSaved }: Pick<TabProps, 'detail'> & { assignment: Assignment; student: Member; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const errorText = useErrorText();
  const exerciseTitle = useExerciseTitle();
  const csrf = useAuthStore((s) => s.csrf);
  const now = useNow();
  const cell = detail.cells[cellKey(assignment.id, student.id)];
  const [score, setScore] = useState(String(cell?.grade?.score ?? cell?.auto ?? ''));
  const [comment, setComment] = useState(cell?.grade?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const best = cell?.best;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      await teacherApi.setGrade(assignment.id, student.id, Number(score), comment, csrf);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const revertToAuto = async () => {
    if (!csrf) return;
    try {
      await teacherApi.clearGrade(assignment.id, student.id, csrf);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Modal title={`${student.displayName} — ${assignment.title}`} onClose={onClose}>
      <div className={styles.gradeTop}>
        <StatusChip status={cellStatus(cell, assignment, now)} />
        {assignment.exerciseId && <span className={styles.muted}>{exerciseTitle(assignment.exerciseId)}</span>}
      </div>
      {best ? (
        <dl className={styles.facts}>
          <div>
            <dt>{t('classroom.grade.auto')}</dt>
            <dd>
              {cell.auto}/{assignment.points} <small>({best.percent}%)</small>
            </dd>
          </div>
          <div>
            <dt>{t('classroom.grade.time')}</dt>
            <dd>{fmtSeconds(best.seconds)}</dd>
          </div>
          <div>
            <dt>{t('classroom.grade.errors')}</dt>
            <dd>{best.errors}</dd>
          </div>
          <div>
            <dt>{t('classroom.grade.hints')}</dt>
            <dd>{best.hints}</dd>
          </div>
          <div>
            <dt>{t('classroom.grade.attempts')}</dt>
            <dd>{cell.attempts}</dd>
          </div>
          <div>
            <dt>{t('classroom.grade.when')}</dt>
            <dd>
              {fmtDateTime(best.at)}
              {cell.late && <span className={styles.lateTag}>{t('classroom.status.late')}</span>}
            </dd>
          </div>
        </dl>
      ) : (
        assignment.exerciseId && <p className={styles.empty}>{t('classroom.grade.noAttempt')}</p>
      )}
      {cell?.answer && (
        <blockquote className={styles.answer}>
          <small>
            {t('classroom.grade.answer')} · {fmtDateTime(cell.answer.at)}
          </small>
          <p>{cell.answer.body}</p>
        </blockquote>
      )}
      <form className={styles.gradeForm} onSubmit={save}>
        <label className={auth.field}>
          <span>{t('classroom.grade.score', { max: assignment.points })}</span>
          <input type="number" min={0} max={assignment.points} step={1} value={score} onChange={(e) => setScore(e.target.value)} required />
        </label>
        <label className={auth.field}>
          <span>{t('classroom.grade.comment')}</span>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} placeholder={t('classroom.grade.commentPlaceholder')} />
        </label>
        {error && (
          <p className={auth.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.row}>
          <button type="submit" className={auth.primary} disabled={score === ''}>
            <Save size={16} aria-hidden="true" /> {t('classroom.grade.save')}
          </button>
          {cell?.grade && (
            <button type="button" className={auth.secondary} onClick={revertToAuto}>
              <Undo2 size={16} aria-hidden="true" /> {t('classroom.grade.useAuto')}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export function JournalTab({ detail, reload, go }: TabProps) {
  const t = useT();
  const [open, setOpen] = useState<{ a: Assignment; s: Member } | null>(null);
  const totals = useMemo(() => new Map(studentTotals(detail).map((x) => [x.id, x])), [detail]);
  const now = useNow();
  const close = useCallback(() => setOpen(null), []);

  if (!detail.students.length || !detail.assignments.length) {
    return (
      <div className={styles.emptyBox}>
        {!detail.students.length && (
          <p>
            {t('classroom.journal.noStudents')}{' '}
            <button type="button" className={styles.linkBtn} onClick={() => go('students')}>
              {t('classroom.tabs.students')}
            </button>
          </p>
        )}
        {!detail.assignments.length && (
          <p>
            {t('classroom.journal.noAssignments')}{' '}
            <button type="button" className={styles.linkBtn} onClick={() => go('assignments')}>
              {t('classroom.tabs.assignments')}
            </button>
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <p className={styles.hint}>{t('classroom.journal.hint')}</p>
      <div className={styles.journalWrap}>
        <table className={styles.journal}>
          <thead>
            <tr>
              <th scope="col" className={styles.stickyCol}>
                {t('classroom.students.name')}
              </th>
              {detail.assignments.map((a) => (
                <th key={a.id} scope="col" title={a.description || a.title}>
                  <span className={styles.colTitle}>{a.title}</span>
                  <small>
                    {a.points} {t('classroom.journal.pts')}
                    {a.dueAt ? ` · ${fmtDateTime(a.dueAt)}` : ''}
                  </small>
                </th>
              ))}
              <th scope="col">{t('classroom.journal.total')}</th>
            </tr>
          </thead>
          <tbody>
            {detail.students.map((s) => {
              const total = totals.get(s.id);
              return (
                <tr key={s.id}>
                  <th scope="row" className={styles.stickyCol}>
                    {s.displayName}
                    <small>{s.login}</small>
                  </th>
                  {detail.assignments.map((a) => {
                    const cell = detail.cells[cellKey(a.id, s.id)];
                    const status = cellStatus(cell, a, now);
                    return (
                      <td key={a.id}>
                        <button type="button" className={styles.cell} data-status={status} onClick={() => setOpen({ a, s })} aria-label={`${s.displayName}, ${a.title}: ${t(`classroom.status.${status}`)}`}>
                          <b>{cell?.final ?? '—'}</b>
                          <StatusChip status={status} compact />
                        </button>
                      </td>
                    );
                  })}
                  <td className={styles.totalCell}>
                    <b>{total?.points}</b>/{total?.max}
                    <small>{total?.percent ?? 0}%</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && (
        <GradeDialog
          detail={detail}
          assignment={open.a}
          student={open.s}
          onClose={close}
          onSaved={() => {
            setOpen(null);
            reload();
          }}
        />
      )}
    </>
  );
}
