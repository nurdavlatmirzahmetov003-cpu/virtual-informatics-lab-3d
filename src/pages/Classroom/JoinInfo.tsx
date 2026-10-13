/** How students join: the code, a QR code of the join link, and a fresh code on demand. */
import { useState } from 'react';
import { Copy, RefreshCcw } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { teacherApi, type ClassDetail } from '@/services/classroom/api';
import { useAuthStore } from '@/store/authStore';
import { joinLink } from './format';
import { QrCode } from './parts';
import { useErrorText } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

export function JoinInfo({ detail, reload }: { detail: ClassDetail; reload: () => void }) {
  const t = useT();
  const errorText = useErrorText();
  const csrf = useAuthStore((s) => s.csrf);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const link = joinLink(detail.class.joinCode);

  const newCode = async () => {
    if (!csrf || !window.confirm(t('classroom.join.newCodeConfirm'))) return;
    try {
      await teacherApi.updateClass(detail.class.id, { newCode: true }, csrf);
      reload();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className={styles.join}>
      <QrCode text={link} label={t('classroom.join.qrLabel', { code: detail.class.joinCode })} size={240} />
      <div className={styles.joinText}>
        <p className={styles.bigCode}>{detail.class.joinCode}</p>
        <p className={styles.muted}>{t('classroom.join.how')}</p>
        <p className={styles.link}>{link}</p>
        {error && (
          <p className={auth.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.row}>
          <button
            type="button"
            className={auth.secondary}
            onClick={() =>
              navigator.clipboard.writeText(link).then(
                () => setCopied(true),
                () => setCopied(false),
              )
            }
          >
            <Copy size={16} aria-hidden="true" /> {copied ? t('classroom.sheet.copied') : t('classroom.join.copy')}
          </button>
          <button type="button" className={auth.secondary} onClick={newCode}>
            <RefreshCcw size={16} aria-hidden="true" /> {t('classroom.join.newCode')}
          </button>
        </div>
      </div>
    </div>
  );
}
