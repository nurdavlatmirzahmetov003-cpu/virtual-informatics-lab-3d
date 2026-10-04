import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircleCheck, Info, X } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import {
  FREE_INPUTS, GATE_TYPES, LOGIC_TASKS, LOGIC_TASK_IDS, analyze, evaluate, expression, isLogicTaskId, type LogicTaskId,
} from '@/labs/LogicLab';
import { useProgressStore } from '@/store/progressStore';
import { Board } from './Board';
import { Palette } from './Palette';
import { TaskPanel, Warnings } from './SidePanel';
import { TruthTable } from './TruthTable';
import { useLogicLab } from './useLogicLab';
import styles from './LogicLab.module.css';

const tk = (key: string) => key as TranslationKey;
type Mode = LogicTaskId | 'free';
/** Links of the earlier version: ?task=xor / nand. */
const LEGACY: Record<string, LogicTaskId> = { xor: 'xorBasic', nand: 'table' };

function Lab({ mode }: { mode: Mode }) {
  const t = useT();
  const task = mode === 'free' ? null : mode;
  const { circuit, bits, selection, notice, attempt, report, exercise, actions } = useLogicLab(task);
  const svgRef = useRef<SVGSVGElement>(null);
  const labels = exercise ? exercise.inputs : FREE_INPUTS;
  const evaluation = useMemo(() => evaluate(circuit, bits), [circuit, bits]);
  const issues = useMemo(() => analyze(circuit), [circuit]);
  const formula = useMemo(() => expression(circuit), [circuit]);
  const warned = useMemo(() => new Set(issues.filter((i) => i.code !== 'unused').flatMap((i) => i.nodes)), [issues]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(actions.dismissNotice, 4500);
    return () => window.clearTimeout(id);
  }, [notice, actions]);

  return (
    <div className={styles.lab}>
      <Palette circuit={circuit} allowed={exercise?.allowed ?? GATE_TYPES} actions={actions} svgRef={svgRef} />
      <div className={styles.stage}>
        {exercise && exercise.allowed.length < GATE_TYPES.length && <p className={styles.restriction}>{t('logic.ui.onlyAllowed', { gates: exercise.allowed.join(', ') })}</p>}
        <div className={styles.boardWrap}>
          {notice && (
            <p className={styles.notice} role="alert">
              <Info size={15} aria-hidden="true" />
              {t(tk(`logic.connectError.${notice}`))}
              <button type="button" onClick={actions.dismissNotice} aria-label={t('anatomy.close')}>
                <X size={14} aria-hidden="true" />
              </button>
            </p>
          )}
          <Board circuit={circuit} evaluation={evaluation} bits={bits} selection={selection} warned={warned} actions={actions} svgRef={svgRef} />
        </div>
        <p className={styles.hint}>{t('logic.ui.wireHint')}</p>
        <TruthTable circuit={circuit} labels={labels} bits={bits} task={exercise} onPick={actions.setBits} />
        <p className={styles.footnote}>{t('logic.ui.note')}</p>
      </div>
      <aside className={styles.side}>
        {exercise && attempt && <TaskPanel task={exercise} attempt={attempt} report={report} actions={actions} />}
        <Warnings issues={issues} formula={formula} />
      </aside>
    </div>
  );
}

export default function LogicLabPage() {
  const t = useT();
  useDocumentTitle(t('labs.modules.logic.title'));
  const [params, setParams] = useSearchParams();
  const raw = params.get('task');
  const mode: Mode = raw === 'free' ? 'free' : isLogicTaskId(raw) ? raw : (raw && LEGACY[raw]) || 'and';
  const best = useProgressStore((s) => s.best);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('logic.ui.eyebrow')}</span>
        <h1>{t('labs.modules.logic.title')}</h1>
        <p>{t('logic.ui.intro')}</p>
      </header>
      <nav className={styles.modes} aria-label={t('logic.ui.choose')}>
        {LOGIC_TASK_IDS.map((id, i) => {
          const score = best.find((a) => a.exercise === LOGIC_TASKS[id].id)?.score;
          return (
            <button key={id} type="button" className={styles.modeCard} aria-pressed={mode === id} onClick={() => setParams({ task: id }, { replace: true })}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <b>{t(tk(`logic.tasks.${id}.title`))}</b>
              <small>{t(tk(`logic.tasks.${id}.short`))}</small>
              {score !== undefined && (
                <em data-done={score >= 70}>
                  {score >= 70 && <CircleCheck size={12} aria-hidden="true" />} {t('logic.ui.best', { score: Math.round(score / 10) })}
                </em>
              )}
            </button>
          );
        })}
        <button type="button" className={styles.modeCard} aria-pressed={mode === 'free'} onClick={() => setParams({ task: 'free' }, { replace: true })}>
          <span>∞</span>
          <b>{t('logic.ui.free')}</b>
          <small>{t('logic.ui.freeDesc')}</small>
        </button>
      </nav>
      <Lab key={mode} mode={mode} />
    </div>
  );
}
