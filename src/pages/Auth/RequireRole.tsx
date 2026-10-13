/**
 * Route guard: shows its page only to the given roles. A guest is sent to
 * sign in (and back here afterwards); a signed-in user with another role
 * sees a plain "not for your role" page. The server checks roles again on
 * every request — this is only the friendly front door.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useT } from '@/hooks/useT';
import type { Role } from '@/services/auth/api';
import { useAuthStore } from '@/store/authStore';
import { homeOf } from './roles';
import styles from './Auth.module.css';

export function RequireRole({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const t = useT();
  const location = useLocation();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  if (status === 'loading') return <div className={styles.page} aria-busy="true" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!roles.includes(user.role)) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1>{t('auth.forbidden.title')}</h1>
          <p className={styles.lead}>{t('auth.forbidden.text')}</p>
          <Link to={homeOf(user.role)} className={styles.primary}>
            {t('auth.forbidden.home')}
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
