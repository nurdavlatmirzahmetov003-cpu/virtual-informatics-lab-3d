/**
 * The robot teacher's panel (2026-10): Bit checks the student's progress —
 * overall and per lab — names the next task, lists the devices of the zone
 * in view whose test is still open and the teardowns left, and gives a tip
 * for the zone. Everything comes from the local progress records.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, ClipboardCheck, Lightbulb, MessageCircle, Presentation, Wrench, X } from 'lucide-react';
import { deviceById, deviceKey } from '@/data/devices/devices';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { teacherCheck } from '@/lib/lab/teacher';
import { useAuthStore } from '@/store/authStore';
import { useLabStore } from '@/store/labStore';
import { openBit } from '@/store/bitStore';
import { useProgressStore } from '@/store/progressStore';
import { BitSays } from '@/components/bit/BitSays';
import { POSTER_IDS } from '@/data/lab/classroom';
import { bitVoice, sentencesOf, useVoiceStore } from '@/services/bit/voice';
import { useLessonBoard } from '@/store/lessonBoardStore';
import styles from './TeacherPanel.module.css';

const k = (s: string) => s as TranslationKey;

const LESSON_OWNER = 'lab-lesson';

/**
 * "Lesson": the robot teacher reads one of the classroom topics with Bit's
 * voice; the whiteboard beside it shows the topic and the sentence being
 * spoken (useLessonBoard). Each lesson is the next topic.
 */
function LessonButton() {
  const t = useT();
  const active = useLessonBoard((s) => s.active);
  const mine = useVoiceStore((s) => s.owner === LESSON_OWNER && s.speaking);
  const [next, setNext] = useState(0);
  const topic = POSTER_IDS[next % POSTER_IDS.length];
  const title = t(k(`lab.classroom.posters.${topic}.title`));
  useEffect(() => bitVoice.onIdle(() => useLessonBoard.setState({ active: false })), []);
  // leaving the panel ends the lesson
  useEffect(
    () => () => {
      if (useVoiceStore.getState().owner === LESSON_OWNER) bitVoice.stop();
      useLessonBoard.setState({ active: false });
    },
    [],
  );
  const start = () => {
    if (active && mine) {
      bitVoice.stop();
      useLessonBoard.setState({ active: false });
      return;
    }
    const base = `lab.classroom.posters.${topic}`;
    const lines = [t(k(`${base}.subtitle`)), ...sentencesOf(t(k(`${base}.explain`))), ...['f1', 'f2', 'f3', 'f4'].map((f) => t(k(`${base}.${f}`)))].filter((s) => s && !s.startsWith('lab.'));
    bitVoice.stop();
    useLessonBoard.setState({ active: true, title, lines, index: 0 });
    useVoiceStore.setState({ owner: LESSON_OWNER });
    bitVoice.sayEach([`${title}. ${lines[0]}`, ...lines.slice(1)], (i) => {
      useLessonBoard.setState({ index: i });
      useVoiceStore.setState({ owner: LESSON_OWNER });
    });
    setNext((n) => n + 1);
  };
  return (
    <button type="button" className={styles.cta} onClick={start} aria-pressed={active && mine}>
      <Presentation size={16} aria-hidden="true" /> {active && mine ? t('lab.teacher.lessonStop') : t('lab.teacher.lesson', { topic: title })}
    </button>
  );
}

export function TeacherPanel() {
  const t = useT();
  const close = useLabStore((s) => s.closeTeacher);
  const focus = useLabStore((s) => s.focus);
  const openDevice = useLabStore((s) => s.openDevice);
  const openTeardown = useLabStore((s) => s.openTeardown);
  const exercises = useProgressStore((s) => s.exercises);
  const user = useAuthStore((s) => s.user);
  const check = useMemo(() => teacherCheck(exercises, focus), [exercises, focus]);
  const name = user?.displayName.split(' ')[0] ?? t('lab.teacher.friend');

  return (
    <aside className={styles.panel} aria-labelledby="teacher-title">
      <header className={styles.head}>
        <span className={styles.avatar} aria-hidden="true">
          <Bot size={26} />
        </span>
        <div>
          <span className={styles.eyebrow}>{t('lab.teacher.role')}</span>
          <h2 id="teacher-title">{t('lab.teacher.name')}</h2>
        </div>
        <button type="button" className={styles.icon} onClick={close} aria-label={t('deviceUi.close')} title={t('deviceUi.close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <BitSays text={t(k(`lab.teacher.mood.${check.mood}`), { name, percent: check.percent })} more={[t(k(`lab.teacher.tips.${focus ?? 'overview'}`))]} />
      <button type="button" className={styles.cta} onClick={() => openBit()}>
        <MessageCircle size={16} aria-hidden="true" /> {t('bit.ask')}
      </button>
      <LessonButton />

      <section className={styles.card} aria-labelledby="teacher-check">
        <h3 id="teacher-check">
          <ClipboardCheck size={16} aria-hidden="true" /> {t('lab.teacher.check')}
        </h3>
        <div className={styles.total}>
          <span className={styles.ring} style={{ ['--p' as string]: `${check.percent}%` }}>
            <b>{check.percent}%</b>
          </span>
          <span>{t('lab.teacher.done', { done: check.completed, total: check.total })}</span>
        </div>
        <ul className={styles.labs}>
          {check.labs.map((l) => (
            <li key={l.lab}>
              <span>{t(k(`labs.modules.${l.lab}.title`))}</span>
              <span className={styles.bar} aria-hidden="true">
                <i style={{ width: `${(l.completed / Math.max(1, l.total)) * 100}%` }} />
              </span>
              <b>
                {l.completed}/{l.total}
              </b>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="teacher-next">
        <h3 id="teacher-next">
          <ArrowRight size={16} aria-hidden="true" /> {t('tasks.next.eyebrow')}
        </h3>
        {check.next ? (
          <>
            <b className={styles.nextTitle}>{t(k(check.next.task.info.title))}</b>
            <p className={styles.muted}>{t(k(`tasks.next.reason.${check.next.reason}`))}</p>
            <Link to={check.next.task.info.path} className={styles.cta}>
              {t(check.next.reason === 'continue' ? 'tasks.next.continue' : 'tasks.next.start')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <p className={styles.muted}>{t('tasks.next.allDone')}</p>
        )}
      </section>

      {focus && (
        <section className={styles.card} aria-labelledby="teacher-zone">
          <h3 id="teacher-zone">{t('lab.teacher.zoneTests', { zone: t(k(`lab.zones.${focus}.name`)) })}</h3>
          {check.zoneTodo.length ? (
            <div className={styles.chips}>
              {check.zoneTodo.map((id) => {
                const device = deviceById(id)!;
                return (
                  <button key={id} type="button" onClick={() => openDevice(id)}>
                    {t(k(deviceKey(device, 'name')))}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={styles.muted}>{t('lab.teacher.zoneDone')}</p>
          )}
        </section>
      )}

      {check.teardownsTodo.length > 0 && (
        <section className={styles.card} aria-labelledby="teacher-teardowns">
          <h3 id="teacher-teardowns">
            <Wrench size={16} aria-hidden="true" /> {t('lab.teacher.teardowns')}
          </h3>
          <div className={styles.chips}>
            {check.teardownsTodo.map((id) => (
              <button key={id} type="button" onClick={() => openTeardown(id)}>
                {t(k(`teardown.${id}.title`))}
              </button>
            ))}
          </div>
        </section>
      )}

      <p className={styles.tip}>
        <Lightbulb size={16} aria-hidden="true" />
        <span>{t(k(`lab.teacher.tips.${focus ?? 'overview'}`))}</span>
      </p>
      <Link to="/progress" className={styles.link}>
        {t('tasks.next.results')} <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </aside>
  );
}
