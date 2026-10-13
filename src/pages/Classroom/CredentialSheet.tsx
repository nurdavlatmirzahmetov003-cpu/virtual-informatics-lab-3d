/**
 * New logins and passwords, shown once right after they are generated: a
 * table on screen and cut-out cards when printed. The server keeps only the
 * hashes, so the teacher prints or copies them now.
 */
import { Printer, X, Copy } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/hooks/useT';
import type { Credential } from '@/services/classroom/api';
import { QrCode } from './parts';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

export function CredentialSheet({ className, credentials, onClose }: { className: string; credentials: Credential[]; onClose: () => void }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const loginUrl = `${window.location.origin}/login`;
  const copy = async () => {
    const text = credentials.map((c) => `${c.displayName}\t${c.login}\t${c.password}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className={`${auth.panel} ${styles.sheetPanel}`} aria-labelledby="cred-title">
      <div className={styles.sheetHead}>
        <h2 id="cred-title">{t('classroom.sheet.title', { n: credentials.length })}</h2>
        <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t('classroom.sheet.close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <p className={auth.notice} role="status">
        {t('classroom.sheet.once')}
      </p>
      <div className={styles.tableWrap}>
        <table className={auth.table}>
          <thead>
            <tr>
              <th>{t('classroom.students.name')}</th>
              <th>{t('auth.login')}</th>
              <th>{t('auth.password')}</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((c) => (
              <tr key={c.id}>
                <td>{c.displayName}</td>
                <td className={styles.mono}>{c.login}</td>
                <td className={styles.mono}>{c.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.row}>
        <button type="button" className={auth.primary} onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> {t('classroom.sheet.print')}
        </button>
        <button type="button" className={auth.secondary} onClick={copy}>
          <Copy size={16} aria-hidden="true" /> {copied ? t('classroom.sheet.copied') : t('classroom.sheet.copy')}
        </button>
      </div>

      {/* print-only: one card per student, a direct child of <body> so nothing else takes paper */}
      {createPortal(
        <div className={styles.printSheet} aria-hidden="true">
          {credentials.map((c) => (
            <article key={c.id} className={styles.printCard}>
              <div>
                <p className={styles.printApp}>{t('app.short')}</p>
                <h3>{c.displayName}</h3>
                <p className={styles.printClass}>{className}</p>
                <dl>
                  <dt>{t('auth.login')}</dt>
                  <dd>{c.login}</dd>
                  <dt>{t('auth.password')}</dt>
                  <dd>{c.password}</dd>
                </dl>
                <p className={styles.printUrl}>{loginUrl}</p>
                <p className={styles.printNote}>{t('classroom.sheet.keepSecret')}</p>
              </div>
              <QrCode text={loginUrl} label={loginUrl} size={84} />
            </article>
          ))}
        </div>,
        document.body,
      )}
    </section>
  );
}
