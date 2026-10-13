/**
 * `/join?code=…` — where a class QR code leads. A signed-in student joins
 * with one press; a guest signs in first and comes back here.
 */
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { studentApi } from '@/services/classroom/api';
import { useAuthStore } from '@/store/authStore';
import { homeOf } from '../Auth/roles';
import auth from '../Auth/Auth.module.css';
import { useErrorText } from './hooks';
import styles from './Classroom.module.css';

export default function JoinPage() {
  const t = useT();
  useDocumentTitle(t('classroom.student.join'));
  const errorText = useErrorText();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = (params.get('code') ?? '').toUpperCase().slice(0, 12);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const csrf = useAuthStore((s) => s.csrf);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'loading') return <div className={auth.page} aria-busy="true" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`/join?code=${code}`)}`} replace />;

  const join = async () => {
    if (!csrf) return;
    setBusy(true);
    try {
      await studentApi.join(code, csrf);
      navigate('/student', { replace: true });
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };

  return (
    <div className={auth.page}>
      <div className={auth.card}>
        <span className={auth.eyebrow}>{t('classroom.class.eyebrow')}</span>
        <h1>{t('classroom.student.join')}</h1>
        <p className={styles.bigCode}>{code || '—'}</p>
        {user.role === 'student' ? (
          <>
            <p className={auth.lead}>{t('classroom.joinPage.lead', { name: user.displayName })}</p>
            {error && (
              <p className={auth.error} role="alert">
                {error}
              </p>
            )}
            <button type="button" className={auth.primary} onClick={join} disabled={busy || !code}>
              <LogIn size={16} aria-hidden="true" /> {t('classroom.student.joinButton')}
            </button>
          </>
        ) : (
          <>
            <p className={auth.lead}>{t('classroom.joinPage.notStudent')}</p>
            <Link to={homeOf(user.role)} className={auth.secondary}>
              {t('auth.forbidden.home')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
