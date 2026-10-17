/**
 * One live room (V2-11b). The teacher's screen is made for the projector:
 * big code and QR, the question, the answer bars, the race standings. The
 * student's screen is made for a phone: three answer tiles or a race board.
 * Everything shown comes from the server's state; the clock is the server's.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, CircleCheck, CircleX, Copy, Crown, Flag, LogOut, Play, SkipForward, Square, Timer, TriangleAlert, Users, WifiOff, X } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { useLive, type Feedback, type LivePlayer, type LiveRoom } from '@/services/live/client';
import { QrCode } from '../Classroom/parts';
import auth from '../Auth/Auth.module.css';
import { AssemblyBoard, ConnectBoard, FaultBoard } from './RaceBoards';
import { feedbackText, k } from './text';
import styles from './Live.module.css';

type Send = (m: Record<string, unknown>) => void;
const MEDAL = ['#f4c97a', '#c9d3e3', '#e0a47c'];
const LETTERS = ['A', 'B', 'C'];

/** Server time, ticking while something on screen counts down. */
function useServerNow(offset: number, active: boolean) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [active]);
  return now + offset;
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Ring({ left, total, big = false }: { left: number; total: number; big?: boolean }) {
  const share = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <span className={styles.ring} data-big={big} data-low={left <= 5000}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className={styles.ringTrack} />
        <circle cx="32" cy="32" r={r} className={styles.ringFill} strokeDasharray={c} strokeDashoffset={c * (1 - share)} />
      </svg>
      <b>{Math.max(0, Math.ceil(left / 1000))}</b>
    </span>
  );
}

function PlayerName({ p }: { p: LivePlayer }) {
  const t = useT();
  return (
    <>
      {p.name ?? t('game.board.anonymous', { n: p.rank })}
      {p.me && <em>{t('game.board.you')}</em>}
    </>
  );
}

/** Standings: quiz points, or race progress and time. */
function Standings({ room, limit }: { room: LiveRoom; limit?: number }) {
  const t = useT();
  const quiz = !!room.quiz;
  const me = room.players.find((p) => p.me);
  let rows = limit ? room.players.slice(0, limit) : room.players;
  if (limit && me && !rows.includes(me)) rows = [...rows, me];
  const top = Math.max(1, ...room.players.map((p) => p.score ?? 0));
  return (
    <ol className={styles.standings}>
      {rows.map((p) => (
        <li key={p.id} data-me={p.me} data-off={!p.connected} style={{ '--medal': MEDAL[p.rank - 1] ?? 'transparent' } as CSSProperties}>
          <span className={styles.rank} data-top={p.rank <= 3}>
            {p.rank}
          </span>
          <span className={styles.name}>
            <PlayerName p={p} />
          </span>
          <span className={styles.bar} aria-hidden="true">
            <i style={{ width: `${(quiz ? (p.score ?? 0) / top : p.progress) * 100}%` }} data-done={p.done} />
          </span>
          <b className={styles.score}>
            {quiz ? t('live.quiz.score', { n: (p.score ?? 0).toLocaleString('ru-RU') }) : p.score !== null ? t('live.race.seconds', { s: p.score }) : `${Math.round(p.progress * 100)}%`}
            {!quiz && p.mistakes > 0 && <small>{t('live.rooms.mistakesN', { n: p.mistakes })}</small>}
          </b>
        </li>
      ))}
    </ol>
  );
}

function Podium({ room }: { room: LiveRoom }) {
  const t = useT();
  const top = room.players.filter((p) => p.rank <= 3).slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return (
    <div className={styles.podium} aria-label={t('live.final.podium')}>
      {order.map((p) => (
        <div key={p.id} className={styles.step} data-rank={p.rank} style={{ '--medal': MEDAL[p.rank - 1] } as CSSProperties}>
          {p.rank === 1 && <Crown size={22} aria-hidden="true" />}
          <span className={styles.stepName}>
            <PlayerName p={p} />
          </span>
          <b>{room.quiz ? t('live.quiz.score', { n: (p.score ?? 0).toLocaleString('ru-RU') }) : p.score !== null ? t('live.race.seconds', { s: p.score }) : t('live.race.notFinished')}</b>
          <span className={styles.stepBlock}>{p.rank}</span>
        </div>
      ))}
    </div>
  );
}

function Final({ room }: { room: LiveRoom }) {
  const t = useT();
  const me = room.players.find((p) => p.me);
  return (
    <section className={styles.final}>
      <h2>
        <Flag size={20} aria-hidden="true" /> {t('live.final.title')}
      </h2>
      {me && <p className={styles.myRank}>{t('live.final.yourRank', { n: me.rank, of: room.players.length })}</p>}
      <Podium room={room} />
      <h3>{t('live.final.all')}</h3>
      <Standings room={room} />
      <p className={styles.note}>{t('live.final.saved')}</p>
      {room.isHost && (
        <Link to="/live" className={auth.primary}>
          <Play size={16} aria-hidden="true" /> {t('live.final.again')}
        </Link>
      )}
    </section>
  );
}

function Lobby({ room, send }: { room: LiveRoom; send: Send }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const link = `${location.origin}/live?code=${room.code}`;
  if (!room.isHost) {
    return (
      <section className={styles.waitCard}>
        <span className={styles.pulse} aria-hidden="true" />
        <h2>{t('live.lobby.playerWait')}</h2>
        <p className={styles.note}>
          <Users size={14} aria-hidden="true" /> {t('live.rooms.playersN', { n: room.players.length })}
        </p>
      </section>
    );
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className={styles.lobby}>
      <section className={styles.codeCard}>
        <p className={styles.scan}>{t('live.lobby.scan')}</p>
        <p className={styles.bigCode} aria-label={t('live.join.code')}>
          {room.code.split('').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </p>
        <QrCode text={link} label={t('live.join.code')} size={200} />
        <button type="button" className={styles.linkBtn} onClick={copy}>
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied ? t('live.lobby.copied') : t('live.lobby.copy')}
        </button>
      </section>
      <section className={styles.playersCard}>
        <header>
          <h2>
            <Users size={18} aria-hidden="true" /> {t('live.lobby.players')} <span className={styles.count}>{room.players.length}</span>
          </h2>
          <button type="button" className={auth.primary} onClick={() => send({ t: 'start' })} disabled={!room.players.length}>
            <Play size={16} aria-hidden="true" /> {t('live.lobby.start')}
          </button>
        </header>
        {room.players.length ? (
          <ul className={styles.chips}>
            {room.players.map((p) => (
              <li key={p.id} data-off={!p.connected} title={p.connected ? undefined : t('live.lobby.offline')}>
                {p.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.waiting}>
            <span className={styles.pulse} aria-hidden="true" /> {t('live.lobby.waiting')}
          </p>
        )}
        <p className={styles.note}>{room.quiz ? `${t('live.quiz.progress', { n: 0, of: room.quiz.total })} · ${t('live.create.seconds')}: ${room.quiz.limitMs / 1000}` : room.race ? `${t('live.create.minutes')}: ${room.race.endsAt / 60_000}` : null}</p>
      </section>
    </div>
  );
}

function QuizView({ room, now, send }: { room: LiveRoom; now: number; send: Send }) {
  const t = useT();
  const q = room.quiz!;
  const question = q.question;
  if (!question) return <p className={styles.waiting}>{t('live.quiz.getReady')}</p>;
  const base = question.base;
  const left = q.deadline - now;
  const reveal = q.reveal;
  const me = room.players.find((p) => p.me);
  const totalAnswers = reveal ? Math.max(1, reveal.counts.reduce((a, b) => a + b, 0)) : 1;
  const last = q.index + 1 >= q.total;

  return (
    <div className={styles.quiz} data-host={room.isHost}>
      <header className={styles.quizHead}>
        <span className={styles.badge}>{t('live.quiz.progress', { n: q.index + 1, of: q.total })}</span>
        {q.phase === 'question' && <Ring left={left} total={q.limitMs} big={room.isHost} />}
        {room.isHost ? (
          <span className={styles.badge}>{t('live.quiz.answered', { n: q.answered, of: room.players.length })}</span>
        ) : (
          <span className={styles.badge}>{t('live.quiz.score', { n: (q.myScore ?? 0).toLocaleString('ru-RU') })}</span>
        )}
      </header>
      <p className={styles.device}>{t(k(question.device))}</p>
      <h2 className={styles.question}>{t(k(`${base}.question`))}</h2>
      <div className={styles.options}>
        {question.order.map((o, slot) => {
          const chosen = q.myAnswer === slot;
          const state = reveal ? (slot === reveal.correct ? 'right' : chosen ? 'wrong' : 'dim') : chosen ? 'chosen' : q.myAnswer !== null ? 'dim' : 'idle';
          const share = reveal ? reveal.counts[slot] / totalAnswers : 0;
          return (
            <button
              key={o}
              type="button"
              className={styles.option}
              data-slot={slot}
              data-state={state}
              disabled={room.isHost || reveal !== null || q.myAnswer !== null || left <= 0}
              onClick={() => send({ t: 'answer', slot })}
              style={{ '--share': `${share * 100}%` } as CSSProperties}
            >
              <span className={styles.letter}>{LETTERS[slot]}</span>
              <span className={styles.optionText}>{t(k(`${base}.${o}`))}</span>
              {reveal && <span className={styles.votes}>{reveal.counts[slot]}</span>}
              {reveal && slot === reveal.correct && <CircleCheck size={20} aria-hidden="true" className={styles.mark} />}
              {reveal && chosen && slot !== reveal.correct && <CircleX size={20} aria-hidden="true" className={styles.mark} />}
            </button>
          );
        })}
      </div>

      {!room.isHost && q.phase === 'question' && q.myAnswer !== null && <p className={styles.locked}>{t('live.quiz.locked')}</p>}
      {!room.isHost && reveal && (
        <p className={styles.result} data-tone={q.myAnswer === null ? 'missed' : q.myAnswer === reveal.correct ? 'right' : 'wrong'}>
          {q.myAnswer === null ? t('live.quiz.missed') : q.myAnswer === reveal.correct ? t('live.quiz.right') : t('live.quiz.wrong')}
          <b>{t('live.quiz.points', { n: reveal.myPoints })}</b>
          {me && <span>{t('live.quiz.rank', { n: me.rank })}</span>}
        </p>
      )}
      {reveal && <p className={styles.explain}>{t(k(`${base}.explain`))}</p>}

      {room.isHost && (
        <div className={styles.hostBar}>
          {q.phase === 'question' && (
            <button type="button" className={auth.primary} onClick={() => send({ t: 'reveal' })}>
              <Check size={16} aria-hidden="true" /> {t('live.quiz.reveal')}
            </button>
          )}
          {q.phase === 'reveal' && (
            <button type="button" className={auth.primary} onClick={() => send({ t: 'next' })}>
              {last ? <Flag size={16} aria-hidden="true" /> : <SkipForward size={16} aria-hidden="true" />} {last ? t('live.quiz.toResults') : t('live.quiz.next')}
            </button>
          )}
          <button type="button" className={auth.secondary} onClick={() => send({ t: 'end' })}>
            <Square size={14} aria-hidden="true" /> {t('live.quiz.end')}
          </button>
        </div>
      )}
      {reveal && (
        <section className={styles.side}>
          <h3>{t('live.quiz.top')}</h3>
          <Standings room={room} limit={5} />
        </section>
      )}
      {!room.isHost && reveal && <p className={styles.note}>{t('live.quiz.waitNext')}</p>}
    </div>
  );
}

function Toast({ feedback }: { feedback: Feedback | null }) {
  const t = useT();
  if (!feedback) return null;
  const text = feedback.message ? feedbackText(t, feedback.message) : feedback.ok ? t('live.connect.ok') : null;
  if (!text) return null;
  return (
    <p key={feedback.at} className={styles.toast} data-ok={feedback.ok} role="status" aria-live="polite">
      {feedback.ok ? <CircleCheck size={18} aria-hidden="true" /> : <TriangleAlert size={18} aria-hidden="true" />}
      <span>{text}</span>
    </p>
  );
}

function RaceView({ room, now, send, feedback }: { room: LiveRoom; now: number; send: Send; feedback: Feedback | null }) {
  const t = useT();
  const race = room.race!;
  const before = race.startsAt - now;
  const me = race.me;
  const clock = (
    <span className={styles.clock} data-low={race.endsAt - now < 30_000}>
      <Timer size={16} aria-hidden="true" /> {t('live.race.timeLeft')} <b>{mmss(race.endsAt - now)}</b>
    </span>
  );
  if (before > 0) {
    return (
      <section className={styles.countdown} aria-live="polite">
        <p>{t('live.race.startsIn')}</p>
        <b key={Math.ceil(before / 1000)}>{Math.ceil(before / 1000)}</b>
      </section>
    );
  }
  if (room.isHost) {
    return (
      <div className={styles.raceHost}>
        <header className={styles.quizHead}>
          {clock}
          <button type="button" className={auth.secondary} onClick={() => send({ t: 'end' })}>
            <Square size={14} aria-hidden="true" /> {t('live.race.end')}
          </button>
        </header>
        <Standings room={room} />
      </div>
    );
  }
  if (!me) return null;
  let board: ReactNode;
  if (me.done) {
    board = (
      <section className={styles.waitCard}>
        <Flag size={28} aria-hidden="true" />
        <h2>{t('live.race.done', { s: me.seconds ?? 0 })}</h2>
        <p className={styles.note}>{t('live.race.waitOthers')}</p>
      </section>
    );
  } else if (room.kind === 'assembly') board = <AssemblyBoard installed={me.installed ?? []} send={send} />;
  else if (room.kind === 'connect') board = <ConnectBoard plugged={me.plugged ?? {}} send={send} />;
  else board = <FaultBoard round={me.round ?? 0} rounds={race.rounds} symptoms={me.symptoms} send={send} />;
  return (
    <div className={styles.race}>
      <header className={styles.quizHead}>
        {clock}
        <span className={styles.progress} aria-label={`${Math.round(me.progress * 100)}%`}>
          <i style={{ width: `${me.progress * 100}%` }} />
        </span>
        <span className={styles.badge} data-warn={me.mistakes > 0}>
          {t('live.race.mistakes', { n: me.mistakes, s: me.mistakes * 10 })}
        </span>
      </header>
      <div className={styles.raceGrid}>
        <div>
          {board}
          <Toast feedback={feedback} />
        </div>
        <aside className={styles.side}>
          <h3>{t('live.race.standings')}</h3>
          <Standings room={room} limit={5} />
        </aside>
      </div>
    </div>
  );
}

/** Refusals and connection trouble, in words. */
function ErrorNote({ code }: { code: string }) {
  const t = useT();
  const known = ['notFound', 'started', 'studentsOnly', 'full', 'notInClass', 'closed', 'slowDown', 'notNow', 'noPlayers'];
  return (
    <p className={auth.error} role="alert">
      <TriangleAlert size={16} aria-hidden="true" /> {t(k(`live.errors.${known.includes(code) ? code : 'server'}`))}
    </p>
  );
}

export function LiveRoomView({ code }: { code: string }) {
  const t = useT();
  useDocumentTitle(t('live.title'));
  const { room, status, error, feedback, offset, send } = useLive(code);
  const ticking = !!room && room.status === 'running';
  const now = useServerNow(offset, ticking);

  if (status === 'closed' && error) {
    return (
      <div className={styles.fatal}>
        <ErrorNote code={error} />
        <Link to="/live" className={auth.secondary}>
          <LogOut size={14} aria-hidden="true" /> {t('live.leave')}
        </Link>
      </div>
    );
  }
  if (!room) return <p className={styles.waiting}>{t('live.connecting')}</p>;

  return (
    <div className={styles.room}>
      <header className={styles.roomHead}>
        <span className={styles.kind} data-kind={room.kind}>
          {t(k(`live.kinds.${room.kind}`))}
        </span>
        <h2>{room.title}</h2>
        <span className={styles.meta}>
          <span className={styles.codeChip}>{room.code}</span>
          <span className={styles.status} data-status={room.status}>
            {t(k(`live.status.${room.status}`))}
          </span>
          {!room.isHost && <span>{t('live.lobby.host', { name: room.hostName })}</span>}
        </span>
        <Link to="/live" className={styles.leave} aria-label={t('live.leave')} title={t('live.leave')}>
          <X size={18} aria-hidden="true" />
        </Link>
      </header>
      {status === 'reconnecting' && (
        <p className={styles.offline} role="status">
          <WifiOff size={16} aria-hidden="true" /> {t('live.reconnecting')}
        </p>
      )}
      {error && !['notNow'].includes(error) && <ErrorNote code={error} />}
      {room.status === 'lobby' && <Lobby room={room} send={send} />}
      {room.status === 'running' && room.quiz && <QuizView room={room} now={now} send={send} />}
      {room.status === 'running' && room.race && <RaceView room={room} now={now} send={send} feedback={feedback} />}
      {room.status === 'finished' && <Final room={room} />}
    </div>
  );
}
