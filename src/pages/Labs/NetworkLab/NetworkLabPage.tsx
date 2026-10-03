import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircleCheck, Info, Settings2, ClipboardList, X } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { NETWORK_TASKS, NETWORK_TASK_IDS, deviceById, isHost, isNetworkTaskId, type Network, type NetworkTaskId } from '@/labs/NetworkLab';
import { bestResults, useProgressStore } from '@/store/progressStore';
import { ConfigPanel } from './ConfigPanel';
import { Palette } from './Palette';
import { PingBar } from './PingBar';
import { TaskPanel } from './TaskPanel';
import { useNetworkLab, type NetworkLabActions, type Selection } from './useNetworkLab';
import { Workspace } from './Workspace';
import styles from './NetworkLab.module.css';

const tk = (key: string) => key as TranslationKey;
type Mode = NetworkTaskId | 'free';
/** Links saved before the rework used these task ids. */
const LEGACY: Record<string, NetworkTaskId> = { lan: 'connect3', router: 'routerLan', address: 'addressing' };

function readMode(value: string | null): Mode {
  if (value === 'free') return 'free';
  if (isNetworkTaskId(value)) return value;
  return (value && LEGACY[value]) || 'connect3';
}

function pingPair(net: Network, from: string, to: string, preset?: [string, string]): [string, string] {
  const hosts = net.devices.filter(isHost);
  const src = hosts.some((d) => d.id === from) ? from : (hosts.find((d) => d.id === preset?.[0]) ?? hosts[0])?.id ?? '';
  const others = net.devices.filter((d) => d.id !== src);
  const dst = others.some((d) => d.id === to) ? to : (others.find((d) => d.id === preset?.[1]) ?? others.at(-1))?.id ?? '';
  return [src, dst];
}

function Lab({ mode }: { mode: Mode }) {
  const t = useT();
  const task = mode === 'free' ? null : mode;
  const lab = useNetworkLab(task);
  const { network, selection, notice, ping, attempt, report, exercise, actions } = lab;
  const svgRef = useRef<SVGSVGElement>(null);
  const [side, setSide] = useState<'task' | 'config'>(task ? 'task' : 'config');
  const [choice, setChoice] = useState<[string, string]>(['', '']);
  const [finished, setFinished] = useState<number | null>(null);
  const [from, to] = pingPair(network, choice[0], choice[1], exercise?.ping);

  // selecting something on the board opens its settings
  const wired: NetworkLabActions = useMemo(
    () => ({
      ...actions,
      select: (s: Selection) => {
        actions.select(s);
        if (s) setSide('config');
      },
      add: (...args: Parameters<NetworkLabActions['add']>) => {
        actions.add(...args);
        setSide('config');
      },
    }),
    [actions],
  );

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(actions.dismissNotice, 4000);
    return () => window.clearTimeout(id);
  }, [notice, actions]);

  const selectedName = selection?.kind === 'device' ? deviceById(network, selection.id)?.name : undefined;

  return (
    <div className={styles.lab}>
      <Palette network={network} actions={wired} svgRef={svgRef} />

      <div className={styles.stage}>
        {notice && (
          <p className={styles.notice} role="alert">
            <Info size={15} aria-hidden="true" />
            {t(tk(`network.connectError.${notice}`))}
            <button type="button" onClick={actions.dismissNotice} aria-label={t('anatomy.close')}>
              <X size={14} aria-hidden="true" />
            </button>
          </p>
        )}
        <Workspace network={network} selection={selection} run={ping} actions={wired} svgRef={svgRef} onPacketDone={setFinished} />
        <PingBar
          network={network}
          from={from}
          to={to}
          onFrom={(id) => setChoice([id, to === id ? '' : to])}
          onTo={(id) => setChoice([from, id])}
          onPing={() => actions.ping(from, to)}
          run={ping}
          finished={Boolean(ping && finished === ping.id)}
        />
        <p className={styles.footnote}>{t('network.note')}</p>
      </div>

      <aside className={styles.side}>
        {exercise && attempt ? (
          <>
            <div className={styles.sideTabs} role="tablist">
              <button type="button" role="tab" aria-selected={side === 'task'} onClick={() => setSide('task')}>
                <ClipboardList size={15} aria-hidden="true" /> {t('network.task.label')}
              </button>
              <button type="button" role="tab" aria-selected={side === 'config'} onClick={() => setSide('config')}>
                <Settings2 size={15} aria-hidden="true" /> {t('network.config.title')}
                {selectedName && <small>{selectedName}</small>}
              </button>
            </div>
            <div role="tabpanel" className={styles.sideBody}>
              {side === 'task' ? <TaskPanel task={exercise} attempt={attempt} report={report} actions={actions} /> : <ConfigPanel network={network} selection={selection} actions={wired} />}
            </div>
          </>
        ) : (
          <div className={styles.sideBody}>
            <p className={styles.note}>{t('network.mode.freeDesc')}</p>
            <ConfigPanel network={network} selection={selection} actions={wired} />
          </div>
        )}
      </aside>
    </div>
  );
}

export default function NetworkLabPage() {
  const t = useT();
  useDocumentTitle(t('network.title'));
  const [params, setParams] = useSearchParams();
  const mode = readMode(params.get('task'));
  const attempts = useProgressStore((s) => s.attempts);
  const best = useMemo(() => bestResults(attempts), [attempts]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('network.eyebrow')}</span>
        <h1>{t('network.title')}</h1>
        <p>{t('network.intro')}</p>
      </header>

      <nav className={styles.modes} aria-label={t('network.task.choose')}>
        {NETWORK_TASK_IDS.map((id, i) => {
          const score = best.find((a) => a.exercise === NETWORK_TASKS[id].id)?.score;
          return (
            <button key={id} type="button" className={styles.modeCard} aria-pressed={mode === id} onClick={() => setParams({ task: id })}>
              <span className={styles.modeIndex}>{String(i + 1).padStart(2, '0')}</span>
              <b>{t(tk(`network.tasks.${id}.title`))}</b>
              <small>{t(tk(`network.tasks.${id}.short`))}</small>
              {score !== undefined && (
                <span className={styles.modeScore} data-done={score >= 70}>
                  {score >= 70 && <CircleCheck size={12} aria-hidden="true" />}
                  {t('network.task.best', { score: Math.round(score / 10) })}
                </span>
              )}
            </button>
          );
        })}
        <button type="button" className={styles.modeCard} data-free aria-pressed={mode === 'free'} onClick={() => setParams({ task: 'free' })}>
          <span className={styles.modeIndex}>∞</span>
          <b>{t('network.mode.free')}</b>
          <small>{t('network.mode.freeDesc')}</small>
        </button>
      </nav>

      <Lab key={mode} mode={mode} />
    </div>
  );
}
