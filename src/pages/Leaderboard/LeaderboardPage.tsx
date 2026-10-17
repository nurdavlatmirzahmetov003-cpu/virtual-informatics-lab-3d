/**
 * Leaderboards and contests (V2-11a). Class and school boards for this week
 * or all time; the student may hide their name from others (or the site
 * does it for everyone); class-vs-class contests with live standings.
 * Guests see their own level and an invitation to sign in.
 */
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff, LogIn, Swords, Trophy, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { GamePanel } from '@/components/game/GamePanel';
import { useT } from '@/hooks/useT';
import { ApiError } from '@/services/auth/api';
import { gameApi, type Board, type ContestListItem, type ContestRow, type GameMe } from '@/services/game/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatDay } from '../Progress/dates';
import styles from './Leaderboard.module.css';

type BoardPick = { scope: 'class' | 'school'; id: string | null; title: string };

const MEDAL = ['#f4c97a', '#c9d3e3', '#e0a47c'];

export function BoardTable({ board }: { board: Board }) {
  const t = useT();
  if (!board.rows.length) return <p className={styles.empty}>{t('game.board.empty')}</p>;
  const top = Math.max(1, board.rows[0].xp);
  return (
    <ol className={styles.board}>
      {board.rows.map((r, i) => (
        <li key={i} data-me={r.me} style={{ '--medal': MEDAL[r.rank - 1] ?? 'transparent' } as CSSProperties}>
          <span className={styles.rank} data-top={r.rank <= 3}>
            {r.rank}
          </span>
          <span className={styles.name}>
            {r.name ?? t('game.board.anonymous', { n: r.rank })}
            {r.me && <em>{t('game.board.you')}</em>}
          </span>
          <span className={styles.level}>{t('game.board.level', { n: r.level })}</span>
          <span className={styles.bar} aria-hidden="true">
            <i style={{ width: `${(r.xp / top) * 100}%` }} />
          </span>
          <b className={styles.xp}>
            {r.xp.toLocaleString('ru-RU')} <small>XP</small>
          </b>
        </li>
      ))}
    </ol>
  );
}

export function ContestCard({ item }: { item: ContestListItem }) {
  const t = useT();
  const [rows, setRows] = useState<ContestRow[] | null>(null);
  const [open, setOpen] = useState(item.status === 'live');
  useEffect(() => {
    if (!open || rows) return;
    gameApi.contest(item.id).then(
      (r) => setRows(r.rows),
      () => setRows([]),
    );
  }, [open, rows, item.id]);
  const top = Math.max(1, rows?.[0]?.average ?? 1);
  return (
    <li className={styles.contest} data-status={item.status}>
      <button type="button" className={styles.contestHead} onClick={() => setOpen(!open)} aria-expanded={open}>
        <Swords size={18} aria-hidden="true" />
        <span>
          <b>{item.title}</b>
          <small>
            {t(`game.contest.status.${item.status}`)} · {formatDay(item.startsAt)} – {formatDay(item.endsAt)}
          </small>
        </span>
        {item.myRank && <span className={styles.myRank}>{t('game.contest.myRank', { n: item.myRank, of: item.classes })}</span>}
      </button>
      {open && rows && (
        <ol className={styles.contestRows}>
          {rows.map((r) => (
            <li key={r.classId} data-me={r.mine} style={{ '--medal': MEDAL[r.rank - 1] ?? 'transparent' } as CSSProperties}>
              <span className={styles.rank} data-top={r.rank <= 3}>
                {r.rank}
              </span>
              <span className={styles.name}>
                {r.name}
                <small>{r.teacher}</small>
              </span>
              <span className={styles.level}>{t('game.contest.active', { n: r.active, of: r.students })}</span>
              <span className={styles.bar} aria-hidden="true">
                <i style={{ width: `${(r.average / top) * 100}%` }} />
              </span>
              <b className={styles.xp}>
                {r.average} <small>{t('game.contest.perStudent')}</small>
              </b>
            </li>
          ))}
        </ol>
      )}
      {open && item.status !== 'finished' && <p className={styles.note}>{t('game.contest.until', { time: formatDateTime(item.endsAt) })}</p>}
    </li>
  );
}

function Boards({ me }: { me: GameMe }) {
  const t = useT();
  const csrf = useAuthStore((s) => s.csrf);
  const user = useAuthStore((s) => s.user)!;
  const picks: BoardPick[] = [...me.boards.classes.map((c) => ({ scope: 'class' as const, id: c.id, title: c.name })), ...(me.boards.school ? [{ scope: 'school' as const, id: null, title: me.boards.school.name }] : [])];
  const [pick, setPick] = useState<BoardPick | null>(picks[0] ?? null);
  const [period, setPeriod] = useState<'week' | 'all'>('week');
  const [board, setBoard] = useState<Board | null>(null);
  const [anon, setAnon] = useState(me.anon);
  const [contests, setContests] = useState<ContestListItem[] | null>(null);

  useEffect(() => {
    if (!pick) return;
    gameApi.board(pick.scope, pick.id, period).then(setBoard, () => setBoard(null));
  }, [pick, period]);
  useEffect(() => {
    gameApi.contests().then(
      (r) => setContests(r.contests),
      () => setContests([]),
    );
  }, []);

  const toggleAnon = async (next: boolean) => {
    if (!csrf) return;
    setAnon(next);
    try {
      await gameApi.setAnon(next, csrf);
    } catch {
      setAnon(!next);
    }
  };

  return (
    <div className={styles.layout}>
      <section className={styles.panel} aria-labelledby="board-title">
        <header className={styles.panelHead}>
          <h2 id="board-title">
            <Trophy size={18} aria-hidden="true" /> {t('game.board.title')}
          </h2>
          <div className={styles.segmented} role="tablist" aria-label={t('game.board.period')}>
            {(['week', 'all'] as const).map((p) => (
              <button key={p} type="button" role="tab" aria-selected={period === p} onClick={() => setPeriod(p)}>
                {t(`game.board.${p}`)}
              </button>
            ))}
          </div>
        </header>
        {picks.length > 1 && (
          <div className={styles.picks} role="tablist" aria-label={t('game.board.which')}>
            {picks.map((p) => (
              <button key={`${p.scope}:${p.id}`} type="button" role="tab" aria-selected={pick?.scope === p.scope && pick?.id === p.id} onClick={() => setPick(p)}>
                {p.scope === 'school' ? <Users size={14} aria-hidden="true" /> : null}
                {p.title}
              </button>
            ))}
          </div>
        )}
        {!pick && <p className={styles.empty}>{user.role === 'student' ? t('game.board.noClass') : t('game.board.noClassStaff')}</p>}
        {board && <BoardTable board={board} />}
        <p className={styles.note}>{period === 'week' ? t('game.board.weekNote') : t('game.board.allNote')}</p>
        {user.role === 'student' && (
          <label className={styles.anon}>
            <input type="checkbox" checked={anon || me.forcedAnon} disabled={me.forcedAnon} onChange={(e) => toggleAnon(e.target.checked)} />
            <span>
              <b>
                <EyeOff size={14} aria-hidden="true" /> {t('game.board.hideMe')}
              </b>
              <small>{me.forcedAnon ? t('game.board.forced') : t('game.board.hideHint')}</small>
            </span>
          </label>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="contest-title">
        <header className={styles.panelHead}>
          <h2 id="contest-title">
            <Swords size={18} aria-hidden="true" /> {t('game.contest.title')}
          </h2>
        </header>
        {contests && !contests.length && <p className={styles.empty}>{user.role === 'student' ? t('game.contest.none') : t('game.contest.noneStaff')}</p>}
        <ul className={styles.contests}>
          {contests?.map((c) => (
            <ContestCard key={c.id} item={c} />
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function LeaderboardPage() {
  const t = useT();
  const status = useAuthStore((s) => s.status);
  const [me, setMe] = useState<GameMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    gameApi.me().then(setMe, (e) => setError(e instanceof ApiError ? e.code : 'server'));
  }, []);
  useEffect(() => {
    if (status === 'signedIn') load();
  }, [status, load]);

  const role = useAuthStore((s) => s.user?.role);
  return (
    <PageLayout eyebrow={t('game.eyebrow')} title={t('game.title')} subtitle={t('game.subtitle')}>
      {role !== 'teacher' && role !== 'admin' && <GamePanel boardLink={false} />}
      {status === 'guest' && (
        <div className={styles.invite}>
          <p>{t('game.guest')}</p>
          <Link to="/login?next=%2Fleaderboard" className={styles.button}>
            <LogIn size={16} aria-hidden="true" /> {t('auth.signIn')}
          </Link>
        </div>
      )}
      {error && <p className={styles.empty}>{t('game.error')}</p>}
      {me && !me.enabled && role === 'student' ? <p className={styles.invite}>{t('game.off')}</p> : me && <Boards me={me} />}
    </PageLayout>
  );
}
