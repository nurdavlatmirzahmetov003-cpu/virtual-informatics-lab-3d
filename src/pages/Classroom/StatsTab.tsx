/** Class statistics and export (CSV for spreadsheets, JSON for everything). */
import { useMemo } from 'react';
import { FileJson, FileSpreadsheet } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useSettingsStore } from '@/store/settingsStore';
import { assignmentStats, classSummary, studentTotals, toCsv, toJson } from '@/services/classroom/stats';
import type { TabProps } from './ClassPage';
import { downloadText, slug } from './format';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

const level = (p: number | null) => (p == null ? 'none' : p >= 85 ? 'high' : p >= 60 ? 'mid' : 'low');

export function StatsTab({ detail }: TabProps) {
  const t = useT();
  const lang = useSettingsStore((s) => s.language);
  /** 2.3 in English, 2,3 in Kazakh and Russian. */
  const num = (x: number | null) => (x == null ? '—' : lang === 'en' ? String(x) : String(x).replace('.', ','));
  const summary = useMemo(() => classSummary(detail), [detail]);
  const perAssignment = useMemo(() => assignmentStats(detail), [detail]);
  const perStudent = useMemo(() => studentTotals(detail).sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1)), [detail]);
  const names = new Map(detail.students.map((s) => [s.id, s.displayName]));
  const titles = new Map(detail.assignments.map((a) => [a.id, a]));
  const day = new Date().toISOString().slice(0, 10);

  const exportCsv = () =>
    downloadText(
      `${slug(detail.class.name)}_${day}.csv`,
      toCsv(detail, { student: t('classroom.students.name'), login: t('auth.login'), total: t('classroom.journal.total'), percent: '%' }),
      'text/csv;charset=utf-8',
    );
  const exportJson = () => downloadText(`${slug(detail.class.name)}_${day}.json`, JSON.stringify(toJson(detail, Date.now()), null, 2), 'application/json');

  const tiles = [
    { label: t('classroom.stats.students'), value: summary.students },
    { label: t('classroom.stats.assignments'), value: summary.assignments },
    { label: t('classroom.stats.completion'), value: summary.completion == null ? '—' : `${summary.completion}%` },
    { label: t('classroom.stats.average'), value: summary.averagePercent == null ? '—' : `${summary.averagePercent}%` },
  ];

  return (
    <div className={styles.stats}>
      <div className={styles.tiles}>
        {tiles.map((x) => (
          <div key={x.label} className={styles.tile}>
            <b>{x.value}</b>
            <span>{x.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.row}>
        <button type="button" className={auth.secondary} onClick={exportCsv} disabled={!detail.students.length}>
          <FileSpreadsheet size={16} aria-hidden="true" /> {t('classroom.stats.csv')}
        </button>
        <button type="button" className={auth.secondary} onClick={exportJson}>
          <FileJson size={16} aria-hidden="true" /> {t('classroom.stats.json')}
        </button>
      </div>

      {!!perAssignment.length && (
        <section className={auth.panel}>
          <h2>{t('classroom.stats.byAssignment')}</h2>
          <div className={styles.tableWrap}>
            <table className={auth.table}>
              <thead>
                <tr>
                  <th>{t('classroom.assignments.title')}</th>
                  <th>{t('classroom.stats.done')}</th>
                  <th>{t('classroom.stats.avgScore')}</th>
                  <th>{t('classroom.stats.late')}</th>
                  <th>{t('classroom.grade.errors')}</th>
                  <th>{t('classroom.grade.hints')}</th>
                </tr>
              </thead>
              <tbody>
                {perAssignment.map((s) => (
                  <tr key={s.id}>
                    <td>{titles.get(s.id)?.title}</td>
                    <td>
                      <span className={styles.meter}>
                        <i style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
                        <small>
                          {s.done}/{s.total}
                        </small>
                      </span>
                    </td>
                    <td>
                      <span className={styles.pct} data-level={level(s.averagePercent)}>
                        {s.average == null ? '—' : `${num(s.average)}/${titles.get(s.id)?.points} · ${s.averagePercent}%`}
                      </span>
                    </td>
                    <td>{s.late}</td>
                    <td>{num(s.errors)}</td>
                    <td>{num(s.hints)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!!perStudent.length && (
        <section className={auth.panel}>
          <h2>{t('classroom.stats.byStudent')}</h2>
          <ol className={styles.ranking}>
            {perStudent.map((s) => (
              <li key={s.id}>
                <span>{names.get(s.id)}</span>
                <span className={styles.bar} data-level={level(s.percent)}>
                  <i style={{ width: `${s.percent ?? 0}%` }} />
                </span>
                <b>{s.percent ?? 0}%</b>
                <small className={styles.muted}>
                  {s.points}/{s.max}
                </small>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
