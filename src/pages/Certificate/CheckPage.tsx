/** Public check of a printed certificate by its code (the QR code on the sheet leads here). */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { formatLongDate } from '../Progress/dates';
import { useSettingsStore } from '@/store/settingsStore';
import { certificateApi, type Certificate } from '@/services/feedback/api';
import own from './CertificatePage.module.css';


export default function CheckPage() {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const { code = '' } = useParams();
  const [cert, setCert] = useState<Certificate | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    certificateApi
      .check(code)
      .then((r) => alive && setCert(r.certificate))
      .catch(() => alive && setCert(null));
    return () => {
      alive = false;
    };
  }, [code]);
  return (
    <PageLayout eyebrow={t('certificate.eyebrow')} title={t('certificate.check.title')}>
      {cert === null && <p className={own.invalid}>{t('certificate.check.notFound')}</p>}
      {cert && (
        <div className={own.result}>
          <span className={own.valid}>
            <BadgeCheck size={24} aria-hidden="true" /> {t('certificate.check.valid')}
          </span>
          <dl>
            <dt>{t('certificate.check.issuedTo')}</dt>
            <dd>{cert.name}</dd>
            <dt>{t('certificate.check.kind')}</dt>
            <dd>{t(cert.kind === 'commendation' ? 'certificate.kinds.commendation' : 'certificate.kinds.certificate')}</dd>
            <dt>{t('certificate.date')}</dt>
            <dd>{formatLongDate(cert.issuedAt, language)}</dd>
            <dt>{t('certificate.check.code')}</dt>
            <dd>{cert.code}</dd>
          </dl>
          <p>{t(cert.kind === 'commendation' ? 'certificate.bodyHonors' : 'certificate.body', { total: cert.total, average: cert.average })}</p>
        </div>
      )}
      <p>
        <Link to="/certificate">{t('certificate.title')}</Link>
      </p>
    </PageLayout>
  );
}
