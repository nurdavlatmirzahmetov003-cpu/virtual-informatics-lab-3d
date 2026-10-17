/**
 * The student's game panel (V2-11a): level ring with rank, XP to the next
 * level, this week's XP and streak; today's challenge and this week's goals.
 * Calm and precise — numbers first, no confetti.
 */
import { useId, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, Check, Flame, Medal, Target } from 'lucide-react';
import { useGame } from '@/hooks/useGame';
import { useNow } from '@/hooks/useNow';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { XP } from '@/services/game/xp';
import { DAILY_PASS, dayKey, dayStart } from '@/services/progress/challenges';
import { LAB_MODULES } from '@/pages/Labs/modules';
import styles from './Game.module.css';

const tk = (k: string) => k as TranslationKey;
const tone = (lab: string) => LAB_MODULES.find((m) => m.id === lab)?.tone ?? 'var(--accent)';

export function LevelRing({ level, progress, size = 112 }: { level: number; progress: number; size?: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const grad = `lvl-${useId().replace(/:/g, '')}`;
  return (
    <svg className={styles.ring} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={r} className={styles.ringTrack} />
      <circle cx="50" cy="50" r={r} className={styles.ringFill} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, progress))} stroke={`url(#${grad})`} />
      <text x="50" y="50" className={styles.ringNum} textAnchor="middle" dominantBaseline="central">
        {level}
      </text>
    </svg>
  );
}

function useHoursLeft() {
  const now = useNow();
  return Math.max(1, Math.ceil((dayStart(dayKey(now) + 1) - now) / 3_600_000));
}

export function GamePanel({ compact = false, boardLink = true }: { compact?: boolean; boardLink?: boolean }) {
  const t = useT();
  const g = useGame();
  const hoursLeft = useHoursLeft();
  const { level } = g;

  return (
    <div className={styles.grid} data-compact={compact}>
      <section className={styles.hero} aria-labelledby="game-level">
        <LevelRing level={level.level} progress={level.progress} />
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>{t('game.level', { n: level.level })}</span>
          <h2 id="game-level">{t(tk(`game.ranks.${level.rank}`))}</h2>
          <div className={styles.xpBar} role="progressbar" aria-valuemin={0} aria-valuemax={level.span} aria-valuenow={level.into} aria-label={t('game.toNext')}>
            <i style={{ width: `${level.progress * 100}%` }} />
          </div>
          <p className={styles.muted}>{t('game.toNextValue', { into: level.into, span: level.span, next: level.level + 1 })}</p>
          <div className={styles.chips}>
            <span>
              <b>{g.xp.total.toLocaleString('ru-RU')}</b> XP
            </span>
            <span>
              <b>+{g.weekXp}</b> {t('game.thisWeek')}
            </span>
            <span data-hot={g.streak.current > 0}>
              <Flame size={14} aria-hidden="true" /> <b>{g.streak.current}</b> {t('game.streakDays')}
            </span>
          </div>
          {!compact && boardLink && (
            <Link to="/leaderboard" className={styles.link}>
              <Medal size={15} aria-hidden="true" /> {t('game.toBoard')} <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="game-daily">
        <header className={styles.cardHead}>
          <h3 id="game-daily">
            <CalendarCheck2 size={17} aria-hidden="true" /> {t('game.daily.title')}
          </h3>
          <small>{t('game.daily.left', { h: hoursLeft })}</small>
        </header>
        <ol className={styles.items}>
          {g.daily.items.map(({ task, done, best }) => (
            <li key={task.id} data-done={done} style={{ '--tone': tone(task.lab) } as CSSProperties}>
              <span className={styles.check} aria-hidden="true">
                {done ? <Check size={13} strokeWidth={3} /> : null}
              </span>
              <Link to={task.path} className={styles.itemLink}>
                <b>{t(tk(task.title))}</b>
                <small>
                  {t(`labs.modules.${task.lab}.title`)}
                  {best !== null && !done ? ` · ${t('game.daily.best', { p: best, need: DAILY_PASS })}` : ''}
                </small>
              </Link>
              <span className={styles.reward}>{done ? t('game.daily.done') : `+${XP.dailyItem} XP`}</span>
            </li>
          ))}
        </ol>
        <p className={styles.footnote}>{g.daily.complete ? t('game.daily.allDone', { xp: XP.dailyAll }) : t('game.daily.rule', { need: DAILY_PASS, xp: XP.dailyAll })}</p>
      </section>

      <section className={styles.card} aria-labelledby="game-weekly">
        <header className={styles.cardHead}>
          <h3 id="game-weekly">
            <Target size={17} aria-hidden="true" /> {t('game.weekly.title')}
          </h3>
          <small>{t('game.weekly.reward', { xp: XP.weeklyGoal })}</small>
        </header>
        <ul className={styles.goals}>
          {g.weekly.goals.map((goal) => (
            <li key={goal.id} data-done={goal.done}>
              <div className={styles.goalHead}>
                <span>{t(tk(`game.weekly.goals.${goal.id}`), { n: goal.target })}</span>
                <b>
                  {goal.current}/{goal.target}
                </b>
              </div>
              <span className={styles.goalBar} aria-hidden="true">
                <i style={{ width: `${(goal.current / goal.target) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
