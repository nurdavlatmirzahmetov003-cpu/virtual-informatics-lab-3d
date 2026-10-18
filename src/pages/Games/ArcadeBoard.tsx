/** Class / school leaderboard of one arena game, this week or all time. */
import { useEffect, useState } from 'react';
import { Medal } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { ArcadeGame } from '@/labs/Arcade';
import { arcadeApi, type Board, type Boards } from '@/services/arcade/api';
import styles from './Games.module.css';

type Choice = { scope: 'class' | 'school'; id: string | null; label: string };

export function ArcadeBoard({ game, refresh }: { game: ArcadeGame; refresh: number }) {
  const t = useT();
  const [boards, setBoards] = useState<Boards | null>(null);
  const [choice, setChoice] = useState(0);
  const [period, setPeriod] = useState<'week' | 'all'>('week');
  const [board, setBoard] = useState<Board | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'off' | 'none'>('loading');

  useEffect(() => {
    let alive = true;
    arcadeApi
      .me()
      .then((r) => {
        if (!alive) return;
        if (!r.enabled) return setState('off');
        setBoards(r.boards);
        if (!r.boards.classes.length && !r.boards.school) setState('none');
      })
      .catch(() => alive && setState('none'));
    return () => {
      alive = false;
    };
  }, []);

  const choices: Choice[] = boards ? [...boards.classes.map((c) => ({ scope: 'class' as const, id: c.id, label: c.name })), ...(boards.school ? [{ scope: 'school' as const, id: null, label: boards.school.name }] : [])] : [];
  const current = choices[choice] ?? null;

  useEffect(() => {
    if (!current) return;
    let alive = true;
    arcadeApi
      .board(game, current.scope, current.id, period)
      .then((b) => {
        if (!alive) return;
        setBoard(b);
        setState('ready');
      })
      .catch((e: { code?: string }) => alive && setState(e.code === 'leaderboardsOff' ? 'off' : 'none'));
    return () => {
      alive = false;
    };
    // `refresh` changes when a new ranked score was saved
  }, [game, current?.scope, current?.id, period, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'off') return <p className={styles.note}>{t('arcade.board.off')}</p>;
  if (state === 'none') return <p className={styles.note}>{t('arcade.board.none')}</p>;

  return (
    <section className={styles.board} aria-labelledby="arcade-board">
      <header>
        <h3 id="arcade-board">
          <Medal size={18} aria-hidden="true" /> {t('arcade.board.title')}
        </h3>
        <div className={styles.tabs}>
          {choices.map((c, i) => (
            <button key={`${c.scope}${c.id}`} type="button" aria-pressed={i === choice} onClick={() => setChoice(i)}>
              {c.scope === 'class' ? `${t('arcade.board.class')}: ${c.label}` : `${t('arcade.board.school')}: ${c.label}`}
            </button>
          ))}
        </div>
        <div className={styles.tabs}>
          {(['week', 'all'] as const).map((p) => (
            <button key={p} type="button" aria-pressed={p === period} onClick={() => setPeriod(p)}>
              {t(p === 'week' ? 'arcade.board.week' : 'arcade.board.all')}
            </button>
          ))}
        </div>
      </header>
      {board && board.rows.length === 0 && <p className={styles.note}>{t('arcade.board.empty')}</p>}
      {board && board.rows.length > 0 && (
        <ol className={styles.rows}>
          {board.rows.map((r, i) => (
            <li key={i} data-me={r.me || undefined} data-top={r.rank <= 3 ? r.rank : undefined}>
              <span className={styles.rank}>{r.rank}</span>
              <span className={styles.who}>
                {r.name ?? `${t('arcade.board.hidden')} ${r.rank}`}
                {r.me && <small> ({t('arcade.board.you')})</small>}
              </span>
              <b>{r.score.toLocaleString('ru-RU')}</b>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
