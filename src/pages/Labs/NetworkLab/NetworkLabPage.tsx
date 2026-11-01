import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, CircleCheck, Info, Settings2, ClipboardList, X } from 'lucide-react';
import { LabLayout } from '@/components/lab/LabLayout';
import { TaskGuide, type DemoStep } from '@/components/lab/TaskGuide';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { NETWORK_TASKS, NETWORK_TASK_IDS, deviceById, isHost, isNetworkTaskId, type Network, type NetworkTaskId } from '@/labs/NetworkLab';
import { useProgressStore } from '@/store/progressStore';
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

  // V4 §5.3: Bit shows the first task step by step through the lab's own actions
  const live = useRef(network);
  useEffect(() => {
    live.current = network;
  }, [network]);
  const demo = useCallback((): DemoStep[] => {
    const el = (sel: string) => () => document.querySelector(sel);
    const id = (name: string) => live.current.devices.find((d) => d.name === name)?.id ?? '';
    const sw = () => live.current.devices.find((d) => d.type === 'switch')?.id ?? '';
    return [
      { say: t('labGuide.network.s1'), target: el('[data-guide="workspace"]') },
      { say: t('labGuide.network.s2'), target: el('[data-guide-item="switch"]'), run: () => actions.add('switch', 560, 320) },
      { say: t('labGuide.network.s3'), target: el('[data-guide="workspace"]'), run: () => actions.connectDevices(id('PC1'), sw()) },
      {
        say: t('labGuide.network.s4'),
        run: () => {
          actions.connectDevices(id('PC2'), sw());
          window.setTimeout(() => actions.connectDevices(id('PC3'), sw()), 500);
        },
      },
      { say: t('labGuide.network.s5'), target: el('[data-guide="ping"]'), run: () => actions.ping(id('PC1'), id('PC3')), hold: 3600 },
      { say: t('labGuide.network.s6'), target: el('[data-guide="check"]') },
    ];
  }, [actions, t]);

  const sideContent = exercise && attempt ? (
    <div className={styles.side}>
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
    </div>
  ) : (
    <div className={styles.side}>
      <p className={styles.note}>{t('network.mode.freeDesc')}</p>
      <ConfigPanel network={network} selection={selection} actions={wired} />
    </div>
  );

  return (
    <LabLayout
      id="network"
      palette={{ title: t('network.palette.title'), icon: <Boxes size={16} aria-hidden="true" />, content: <Palette network={network} actions={wired} svgRef={svgRef} /> }}
      panel={{ title: task ? t(tk(`network.tasks.${task}.title`)) : t('network.config.title'), icon: exercise ? <ClipboardList size={16} aria-hidden="true" /> : <Settings2 size={16} aria-hidden="true" />, badge: selectedName, content: sideContent }}
    >
      <div className={styles.stage}>
        {task && <TaskGuide id={`network:${task}`} title={t(tk(`network.tasks.${task}.title`))} text={t(tk(`network.tasks.${task}.instructions`))} demo={task === NETWORK_TASK_IDS[0] ? demo : undefined} onDemoEnd={actions.restart} />}
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
    </LabLayout>
  );
}

export default function NetworkLabPage() {
  const t = useT();
  useDocumentTitle(t('network.title'));
  const [params, setParams] = useSearchParams();
  const mode = readMode(params.get('task'));
  const exercises = useProgressStore((s) => s.exercises);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('network.eyebrow')}</span>
        <h1>{t('network.title')}</h1>
        <p>{t('network.intro')}</p>
      </header>

      <nav className={styles.modes} aria-label={t('network.task.choose')}>
        {NETWORK_TASK_IDS.map((id, i) => {
          const p = exercises[NETWORK_TASKS[id].id];
          const score = p?.best.score;
          const done = p?.completedAt !== undefined;
          return (
            <button key={id} type="button" className={styles.modeCard} aria-pressed={mode === id} onClick={() => setParams({ task: id })}>
              <span className={styles.modeIndex}>{String(i + 1).padStart(2, '0')}</span>
              <b>{t(tk(`network.tasks.${id}.title`))}</b>
              <small>{t(tk(`network.tasks.${id}.short`))}</small>
              {score !== undefined && (
                <span className={styles.modeScore} data-done={done}>
                  {done && <CircleCheck size={12} aria-hidden="true" />}
                  {t('network.task.best', { score: score })}
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
