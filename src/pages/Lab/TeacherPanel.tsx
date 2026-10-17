/**
 * The robot teacher's panel (2026-10): Bit checks the student's progress —
 * overall and per lab — names the next task, lists the devices of the zone
 * in view whose test is still open and the teardowns left, and gives a tip
 * for the zone. Everything comes from the local progress records.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, ClipboardCheck, Lightbulb, Wrench, X } from 'lucide-react';
import { deviceById, deviceKey } from '@/data/devices/devices';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { teacherCheck } from '@/lib/lab/teacher';
import { useAuthStore } from '@/store/authStore';
import { useLabStore } from '@/store/labStore';
import { useProgressStore } from '@/store/progressStore';
import styles from './TeacherPanel.module.css';

const k = (s: string) => s as TranslationKey;

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

      <p className={styles.speech}>{t(k(`lab.teacher.mood.${check.mood}`), { name, percent: check.percent })}</p>

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
