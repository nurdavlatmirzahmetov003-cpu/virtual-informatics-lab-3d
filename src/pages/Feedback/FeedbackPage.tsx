/**
 * Rate the site and write to us (0.36): a 1–5 star rating with two short
 * questions, the site's average, and a contact form — to the administrator,
 * or (signed-in students) to their teacher through the class thread.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Mail, Send, Star } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/services/auth/api';
import { studentApi } from '@/services/classroom/api';
import { CONTACT_TOPICS, feedbackApi, type ContactTopic, type RatingSummary } from '@/services/feedback/api';
import styles from './Feedback.module.css';

const k = (s: string) => s as TranslationKey;

function errorText(t: ReturnType<typeof useT>, e: unknown, scope: 'feedback' | 'contact') {
  const code = e instanceof ApiError ? e.code : '';
  if (code === 'offline' || code === 'rateLimited' || code === 'badRating') return t(k(`feedback.errors.${code}`));
  if (scope === 'contact' && (code === 'noName' || code === 'badTopic' || code === 'tooShort')) return t(k(`contact.errors.${code}`));
  return t('feedback.errors.generic');
}

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const t = useT();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={styles.starsRow}>
      <div className={styles.stars} role="radiogroup" aria-label={t('feedback.rating')} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={t(k(`feedback.stars.${n}`))} data-on={n <= shown || undefined} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}>
            <Star size={34} aria-hidden="true" />
          </button>
        ))}
      </div>
      <span className={styles.starLabel}>{shown ? t(k(`feedback.stars.${shown}`)) : ' '}</span>
    </div>
  );
}

function Summary({ summary }: { summary: RatingSummary | null }) {
  const t = useT();
  if (!summary) return null;
  if (!summary.count) return <p className={styles.muted}>{t('feedback.noVotes')}</p>;
  const max = Math.max(...summary.stars, 1);
  return (
    <div className={styles.summary}>
      <b className={styles.avg}>{summary.average?.toFixed(1)}</b>
      <div>
        <span className={styles.avgStars} style={{ ['--p' as string]: `${((summary.average ?? 0) / 5) * 100}%` }} aria-label={t('feedback.average', { avg: summary.average ?? 0 })} />
        <span className={styles.muted}>{t('feedback.votes', { n: summary.count })}</span>
      </div>
      <ul className={styles.bars}>
        {[5, 4, 3, 2, 1].map((n) => (
          <li key={n}>
            <span>{n}</span>
            <i style={{ width: `${(summary.stars[n - 1] / max) * 100}%` }} />
            <small>{summary.stars[n - 1]}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RatingForm({ onSummary }: { onSummary: (s: RatingSummary) => void }) {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState('');
  const [improve, setImprove] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setError(t('feedback.errors.badRating'));
    setBusy(true);
    setError(null);
    try {
      const r = await feedbackApi.rate({ rating, liked, improve, name, page: document.referrer ? new URL(document.referrer).pathname.slice(0, 120) : '', lang: language, website });
      if (r.summary) onSummary(r.summary);
      setDone(true);
    } catch (err) {
      setError(errorText(t, err, 'feedback'));
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <p className={styles.thanks}>
        <CheckCircle2 size={22} aria-hidden="true" /> {t('feedback.thanks')}
      </p>
    );
  return (
    <form className={styles.form} onSubmit={submit}>
      <h2>{t('feedback.rating')}</h2>
      <Stars value={rating} onChange={setRating} />
      <label className={styles.field}>
        <span>{t('feedback.liked')}</span>
        <textarea rows={2} maxLength={1000} value={liked} onChange={(e) => setLiked(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span>{t('feedback.improve')}</span>
        <textarea rows={2} maxLength={1000} value={improve} onChange={(e) => setImprove(e.target.value)} />
      </label>
      {!user && (
        <label className={styles.field}>
          <span>{t('feedback.name')}</span>
          <input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </label>
      )}
      {/* bots fill every field; people never see this one */}
      <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.primary} disabled={busy}>
        <Star size={16} aria-hidden="true" /> {t('feedback.send')}
      </button>
    </form>
  );
}

function ContactForm() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const csrf = useAuthStore((s) => s.csrf);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; teacherName: string }>>([]);
  const [to, setTo] = useState('admin');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [topic, setTopic] = useState<ContactTopic>('question');
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<'admin' | 'teacher' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'student') return;
    let alive = true;
    studentApi
      .home()
      .then((h) => alive && setClasses(h.classes))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (to !== 'admin' && csrf) {
        // the class thread: the teacher answers where students already read their messages
        await studentApi.send(to, `[${t(k(`contact.topics.${topic}`))}] ${body.trim()}`, csrf);
        setSent('teacher');
      } else {
        await feedbackApi.contact({ name, contact, topic, body, website });
        setSent('admin');
      }
    } catch (err) {
      setError(errorText(t, err, 'contact'));
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <p className={styles.thanks}>
        <CheckCircle2 size={22} aria-hidden="true" /> {sent === 'teacher' ? t('contact.sentTeacher') : t('contact.sent')}
      </p>
    );
  return (
    <form className={styles.form} onSubmit={submit} id="contact">
      <h2>
        <Mail size={20} aria-hidden="true" /> {t('contact.title')}
      </h2>
      <p className={styles.muted}>{t('contact.lead')}</p>
      {classes.length > 0 && (
        <label className={styles.field}>
          <span>{t('contact.to')}</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="admin">{t('contact.toAdmin')}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {t('contact.toTeacher', { class: `${c.name} (${c.teacherName})` })}
              </option>
            ))}
          </select>
        </label>
      )}
      {!user && (
        <div className={styles.pair}>
          <label className={styles.field}>
            <span>{t('contact.name')}</span>
            <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className={styles.field}>
            <span>{t('contact.contact')}</span>
            <input maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" />
          </label>
        </div>
      )}
      <label className={styles.field}>
        <span>{t('contact.topic')}</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value as ContactTopic)}>
          {CONTACT_TOPICS.map((x) => (
            <option key={x} value={x}>
              {t(k(`contact.topics.${x}`))}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>{t('contact.body')}</span>
        <textarea required rows={5} minLength={5} maxLength={3000} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <p className={styles.small}>{t('contact.privacy')}</p>
      <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.primary} disabled={busy}>
        <Send size={16} aria-hidden="true" /> {t('contact.send')}
      </button>
    </form>
  );
}

export default function FeedbackPage() {
  const t = useT();
  const { hash } = useLocation();
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  // footer link «Contact»: go straight to the form
  useEffect(() => {
    if (hash === '#contact') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);
  useEffect(() => {
    let alive = true;
    feedbackApi
      .summary()
      .then((s) => alive && setSummary(s))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return (
    <PageLayout eyebrow={t('feedback.eyebrow')} title={t('feedback.title')} subtitle={t('feedback.subtitle')}>
      <div className={styles.grid}>
        <section className={styles.card}>
          <Summary summary={summary} />
          <RatingForm onSummary={setSummary} />
        </section>
        <section className={styles.card}>
          <ContactForm />
        </section>
      </div>
    </PageLayout>
  );
}
