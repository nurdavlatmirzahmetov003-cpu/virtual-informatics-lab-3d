/**
 * Student home (V2-9): assignments with deadlines and status, grades and
 * teacher comments, announcements, messages to the teacher, joining a
 * class with a code. Lab results sync to the server on their own (V2-8).
 */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, CalendarClock, LogIn, Medal, Megaphone, MessageSquare, PenLine, Trophy } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { taskById } from '@/services/progress/catalog';
import { studentApi, type StudentHome as Home } from '@/services/classroom/api';
import { cellStatus } from '@/services/classroom/stats';
import { useAuthStore } from '@/store/authStore';
import { useSiteStore } from '@/store/siteStore';
import { RequireRole } from '../Auth/RequireRole';
import { AnnouncementList } from './AnnouncementsTab';
import { fmtDateTime } from './format';
import { MessageThread } from './MessageThread';
import { Modal, StatusChip } from './parts';
import { useErrorText, useExerciseTitle, useNow } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

const HOUR = 3600_000;

function useDueText() {
  const t = useT();
  return (dueAt: number | null, now: number) => {
    if (dueAt == null) return t('classroom.assignments.noDue');
    const left = dueAt - now;
    if (left < 0) return t('classroom.due.overdue');
    if (left < 24 * HOUR) return t('classroom.due.hours', { n: Math.max(1, Math.round(left / HOUR)) });
    return t('classroom.due.days', { n: Math.round(left / (24 * HOUR)) });
  };
}

function JoinForm({ onJoined }: { onJoined: (name: string) => void }) {
  const t = useT();
  const errorText = useErrorText();
  const csrf = useAuthStore((s) => s.csrf);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const join = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf || !code.trim()) return;
    try {
      const r = await studentApi.join(code, csrf);
      setCode('');
      setError(null);
      onJoined(r.class.name);
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <form className={auth.panel} onSubmit={join}>
      <h2>
        <LogIn size={18} aria-hidden="true" /> {t('classroom.student.join')}
      </h2>
      <label className={auth.field}>
        <span>{t('classroom.class.code')}</span>
        <input
          className={styles.codeInput}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={12}
          autoComplete="off"
          spellCheck={false}
          placeholder="ABC234"
          aria-describedby="join-hint"
        />
        <small id="join-hint">{t('classroom.student.joinHint')}</small>
      </label>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={auth.primary} disabled={!code.trim()}>
        <LogIn size={16} aria-hidden="true" /> {t('classroom.student.joinButton')}
      </button>
    </form>
  );
}

function AnswerBox({ assignmentId, current, onSaved }: { assignmentId: string; current: string; onSaved: () => void }) {
  const t = useT();
  const errorText = useErrorText();
  const csrf = useAuthStore((s) => s.csrf);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(current);
  const [error, setError] = useState<string | null>(null);
  if (!open) {
    return (
      <button type="button" className={styles.linkBtn} onClick={() => setOpen(true)}>
        <PenLine size={14} aria-hidden="true" /> {current ? t('classroom.student.editAnswer') : t('classroom.student.writeAnswer')}
      </button>
    );
  }
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf || !body.trim()) return;
    try {
      await studentApi.answer(assignmentId, body.trim(), csrf);
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <form className={styles.answerForm} onSubmit={save}>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={4000} aria-label={t('classroom.grade.answer')} />
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.row}>
        <button type="submit" className={auth.primary} disabled={!body.trim()}>
          {t('classroom.student.send')}
        </button>
        <button type="button" className={auth.secondary} onClick={() => setOpen(false)}>
          {t('classroom.student.cancel')}
        </button>
      </div>
    </form>
  );
}

function StudentView() {
  const t = useT();
  const errorText = useErrorText();
  const exerciseTitle = useExerciseTitle();
  const dueText = useDueText();
  const user = useAuthStore((s) => s.user)!;
  const csrf = useAuthStore((s) => s.csrf);
  const allowJoin = useSiteStore((s) => s.allowJoinByCode);
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);
  const [chat, setChat] = useState<{ id: string; name: string; teacher: string } | null>(null);

  const reload = useCallback(() => {
    studentApi
      .home()
      .then((h) => {
        setHome(h);
        setError(null);
      })
      .catch((e) => setError(errorText(e)));
  }, [errorText]);
  useEffect(reload, [reload]);

  const classNames = useMemo(() => Object.fromEntries((home?.classes ?? []).map((c) => [c.id, c.name])), [home]);
  const now = useNow();
  const assignments = useMemo(() => {
    const order = { overdue: 0, todo: 1, answered: 2, late: 3, done: 4, graded: 5 } as const;
    return [...(home?.assignments ?? [])].sort((a, b) => order[cellStatus(a.cell, a, now)] - order[cellStatus(b.cell, b, now)] || (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
  }, [home, now]);
  const graded = assignments.filter((a) => a.cell.grade);
  const closeChat = useCallback(() => setChat(null), []);
  const chatId = chat?.id ?? '';
  const load = useCallback(async () => {
    const r = await studentApi.messages(chatId);
    reload();
    return r.messages;
  }, [chatId, reload]);
  const send = useCallback(async (body: string) => (await studentApi.send(chatId, body, csrf ?? '')).messages, [chatId, csrf]);

  return (
    <PageLayout eyebrow={t('auth.roles.student')} title={t('classroom.student.title')} subtitle={t('classroom.student.subtitle', { name: user.displayName })}>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      {joined && (
        <p className={auth.ok} role="status">
          {t('classroom.student.joined', { name: joined })}
        </p>
      )}
      <div className={styles.split}>
        <div className={styles.mainCol}>
          <section aria-labelledby="my-tasks">
            <h2 id="my-tasks" className={styles.sectionTitle}>
              <CalendarClock size={18} aria-hidden="true" /> {t('classroom.student.assignments')}
            </h2>
            {home && !home.assignments.length && <p className={styles.emptyBox}>{home.classes.length ? t('classroom.student.noAssignments') : t('classroom.student.noClasses')}</p>}
            <ul className={styles.cards}>
              {assignments.map((a) => {
                const status = cellStatus(a.cell, a, now);
                const task = a.exerciseId ? taskById(a.exerciseId) : undefined;
                return (
                  <li key={a.id} className={styles.assignment} data-status={status}>
                    <div className={styles.assignmentHead}>
                      <h3>{a.title}</h3>
                      <StatusChip status={status} />
                    </div>
                    <small className={styles.muted}>{classNames[a.classId]}</small>
                    {a.description && <p className={styles.desc}>{a.description}</p>}
                    <div className={styles.assignmentMeta}>
                      <span data-overdue={status === 'overdue'}>
                        <CalendarClock size={14} aria-hidden="true" /> {dueText(a.dueAt, now)}
                        {a.dueAt != null && <small className={styles.muted}> · {fmtDateTime(a.dueAt)}</small>}
                      </span>
                      <b className={styles.points}>
                        {a.cell.final ?? '—'}/{a.points}
                      </b>
                    </div>
                    {a.cell.grade?.comment && (
                      <blockquote className={styles.answer}>
                        <small>{t('classroom.student.teacherComment')}</small>
                        <p>{a.cell.grade.comment}</p>
                      </blockquote>
                    )}
                    <div className={styles.row}>
                      {task && (
                        <Link to={task.path} className={auth.secondary}>
                          {exerciseTitle(a.exerciseId)} <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      )}
                      {!a.exerciseId && <AnswerBox key={a.cell.answer?.at ?? 0} assignmentId={a.id} current={a.cell.answer?.body ?? ''} onSaved={reload} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="my-news">
            <h2 id="my-news" className={styles.sectionTitle}>
              <Megaphone size={18} aria-hidden="true" /> {t('classroom.tabs.announcements')}
            </h2>
            {home && <AnnouncementList items={home.announcements} classNames={classNames} />}
          </section>
        </div>

        <aside className={styles.side}>
          {allowJoin ? (
            <JoinForm
              onJoined={(name) => {
                setJoined(name);
                reload();
              }}
            />
          ) : (
            <p className={styles.emptyBox}>{t('classroom.student.joinOff')}</p>
          )}
          {!!home?.classes.length && (
            <section className={auth.panel}>
              <h2>{t('classroom.student.classes')}</h2>
              <ul className={styles.classList}>
                {home.classes.map((c) => (
                  <li key={c.id}>
                    <span>
                      <b>{c.name}</b>
                      <small className={styles.muted}>{c.teacherName}</small>
                    </span>
                    <button type="button" className={auth.secondary} onClick={() => setChat({ id: c.id, name: c.name, teacher: c.teacherName })}>
                      <MessageSquare size={15} aria-hidden="true" /> {t('classroom.student.message')}
                      {c.unread > 0 && <span className={styles.badge}>{c.unread}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!!graded.length && (
            <section className={auth.panel}>
              <h2>
                <Award size={18} aria-hidden="true" /> {t('classroom.student.grades')}
              </h2>
              <ul className={styles.workList}>
                {graded.map((a) => (
                  <li key={a.id}>
                    <span>{a.title}</span>
                    <b>
                      {a.cell.grade!.score}/{a.points}
                    </b>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Link to="/leaderboard" className={`${auth.panel} ${styles.resultsLink}`}>
            <Medal size={20} aria-hidden="true" />
            <span>
              <b>{t('game.title')}</b>
              <small>{t('game.studentLink')}</small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/progress" className={`${auth.panel} ${styles.resultsLink}`}>
            <Trophy size={20} aria-hidden="true" />
            <span>
              <b>{t('nav.progress')}</b>
              <small>{t('classroom.student.resultsSynced')}</small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </aside>
      </div>

      {chat && (
        <Modal title={t('classroom.student.chatWith', { name: chat.teacher })} onClose={closeChat}>
          <MessageThread title={chat.name} otherName={chat.teacher} load={load} send={send} bare />
        </Modal>
      )}
    </PageLayout>
  );
}

export default function StudentHome() {
  return (
    <RequireRole roles={['student']}>
      <StudentView />
    </RequireRole>
  );
}
