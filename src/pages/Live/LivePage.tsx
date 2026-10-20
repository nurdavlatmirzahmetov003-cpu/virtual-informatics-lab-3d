/**
 * `/live` — live games (V2-11b). With `?code=` it is the room itself (the
 * teacher's projector screen or the student's phone). Without: the student
 * types a code; the teacher opens a room (quiz or race), sees the rooms in
 * play and the saved results of past games. Guests are asked to sign in.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Cable, ChevronDown, CircleHelp, Cpu, History, Laptop, LogIn, MonitorPlay, Plus, ScanSearch, Smartphone, Stethoscope, Trash2, Waypoints, type LucideIcon } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { QUIZ_TOPICS, type QuizTopic } from '@/labs/LiveGames/quiz';
import { GAME_KINDS, type GameKind } from '@/labs/LiveGames/races';
import { ApiError } from '@/services/auth/api';
import { teacherApi, type ClassSummary } from '@/services/classroom/api';
import { liveApi } from '@/services/live/client';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '../Progress/dates';
import auth from '../Auth/Auth.module.css';
import { LiveRoomView } from './LiveRoom';
import { k } from './text';
import styles from './Live.module.css';

const KIND_ICON: Record<GameKind, LucideIcon> = { quiz: CircleHelp, device: ScanSearch, assembly: Cpu, connect: Cable, fault: Stethoscope, phone: Smartphone, laptop: Laptop, network: Waypoints };
const collator = new Intl.Collator(['kk', 'ru', 'en']);

type Rooms = Awaited<ReturnType<typeof liveApi.rooms>>;
type Results = Awaited<ReturnType<typeof liveApi.session>>['results'];

const errorKey = (e: unknown) => {
  const code = e instanceof ApiError ? e.code : 'server';
  return k(`live.errors.${['badTitle', 'badTopics', 'badCount', 'badSeconds', 'badMinutes', 'badClass', 'offline', 'notFound'].includes(code) ? code : 'server'}`);
};

function JoinForm() {
  const t = useT();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const go = (e: FormEvent) => {
    e.preventDefault();
    const c = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c) navigate(`/live?code=${c}`);
  };
  return (
    <form className={`${auth.panel} ${styles.joinCard}`} onSubmit={go}>
      <h2>
        <MonitorPlay size={18} aria-hidden="true" /> {t('live.join.title')}
      </h2>
      <p className={styles.note}>{t('live.join.hint')}</p>
      <label className={auth.field}>
        <span>{t('live.join.code')}</span>
        <input className={styles.codeInput} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ABC123" required />
      </label>
      <button type="submit" className={auth.primary} disabled={!code.trim()}>
        <LogIn size={16} aria-hidden="true" /> {t('live.join.go')}
      </button>
    </form>
  );
}

function CreateForm() {
  const t = useT();
  const navigate = useNavigate();
  const csrf = useAuthStore((s) => s.csrf);
  const [kind, setKind] = useState<GameKind>('quiz');
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [counts, setCounts] = useState<Record<QuizTopic, number> | null>(null);
  const [topics, setTopics] = useState<QuizTopic[]>([...QUIZ_TOPICS]);
  const [count, setCount] = useState(10);
  const [seconds, setSeconds] = useState(20);
  const [minutes, setMinutes] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teacherApi.classes().then(
      (r) => setClasses([...r.classes].sort((a, b) => collator.compare(a.name, b.name))),
      () => setClasses([]),
    );
    liveApi.topics().then(
      (r) => setCounts(r.topics),
      () => setCounts(null),
    );
  }, []);

  const toggle = (topic: QuizTopic) => setTopics((list) => (list.includes(topic) ? list.filter((x) => x !== topic) : [...list, topic]));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    setBusy(true);
    setError(null);
    try {
      const input =
        kind === 'quiz'
          ? { kind, title, classId: classId || null, topics, count, seconds }
          : kind === 'device'
            ? { kind, title, classId: classId || null, count, seconds }
            : { kind, title, classId: classId || null, minutes };
      const r = await liveApi.create(input, csrf);
      navigate(`/live?code=${r.code}`);
    } catch (err) {
      setError(t(errorKey(err)));
      setBusy(false);
    }
  };

  return (
    <form className={`${auth.panel} ${styles.createCard}`} onSubmit={submit}>
      <h2>
        <Plus size={18} aria-hidden="true" /> {t('live.create.title')}
      </h2>
      <fieldset className={styles.kinds}>
        <legend>{t('live.create.kind')}</legend>
        {GAME_KINDS.map((g) => {
          const Icon = KIND_ICON[g];
          return (
            <label key={g} className={styles.kindCard} data-kind={g}>
              <input type="radio" name="kind" value={g} checked={kind === g} onChange={() => setKind(g)} />
              <Icon size={20} aria-hidden="true" />
              <b>{t(k(`live.kinds.${g}`))}</b>
              <small>{t(k(`live.kindHints.${g}`))}</small>
            </label>
          );
        })}
      </fieldset>
      <label className={auth.field}>
        <span>{t('live.create.name')}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t('live.create.namePlaceholder')} required />
      </label>
      <label className={auth.field}>
        <span>{t('live.create.class')}</span>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">{t('live.create.anyClass')}</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <small>{t('live.create.classHint')}</small>
      </label>
      {kind === 'quiz' || kind === 'device' ? (
        <>
          {kind === 'quiz' && (
          <fieldset className={styles.topics}>
            <legend>
              {t('live.create.topics')}
              <button type="button" className={styles.linkBtn} onClick={() => setTopics(topics.length === QUIZ_TOPICS.length ? [] : [...QUIZ_TOPICS])}>
                {t('live.create.all')}
              </button>
            </legend>
            {QUIZ_TOPICS.map((topic) => (
              <label key={topic} className={styles.topic}>
                <input type="checkbox" checked={topics.includes(topic)} onChange={() => toggle(topic)} />
                <span>{t(k(`lab.zones.${topic}.name`))}</span>
                {counts && <small>{t('live.create.topicN', { n: counts[topic] })}</small>}
              </label>
            ))}
          </fieldset>
          )}
          <div className={styles.numbers}>
            <label className={auth.field}>
              <span>{t('live.create.count')}</span>
              <input type="number" min={3} max={30} value={count} onChange={(e) => setCount(Number(e.target.value))} required />
            </label>
            <label className={auth.field}>
              <span>{t('live.create.seconds')}</span>
              <input type="number" min={5} max={60} step={5} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} required />
            </label>
          </div>
        </>
      ) : (
        <label className={auth.field}>
          <span>{t('live.create.minutes')}</span>
          <input type="number" min={1} max={30} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} required />
        </label>
      )}
      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={auth.primary} disabled={busy || !title.trim() || (kind === 'quiz' && !topics.length)}>
        <MonitorPlay size={16} aria-hidden="true" /> {t('live.create.submit')}
      </button>
    </form>
  );
}

function PastGame({ game }: { game: Rooms['past'][number] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Results | null>(null);
  useEffect(() => {
    if (!open || rows) return;
    liveApi.session(game.id).then(
      (r) => setRows(r.results),
      () => setRows([]),
    );
  }, [open, rows, game.id]);
  const Icon = KIND_ICON[game.kind];
  return (
    <li className={styles.pastItem}>
      <button type="button" className={styles.pastHead} onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon size={16} aria-hidden="true" />
        <span>
          <b>{game.title}</b>
          <small>
            {t(k(`live.kinds.${game.kind}`))} · {formatDateTime(game.finishedAt)} · {t('live.rooms.playersN', { n: game.players })}
          </small>
        </span>
        <ChevronDown size={16} aria-hidden="true" className={styles.chev} />
      </button>
      {open && rows && (
        <ol className={styles.pastRows}>
          {rows.map((r, i) => (
            <li key={i}>
              <span className={styles.rank} data-top={r.rank <= 3}>
                {r.rank}
              </span>
              <span className={styles.name}>
                {r.name}
                <small>{r.login}</small>
              </span>
              <span className={styles.detail}>
                {game.kind === 'quiz' ? t('live.rooms.correct', { n: r.detail.correct ?? 0, of: r.detail.of ?? 0 }) : t('live.rooms.mistakesN', { n: r.detail.mistakes ?? 0 })}
              </span>
              <b className={styles.score}>{game.kind === 'quiz' ? t('live.quiz.score', { n: (r.score ?? 0).toLocaleString('ru-RU') }) : r.score !== null ? t('live.race.seconds', { s: r.score }) : `${Math.round((r.detail.progress ?? 0) * 100)}%`}</b>
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

function HostDashboard() {
  const t = useT();
  const csrf = useAuthStore((s) => s.csrf);
  const [data, setData] = useState<Rooms | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    liveApi.rooms().then(setData, () => setData({ rooms: [], past: [] }));
  }, [tick]);
  // a finished room lives on under past games
  const open = data?.rooms.filter((r) => r.status !== 'finished');
  const close = async (id: string) => {
    if (!csrf || !window.confirm(t('live.rooms.closeConfirm'))) return;
    try {
      await liveApi.close(id, csrf);
    } finally {
      setTick((n) => n + 1);
    }
  };
  return (
    <div className={styles.dashboard}>
      <CreateForm />
      <div className={styles.lists}>
        <section className={auth.panel}>
          <h2>
            <MonitorPlay size={18} aria-hidden="true" /> {t('live.rooms.active')}
          </h2>
          {open && !open.length && <p className={styles.note}>{t('live.rooms.none')}</p>}
          <ul className={styles.roomList}>
            {open?.map((r) => {
              const Icon = KIND_ICON[r.kind];
              return (
                <li key={r.id}>
                  <Icon size={18} aria-hidden="true" />
                  <span>
                    <b>{r.title}</b>
                    <small>
                      <span className={styles.codeChip}>{r.code}</span> {t(k(`live.status.${r.status}`))} · {t('live.rooms.playersN', { n: r.players })}
                    </small>
                  </span>
                  <Link to={`/live?code=${r.code}`} className={auth.secondary}>
                    {t('live.rooms.open')}
                  </Link>
                  <button type="button" className={styles.iconBtn} onClick={() => close(r.id)} aria-label={`${t('live.rooms.close')}: ${r.title}`} title={t('live.rooms.close')}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <section className={auth.panel}>
          <h2>
            <History size={18} aria-hidden="true" /> {t('live.rooms.past')}
          </h2>
          {data && !data.past.length && <p className={styles.note}>{t('live.rooms.pastNone')}</p>}
          <ul className={styles.pastList}>
            {data?.past.map((g) => (
              <PastGame key={g.id} game={g} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function LivePage() {
  const t = useT();
  const [params] = useSearchParams();
  const code = (params.get('code') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'loading') return <PageLayout eyebrow={t('live.eyebrow')} title={t('live.title')} />;
  if (!user) {
    const next = encodeURIComponent(code ? `/live?code=${code}` : '/live');
    return (
      <PageLayout eyebrow={t('live.eyebrow')} title={t('live.title')} subtitle={t('live.subtitle')}>
        <div className={`${auth.panel} ${styles.invite}`}>
          <p>{t('live.guest')}</p>
          <Link to={`/login?next=${next}`} className={auth.primary}>
            <LogIn size={16} aria-hidden="true" /> {t('auth.signIn')}
          </Link>
        </div>
      </PageLayout>
    );
  }
  if (code) {
    return (
      <div className={styles.roomPage}>
        <LiveRoomView key={code} code={code} />
      </div>
    );
  }
  return (
    <PageLayout eyebrow={t('live.eyebrow')} title={t('live.title')} subtitle={t('live.subtitle')}>
      {user.role === 'student' ? <JoinForm /> : <HostDashboard />}
    </PageLayout>
  );
}
