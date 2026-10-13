/**
 * Admin home (V2-8): the user list and adding teacher / student accounts.
 * The admin types the new account's starting password; it is sent once
 * over the session (CSRF-protected) and stored only as a hash. The full
 * admin panel (audit log, settings, backups) is V2-10.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { ApiError, adminApi, type AdminUser, type Role } from '@/services/auth/api';
import { useAuthStore } from '@/store/authStore';
import { RequireRole } from './RequireRole';
import styles from './Auth.module.css';

function AdminHome() {
  const t = useT();
  useDocumentTitle(t('auth.admin.title'));
  const csrf = useAuthStore((s) => s.csrf);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [form, setForm] = useState({ login: '', displayName: '', role: 'student' as Role, password: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const refresh = useCallback(() => {
    adminApi
      .users()
      .then((r) => setUsers(r.users))
      .catch(() => setUsers([]));
  }, []);
  useEffect(refresh, [refresh]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      const r = await adminApi.createUser(form, csrf);
      setMsg({ ok: true, text: t('auth.admin.created', { login: r.user.login }) });
      setForm({ login: '', displayName: '', role: form.role, password: '' });
      refresh();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'server';
      setMsg({ ok: false, text: t(`auth.admin.errors.${code.replace('.', '_')}` as TranslationKey) });
    }
  };

  return (
    <div className={styles.dash}>
      <span className={styles.eyebrow}>{t('auth.roles.admin')}</span>
      <h1>{t('auth.admin.title')}</h1>
      <div className={styles.cols}>
        <section className={styles.panel}>
          <h2>{t('auth.admin.users', { n: users?.length ?? 0 })}</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('auth.login')}</th>
                <th>{t('auth.admin.name')}</th>
                <th>{t('auth.admin.role')}</th>
                <th>{t('auth.admin.lastLogin')}</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} data-disabled={u.disabled}>
                  <td>{u.login}</td>
                  <td>{u.displayName}</td>
                  <td>
                    <span className={styles.role} data-role={u.role}>
                      {t(`auth.roles.${u.role}`)}
                    </span>
                  </td>
                  <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <form className={styles.panel} onSubmit={submit}>
          <h2>
            <UserPlus size={18} aria-hidden="true" /> {t('auth.admin.add')}
          </h2>
          <label className={styles.field}>
            <span>{t('auth.login')}</span>
            <input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} autoComplete="off" spellCheck={false} required />
            <small>{t('auth.admin.loginRule')}</small>
          </label>
          <label className={styles.field}>
            <span>{t('auth.admin.name')}</span>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          </label>
          <label className={styles.field}>
            <span>{t('auth.admin.role')}</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {(['student', 'teacher', 'admin'] as const).map((r) => (
                <option key={r} value={r}>
                  {t(`auth.roles.${r}`)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t('auth.admin.startPassword')}</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required />
            <small>{t('auth.admin.passwordRule')}</small>
          </label>
          {msg && (
            <p className={msg.ok ? styles.ok : styles.error} role={msg.ok ? 'status' : 'alert'}>
              {msg.text}
            </p>
          )}
          <button type="submit" className={styles.primary}>
            <UserPlus size={16} aria-hidden="true" /> {t('auth.admin.create')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireRole roles={['admin']}>
      <AdminHome />
    </RequireRole>
  );
}
