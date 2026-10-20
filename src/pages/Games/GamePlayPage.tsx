/**
 * One arena game (0.36): intro → 3-2-1 → play → result with the record,
 * a challenge link (same seed = same rounds for a friend) and the class /
 * school leaderboard. Rounds come from labs/Arcade; the server referees
 * signed-in runs. 0.37: the hands-on 3D games (moves are the answers), a
 * timer bar, combos with sounds, stars and experience on the result.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, CircleCheck, CircleX, Copy, Flame, Play, RotateCcw, Sparkles, Star, Trophy, X } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { deviceById, deviceKey } from '@/data/devices/devices';
import {
  ARCADE, HANDS_ON_RACE, PORT_JOBS, binaryPrompt, binaryRight, binaryRounds, deviceRounds, handsOnFaults, handsOnStart, isArcadeGame, isHandsOn, isSeed, orderCards, portRounds, replayOrder, subnetRounds, xpOf,
  type ArcadeGame, type HandsOnGame,
} from '@/labs/Arcade';
import { applyMove, type Move } from '@/labs/LiveGames/races';
import { playSfx } from '@/lib/audio/sfx';
import { feedbackText } from '@/pages/Live/text';
import { HandsOnBoard } from './handsOn/HandsOnBoard';
import { STEP_IDS, canInstall, type StepId } from '@/labs/AssemblyLab/steps';
import { maskFromPrefix } from '@/labs/NetworkLab/ipv4';
import { finishRun, startRun, type Finish, type Run } from '@/services/arcade/api';
import { useAuthStore } from '@/store/authStore';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { GAME_ICON, GAME_TONE } from './gameMeta';
import { ArcadeBoard } from './ArcadeBoard';
import styles from './Games.module.css';

const DeviceViewer3D = lazy(() => import('@/pages/Lab/DeviceViewer3D'));
const k = (s: string) => s as TranslationKey;
const LETTERS = ['A', 'B', 'C', 'D'];

type Phase = 'intro' | 'countdown' | 'play' | 'saving' | 'result';

interface PlayProps {
  seed: number;
  /** Records the answer for the next round (the referee replays them in order). */
  answer: (value: unknown) => void;
  done: () => void;
}

/* ── the games ─────────────────────────────────────────────────────── */

/** Four options, a short right / wrong flash, then the next round. */
function ChoiceRounds({ count, render, options, label, right, answer, done }: { count: number; render: (i: number) => React.ReactNode; options: (i: number) => string[]; label: (o: string) => string; right: (i: number) => string; answer: PlayProps['answer']; done: () => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const pick = (o: string) => {
    if (picked) return;
    setPicked(o);
    answer(o);
    window.setTimeout(
      () => {
        setPicked(null);
        if (i + 1 >= count) done();
        else setI(i + 1);
      },
      reduced ? 350 : 750,
    );
  };
  const correct = right(i);
  return (
    <div className={styles.round}>
      <div className={styles.progress}>
        <span>
          {i + 1}/{count}
        </span>
        <i style={{ width: `${(i / count) * 100}%` }} />
      </div>
      {render(i)}
      <div className={styles.options}>
        {options(i).map((o, slot) => {
          const state = !picked ? 'idle' : o === correct ? 'right' : o === picked ? 'wrong' : 'dim';
          return (
            <button key={o} type="button" className={styles.option} data-state={state} disabled={!!picked} onClick={() => pick(o)}>
              <span className={styles.letter}>{LETTERS[slot]}</span>
              <span>{label(o)}</span>
              {picked && o === correct && <CircleCheck size={18} aria-hidden="true" />}
              {picked && o === picked && o !== correct && <CircleX size={18} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {picked && <p className={styles.flash} data-ok={picked === correct}>{picked === correct ? t('arcade.ports.right') : t('arcade.ports.wrong', { name: label(correct) })}</p>}
    </div>
  );
}

function DevicePlay({ seed, answer, done }: PlayProps) {
  const t = useT();
  const rounds = useMemo(() => deviceRounds(seed), [seed]);
  const name = (id: string) => t(k(deviceKey(deviceById(id)!, 'name')));
  return (
    <ChoiceRounds
      count={rounds.length}
      options={(i) => rounds[i].options}
      right={(i) => rounds[i].device}
      label={name}
      answer={answer}
      done={done}
      render={(i) => (
        <>
          <h2 className={styles.prompt}>{t('arcade.device.question')}</h2>
          <div className={styles.model}>
            <Suspense fallback={<span className={styles.loading} />}>
              <DeviceViewer3D key={rounds[i].device} id={rounds[i].device} autoRotate label={t('arcade.device.question')} />
            </Suspense>
          </div>
        </>
      )}
    />
  );
}

function PortsPlay({ seed, answer, done }: PlayProps) {
  const t = useT();
  const rounds = useMemo(() => portRounds(seed), [seed]);
  return (
    <ChoiceRounds
      count={rounds.length}
      options={(i) => rounds[i].options}
      right={(i) => PORT_JOBS[rounds[i].job]}
      label={(o) => t(k(`deviceUi.portTypes.${o}`))}
      answer={answer}
      done={done}
      render={(i) => (
        <>
          <span className={styles.ask}>{t('arcade.ports.question')}</span>
          <h2 className={styles.prompt}>{t(k(`arcade.ports.jobs.${rounds[i].job}`))}</h2>
        </>
      )}
    />
  );
}

function OrderPlay({ seed, answer, done }: PlayProps) {
  const t = useT();
  const cards = useMemo(() => orderCards(seed), [seed]);
  const [taps, setTaps] = useState<StepId[]>([]);
  const [shake, setShake] = useState<StepId | null>(null);
  const { installed, mistakes } = replayOrder(taps);
  const tap = (s: StepId) => {
    if (installed.includes(s)) return;
    const ok = canInstall(s, installed);
    answer(s);
    const next = [...taps, s];
    setTaps(next);
    if (!ok) {
      setShake(s);
      window.setTimeout(() => setShake(null), 450);
    } else if (replayOrder(next).done) done();
  };
  return (
    <div className={styles.round}>
      <div className={styles.progress}>
        <span>{t('arcade.order.installed', { n: installed.length, total: STEP_IDS.length })}</span>
        <i style={{ width: `${(installed.length / STEP_IDS.length) * 100}%` }} />
      </div>
      <h2 className={styles.prompt}>{t('arcade.order.question')}</h2>
      <div className={styles.cards}>
        {cards.map((s) => {
          const at = installed.indexOf(s);
          return (
            <button key={s} type="button" className={styles.stepCard} data-done={at >= 0 || undefined} data-shake={shake === s || undefined} disabled={at >= 0} onClick={() => tap(s)}>
              {at >= 0 ? <b>{at + 1}</b> : null}
              <span>{t(k(`pcLab.steps.${s}.name`))}</span>
            </button>
          );
        })}
      </div>
      <p className={styles.hud}>
        {t('arcade.mistakes', { n: mistakes })}
        {shake && <span className={styles.warn}> · {t('arcade.order.wrong')}</span>}
      </p>
    </div>
  );
}

/** Correct answers in a row so far, for the streak badge. */
const streakOf = (oks: boolean[]) => {
  let n = 0;
  for (let i = oks.length - 1; i >= 0 && oks[i]; i--) n++;
  return n;
};

function BinaryPlay({ seed, answer }: PlayProps) {
  const t = useT();
  const rounds = useMemo(() => binaryRounds(seed), [seed]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState('');
  const [oks, setOks] = useState<boolean[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const round = rounds[Math.min(i, rounds.length - 1)];
  const submit = (v: string) => {
    if (i >= rounds.length) return;
    answer(v);
    setOks([...oks, binaryRight(round, v)]);
    setValue('');
    setI(i + 1);
    input.current?.focus();
  };
  const keys = round.dir === 'toBin' ? ['0', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  return (
    <div className={styles.round}>
      <p className={styles.hud}>
        {t('arcade.correct', { n: oks.filter(Boolean).length, total: oks.length })}
        {streakOf(oks) >= 2 && <span className={styles.streak}>{t('arcade.streak', { n: streakOf(oks) })}</span>}
        {oks.length > 0 && <span className={styles.last} data-ok={oks[oks.length - 1]}>{oks[oks.length - 1] ? <Check size={16} /> : <X size={16} />}</span>}
      </p>
      <span className={styles.ask}>{round.dir === 'toBin' ? t('arcade.binary.toBin') : t('arcade.binary.toDec')}</span>
      <h2 className={styles.number}>
        {binaryPrompt(round)}
        <sub>{round.dir === 'toBin' ? '10' : '2'}</sub>
      </h2>
      <form
        className={styles.answerRow}
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) submit(value);
        }}
      >
        <input
          ref={input}
          className={styles.answerInput}
          value={value}
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          aria-label={t('arcade.binary.placeholder')}
          placeholder={t('arcade.binary.placeholder')}
          onChange={(e) => setValue(e.target.value.replace(round.dir === 'toBin' ? /[^01]/g : /\D/g, '').slice(0, 9))}
        />
        <button type="submit" className={styles.primary} disabled={!value}>
          {t('arcade.binary.submit')}
        </button>
      </form>
      <div className={styles.keypad}>
        {keys.map((d) => (
          <button key={d} type="button" onClick={() => setValue((v) => (v + d).slice(0, 9))}>
            {d}
          </button>
        ))}
        <button type="button" onClick={() => setValue((v) => v.slice(0, -1))} aria-label="⌫">
          ⌫
        </button>
      </div>
    </div>
  );
}

function SubnetPlay({ seed, answer }: PlayProps) {
  const t = useT();
  const rounds = useMemo(() => subnetRounds(seed), [seed]);
  const [i, setI] = useState(0);
  const [oks, setOks] = useState<boolean[]>([]);
  const round = rounds[Math.min(i, rounds.length - 1)];
  const say = useCallback(
    (same: boolean) => {
      if (i >= rounds.length) return;
      answer(same);
      setOks((o) => [...o, same === rounds[i].same]);
      setI((n) => n + 1);
    },
    [answer, i, rounds],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') say(true);
      if (e.key === 'ArrowRight') say(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [say]);
  return (
    <div className={styles.round}>
      <p className={styles.hud}>
        {t('arcade.correct', { n: oks.filter(Boolean).length, total: oks.length })}
        {streakOf(oks) >= 2 && <span className={styles.streak}>{t('arcade.streak', { n: streakOf(oks) })}</span>}
        {oks.length > 0 && <span className={styles.last} data-ok={oks[oks.length - 1]}>{oks[oks.length - 1] ? <Check size={16} /> : <X size={16} />}</span>}
      </p>
      <span className={styles.ask}>{t('arcade.subnet.question')}</span>
      <div className={styles.ips}>
        <code>{round.a}</code>
        <code>{round.b}</code>
      </div>
      <p className={styles.mask}>{t('arcade.subnet.mask', { prefix: round.prefix, mask: maskFromPrefix(round.prefix) })}</p>
      <div className={styles.yesNo}>
        <button type="button" className={styles.yes} onClick={() => say(true)}>
          {t('arcade.subnet.yes')}
        </button>
        <button type="button" className={styles.no} onClick={() => say(false)}>
          {t('arcade.subnet.no')}
        </button>
      </div>
      <p className={styles.keysHint}>{t('arcade.subnet.keys')}</p>
    </div>
  );
}

/** Kinds whose own scene already says what happened (the lab stores carry the messages and sounds). */
const SELF_SPOKEN = new Set(['assembly', 'connect']);

/**
 * A hands-on 3D game: the race state is replayed here with the same rules
 * the server uses, so every move gets its answer at once; the moves are the
 * run's answers. A streak of moves that worked is a combo.
 */
function HandsOnPlay({ game, seed, answer, done }: PlayProps & { game: HandsOnGame }) {
  const t = useT();
  const kind = HANDS_ON_RACE[game];
  const faults = useMemo(() => handsOnFaults(game, seed), [game, seed]);
  const [state, setState] = useState(() => handsOnStart(game, seed));
  const [combo, setCombo] = useState(0);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const live = useRef({ state, combo: 0, finished: false });
  const move = useCallback(
    (m: Move) => {
      const cur = live.current;
      if (cur.state.done) return;
      const r = applyMove(kind, cur.state, m, faults, seed);
      // nothing happened (a move that does not apply): not an answer
      if (!r.ok && r.state.mistakes === cur.state.mistakes) return;
      answer(m);
      const mistake = r.state.mistakes > cur.state.mistakes;
      cur.combo = mistake ? 0 : r.ok ? cur.combo + 1 : cur.combo;
      cur.state = r.state;
      setState(r.state);
      setCombo(cur.combo);
      const comboUp = r.ok && cur.combo >= 3 && cur.combo % 3 === 0;
      if (!SELF_SPOKEN.has(kind)) {
        if (r.message) setNote({ ok: r.ok, text: feedbackText(t, r.message) });
        else if (mistake) setNote({ ok: false, text: t('games3d.mistake') });
        else if (r.ok) setNote(null);
        if (mistake) playSfx('error');
        else if (r.ok) playSfx(comboUp ? 'combo' : 'snap');
      } else if (comboUp) playSfx('combo');
      if (r.state.done && !cur.finished) {
        cur.finished = true;
        playSfx('win');
        window.setTimeout(done, 1200);
      }
    },
    [answer, done, faults, kind, seed, t],
  );
  return (
    <div className={styles.round}>
      <div className={styles.progress}>
        <span>{Math.round(state.progress * 100)}%</span>
        <i style={{ width: `${state.progress * 100}%` }} />
      </div>
      <p className={styles.hud}>
        {t('arcade.mistakes', { n: state.mistakes })}
        {combo >= 2 && (
          <span className={styles.streak}>
            <Flame size={14} aria-hidden="true" /> {t('games3d.combo', { n: combo })}
          </span>
        )}
        {state.done && (
          <span className={styles.last} data-ok="true">
            <Check size={16} />
          </span>
        )}
      </p>
      {note && (
        <p className={styles.flash} data-ok={note.ok} role="status">
          {note.text}
        </p>
      )}
      <HandsOnBoard kind={kind} seed={seed} state={state} faults={faults} move={move} />
    </div>
  );
}

const handsOn = (game: HandsOnGame) =>
  function HandsOnRun(p: PlayProps) {
    return <HandsOnPlay game={game} {...p} />;
  };

const PLAY: Record<ArcadeGame, (p: PlayProps) => React.ReactNode> = {
  device: DevicePlay,
  ports: PortsPlay,
  order: OrderPlay,
  binary: BinaryPlay,
  subnet: SubnetPlay,
  phone: handsOn('phone'),
  laptop: handsOn('laptop'),
  pcbuild: handsOn('pcbuild'),
  plug: handsOn('plug'),
  network: handsOn('network'),
  fault: handsOn('fault'),
};

/** Three stars, lit one after another. */
function Stars({ n }: { n: number }) {
  const t = useT();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!n) return;
    const ids = Array.from({ length: n }, (_, i) => window.setTimeout(() => playSfx('star'), reduced ? 0 : 350 + i * 300));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [n, reduced]);
  return (
    <span className={styles.stars} role="img" aria-label={t('games3d.stars', { n })}>
      {[0, 1, 2].map((i) => (
        <Star key={i} size={34} aria-hidden="true" data-on={i < n || undefined} style={{ animationDelay: `${350 + i * 300}ms` }} />
      ))}
    </span>
  );
}

/* ── the page ──────────────────────────────────────────────────────── */

export default function GamePlayPage() {
  const t = useT();
  const navigate = useNavigate();
  const { game: param } = useParams();
  const [search] = useSearchParams();
  const game: ArcadeGame | null = isArcadeGame(param) ? param : null;
  const seedParam = search.get('seed');
  const challengeSeed = seedParam ? Number(seedParam) : NaN;
  const challenge = isSeed(challengeSeed) ? challengeSeed : undefined;
  const status = useAuthStore((s) => s.status);
  const [phase, setPhase] = useState<Phase>('intro');
  const [count, setCount] = useState(3);
  const [run, setRun] = useState<Run | null>(null);
  const [left, setLeft] = useState(0);
  const [finish, setFinish] = useState<Finish | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const answers = useRef<unknown[]>([]);
  const ended = useRef(false);
  useDocumentTitle(game ? t(k(`arcade.games.${game}.title`)) : t('arcade.title'));

  useEffect(() => {
    if (!game) navigate('/games', { replace: true });
  }, [game, navigate]);

  const end = useCallback(async () => {
    if (!run || ended.current) return;
    ended.current = true;
    setPhase('saving');
    try {
      setFinish(await finishRun(run, answers.current));
      setError(null);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(['tooFast', 'expired', 'badAnswers', 'noRun'].includes(code) ? t(k(`arcade.errors.${code}`)) : t('arcade.errors.generic'));
    }
    setPhase('result');
  }, [run, t]);

  const begin = async () => {
    if (!game) return;
    answers.current = [];
    ended.current = false;
    setFinish(null);
    setError(null);
    setCopied(false);
    setCount(3);
    setPhase('countdown');
    setRun(await startRun(game, challenge));
  };

  // 3-2-1, then the clock
  useEffect(() => {
    if (phase !== 'countdown' || !run) return;
    const timer = window.setTimeout(() => {
      if (count > 1) return setCount(count - 1);
      setLeft(ARCADE[run.game].seconds);
      setPhase('play');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [phase, count, run]);

  useEffect(() => {
    if (phase !== 'play') return;
    const timer = window.setTimeout(() => {
      setLeft(left - 1);
      // the last five seconds tick
      if (left <= 6 && left > 1) playSfx('tick');
      if (left <= 1) void end();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, left, end]);

  const answer = useCallback((v: unknown) => {
    answers.current.push(v);
  }, []);

  if (!game) return null;
  const Icon = GAME_ICON[game];
  const spec = ARCADE[game];
  const Game = PLAY[game];
  const shareUrl = run ? `${window.location.origin}${import.meta.env.BASE_URL}games/${game}?seed=${run.seed}` : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      window.prompt(t('arcade.challengeHint'), shareUrl);
    }
  };
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (phase === 'intro' && e.key === 'Enter') void begin();
  };

  return (
    <div className={styles.page} data-wide={isHandsOn(game) || undefined} style={{ ['--tone' as string]: GAME_TONE[game] }} onKeyDown={onKeyDown}>
      <header className={styles.bar}>
        <Link to="/games" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> {t('arcade.back')}
        </Link>
        <h1>
          <Icon size={22} aria-hidden="true" /> {t(k(`arcade.games.${game}.title`))}
        </h1>
        {phase === 'play' && (
          <span className={styles.clock} data-low={left <= 10 || undefined} aria-label={t('arcade.timeLeft')}>
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </span>
        )}
      </header>
      {phase === 'play' && (
        <div className={styles.timeBar} data-low={left <= 10 || undefined} aria-hidden="true">
          <i style={{ width: `${(left / spec.seconds) * 100}%` }} />
        </div>
      )}

      {phase === 'intro' && (
        <section className={styles.intro}>
          <span className={styles.bigIcon}>
            <Icon size={44} aria-hidden="true" />
          </span>
          <p>{t(k(`arcade.games.${game}.desc`))}</p>
          {challenge !== undefined && <p className={styles.note}>{t('arcade.challenged')}</p>}
          {status === 'guest' && <p className={styles.note}>{t('arcade.guest')}</p>}
          <button type="button" className={styles.primary} onClick={() => void begin()}>
            <Play size={18} aria-hidden="true" /> {t('arcade.start')}
          </button>
        </section>
      )}

      {phase === 'countdown' && (
        <section className={styles.countdown} aria-live="assertive">
          <span>{count}</span>
          <p>{t('arcade.ready')}</p>
        </section>
      )}

      {phase === 'play' && run && <Game seed={run.seed} answer={answer} done={() => void end()} />}

      {phase === 'saving' && <section className={styles.countdown}><span className={styles.loading} /></section>}

      {phase === 'result' && (
        <section className={styles.result}>
          {finish ? (
            <>
              <span className={styles.resultLabel}>{t('arcade.result')}</span>
              <Stars n={finish.result.stars ?? 0} />
              <b className={styles.score}>{t('arcade.points', { n: finish.result.score.toLocaleString('ru-RU') })}</b>
              <span className={styles.xp}>
                <Sparkles size={15} aria-hidden="true" /> {t('games3d.xp', { n: xpOf(finish.result) })}
              </span>
              {finish.previousBest !== null && finish.result.score > finish.previousBest && <span className={styles.newBest}>{t('arcade.newBest')}</span>}
              {finish.previousBest === null && finish.result.score > 0 && <span className={styles.newBest}>{t('arcade.newBest')}</span>}
              <p className={styles.stats}>
                {t('arcade.correct', { n: finish.result.correct, total: finish.result.total })} · {t('arcade.mistakes', { n: finish.result.mistakes })} ·{' '}
                <Trophy size={14} aria-hidden="true" /> {t('arcade.best', { n: finish.best.toLocaleString('ru-RU') })}
              </p>
              {!finish.ranked && <p className={styles.note}>{status === 'signedIn' ? t('arcade.offline') : t('arcade.guest')}</p>}
            </>
          ) : (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => void begin()}>
              <RotateCcw size={16} aria-hidden="true" /> {t('arcade.again')}
            </button>
            <button type="button" className={styles.secondary} onClick={() => void copy()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? t('arcade.copied') : t('arcade.challenge')}
            </button>
            {status === 'guest' && (
              <Link to="/login" className={styles.secondary}>
                {t('arcade.signIn')}
              </Link>
            )}
          </div>
          <p className={styles.keysHint}>{t('arcade.challengeHint')}</p>
          {status === 'signedIn' && <ArcadeBoard game={game} refresh={finish?.ranked ? finish.result.score : 0} />}
        </section>
      )}
      <p className={styles.specLine}>{spec.mode === 'rounds' ? t('arcade.rounds', { n: spec.rounds }) : t('arcade.seconds', { n: spec.seconds })}</p>
    </div>
  );
}
