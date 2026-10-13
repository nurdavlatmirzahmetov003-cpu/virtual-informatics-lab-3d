/**
 * Users: search and filters, an edit dialog (name, role, school, block),
 * one-time password reset links, and adding a user with a starting
 * password the admin types (stored only as a hash).
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Ban, Copy, KeyRound, Pencil, Search, UserPlus } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { Role } from '@/services/auth/api';
import { adminApi, type AdminUserRow, type School } from '@/services/admin/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '../Progress/dates';
import { Modal } from '../Classroom/parts';
import { useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

const ROLES: Role[] = ['student', 'teacher', 'admin'];

function EditDialog({ user, schools, onClose, onSaved }: { user: AdminUserRow; schools: School[]; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const errorText = useAdminError();
  const csrf = useAuthStore((s) => s.csrf);
  const me = useAuthStore((s) => s.user);
  const [name, setName] = useState(user.displayName);
  const [role, setRole] = useState<Role>(user.role);
  const [schoolId, setSchoolId] = useState(user.schoolId ?? '');
  const [disabled, setDisabled] = useState(user.disabled);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ url: string; expiresAt: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const self = me?.id === user.id;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      await adminApi.updateUser(user.id, { displayName: name, role, schoolId: schoolId || null, disabled }, csrf);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const makeLink = async () => {
    if (!csrf) return;
    try {
      const r = await adminApi.resetLink(user.id, csrf);
      setLink({ url: `${window.location.origin}/reset?token=${r.token}`, expiresAt: r.expiresAt });
      setCopied(false);
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Modal title={`${user.displayName} · ${user.login}`} onClose={onClose}>
      <form className={styles.form} onSubmit={save}>
        <label className={auth.field}>
          <span>{t('auth.admin.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
        </label>
        <div className={cls.twoCols}>
          <label className={auth.field}>
            <span>{t('auth.admin.role')}</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={self}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`auth.roles.${r}`)}
                </option>
              ))}
            </select>
          </label>
          <label className={auth.field}>
            <span>{t('admin.users.school')}</span>
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              <option value="">{t('admin.users.noSchool')}</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={styles.check}>
          <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} disabled={self} />
          <span>
            <b>{t('admin.users.blocked')}</b>
            <small>{t('admin.users.blockedHint')}</small>
          </span>
        </label>
        {self && <p className={cls.hint}>{t('admin.users.selfHint')}</p>}
        {role !== user.role && <p className={auth.notice}>{t('admin.users.roleHint')}</p>}
        {error && (
          <p className={auth.error} role="alert">
            {error}
          </p>
        )}
        <div className={cls.row}>
          <button type="submit" className={auth.primary}>
            {t('admin.save')}
          </button>
          <button type="button" className={auth.secondary} onClick={makeLink}>
            <KeyRound size={16} aria-hidden="true" /> {t('admin.users.resetLink')}
          </button>
        </div>
      </form>
      {link && (
        <div className={styles.linkBox} role="status">
          <p>{t('admin.users.linkHint', { time: formatDateTime(link.expiresAt) })}</p>
          <code>{link.url}</code>
          <button
            type="button"
            className={auth.secondary}
            onClick={() =>
              navigator.clipboard.writeText(link.url).then(
                () => setCopied(true),
                () => setCopied(false),
              )
            }
          >
            <Copy size={15} aria-hidden="true" /> {copied ? t('classroom.sheet.copied') : t('admin.users.copyLink')}
          </button>
        </div>
      )}
    </Modal>
  );
}

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const t = useT();
  const errorText = useAdminError();
  const csrf = useAuthStore((s) => s.csrf);
  const [form, setForm] = useState({ login: '', displayName: '', role: 'teacher' as Role, password: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      const r = await adminApi.createUser(form, csrf);
      setMsg({ ok: true, text: t('auth.admin.created', { login: r.user.login }) });
      setForm({ login: '', displayName: '', role: form.role, password: '' });
      onCreated();
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    }
  };
  return (
    <form className={auth.panel} onSubmit={submit}>
      <h2>
        <UserPlus size={18} aria-hidden="true" /> {t('auth.admin.add')}
      </h2>
      <label className={auth.field}>
        <span>{t('auth.login')}</span>
        <input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} autoComplete="off" spellCheck={false} required />
        <small>{t('auth.admin.loginRule')}</small>
      </label>
      <label className={auth.field}>
        <span>{t('auth.admin.name')}</span>
        <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
      </label>
      <label className={auth.field}>
        <span>{t('auth.admin.role')}</span>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`auth.roles.${r}`)}
            </option>
          ))}
        </select>
      </label>
      <label className={auth.field}>
        <span>{t('auth.admin.startPassword')}</span>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required />
        <small>{t('auth.admin.passwordRule')}</small>
      </label>
      {msg && (
        <p className={msg.ok ? auth.ok : auth.error} role={msg.ok ? 'status' : 'alert'}>
          {msg.text}
        </p>
      )}
      <button type="submit" className={auth.primary}>
        <UserPlus size={16} aria-hidden="true" /> {t('auth.admin.create')}
      </button>
    </form>
  );
}

export function UsersTab() {
  const t = useT();
  const errorText = useAdminError();
  const [filter, setFilter] = useState({ q: '', role: '', status: '', school: '' });
  const [data, setData] = useState<{ total: number; users: AdminUserRow[] } | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [edit, setEdit] = useState<AdminUserRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    adminApi
      .users(filter)
      .then((r) => {
        setData(r);
        setError(null);
      })
      .catch((e) => setError(errorText(e)));
  }, [filter, errorText]);
  // search as you type, a moment after the last key
  useEffect(() => {
    const id = setTimeout(reload, 250);
    return () => clearTimeout(id);
  }, [reload]);
  useEffect(() => {
    adminApi
      .schools()
      .then((r) => setSchools(r.schools))
      .catch(() => setSchools([]));
  }, []);
  const close = useCallback(() => setEdit(null), []);

  return (
    <div className={cls.split}>
      <section className={auth.panel}>
        <h2>{t('admin.users.title', { n: data?.users.length ?? 0, total: data?.total ?? 0 })}</h2>
        <div className={styles.filters}>
          <label className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder={t('admin.users.search')} aria-label={t('admin.users.search')} />
          </label>
          <select value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value })} aria-label={t('auth.admin.role')}>
            <option value="">{t('admin.users.allRoles')}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`auth.roles.${r}`)}
              </option>
            ))}
          </select>
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} aria-label={t('admin.users.status')}>
            <option value="">{t('admin.users.anyStatus')}</option>
            <option value="active">{t('admin.users.active')}</option>
            <option value="blocked">{t('admin.users.blocked')}</option>
          </select>
          <select value={filter.school} onChange={(e) => setFilter({ ...filter, school: e.target.value })} aria-label={t('admin.users.school')}>
            <option value="">{t('admin.users.allSchools')}</option>
            <option value="none">{t('admin.users.noSchool')}</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p className={auth.error} role="alert">
            {error}
          </p>
        )}
        <div className={cls.tableWrap}>
          <table className={auth.table}>
            <thead>
              <tr>
                <th>{t('auth.admin.name')}</th>
                <th>{t('auth.admin.role')}</th>
                <th>{t('admin.users.school')}</th>
                <th>{t('admin.users.classes')}</th>
                <th>{t('auth.admin.lastLogin')}</th>
                <th>
                  <span className="visually-hidden">{t('classroom.students.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u.id} data-disabled={u.disabled}>
                  <td>
                    <b>{u.displayName}</b>
                    <small className={styles.sub}>{u.login}</small>
                  </td>
                  <td>
                    <span className={auth.role} data-role={u.role}>
                      {t(`auth.roles.${u.role}`)}
                    </span>
                    {u.disabled && (
                      <span className={styles.blockedTag}>
                        <Ban size={12} aria-hidden="true" /> {t('admin.users.blocked')}
                      </span>
                    )}
                  </td>
                  <td>{u.schoolName ?? '—'}</td>
                  <td>{u.classes}</td>
                  <td className={cls.nowrap}>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}</td>
                  <td>
                    <button type="button" className={cls.iconBtn} onClick={() => setEdit(u)} aria-label={`${t('admin.edit')}: ${u.displayName}`} title={t('admin.edit')}>
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && !data.users.length && <p className={cls.empty}>{t('admin.users.none')}</p>}
      </section>
      <div className={cls.side}>
        <CreateForm onCreated={reload} />
      </div>
      {edit && (
        <EditDialog
          user={edit}
          schools={schools}
          onClose={close}
          onSaved={() => {
            setEdit(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
