/** System health: server, database, backups, sessions, disk, AI — with warnings and an integrity check. */
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Stethoscope } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { adminApi, type Health } from '@/services/admin/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '../Progress/dates';
import { durationParts, fmtBytes, useAdminError } from './util';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';
import styles from './Admin.module.css';

export function HealthTab() {
  const t = useT();
  const errorText = useAdminError();
  const csrf = useAuthStore((s) => s.csrf);
  const [h, setH] = useState<Health | null>(null);
  const [check, setCheck] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    adminApi
      .health()
      .then((r) => {
        setH(r);
        setError(null);
      })
      .catch((e) => setError(errorText(e)));
  }, [errorText]);
  useEffect(reload, [reload]);

  const uptime = h ? durationParts(h.server.uptime) : null;
  const tiles = h
    ? [
        { label: t('admin.health.uptime'), value: uptime!.d ? t('admin.health.uptimeDays', { d: uptime!.d, h: uptime!.h }) : uptime!.h ? t('admin.health.uptimeHours', { h: uptime!.h, m: uptime!.m }) : t('admin.health.uptimeMinutes', { m: uptime!.m }) },
        { label: t('admin.health.db'), value: fmtBytes(h.database.size + h.database.wal) },
        { label: t('admin.health.sessions'), value: String(h.sessions.active) },
        { label: t('admin.health.lastBackup'), value: h.backups.last ? formatDateTime(h.backups.last) : '—' },
        { label: t('admin.health.disk'), value: h.disk ? fmtBytes(h.disk.free) : '—' },
        { label: t('admin.health.memory'), value: fmtBytes(h.server.rss) },
      ]
    : [];

  return (
    <div className={styles.stack}>
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <div className={cls.row}>
        <button type="button" className={auth.secondary} onClick={reload}>
          <RefreshCw size={15} aria-hidden="true" /> {t('classroom.messages.refresh')}
        </button>
        <button type="button" className={auth.secondary} onClick={() => csrf && adminApi.integrity(csrf).then((r) => setCheck(r.result), (e) => setError(errorText(e)))}>
          <Stethoscope size={15} aria-hidden="true" /> {t('admin.health.integrity')}
        </button>
        {check && (
          <span className={check.join() === 'ok' ? styles.good : styles.bad} role="status">
            {check.join() === 'ok' ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
            {check.join() === 'ok' ? t('admin.health.integrityOk') : check.slice(0, 3).join('; ')}
          </span>
        )}
      </div>

      {h && (
        <>
          <ul className={styles.warnings}>
            {h.warnings.length === 0 && (
              <li className={styles.good}>
                <CheckCircle2 size={16} aria-hidden="true" /> {t('admin.health.allGood')}
              </li>
            )}
            {h.warnings.map((w) => (
              <li key={w} className={styles.warn}>
                <AlertTriangle size={16} aria-hidden="true" /> {t(`admin.health.warnings.${w}` as TranslationKey)}
              </li>
            ))}
          </ul>
          <div className={cls.tiles}>
            {tiles.map((x) => (
              <div key={x.label} className={cls.tile}>
                <b className={styles.tileValue}>{x.value}</b>
                <span>{x.label}</span>
              </div>
            ))}
          </div>
          <div className={cls.split}>
            <section className={auth.panel}>
              <h2>{t('admin.health.tables')}</h2>
              <table className={`${auth.table} ${styles.dense}`}>
                <tbody>
                  {Object.entries(h.database.rows).map(([k, n]) => (
                    <tr key={k}>
                      <td className={cls.mono}>{k}</td>
                      <td className={styles.num}>{n.toLocaleString('ru-RU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className={auth.panel}>
              <h2>{t('admin.health.system')}</h2>
              <dl className={styles.facts}>
                <dt>Node.js</dt>
                <dd>
                  {h.server.node} · {h.server.platform}
                </dd>
                <dt>{t('admin.health.dbFile')}</dt>
                <dd className={cls.mono}>{h.database.file}</dd>
                <dt>{t('admin.health.migrations')}</dt>
                <dd className={cls.mono}>{h.database.migrations.join(', ')}</dd>
                <dt>{t('admin.health.backups')}</dt>
                <dd>
                  {h.backups.count} · <span className={cls.mono}>{h.backups.dir}</span>
                </dd>
                <dt>AI</dt>
                <dd>{h.ai.provider ? `${h.ai.provider} · ${h.ai.model}` : t('admin.health.aiLocal')}</dd>
                <dt>{t('admin.health.port')}</dt>
                <dd>{h.config.port}</dd>
                <dt>HTTPS cookie</dt>
                <dd>{h.config.cookieSecure ? t('admin.health.yes') : t('admin.health.no')}</dd>
                <dt>{t('admin.health.proxy')}</dt>
                <dd className={cls.mono}>{h.config.trustProxy}</dd>
                <dt>{t('admin.health.origins')}</dt>
                <dd className={cls.mono}>{h.config.allowedOrigins.join(' ')}</dd>
              </dl>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
