/**
 * V4 §9: `/achievements` — a game-style achievements screen. Summary header
 * (level, XP bar, coins from the same economy as the robots, earned per
 * rarity, recent unlocks), a top-3 showcase on pedestals, then every badge as
 * a medal: earned ones shine in their rarity's metal, locked ones are
 * silhouettes with a progress ring and a hint. A badge opens its card.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Coins, Lock, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { BadgeMedal } from '@/components/achievements/BadgeMedal';
import { UnlockCeremony } from '@/components/achievements/UnlockCeremony';
import { LevelRing } from '@/components/game/GamePanel';
import { useGame } from '@/hooks/useGame';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { evaluateAchievements, type AchievementId, type AchievementProgress } from '@/services/progress';
import { badgeXp, RARITIES, RARITY, rarityRank, type Rarity } from '@/services/progress/rarity';
import { balance } from '@/services/robots/economy';
import { useProgressStore, useProgressSummary } from '@/store/progressStore';
import { useRobotsStore } from '@/store/robotsStore';
import { formatDay } from '../Progress/dates';
import styles from './Achievements.module.css';

const tk = (key: string) => key as TranslationKey;
type Filter = 'all' | 'earned' | 'locked';

interface Badge extends AchievementProgress {
  earned: boolean;
  at: number | undefined;
  rarity: Rarity;
}

export default function AchievementsPage() {
  const t = useT();
  const g = useGame();
  const summary = useProgressSummary();
  const attempts = useProgressStore((s) => s.attempts);
  const unlockedAt = useProgressStore((s) => s.achievements);
  const save = useRobotsStore((s) => s.save);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Badge | null>(null);

  useEffect(() => void useRobotsStore.getState().load(), []);

  const badges = useMemo<Badge[]>(
    () =>
      evaluateAchievements(summary, attempts)
        .map((a) => ({ ...a, earned: a.unlocked || unlockedAt[a.id] !== undefined, at: unlockedAt[a.id], rarity: RARITY[a.id] }))
        // legendary first; within a rarity, earned first
        .sort((a, b) => rarityRank(b.id) - rarityRank(a.id) || Number(b.earned) - Number(a.earned)),
    [summary, attempts, unlockedAt],
  );
  const earned = badges.filter((b) => b.earned);
  const recent = [...earned].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)).slice(0, 3);
  const top = [...earned].sort((a, b) => rarityRank(b.id) - rarityRank(a.id) || (b.at ?? 0) - (a.at ?? 0)).slice(0, 3);
  // pedestals: second, first, third
  const podium = [top[1], top[0], top[2]].filter(Boolean) as Badge[];
  const shown = badges.filter((b) => filter === 'all' || (filter === 'earned' ? b.earned : !b.earned));
  const coins = balance(g.xp.total, save);
  const name = (id: AchievementId) => t(tk(`achievements.items.${id}.name`));

  return (
    <PageLayout eyebrow={t('achievements.page.eyebrow')} title={t('achievements.page.title')} subtitle={t('achievements.page.subtitle')}>
      <section className={styles.hero} aria-label={t('achievements.summary.title')}>
        <div className={styles.level}>
          <LevelRing level={g.level.level} progress={g.level.progress} size={104} />
          <div>
            <span className={styles.eyebrow}>{t('game.level', { n: g.level.level })}</span>
            <h2>{t(tk(`game.ranks.${g.level.rank}`))}</h2>
            <div className={styles.xpBar} role="progressbar" aria-valuemin={0} aria-valuemax={g.level.span} aria-valuenow={g.level.into} aria-label={t('game.toNext')}>
              <i style={{ width: `${g.level.progress * 100}%` }} />
            </div>
            <p className={styles.muted}>{t('game.toNextValue', { into: g.level.into, span: g.level.span, next: g.level.level + 1 })}</p>
            <div className={styles.chips}>
              <span>
                <Sparkles size={14} aria-hidden="true" /> <b>{g.xp.total.toLocaleString('ru-RU')}</b> XP
              </span>
              <Link to="/robots" className={styles.coins} title={t('achievements.summary.coinsHint')}>
                <Coins size={14} aria-hidden="true" /> <b>{coins}</b> {t('achievements.coins')}
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.tally}>
          <b className={styles.count}>
            {earned.length}
            <small>/{badges.length}</small>
          </b>
          <span className={styles.muted}>{t('achievements.summary.earned')}</span>
          <ul className={styles.tiers}>
            {[...RARITIES].reverse().map((r) => (
              <li key={r} data-rarity={r}>
                <i aria-hidden="true" />
                {t(tk(`achievements.rarity.${r}`))}
                <b>
                  {earned.filter((b) => b.rarity === r).length}/{badges.filter((b) => b.rarity === r).length}
                </b>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.recent}>
          <h3>{t('achievements.summary.recent')}</h3>
          {recent.length === 0 ? (
            <p className={styles.muted}>{t('achievements.summary.recentEmpty')}</p>
          ) : (
            <ul>
              {recent.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setOpen(b)}>
                    <BadgeMedal id={b.id} unlocked size={40} />
                    <span>
                      <b>{name(b.id)}</b>
                      <small>{b.at ? formatDay(b.at) : t(tk(`achievements.rarity.${b.rarity}`))}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={styles.showcase} aria-labelledby="showcase-title">
        <h2 id="showcase-title">{t('achievements.summary.showcase')}</h2>
        {podium.length === 0 ? (
          <p className={styles.muted}>{t('achievements.summary.showcaseEmpty')}</p>
        ) : (
          <ol className={styles.podium}>
            {podium.map((b) => (
              <li key={b.id} data-place={top.indexOf(b) + 1} data-rarity={b.rarity}>
                <button type="button" onClick={() => setOpen(b)} aria-label={`${top.indexOf(b) + 1}. ${name(b.id)}`}>
                  <BadgeMedal id={b.id} unlocked size={top.indexOf(b) === 0 ? 132 : 104} />
                  <b>{name(b.id)}</b>
                  <small>{t(tk(`achievements.rarity.${b.rarity}`))}</small>
                </button>
                <span className={styles.pedestal} aria-hidden="true">
                  {top.indexOf(b) + 1}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={styles.all} aria-labelledby="all-title">
        <div className={styles.allHead}>
          <h2 id="all-title">{t('progress.achievements.title')}</h2>
          <div className={styles.filter} role="radiogroup" aria-label={t('achievements.filter.label')}>
            {(['all', 'earned', 'locked'] as const).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
                {t(tk(`achievements.filter.${f}`))}
              </button>
            ))}
          </div>
        </div>
        <ul className={styles.grid}>
          {shown.map((b) => (
            <li key={b.id} className={styles.card} data-rarity={b.rarity} data-earned={b.earned}>
              <button type="button" onClick={() => setOpen(b)} aria-label={`${name(b.id)} — ${b.earned ? t(tk(`achievements.rarity.${b.rarity}`)) : t('progress.achievements.locked')}`}>
                <span className={styles.medal}>
                  <BadgeMedal id={b.id} unlocked={b.earned} progress={b.earned ? undefined : b.current / b.target} size={92} />
                  {!b.earned && (
                    <span className={styles.lock} aria-hidden="true">
                      <Lock size={12} />
                    </span>
                  )}
                </span>
                <span className={styles.tier}>{t(tk(`achievements.rarity.${b.rarity}`))}</span>
                <b className={styles.name}>{name(b.id)}</b>
                {b.earned ? (
                  <small className={styles.date}>{b.at ? t('progress.achievements.unlockedAt', { date: formatDay(b.at) }) : t('achievements.summary.earnedShort')}</small>
                ) : (
                  <>
                    <small className={styles.hint}>{t(tk(`achievements.items.${b.id}.condition`), { target: b.target })}</small>
                    <small className={styles.count2}>{t('progress.achievements.progress', { current: b.current, target: b.target })}</small>
                  </>
                )}
                <small className={styles.xp}>+{badgeXp(b.id)} XP</small>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.back}>
        <Link to="/progress">
          {t('achievements.page.toProgress')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </p>

      {open && <UnlockCeremony id={open.id} unlocked={open.earned} target={open.target} current={open.current} replay onClose={() => setOpen(null)} />}
    </PageLayout>
  );
}
