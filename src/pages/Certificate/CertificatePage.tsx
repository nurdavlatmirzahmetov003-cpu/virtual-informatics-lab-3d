/**
 * Course completion (0.36). Students see how far they are; with every task
 * done the server issues a certificate (average ≥ 90 %: a commendation)
 * with a code anyone can check. Guests and offline users get an unverified
 * printable copy from the progress in this browser.
 *
 * V4 §8: a new certificate opens the celebration (Celebration.tsx); the demo
 * profile gets one at once, watermarked, with a DEMO- code that never verifies.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Eye, PartyPopper, Printer, Search } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { summarize } from '@/services/progress';
import { useProgressStore } from '@/store/progressStore';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/services/auth/api';
import { certificateApi, type Certificate, type Eligibility } from '@/services/feedback/api';
import { DEMO_ACTIVE } from '@/lib/storage';
import { demoCertificateCode } from '@/services/demo/mode';
import { Celebration } from './Celebration';
import { CertificateSheet, type SheetData } from './CertificateSheet';
import styles from '../Feedback/Feedback.module.css';
import own from './CertificatePage.module.css';

const COMMENDATION_AVERAGE = 90;

function Progress({ e }: { e: Eligibility }) {
  const t = useT();
  return (
    <div className={own.progress}>
      <div className={own.ring} style={{ ['--p' as string]: `${(e.completed / Math.max(1, e.total)) * 100}%` }}>
        <b>{Math.round((e.completed / Math.max(1, e.total)) * 100)}%</b>
      </div>
      <div>
        <p>{t('certificate.progress', { done: e.completed, total: e.total })}</p>
        <p className={styles.muted}>{t('certificate.average', { n: e.average })}</p>
        {e.kind ? (
          <p className={own.ready}>{e.kind === 'commendation' ? t('certificate.readyHonors') : t('certificate.ready')}</p>
        ) : (
          <p className={styles.muted}>
            {t('certificate.left', { n: e.total - e.completed })} <Link to="/assignments">{t('certificate.toTasks')}</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function CheckForm() {
  const t = useT();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) navigate(`/certificate/check/${encodeURIComponent(code.trim().toUpperCase())}`);
  };
  return (
    <form className={own.check} onSubmit={submit}>
      <label className={styles.field}>
        <span>{t('certificate.check.enter')}</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BL-XXXX-XXXX" maxLength={20} />
      </label>
      <button type="submit" className={styles.primary}>
        <Search size={16} aria-hidden="true" /> {t('certificate.check.go')}
      </button>
    </form>
  );
}

export default function CertificatePage() {
  const t = useT();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const exercises = useProgressStore((s) => s.exercises);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [server, setServer] = useState<Eligibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [today] = useState(() => Date.now());
  const [celebrating, setCelebrating] = useState(false);
  const [demoIssued, setDemoIssued] = useState(false);
  const student = status === 'signedIn' && user?.role === 'student';

  useEffect(() => {
    if (!student) return;
    let alive = true;
    certificateApi
      .mine()
      .then((r) => {
        if (!alive) return;
        setCerts(r.certificates);
        setServer(r.progress);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [student]);

  // guests: the progress in this browser
  const local = useMemo<Eligibility>(() => {
    const s = summarize({ exercises });
    const average = Math.round(s.totals.average ?? 0);
    const kind = s.totals.completed >= s.totals.tasks && s.totals.tasks > 0 ? (average >= COMMENDATION_AVERAGE ? 'commendation' : 'certificate') : null;
    return { kind, completed: s.totals.completed, total: s.totals.tasks, average };
  }, [exercises]);
  const e = student ? server : local;

  const best = certs.find((c) => c.kind === 'commendation') ?? certs[0] ?? null;
  const owed = e?.kind && !certs.some((c) => c.kind === e.kind);

  const issue = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await certificateApi.issue();
      setCerts((list) => [...list.filter((c) => c.code !== r.certificate.code), r.certificate]);
      setCelebrating(true);
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'notYet' ? t('certificate.errors.notYet') : t('certificate.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const sheet: SheetData | null = best
    ? { kind: best.kind, name: best.name, average: best.average, total: best.total, issuedAt: best.issuedAt, code: best.code }
    : DEMO_ACTIVE
      ? demoIssued && local.kind
        ? { kind: local.kind, name: t('demo.student'), average: local.average, total: local.total, issuedAt: today, code: demoCertificateCode(), mark: 'demo' }
        : null
      : !student && local.kind
      ? { kind: local.kind, name: guestName.trim(), average: local.average, total: local.total, issuedAt: today, code: null }
      : null;

  return (
    <PageLayout eyebrow={t('certificate.eyebrow')} title={t('certificate.title')} subtitle={t('certificate.subtitle')}>
      <div className={own.top}>
        {e && <Progress e={e} />}
        {student && owed && (
          <button type="button" className={styles.primary} onClick={() => void issue()} disabled={busy}>
            <Award size={16} aria-hidden="true" /> {t('certificate.get')}
          </button>
        )}
        {DEMO_ACTIVE && local.kind && !demoIssued && (
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              setDemoIssued(true);
              setCelebrating(true);
            }}
          >
            <Award size={16} aria-hidden="true" /> {t('demo.instantCertificate')}
          </button>
        )}
        {!student && !DEMO_ACTIVE && local.kind && (
          <label className={styles.field}>
            <span>{t('certificate.guestName')}</span>
            <input value={guestName} onChange={(ev) => setGuestName(ev.target.value)} maxLength={80} autoComplete="name" />
          </label>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      {sheet && (
        <section className={own.sheetWrap}>
          {!student && !DEMO_ACTIVE && <p className={styles.muted}>{t('certificate.guestNote')}</p>}
          <CertificateSheet data={sheet} />
          <div className={own.actions}>
            <button type="button" className={styles.primary} onClick={() => window.print()} disabled={!sheet.name}>
              <Printer size={16} aria-hidden="true" /> {t('certificate.print')}
            </button>
            <button type="button" className={own.secondary} onClick={() => setCelebrating(true)}>
              <PartyPopper size={16} aria-hidden="true" /> {t('certificate.celebrate')}
            </button>
            <p className={styles.small}>{t('certificate.printHint')}</p>
          </div>
        </section>
      )}

      {celebrating && sheet && <Celebration data={sheet} onClose={() => setCelebrating(false)} />}

      <p className={own.previewLink}>
        <Link to="/certificate/preview">
          <Eye size={16} aria-hidden="true" /> {t('certificate.preview.link')}
        </Link>
      </p>

      <section className={own.checkWrap}>
        <h2>{t('certificate.check.title')}</h2>
        <CheckForm />
      </section>
    </PageLayout>
  );
}
