/**
 * Database backups: a snapshot now, download, upload a .db, restore (the
 * server first saves a "before-restore" snapshot; everyone signs in again),
 * delete. Restoring asks twice — it replaces every account and result.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseBackup, Download, History, Trash2, Upload } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { adminApi, type BackupInfo } from '@/services/admin/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '../Progress/dates';
import { fmtBytes, useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

export function BackupsTab() {
  const t = useT();
  const errorText = useAdminError();
  const navigate = useNavigate();
  const csrf = useAuthStore((s) => s.csrf);
  const [list, setList] = useState<BackupInfo[] | null>(null);
  const [restorable, setRestorable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    adminApi
      .backups()
      .then((r) => {
        setList(r.backups);
        setRestorable(r.restorable);
      })
      .catch((e) => setMsg({ ok: false, text: errorText(e) }));
  }, [errorText]);
  useEffect(reload, [reload]);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    try {
      setMsg({ ok: true, text: await fn() });
      reload();
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  const restore = async (b: BackupInfo) => {
    if (!csrf || !window.confirm(t('admin.backups.restoreConfirm', { name: b.name, time: formatDateTime(b.createdAt) })) || !window.confirm(t('admin.backups.restoreConfirm2'))) return;
    setBusy(true);
    try {
      await adminApi.restore(b.name, csrf);
      // the restored database has no sessions: sign in again
      await useAuthStore.getState().signOut();
      navigate('/login?next=%2Fadmin%3Ftab%3Dbackups&restored=1', { replace: true });
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) });
      setBusy(false);
    }
  };

  return (
    <div className={cls.split}>
      <section className={auth.panel}>
        <h2>{t('admin.backups.title', { n: list?.length ?? 0 })}</h2>
        {msg && (
          <p className={msg.ok ? auth.ok : auth.error} role={msg.ok ? 'status' : 'alert'}>
            {msg.text}
          </p>
        )}
        {list && !list.length && <p className={cls.empty}>{t('admin.backups.none')}</p>}
        {!!list?.length && (
          <div className={cls.tableWrap}>
            <table className={`${auth.table} ${styles.dense}`}>
              <thead>
                <tr>
                  <th>{t('admin.backups.file')}</th>
                  <th>{t('admin.backups.when')}</th>
                  <th>{t('admin.backups.size')}</th>
                  <th>
                    <span className="visually-hidden">{t('classroom.students.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.name}>
                    <td className={cls.mono}>
                      {b.name}
                      {b.name.includes('before-restore') && <small className={styles.sub}>{t('admin.backups.safety')}</small>}
                    </td>
                    <td className={cls.nowrap}>{formatDateTime(b.createdAt)}</td>
                    <td className={cls.nowrap}>{fmtBytes(b.size)}</td>
                    <td>
                      <div className={cls.actions}>
                        <a className={cls.iconBtn} href={adminApi.downloadUrl(b.name)} download={b.name} title={t('admin.backups.download')} aria-label={`${t('admin.backups.download')}: ${b.name}`}>
                          <Download size={16} aria-hidden="true" />
                        </a>
                        {restorable && (
                          <button type="button" className={cls.iconBtn} disabled={busy} onClick={() => restore(b)} title={t('admin.backups.restore')} aria-label={`${t('admin.backups.restore')}: ${b.name}`}>
                            <History size={16} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          className={cls.iconBtn}
                          data-danger="true"
                          disabled={busy}
                          onClick={() => csrf && window.confirm(t('admin.backups.deleteConfirm', { name: b.name })) && run(async () => (await adminApi.deleteBackup(b.name, csrf), t('admin.backups.deleted')))}
                          title={t('admin.delete')}
                          aria-label={`${t('admin.delete')}: ${b.name}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className={cls.side}>
        <section className={auth.panel}>
          <h2>
            <DatabaseBackup size={18} aria-hidden="true" /> {t('admin.backups.makeTitle')}
          </h2>
          <p className={cls.hint}>{t('admin.backups.makeHint')}</p>
          <button type="button" className={auth.primary} disabled={busy} onClick={() => csrf && run(async () => t('admin.backups.made', { name: (await adminApi.createBackup(csrf)).backup.name }))}>
            <DatabaseBackup size={16} aria-hidden="true" /> {t('admin.backups.make')}
          </button>
        </section>
        <section className={auth.panel}>
          <h2>
            <Upload size={18} aria-hidden="true" /> {t('admin.backups.uploadTitle')}
          </h2>
          <p className={cls.hint}>{t('admin.backups.uploadHint')}</p>
          <label className={`${auth.secondary} ${styles.fileButton}`} data-disabled={busy}>
            <Upload size={16} aria-hidden="true" /> {t('admin.backups.choose')}
            <input
              ref={file}
              type="file"
              accept=".db,application/vnd.sqlite3,application/x-sqlite3"
              className={styles.file}
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && csrf) void run(async () => t('admin.backups.uploaded', { name: (await adminApi.upload(f, csrf)).name }));
                if (file.current) file.current.value = '';
              }}
            />
          </label>
        </section>
        {!restorable && <p className={auth.notice}>{t('admin.backups.memory')}</p>}
        <p className={cls.hint}>{t('admin.backups.restoreHint')}</p>
      </div>
    </div>
  );
}
