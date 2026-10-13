/** Teacher home (V2-8): signed in, classes come in V2-9. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { School } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { teacherApi } from '@/services/auth/api';
import { useAuthStore } from '@/store/authStore';
import { RequireRole } from './RequireRole';
import styles from './Auth.module.css';

function TeacherHome() {
  const t = useT();
  useDocumentTitle(t('auth.teacher.title'));
  const user = useAuthStore((s) => s.user)!;
  const [classes, setClasses] = useState<number | null>(null);
  useEffect(() => {
    teacherApi
      .overview()
      .then((r) => setClasses(r.classes))
      .catch(() => setClasses(null));
  }, []);
  return (
    <div className={styles.dash}>
      <span className={styles.eyebrow}>{t('auth.roles.teacher')}</span>
      <h1>{t('auth.welcome', { name: user.displayName })}</h1>
      <section className={styles.panel}>
        <h2>
          <School size={18} aria-hidden="true" /> {t('auth.teacher.classes')}
        </h2>
        <p className={styles.big}>{classes ?? '—'}</p>
        <p className={styles.lead}>{t('auth.teacher.soon')}</p>
        <Link to="/labs" className={styles.secondary}>
          {t('auth.teacher.labs')}
        </Link>
      </section>
    </div>
  );
}

export default function TeacherPage() {
  return (
    <RequireRole roles={['teacher', 'admin']}>
      <TeacherHome />
    </RequireRole>
  );
}
