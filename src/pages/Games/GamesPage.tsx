/**
 * The Games arena (0.36): five quick competitive games with records and
 * class / school leaderboards, and the way into live class games. 0.37: six
 * hands-on 3D games first, the player's level (experience from the best
 * scores) and badges.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, MonitorPlay, Sparkles, Trophy } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { ARCADE, HANDS_ON_GAMES, QUICK_GAMES, type ArcadeGame } from '@/labs/Arcade';
import { BADGE_IDS, badgesOf, levelOf, totalXp } from '@/labs/Arcade/badges';
import { arcadeApi, localBests } from '@/services/arcade/api';
import { useAuthStore } from '@/store/authStore';
import { GAME_ICON, GAME_TONE } from './gameMeta';
import styles from './Games.module.css';

const k = (s: string) => s as TranslationKey;

function GameCard({ g, best }: { g: ArcadeGame; best: number | undefined }) {
  const t = useT();
  const Icon = GAME_ICON[g];
  const spec = ARCADE[g];
  return (
    <Link to={`/games/${g}`} className={styles.card} style={{ ['--tone' as string]: GAME_TONE[g] }}>
      {spec.mode === 'build' && <span className={styles.badge3d}>3D</span>}
      <span className={styles.icon}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <h2>{t(k(`arcade.games.${g}.title`))}</h2>
      <p>{t(k(`arcade.games.${g}.desc`))}</p>
      <span className={styles.meta}>{spec.mode === 'rounds' ? t('arcade.rounds', { n: spec.rounds }) : t('arcade.seconds', { n: spec.seconds })}</span>
      <span className={styles.best}>
        <Trophy size={14} aria-hidden="true" /> {best !== undefined ? t('arcade.best', { n: best }) : t('arcade.noBest')}
      </span>
      <span className={styles.play}>
        {t('arcade.play')} <ArrowRight size={16} aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function GamesPage() {
  const t = useT();
  const status = useAuthStore((s) => s.status);
  const [bests, setBests] = useState<Partial<Record<ArcadeGame, number>>>(() => localBests());

  useEffect(() => {
    if (status !== 'signedIn') return;
    let alive = true;
    arcadeApi
      .me()
      .then((r) => alive && setBests(r.bests))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [status]);

  const xp = totalXp(bests);
  const { level, into, toNext } = levelOf(xp);
  const got = new Set(badgesOf(bests));

  return (
    <PageLayout eyebrow={t('arcade.eyebrow')} title={t('arcade.title')} subtitle={t('arcade.subtitle')}>
      {status === 'guest' && <p className={styles.guest}>{t('arcade.guest')}</p>}
      <section className={styles.levelCard} aria-label={t('games3d.level.title')}>
        <div className={styles.level}>
          <b>
            <Sparkles size={18} aria-hidden="true" /> {t('games3d.level.n', { n: level })}
          </b>
          <div className={styles.levelBar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(into * 100)} aria-label={t('games3d.level.title')}>
            <i style={{ width: `${into * 100}%` }} />
          </div>
          <small>{t('games3d.level.xp', { xp, next: toNext })}</small>
        </div>
        <ul className={styles.badges} aria-label={t('games3d.badges.title')}>
          {BADGE_IDS.map((b) => (
            <li key={b} data-got={got.has(b) || undefined} title={t(k(`games3d.badges.${b}.how`))}>
              <Award size={14} aria-hidden="true" /> {t(k(`games3d.badges.${b}.name`))}
              <span className="visually-hidden">{got.has(b) ? t('games3d.badges.got') : t(k(`games3d.badges.${b}.how`))}</span>
            </li>
          ))}
        </ul>
      </section>

      <h2 className={styles.section}>{t('games3d.section')}</h2>
      <p className={styles.sectionNote}>{t('games3d.sectionNote')}</p>
      <div className={styles.grid}>
        {HANDS_ON_GAMES.map((g) => (
          <GameCard key={g} g={g} best={bests[g]} />
        ))}
      </div>

      <h2 className={styles.section}>{t('games3d.quick')}</h2>
      <div className={styles.grid}>
        {QUICK_GAMES.map((g) => (
          <GameCard key={g} g={g} best={bests[g]} />
        ))}
        <Link to="/live" className={`${styles.card} ${styles.liveCard}`}>
          <span className={styles.icon}>
            <MonitorPlay size={26} aria-hidden="true" />
          </span>
          <h2>{t('arcade.live.title')}</h2>
          <p>{t('arcade.live.text')}</p>
          <span className={styles.play}>
            {t('arcade.live.open')} <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </div>
    </PageLayout>
  );
}
