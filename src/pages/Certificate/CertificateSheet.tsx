/**
 * The certificate or commendation as a sheet of A4 (landscape). Laid out in
 * container units, so the on-screen preview and the paper are the same
 * picture; printing sends only this sheet (portal child of <body>) to paper —
 * "Save as PDF" in the print window makes the PDF. The seal and the
 * signature are images from config/brand.ts (replaceable placeholders).
 */
import { createPortal } from 'react-dom';
import { BRAND } from '@/config/brand';
import { BrandMark } from '@/components/brand/BrandMark';
import { useT } from '@/hooks/useT';
import { formatLongDate } from '../Progress/dates';
import { useSettingsStore } from '@/store/settingsStore';
import type { CertificateKind } from '@/services/feedback/api';
import { QrCode } from '../Classroom/parts';
import styles from './Certificate.module.css';

export interface SheetData {
  kind: CertificateKind;
  name: string;
  average: number;
  total: number;
  issuedAt: number;
  /** Verification code; null for a guest's unverified copy. */
  code: string | null;
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** A corner of the frame: the «қошқар мүйіз» (ram's horn) curl of Kazakh ornament, simplified. */
function Corner({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M6 94V40C6 20 20 6 40 6h54" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M18 94V46c0-16 12-28 28-28h48" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M30 30c10-12 30-8 30 6 0 10-12 14-18 8-5-5-1-12 5-11M30 30c-12 10-8 30 6 30 10 0 14-12 8-18-5-5-12-1-11 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Sheet({ data }: { data: SheetData }) {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const honors = data.kind === 'commendation';
  const verifyUrl = data.code ? `${window.location.origin}${import.meta.env.BASE_URL}certificate/check/${data.code}` : '';
  const awarded = t(honors ? 'certificate.awardedHonors' : 'certificate.awarded');
  return (
    <div className={styles.sheet} data-kind={data.kind}>
      <div className={styles.frame}>
        <Corner className={styles.cTL} />
        <Corner className={styles.cTR} />
        <Corner className={styles.cBL} />
        <Corner className={styles.cBR} />
        <header className={styles.brand}>
          <BrandMark size={44} className={styles.mark} />
          <div>
            <b>{BRAND.name}</b>
            <span>{t('app.title').replace(`${BRAND.name} — `, '')}</span>
          </div>
        </header>
        <h2 className={styles.kind}>{t(honors ? 'certificate.kinds.commendation' : 'certificate.kinds.certificate')}</h2>
        {awarded && <p className={styles.awarded}>{awarded}</p>}
        <p className={styles.name}>{data.name || '—'}</p>
        <p className={styles.body}>{t(honors ? 'certificate.bodyHonors' : 'certificate.body', { total: data.total, average: data.average })}</p>
        <p className={styles.bonus}>{t(honors ? 'certificate.bonusHonors' : 'certificate.bonus')}</p>
        <footer className={styles.foot}>
          <div className={styles.meta}>
            <span>{t('certificate.date')}</span>
            <b>{formatLongDate(data.issuedAt, language)}</b>
            {data.code ? (
              <>
                <span>{t('certificate.code')}</span>
                <b className={styles.code}>{data.code}</b>
              </>
            ) : (
              <b className={styles.unverified}>{t('certificate.notVerified')}</b>
            )}
          </div>
          {data.code && (
            <div className={styles.qr}>
              <QrCode text={verifyUrl} label={t('certificate.verifyAt', { url: verifyUrl })} size={96} />
            </div>
          )}
          <div className={styles.sign}>
            <img className={styles.seal} src={asset(BRAND.certificate.seal)} alt="" />
            <img className={styles.signature} src={asset(BRAND.certificate.signature)} alt="" />
            <span className={styles.line} />
            <b>{BRAND.certificate.signer}</b>
            <span>
              {BRAND.certificate.signerRole[language]}, {BRAND.issuer}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** The on-screen preview, and the copy that goes to paper. */
export function CertificateSheet({ data }: { data: SheetData }) {
  return (
    <>
      <div className={styles.preview}>
        <Sheet data={data} />
      </div>
      {createPortal(
        <div className={styles.printCert} aria-hidden="true">
          <Sheet data={data} />
        </div>,
        document.body,
      )}
    </>
  );
}
