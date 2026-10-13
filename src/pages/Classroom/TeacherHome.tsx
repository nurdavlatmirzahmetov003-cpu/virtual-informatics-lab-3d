/** Teacher home (V2-9): the teacher's classes and creating a new one. */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Plus, School, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { teacherApi, type ClassSummary } from '@/services/classroom/api';
import { useAuthStore } from '@/store/authStore';
import { RequireRole } from '../Auth/RequireRole';
import { useErrorText } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

function Home() {
  const t = useT();
  const errorText = useErrorText();
  const user = useAuthStore((s) => s.user)!;
  const csrf = useAuthStore((s) => s.csrf);
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    teacherApi
      .classes()
      .then((r) => setClasses(r.classes))
      .catch((e) => {
        setClasses([]);
        setError(errorText(e));
      });
  }, [errorText]);
  useEffect(refresh, [refresh]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf || !name.trim()) return;
    try {
      await teacherApi.createClass(name.trim(), csrf);
      setName('');
      setError(null);
      refresh();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <PageLayout eyebrow={t(`auth.roles.${user.role}`)} title={t('classroom.teacher.title')} subtitle={t('classroom.teacher.subtitle', { name: user.displayName })}>
      <div className={styles.homeGrid}>
        <section aria-labelledby="classes-title">
          <h2 id="classes-title" className={styles.sectionTitle}>
            <School size={18} aria-hidden="true" /> {t('classroom.teacher.classes')}
          </h2>
          {classes?.length === 0 && <p className={styles.empty}>{t('classroom.teacher.noClasses')}</p>}
          <ul className={styles.classGrid}>
            {classes?.map((c) => (
              <li key={c.id}>
                <Link to={`/teacher/class/${c.id}`} className={styles.classCard}>
                  <span className={styles.classCode} aria-label={t('classroom.class.code')}>
                    {c.joinCode}
                  </span>
                  <b>{c.name}</b>
                  <span className={styles.classMeta}>
                    <span>
                      <Users size={14} aria-hidden="true" /> {t('classroom.teacher.studentsN', { n: c.students })}
                    </span>
                    <span>
                      <ClipboardList size={14} aria-hidden="true" /> {t('classroom.teacher.assignmentsN', { n: c.assignments })}
                    </span>
                  </span>
                  {user.role === 'admin' && c.teacherId !== user.id && <small className={styles.muted}>{c.teacherName}</small>}
                  <ArrowRight size={16} className={styles.go} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <form className={auth.panel} onSubmit={create}>
          <h2>
            <Plus size={18} aria-hidden="true" /> {t('classroom.teacher.newClass')}
          </h2>
          <label className={auth.field}>
            <span>{t('classroom.teacher.className')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t('classroom.teacher.classPlaceholder')} required />
          </label>
          <p className={styles.hint}>{t('classroom.teacher.newClassHint')}</p>
          {error && (
            <p className={auth.error} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={auth.primary} disabled={!name.trim()}>
            <Plus size={16} aria-hidden="true" /> {t('classroom.teacher.create')}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

export default function TeacherHome() {
  return (
    <RequireRole roles={['teacher', 'admin']}>
      <Home />
    </RequireRole>
  );
}
