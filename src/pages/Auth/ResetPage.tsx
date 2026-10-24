/**
 * `/reset?token=…` — the one-time link an admin gives (V2-10). The user
 * picks a new password; the link then stops working and every old session
 * of the account ends.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { ApiError } from '@/services/auth/api';
import { resetApi } from '@/services/admin/api';
import styles from './Auth.module.css';
import { AuthLogo, AuthShell } from './AuthShell';

export default function ResetPage() {
  const t = useT();
  useDocumentTitle(t('auth.reset.title'));
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [who, setWho] = useState<{ login: string; displayName: string } | null>(null);
  const [state, setState] = useState<'checking' | 'ok' | 'bad'>('checking');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    resetApi.check(token).then(
      (r) => {
        setWho(r);
        setState('ok');
      },
      () => setState('bad'),
    );
  }, [token]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) return setError(t('auth.reset.mismatch'));
    try {
      const r = await resetApi.set(token, pw);
      navigate(`/login?reset=1&login=${encodeURIComponent(r.login)}`, { replace: true });
    } catch (err) {
      const code = err instanceof ApiError ? err.code.replace('.', '_') : 'server';
      setError(t(`auth.reset.errors.${['password_tooShort', 'password_tooSimple', 'password_tooLong', 'badToken', 'rateLimited', 'offline'].includes(code) ? code : 'server'}` as TranslationKey));
    }
  };

  const bad = !token || state === 'bad';
  return (
    <AuthShell>
      <form className={styles.card} onSubmit={submit} noValidate>
        <AuthLogo />
        <span className={styles.eyebrow}>{t('auth.eyebrow')}</span>
        <h1>{t('auth.reset.title')}</h1>
        {bad ? (
          <>
            <p className={styles.error} role="alert">
              {t('auth.reset.invalid')}
            </p>
            <Link to="/login" className={styles.secondary}>
              {t('auth.signIn')}
            </Link>
          </>
        ) : state === 'checking' ? (
          <p className={styles.lead} aria-busy="true">
            …
          </p>
        ) : (
          <>
            <p className={styles.lead}>{t('auth.reset.lead', { name: who!.displayName, login: who!.login })}</p>
            <label className={styles.field}>
              <span>{t('auth.reset.new')}</span>
              <span className={styles.pass}>
                <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? t('auth.hide') : t('auth.show')}>
                  {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </span>
              <small>{t('auth.admin.passwordRule')}</small>
            </label>
            <label className={styles.field}>
              <span>{t('auth.reset.repeat')}</span>
              <input type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
            </label>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={styles.primary} disabled={!pw || !pw2}>
              <KeyRound size={16} aria-hidden="true" /> {t('auth.reset.save')}
            </button>
          </>
        )}
      </form>
    </AuthShell>
  );
}
