/**
 * Top-bar account control (V2-8): "Sign in" for guests; for a signed-in
 * user their name and role, a link to their home page and "Sign out".
 * Hidden while the server is offline — every lab still works as a guest.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, MonitorPlay, Trophy, UserRound } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { homeOf } from '@/pages/Auth/roles';
import { useAuthStore } from '@/store/authStore';
import styles from './TopBar.module.css';

export function AccountButton() {
  const t = useT();
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const serverOnline = useAuthStore((s) => s.serverOnline);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  if (status === 'loading' || (!user && serverOnline === false)) return null;
  if (!user) {
    return (
      <Link to="/login" className={styles.account}>
        <LogIn size={15} aria-hidden="true" />
        <span className={styles.accountText}>{t('auth.signIn')}</span>
      </Link>
    );
  }
  return (
    <div className={styles.accountWrap} ref={box}>
      <button type="button" className={styles.account} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>
        <UserRound size={15} aria-hidden="true" />
        <span className={styles.accountText}>{user.displayName}</span>
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <p className={styles.menuHead}>
            <strong>{user.displayName}</strong>
            <small>
              {user.login} · {t(`auth.roles.${user.role}`)}
            </small>
          </p>
          <Link role="menuitem" to={homeOf(user.role)} onClick={() => setOpen(false)}>
            {t('auth.myPage')}
          </Link>
          <Link role="menuitem" to="/leaderboard" onClick={() => setOpen(false)}>
            <Trophy size={15} aria-hidden="true" /> {t('game.title')}
          </Link>
          <Link role="menuitem" to="/live" onClick={() => setOpen(false)}>
            <MonitorPlay size={15} aria-hidden="true" /> {t('live.link')}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate('/');
            }}
          >
            <LogOut size={15} aria-hidden="true" /> {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
