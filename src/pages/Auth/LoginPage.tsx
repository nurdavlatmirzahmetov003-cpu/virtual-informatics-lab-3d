/**
 * Sign-in (V2-8). Accounts are created by an admin (or a teacher, V2-9);
 * there is no self-registration. Guests keep using every lab without one.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ServerOff } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import { homeOf } from './roles';
import styles from './Auth.module.css';

export default function LoginPage() {
  const t = useT();
  useDocumentTitle(t('auth.title'));
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signIn = useAuthStore((s) => s.signIn);
  const serverOnline = useAuthStore((s) => s.serverOnline);
  const [login, setLogin] = useState(() => (params.get('login') ?? '').slice(0, 64));
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: string; retryAfter?: number } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) return setError({ code: 'missing' });
    setBusy(true);
    setError(null);
    const r = await signIn(login, password);
    setBusy(false);
    if (r.ok) {
      setPassword('');
      const next = params.get('next');
      navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : homeOf(r.user.role), { replace: true });
    } else setError({ code: r.code, retryAfter: r.retryAfter });
  };

  const errorText = error
    ? error.code === 'rateLimited'
      ? t('auth.errors.rateLimited', { min: Math.max(1, Math.ceil((error.retryAfter ?? 60) / 60)) })
      : t(`auth.errors.${['invalidCredentials', 'missing', 'offline'].includes(error.code) ? error.code : 'server'}` as TranslationKey)
    : null;

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={submit} noValidate>
        <span className={styles.eyebrow}>{t('auth.eyebrow')}</span>
        <h1>{t('auth.title')}</h1>
        <p className={styles.lead}>{t('auth.lead')}</p>

        {params.get('reset') && (
          <p className={styles.ok} role="status">
            {t('auth.reset.done')}
          </p>
        )}
        {params.get('restored') && (
          <p className={styles.notice} role="status">
            {t('auth.restored')}
          </p>
        )}
        {serverOnline === false && (
          <p className={styles.notice} role="status">
            <ServerOff size={16} aria-hidden="true" /> {t('auth.offline')}
          </p>
        )}

        <label className={styles.field}>
          <span>{t('auth.login')}</span>
          <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required />
        </label>
        <label className={styles.field}>
          <span>{t('auth.password')}</span>
          <span className={styles.pass}>
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? t('auth.hide') : t('auth.show')} title={show ? t('auth.hide') : t('auth.show')}>
              {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </span>
        </label>

        {errorText && (
          <p className={styles.error} role="alert">
            {errorText}
          </p>
        )}

        <button type="submit" className={styles.primary} disabled={busy}>
          <LogIn size={17} aria-hidden="true" /> {busy ? t('auth.signingIn') : t('auth.signIn')}
        </button>
        <p className={styles.small}>{t('auth.noAccount')}</p>
        <Link to="/labs" className={styles.guest}>
          {t('auth.guest')}
        </Link>
      </form>
    </div>
  );
}
