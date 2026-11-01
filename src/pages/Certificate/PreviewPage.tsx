/**
 * V4 §8.1: `/certificate/preview` — what the certificate looks like, with a
 * sample name: the A4 sheet (prints / saves as PDF like a real one), both
 * kinds, and the celebration a student sees when the course is finished.
 * Marked «SAMPLE» with a DEMO- code, so it never passes as a real one.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PartyPopper, Printer } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { demoCode } from '@/services/certificate/codes';
import { TASKS } from '@/services/progress';
import type { CertificateKind } from '@/services/feedback/api';
import { CertificateSheet, type SheetData } from './CertificateSheet';
import { Celebration } from './Celebration';
import styles from '../Feedback/Feedback.module.css';
import own from './CertificatePage.module.css';

export default function PreviewPage() {
  const t = useT();
  const [kind, setKind] = useState<CertificateKind>('commendation');
  const [celebrating, setCelebrating] = useState(false);
  const [code] = useState(() => demoCode());
  const [today] = useState(() => Date.now());
  const data = useMemo<SheetData>(
    () => ({ kind, name: t('certificate.preview.sampleName'), average: kind === 'commendation' ? 96 : 84, total: TASKS.length, issuedAt: today, code, mark: 'sample' }),
    [kind, t, today, code],
  );

  return (
    <PageLayout eyebrow={t('certificate.eyebrow')} title={t('certificate.preview.title')} subtitle={t('certificate.preview.subtitle')}>
      <div className={own.top}>
        <div className={own.kindSwitch} role="radiogroup" aria-label={t('certificate.check.kind')}>
          {(['commendation', 'certificate'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? own.kindOn : undefined} onClick={() => setKind(k)}>
              {t(k === 'commendation' ? 'certificate.kinds.commendation' : 'certificate.kinds.certificate')}
            </button>
          ))}
        </div>
      </div>
      <section className={own.sheetWrap}>
        <CertificateSheet data={data} />
        <div className={own.actions}>
          <button type="button" className={styles.primary} onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" /> {t('certificate.print')}
          </button>
          <button type="button" className={own.secondary} onClick={() => setCelebrating(true)}>
            <PartyPopper size={16} aria-hidden="true" /> {t('certificate.celebrate')}
          </button>
          <p className={styles.small}>{t('certificate.preview.note')}</p>
        </div>
      </section>
      {celebrating && <Celebration data={data} onClose={() => setCelebrating(false)} />}
      <p className={own.previewLink}>
        <Link to="/certificate">{t('certificate.title')}</Link>
      </p>
    </PageLayout>
  );
}
