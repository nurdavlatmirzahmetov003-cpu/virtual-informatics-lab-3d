/**
 * The class's XP board (real names: the teacher knows their students) and
 * class-vs-class contests: create one with own classes or classes of the
 * same school, follow the standings, delete it (V2-11a).
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Swords, Trash2, Trophy } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { ApiError } from '@/services/auth/api';
import { gameApi, type Board, type ContestListItem } from '@/services/game/api';
import { useAuthStore } from '@/store/authStore';
import type { TabProps } from './ClassPage';
import { fromInputValue, toInputValue } from './format';
import { BoardTable, ContestCard } from '../Leaderboard/LeaderboardPage';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

const DAY = 86_400_000;

export function ContestsTab({ detail }: TabProps) {
  const t = useT();
  const csrf = useAuthStore((s) => s.csrf);
  const classId = detail.class.id;
  const [period, setPeriod] = useState<'week' | 'all'>('week');
  const [board, setBoard] = useState<Board | null>(null);
  const [contests, setContests] = useState<ContestListItem[] | null>(null);
  const [options, setOptions] = useState<Array<{ id: string; name: string; teacher: string }>>([]);
  const [form, setForm] = useState(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { title: '', classIds: [classId], start: toInputValue(start.getTime()), end: toInputValue(start.getTime() + 7 * DAY - 60_000) };
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gameApi.board('class', classId, period).then(setBoard, () => setBoard(null));
  }, [classId, period]);
  const reload = useCallback(() => {
    gameApi.contests().then(
      (r) => setContests(r.contests),
      () => setContests([]),
    );
  }, []);
  useEffect(() => {
    reload();
    gameApi.contestClasses().then(
      (r) => setOptions(r.classes),
      () => setOptions([]),
    );
  }, [reload]);

  const code = (e: unknown) => (e instanceof ApiError ? e.code : 'server');
  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    try {
      await gameApi.createContest({ title: form.title.trim(), classIds: form.classIds, startsAt: fromInputValue(form.start) ?? 0, endsAt: fromInputValue(form.end) ?? 0 }, csrf);
      setForm({ ...form, title: '' });
      setError(null);
      reload();
    } catch (err) {
      const c = code(err);
      setError(t(`game.contest.errors.${['badTitle', 'badClasses', 'badDates'].includes(c) ? c : 'server'}` as Parameters<typeof t>[0]));
    }
  };
  const remove = async (c: ContestListItem) => {
    if (!csrf || !window.confirm(t('game.contest.deleteConfirm', { title: c.title }))) return;
    await gameApi.deleteContest(c.id, csrf).catch(() => undefined);
    reload();
  };
  const toggle = (id: string) => setForm({ ...form, classIds: form.classIds.includes(id) ? form.classIds.filter((x) => x !== id) : [...form.classIds, id] });

  return (
    <div className={styles.split}>
      <div className={styles.mainCol}>
        <section className={auth.panel}>
          <div className={styles.sheetHead}>
            <h2>
              <Trophy size={18} aria-hidden="true" /> {t('game.board.classTitle')}
            </h2>
            <div className={styles.tabs} role="tablist" aria-label={t('game.board.period')}>
              {(['week', 'all'] as const).map((p) => (
                <button key={p} type="button" role="tab" aria-selected={period === p} className={styles.tab} onClick={() => setPeriod(p)}>
                  {t(`game.board.${p}`)}
                </button>
              ))}
            </div>
          </div>
          {board && <BoardTable board={board} />}
          <p className={styles.hint}>{t('game.board.teacherNote')}</p>
        </section>
        <section className={auth.panel}>
          <h2>
            <Swords size={18} aria-hidden="true" /> {t('game.contest.title')}
          </h2>
          {contests && !contests.length && <p className={styles.empty}>{t('game.contest.noneStaff')}</p>}
          <ul className={styles.cards}>
            {contests?.map((c) => (
              <li key={c.id} className={styles.contestItem}>
                <ul className={styles.cards}>
                  <ContestCard item={c} />
                </ul>
                {c.canDelete && (
                  <button type="button" className={styles.iconBtn} data-danger="true" onClick={() => remove(c)} aria-label={`${t('admin.delete')}: ${c.title}`} title={t('admin.delete')}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <form className={`${auth.panel} ${styles.side}`} onSubmit={create}>
        <h2>
          <Plus size={18} aria-hidden="true" /> {t('game.contest.new')}
        </h2>
        <label className={auth.field}>
          <span>{t('game.contest.name')}</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={80} placeholder={t('game.contest.namePlaceholder')} required />
        </label>
        <fieldset className={styles.classPick}>
          <legend>{t('game.contest.classes')}</legend>
          {options.map((o) => (
            <label key={o.id}>
              <input type="checkbox" checked={form.classIds.includes(o.id)} onChange={() => toggle(o.id)} />
              <span>
                {o.name} <small>{o.teacher}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className={styles.dates}>
          <label className={auth.field}>
            <span>{t('game.contest.start')}</span>
            <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </label>
          <label className={auth.field}>
            <span>{t('game.contest.end')}</span>
            <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </label>
        </div>
        <p className={styles.hint}>{t('game.contest.rule')}</p>
        {error && (
          <p className={auth.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={auth.primary} disabled={!form.title.trim() || form.classIds.length < 2}>
          <Swords size={16} aria-hidden="true" /> {t('game.contest.create')}
        </button>
      </form>
    </div>
  );
}
