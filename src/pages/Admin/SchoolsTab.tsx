/** Schools (create, rename, delete) and every class (teacher and school can be changed). */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { adminApi, type AdminClass, type AdminUserRow, type School } from '@/services/admin/api';
import { useAuthStore } from '@/store/authStore';
import { useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

function SchoolRow({ school, onChanged, onError }: { school: School; onChanged: () => void; onError: (e: unknown) => void }) {
  const t = useT();
  const csrf = useAuthStore((s) => s.csrf);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(school.name);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      await adminApi.renameSchool(school.id, name, csrf);
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err);
    }
  };
  const remove = async () => {
    if (!csrf || !window.confirm(t('admin.schools.deleteConfirm', { name: school.name }))) return;
    try {
      await adminApi.deleteSchool(school.id, csrf);
      onChanged();
    } catch (err) {
      onError(err);
    }
  };
  return (
    <li className={styles.schoolRow}>
      {editing ? (
        <form className={styles.inline} onSubmit={save}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} aria-label={t('admin.schools.name')} autoFocus />
          <button type="submit" className={cls.iconBtn} aria-label={t('admin.save')}>
            <Save size={16} aria-hidden="true" />
          </button>
          <button type="button" className={cls.iconBtn} onClick={() => setEditing(false)} aria-label={t('classroom.close')}>
            <X size={16} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <>
          <span>
            <b>{school.name}</b>
            <small className={styles.sub}>{t('admin.schools.counts', { users: school.users, classes: school.classes })}</small>
          </span>
          <span className={cls.actions}>
            <button type="button" className={cls.iconBtn} onClick={() => setEditing(true)} aria-label={`${t('admin.edit')}: ${school.name}`} title={t('admin.edit')}>
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button type="button" className={cls.iconBtn} data-danger="true" onClick={remove} aria-label={`${t('admin.delete')}: ${school.name}`} title={t('admin.delete')}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </span>
        </>
      )}
    </li>
  );
}

export function SchoolsTab() {
  const t = useT();
  const errorText = useAdminError();
  const csrf = useAuthStore((s) => s.csrf);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<AdminClass[] | null>(null);
  const [teachers, setTeachers] = useState<AdminUserRow[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const onError = useCallback((e: unknown) => setError(errorText(e)), [errorText]);

  const reload = useCallback(() => {
    Promise.all([adminApi.schools(), adminApi.classes(), adminApi.users({ role: 'teacher' }), adminApi.users({ role: 'admin' })])
      .then(([s, c, tt, aa]) => {
        setSchools(s.schools);
        setClasses(c.classes);
        setTeachers([...tt.users, ...aa.users]);
        setError(null);
      })
      .catch(onError);
  }, [onError]);
  useEffect(reload, [reload]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf || !name.trim()) return;
    try {
      await adminApi.createSchool(name.trim(), csrf);
      setName('');
      reload();
    } catch (err) {
      onError(err);
    }
  };
  const move = async (c: AdminClass, patch: { teacherId?: string; schoolId?: string | null }) => {
    if (!csrf) return;
    try {
      await adminApi.updateClass(c.id, patch, csrf);
      reload();
    } catch (err) {
      onError(err);
    }
  };

  return (
    <div className={styles.stack}>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <div className={cls.split}>
        <section className={auth.panel}>
          <h2>{t('admin.schools.title', { n: schools.length })}</h2>
          {!schools.length && <p className={cls.empty}>{t('admin.schools.none')}</p>}
          <ul className={styles.list}>
            {schools.map((s) => (
              <SchoolRow key={`${s.id}:${s.name}`} school={s} onChanged={reload} onError={onError} />
            ))}
          </ul>
        </section>
        <form className={`${auth.panel} ${cls.side}`} onSubmit={create}>
          <h2>
            <Plus size={18} aria-hidden="true" /> {t('admin.schools.new')}
          </h2>
          <label className={auth.field}>
            <span>{t('admin.schools.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          </label>
          <p className={cls.hint}>{t('admin.schools.hint')}</p>
          <button type="submit" className={auth.primary} disabled={!name.trim()}>
            <Plus size={16} aria-hidden="true" /> {t('admin.schools.create')}
          </button>
        </form>
      </div>

      <section className={auth.panel}>
        <h2>{t('admin.classes.title', { n: classes?.length ?? 0 })}</h2>
        {classes && !classes.length && <p className={cls.empty}>{t('admin.classes.none')}</p>}
        {!!classes?.length && (
          <div className={cls.tableWrap}>
            <table className={auth.table}>
              <thead>
                <tr>
                  <th>{t('admin.classes.name')}</th>
                  <th>{t('admin.classes.teacher')}</th>
                  <th>{t('admin.users.school')}</th>
                  <th>{t('classroom.stats.students')}</th>
                  <th>{t('classroom.stats.assignments')}</th>
                  <th>
                    <span className="visually-hidden">{t('classroom.students.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <b>{c.name}</b>
                      <small className={`${styles.sub} ${cls.mono}`}>{c.joinCode}</small>
                    </td>
                    <td>
                      <select className={styles.cellSelect} value={c.teacherId} onChange={(e) => move(c, { teacherId: e.target.value })} aria-label={`${t('admin.classes.teacher')}: ${c.name}`}>
                        {!teachers.some((x) => x.id === c.teacherId) && <option value={c.teacherId}>{c.teacherName}</option>}
                        {teachers.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.displayName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select className={styles.cellSelect} value={c.schoolId ?? ''} onChange={(e) => move(c, { schoolId: e.target.value || null })} aria-label={`${t('admin.users.school')}: ${c.name}`}>
                        <option value="">{t('admin.users.noSchool')}</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{c.students}</td>
                    <td>{c.assignments}</td>
                    <td>
                      <Link to={`/teacher/class/${c.id}`} className={cls.iconBtn} aria-label={`${t('admin.classes.open')}: ${c.name}`} title={t('admin.classes.open')}>
                        <ExternalLink size={16} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
