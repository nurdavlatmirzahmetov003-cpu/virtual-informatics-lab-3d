/**
 * Security: sign-in activity of the last 24 h, addresses with failed
 * attempts, temporary login blocks (lift early), manual IP blocks, and the
 * audit log with search and paging.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Ban, LockOpen, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { adminApi, type AuditEntry, type Security } from '@/services/admin/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '../Progress/dates';
import { useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

const ACTIONS = ['', 'login.', 'user.', 'class.', 'student.', 'grade.', 'school.', 'settings.', 'content.', 'backup.', 'security.', 'password.'];

function AuditLog() {
  const t = useT();
  const errorText = useAdminError();
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (before?: number) => {
      adminApi
        .audit({ action, q, before })
        .then((r) => {
          setEntries((prev) => (before ? [...prev, ...r.entries] : r.entries));
          setMore(r.more);
          setError(null);
        })
        .catch((e) => setError(errorText(e)));
    },
    [action, q, errorText],
  );
  useEffect(() => {
    const id = setTimeout(() => load(), 250);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <section className={auth.panel}>
      <h2>{t('admin.audit.title')}</h2>
      <div className={styles.filters}>
        <select value={action} onChange={(e) => setAction(e.target.value)} aria-label={t('admin.audit.action')}>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a ? a.replace('.', '') : t('admin.audit.all')}
            </option>
          ))}
        </select>
        <label className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.audit.search')} aria-label={t('admin.audit.search')} />
        </label>
      </div>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <div className={cls.tableWrap}>
        <table className={`${auth.table} ${styles.dense}`}>
          <thead>
            <tr>
              <th>{t('admin.audit.when')}</th>
              <th>{t('admin.audit.action')}</th>
              <th>{t('admin.audit.who')}</th>
              <th>{t('admin.audit.target')}</th>
              <th>IP</th>
              <th>{t('admin.audit.detail')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className={cls.nowrap}>{formatDateTime(e.at)}</td>
                <td>
                  <code className={styles.action} data-kind={e.action.split('.')[0]}>
                    {e.action}
                  </code>
                </td>
                <td>{e.actor ?? '—'}</td>
                <td className={styles.clip}>{e.target ?? '—'}</td>
                <td className={cls.mono}>{e.ip ?? '—'}</td>
                <td className={styles.clip}>{e.detail || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!entries.length && <p className={cls.empty}>{t('admin.audit.none')}</p>}
      {more && (
        <button type="button" className={auth.secondary} onClick={() => load(entries[entries.length - 1]?.at)}>
          {t('admin.audit.more')}
        </button>
      )}
    </section>
  );
}

export function SecurityTab() {
  const t = useT();
  const errorText = useAdminError();
  const csrf = useAuthStore((s) => s.csrf);
  const [data, setData] = useState<Security | null>(null);
  const [form, setForm] = useState({ ip: '', reason: '', hours: '24' });
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    adminApi
      .security()
      .then((r) => {
        setData(r);
        setError(null);
      })
      .catch((e) => setError(errorText(e)));
  }, [errorText]);
  useEffect(reload, [reload]);

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      setError(null);
      reload();
    } catch (e) {
      setError(errorText(e));
    }
  };
  const block = (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    void act(async () => {
      await adminApi.blockIp(form.ip.trim(), form.reason.trim(), form.hours ? Number(form.hours) : null, csrf);
      setForm({ ip: '', reason: '', hours: form.hours });
    });
  };

  const a = data?.activity;
  return (
    <div className={styles.stack}>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <div className={cls.tiles}>
        <div className={cls.tile}>
          <b>{a?.last24h['login.ok'] ?? 0}</b>
          <span>{t('admin.security.ok')}</span>
        </div>
        <div className={cls.tile} data-tone="warn">
          <b>{a?.last24h['login.fail'] ?? 0}</b>
          <span>{t('admin.security.fail')}</span>
        </div>
        <div className={cls.tile}>
          <b>{a?.last24h['login.blocked'] ?? 0}</b>
          <span>{t('admin.security.limited')}</span>
        </div>
        <div className={cls.tile}>
          <b className={cls.mono}>{data?.yourIp ?? '—'}</b>
          <span>{t('admin.security.yourIp')}</span>
        </div>
      </div>

      <div className={cls.split}>
        <div className={cls.mainCol}>
          <section className={auth.panel}>
            <div className={cls.sheetHead}>
              <h2>{t('admin.security.failsTitle')}</h2>
              <button type="button" className={cls.iconBtn} onClick={reload} aria-label={t('classroom.messages.refresh')} title={t('classroom.messages.refresh')}>
                <RefreshCw size={16} aria-hidden="true" />
              </button>
            </div>
            {!a?.failsByIp.length ? (
              <p className={cls.empty}>
                <ShieldCheck size={16} aria-hidden="true" /> {t('admin.security.noFails')}
              </p>
            ) : (
              <table className={`${auth.table} ${styles.dense}`}>
                <thead>
                  <tr>
                    <th>IP</th>
                    <th>{t('admin.security.attempts')}</th>
                    <th>{t('admin.security.logins')}</th>
                    <th>{t('admin.security.last')}</th>
                    <th>
                      <span className="visually-hidden">{t('classroom.students.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {a.failsByIp.map((f) => (
                    <tr key={f.ip}>
                      <td className={cls.mono}>{f.ip || '—'}</td>
                      <td>{f.fails}</td>
                      <td>{f.logins}</td>
                      <td className={cls.nowrap}>{formatDateTime(f.last)}</td>
                      <td>
                        {f.ip && f.ip !== data?.yourIp && !data?.ipBlocks.some((b) => b.ip === f.ip) && (
                          <button type="button" className={cls.iconBtn} data-danger="true" onClick={() => setForm({ ...form, ip: f.ip, reason: t('admin.security.bruteForce') })} title={t('admin.security.block')} aria-label={`${t('admin.security.block')}: ${f.ip}`}>
                            <Ban size={16} aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className={auth.panel}>
            <h2>{t('admin.security.limiterTitle')}</h2>
            <p className={cls.hint}>{t('admin.security.limiterHint')}</p>
            {!data?.limiter.length ? (
              <p className={cls.empty}>{t('admin.security.noLimits')}</p>
            ) : (
              <ul className={styles.list}>
                {data.limiter.map((l) => (
                  <li key={l.key} className={styles.schoolRow}>
                    <span>
                      <b className={cls.mono}>{l.ip}</b> {l.login && <span className={cls.mono}>· {l.login}</span>}
                      <small className={styles.sub}>{t('admin.security.limitInfo', { n: l.fails, min: Math.max(1, Math.ceil(l.retryAfter / 60)) })}</small>
                    </span>
                    <button type="button" className={auth.secondary} onClick={() => csrf && act(() => adminApi.clearLimiter(l.key, csrf))}>
                      <LockOpen size={15} aria-hidden="true" /> {t('admin.security.unblock')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className={cls.side}>
          <form className={auth.panel} onSubmit={block}>
            <h2>
              <Ban size={18} aria-hidden="true" /> {t('admin.security.blockTitle')}
            </h2>
            <label className={auth.field}>
              <span>IP</span>
              <input value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="203.0.113.7" className={cls.mono} required />
            </label>
            <label className={auth.field}>
              <span>{t('admin.security.reason')}</span>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={200} />
            </label>
            <label className={auth.field}>
              <span>{t('admin.security.duration')}</span>
              <select value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}>
                <option value="1">{t('admin.security.hours', { n: 1 })}</option>
                <option value="24">{t('admin.security.hours', { n: 24 })}</option>
                <option value="168">{t('admin.security.days', { n: 7 })}</option>
                <option value="">{t('admin.security.forever')}</option>
              </select>
              <small>{t('admin.security.blockHint')}</small>
            </label>
            <button type="submit" className={styles.dangerBtn} disabled={!form.ip.trim()}>
              <Ban size={16} aria-hidden="true" /> {t('admin.security.block')}
            </button>
          </form>
          <section className={auth.panel}>
            <h2>{t('admin.security.blockedTitle', { n: data?.ipBlocks.length ?? 0 })}</h2>
            {!data?.ipBlocks.length && <p className={cls.empty}>{t('admin.security.noBlocks')}</p>}
            <ul className={styles.list}>
              {data?.ipBlocks.map((b) => (
                <li key={b.ip} className={styles.schoolRow}>
                  <span>
                    <b className={cls.mono}>{b.ip}</b>
                    <small className={styles.sub}>
                      {b.reason || '—'} · {b.expiresAt ? t('admin.security.until', { time: formatDateTime(b.expiresAt) }) : t('admin.security.forever')}
                    </small>
                  </span>
                  <button type="button" className={cls.iconBtn} onClick={() => csrf && act(() => adminApi.unblockIp(b.ip, csrf))} aria-label={`${t('admin.security.unblock')}: ${b.ip}`} title={t('admin.security.unblock')}>
                    <LockOpen size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <AuditLog />
    </div>
  );
}
