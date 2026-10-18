/**
 * The Games arena (0.36): five quick competitive games with records and
 * class / school leaderboards, and the way into live class games.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MonitorPlay, Trophy } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { ARCADE, ARCADE_GAMES, type ArcadeGame } from '@/labs/Arcade';
import { arcadeApi, localBests } from '@/services/arcade/api';
import { useAuthStore } from '@/store/authStore';
import { GAME_ICON, GAME_TONE } from './gameMeta';
import styles from './Games.module.css';

const k = (s: string) => s as TranslationKey;

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

  return (
    <PageLayout eyebrow={t('arcade.eyebrow')} title={t('arcade.title')} subtitle={t('arcade.subtitle')}>
      {status === 'guest' && <p className={styles.guest}>{t('arcade.guest')}</p>}
      <div className={styles.grid}>
        {ARCADE_GAMES.map((g) => {
          const Icon = GAME_ICON[g];
          const spec = ARCADE[g];
          return (
            <Link key={g} to={`/games/${g}`} className={styles.card} style={{ ['--tone' as string]: GAME_TONE[g] }}>
              <span className={styles.icon}>
                <Icon size={26} aria-hidden="true" />
              </span>
              <h2>{t(k(`arcade.games.${g}.title`))}</h2>
              <p>{t(k(`arcade.games.${g}.desc`))}</p>
              <span className={styles.meta}>{spec.mode === 'timed' ? t('arcade.seconds', { n: spec.seconds }) : t('arcade.rounds', { n: spec.rounds })}</span>
              <span className={styles.best}>
                <Trophy size={14} aria-hidden="true" /> {bests[g] !== undefined ? t('arcade.best', { n: bests[g]! }) : t('arcade.noBest')}
              </span>
              <span className={styles.play}>
                {t('arcade.play')} <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          );
        })}
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
