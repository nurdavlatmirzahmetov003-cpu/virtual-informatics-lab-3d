/**
 * Connection Lab page (V2-6): three graded tasks — connect the PC, connect
 * the laptop by Ethernet (DHCP), join Wi-Fi securely. The 3D stage on the
 * left; the task, cables, messages, DHCP / Wi-Fi panels and grading on the right.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Lock, LockOpen, RotateCcw, ShieldAlert, Wifi, XCircle } from 'lucide-react';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import {
  CONNECT_TASK_IDS, DHCP_STEPS, ETHERNET_SCENARIO, NETWORKS, PC_SCENARIO, SCENARIOS, SCHOOL_KEY, SCHOOL_SSID,
  dhcpLease, endsOf, isSecure, portById, type ConnectTaskId, type PortDef, type WifiNetwork,
} from '@/labs/ConnectLab';
import { useConnectLabStore, type ConnectMessage } from '@/store/connectLabStore';
import { useProgressStore } from '@/store/progressStore';
import styles from './ConnectLab.module.css';

const ConnectStage = lazy(() => import('@/scenes/ConnectLab/ConnectStage'));
const key = (k: string) => k as TranslationKey;
const isTask = (v: string | null): v is ConnectTaskId => !!v && (CONNECT_TASK_IDS as readonly string[]).includes(v);

/** "Graphics card · HDMI", "Router · LAN 2", "Router · WAN — internet". */
function usePortNames() {
  const t = useT();
  return useMemo(() => {
    const name = (p: PortDef) => {
      const port = p.role === 'wan' ? t('connect.roles.wan') : p.role === 'lan' ? t('connect.roles.lan', { n: p.id.split('_').pop() ?? '' }) : t(key(`connect.ports.${p.kind}`));
      return t('connect.portName', { owner: t(key(`connect.owners.${p.owner}`)), port });
    };
    return Object.fromEntries([...PC_SCENARIO.ports, ...ETHERNET_SCENARIO.ports].map((p) => [p.id, name(p)]));
  }, [t]);
}

function endName(t: ReturnType<typeof useT>, end: string) {
  const [cable, side] = end.split('.');
  return side ? `${t(key(`connect.cables.${cable}`))} · ${t(key(`connect.ends.${side}`))}` : t(key(`connect.cables.${cable}`));
}

function Message({ m, names }: { m: ConnectMessage; names: Record<string, string> }) {
  const t = useT();
  if (m.kind === 'ok') {
    return (
      <p className={styles.msg} data-tone="ok" role="status">
        <CheckCircle2 size={18} aria-hidden="true" />
        <span>{t('connect.ui.ok', { cable: endName(t, m.end), port: names[m.port] })}</span>
      </p>
    );
  }
  if (m.kind === 'error') {
    const sid = m.port.startsWith('router') || m.port.startsWith('laptop') ? 'ethernet' : 'pc';
    const end = endsOf(SCENARIOS[sid]).find((e) => e.id === m.end);
    return (
      <p className={styles.msg} data-tone="error" role="alert">
        <XCircle size={18} aria-hidden="true" />
        <span>{t(key(`connect.why.${m.reason}`), { plug: end ? t(key(`connect.ports.${end.kind}`)) : '', port: names[m.port] })}</span>
      </p>
    );
  }
  const tone = m.key === 'joined' ? 'ok' : 'error';
  return (
    <p className={styles.msg} data-tone={tone} role={tone === 'ok' ? 'status' : 'alert'}>
      {tone === 'ok' ? <CheckCircle2 size={18} aria-hidden="true" /> : <ShieldAlert size={18} aria-hidden="true" />}
      <span>{t(key(`connect.wifi.${m.key}`), { ssid: m.ssid })}</span>
    </p>
  );
}

function Cables({ task, names }: { task: 'pc' | 'ethernet'; names: Record<string, string> }) {
  const t = useT();
  const plugged = useConnectLabStore((s) => s.plugs[task].plugged);
  const carrying = useConnectLabStore((s) => s.carrying);
  const { pick, unplugEnd, drop } = useConnectLabStore.getState();
  const ends = endsOf(SCENARIOS[task]);
  return (
    <section className={styles.block}>
      <h3 className={styles.blockTitle}>{t('connect.ui.cables')}</h3>
      <ul className={styles.cables}>
        {ends.map((e) => {
          const port = plugged[e.id];
          return (
            <li key={e.id} data-state={port ? 'in' : carrying === e.id ? 'hand' : 'free'}>
              <span className={styles.kind} data-kind={e.kind} aria-hidden="true" />
              <span className={styles.cableText}>
                <strong>{endName(t, e.id)}</strong>
                <small>{port ? t('connect.ui.pluggedIn', { port: names[port] }) : carrying === e.id ? t('connect.ui.carrying', { cable: endName(t, e.id) }) : t('connect.ui.free')}</small>
              </span>
              {port ? (
                <button type="button" onClick={() => unplugEnd(e.id)}>
                  {t('connect.ui.unplug')}
                </button>
              ) : (
                <button type="button" aria-pressed={carrying === e.id} onClick={() => (carrying === e.id ? drop() : pick(e.id, false))}>
                  {t('connect.ui.pick')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Dhcp({ client }: { client: 'laptop-eth' | 'laptop-wifi' }) {
  const t = useT();
  const lease = dhcpLease(client);
  return (
    <section className={styles.dhcp}>
      <h3 className={styles.blockTitle}>{t('connect.dhcp.title')}</h3>
      <ol className={styles.dora}>
        {DHCP_STEPS.map((s, i) => (
          <li key={s} style={{ animationDelay: `${i * 0.35}s` }}>
            {t(key(`connect.dhcp.${s}`), { ip: lease.ip, hours: lease.hours })}
          </li>
        ))}
      </ol>
      <dl className={styles.lease}>
        {(['ip', 'mask', 'gateway', 'dns'] as const).map((k) => (
          <div key={k}>
            <dt>{t(key(`connect.dhcp.${k}`))}</dt>
            <dd>{lease[k]}</dd>
          </div>
        ))}
      </dl>
      <Link to="/labs/network" className={styles.link}>
        {t('connect.ui.toNetworkLab')} <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}

function Bars({ n }: { n: number }) {
  return (
    <span className={styles.bars} aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <span key={i} data-on={i <= n} style={{ height: `${4 + i * 3}px` }} />
      ))}
    </span>
  );
}

function WifiPanel() {
  const t = useT();
  const joined = useConnectLabStore((s) => s.wifi.joined);
  const { joinWifi, leaveWifi } = useConnectLabStore.getState();
  const [open, setOpen] = useState<string | null>(null);
  const [pass, setPass] = useState('');
  const [warn, setWarn] = useState(false);
  const choose = (n: WifiNetwork) => {
    setOpen(open === n.ssid ? null : n.ssid);
    setPass('');
    setWarn(false);
  };
  return (
    <>
      <section className={styles.sticker} aria-label={t('connect.wifi.sticker')}>
        <span>{t('connect.wifi.sticker')}</span>
        <strong>{t('connect.wifi.stickerText', { ssid: SCHOOL_SSID, key: SCHOOL_KEY })}</strong>
      </section>
      <section className={styles.block}>
        <h3 className={styles.blockTitle}>
          <Wifi size={14} aria-hidden="true" /> {t('connect.wifi.title')}
        </h3>
        <ul className={styles.networks}>
          {NETWORKS.map((n) => {
            const on = joined === n.ssid;
            return (
              <li key={n.ssid} data-open={open === n.ssid} data-on={on}>
                <button type="button" className={styles.net} onClick={() => choose(n)} aria-expanded={open === n.ssid}>
                  <Bars n={n.signal} />
                  <span className={styles.ssid}>
                    <strong>{n.ssid}</strong>
                    <small data-secure={isSecure(n.security)}>{t(key(`connect.wifi.security.${n.security}`))}</small>
                  </span>
                  {n.security === 'open' ? <LockOpen size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                  {on && <span className={styles.badgeOn}>{t('connect.wifi.connected')}</span>}
                </button>
                {open === n.ssid && (
                  <div className={styles.join}>
                    {on ? (
                      <button type="button" className={styles.secondary} onClick={leaveWifi}>
                        {t('connect.wifi.disconnect')}
                      </button>
                    ) : n.security === 'open' ? (
                      warn ? (
                        <div className={styles.warn} role="alertdialog" aria-label={n.ssid}>
                          <p>
                            <ShieldAlert size={16} aria-hidden="true" /> {t('connect.wifi.openWarn')}
                          </p>
                          <div>
                            <button type="button" className={styles.secondary} onClick={() => setWarn(false)}>
                              {t('connect.wifi.cancel')}
                            </button>
                            <button type="button" className={styles.danger} onClick={() => joinWifi(n.ssid, '')}>
                              {t('connect.wifi.openProceed')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" className={styles.primary} onClick={() => setWarn(true)}>
                          {t('connect.wifi.connect')}
                        </button>
                      )
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          joinWifi(n.ssid, pass);
                        }}
                      >
                        <label>
                          <span>{t('connect.wifi.key')}</span>
                          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" spellCheck={false} />
                        </label>
                        <button type="submit" className={styles.primary}>
                          {t('connect.wifi.connect')}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className={styles.note}>{t('connect.wifi.why')}</p>
      </section>
    </>
  );
}

export default function ConnectLabPage() {
  const t = useT();
  useDocumentTitle(t('connect.title'));
  const [params, setParams] = useSearchParams();
  const task = useConnectLabStore((s) => s.task);
  const message = useConnectLabStore((s) => s.message);
  const session = useConnectLabStore((s) => s.sessions[s.task]);
  const plugs = useConnectLabStore((s) => s.plugs);
  const wifi = useConnectLabStore((s) => s.wifi);
  const { setTask, check, reset, hint } = useConnectLabStore.getState();
  const exercises = useProgressStore((s) => s.exercises);
  const names = usePortNames();

  const requested = params.get('task');
  useEffect(() => {
    setTask(isTask(requested) ? requested : 'pc');
  }, [requested, setTask]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useConnectLabStore.getState().carrying) useConnectLabStore.getState().drop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scenario = task === 'wifi' ? null : SCENARIOS[task];
  const plugged = scenario ? plugs[task as 'pc' | 'ethernet'].plugged : {};
  const total = scenario ? endsOf(scenario).length : 1;
  const done = scenario ? Object.keys(plugged).length : wifi.joined ? 1 : 0;
  const mistakes = scenario ? plugs[task as 'pc' | 'ethernet'].mistakes.length : wifi.wrongKeys;
  const wired = task === 'ethernet' && Object.values(plugged).some((p) => portById(ETHERNET_SCENARIO, p)?.owner === 'laptop') && Object.values(plugged).some((p) => portById(ETHERNET_SCENARIO, p)?.role === 'lan');
  const title = t(key(`connect.tasks.${task}.title`));

  return (
    <div className={styles.page}>
      <div className={styles.stage}>
        <Suspense fallback={null}>
          <ConnectStage task={task} names={names} label={t('connect.sceneLabel', { task: title })} />
        </Suspense>
        {scenario && <p className={styles.howTo}>{t('connect.ui.howTo')}</p>}
      </div>

      <aside className={styles.side}>
        <header className={styles.head}>
          <Link to="/labs" className={styles.back}>
            <ArrowLeft size={15} aria-hidden="true" /> {t('connect.ui.back')}
          </Link>
          <span className={styles.eyebrow}>{t('connect.eyebrow')}</span>
          <h1>{t('connect.title')}</h1>
          <p className={styles.lead}>{t('connect.lead')}</p>
        </header>

        <div className={styles.tabs} role="tablist" aria-label={t('connect.ui.tasks')}>
          {CONNECT_TASK_IDS.map((id, i) => (
            <button key={id} type="button" role="tab" aria-selected={task === id} onClick={() => setParams({ task: id })}>
              <span className={styles.tabNum}>{exercises[`connect:${id}`]?.best?.status === 'completed' ? '✓' : i + 1}</span>
              <span>{t(key(`connect.tasks.${id}.title`))}</span>
            </button>
          ))}
        </div>

        <section className={styles.taskCard}>
          <h2>{title}</h2>
          <p>{t(key(`connect.tasks.${task}.instructions`))}</p>
          <div className={styles.meter}>
            <span>{scenario ? t('connect.ui.progress', { done, total }) : wifi.joined ? t('connect.wifi.joined', { ssid: wifi.joined }) : t('connect.feedback.notJoined')}</span>
            {mistakes > 0 && <span className={styles.mist}>{t('connect.ui.mistakes', { n: mistakes })}</span>}
          </div>
          <span className={styles.bar} aria-hidden="true">
            <span style={{ width: `${(done / total) * 100}%` }} />
          </span>
        </section>

        {message && <Message m={message} names={names} />}
        {session.hinted && (
          <p className={styles.hintText}>
            <Lightbulb size={16} aria-hidden="true" /> {t(key(`connect.tasks.${task}.hint`))}
          </p>
        )}

        {task !== 'wifi' && <Cables task={task} names={names} />}
        {task === 'ethernet' && (wired ? <Dhcp client="laptop-eth" /> : <p className={styles.note}>{t('connect.dhcp.waiting')}</p>)}
        {task === 'wifi' && <WifiPanel />}
        {task === 'wifi' && wifi.joined && isSecure(NETWORKS.find((n) => n.ssid === wifi.joined)!.security) && <Dhcp client="laptop-wifi" />}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={hint} disabled={session.hinted}>
            <Lightbulb size={15} aria-hidden="true" /> {t('connect.ui.hint')}
          </button>
          <button type="button" className={styles.secondary} onClick={reset}>
            <RotateCcw size={15} aria-hidden="true" /> {t('connect.ui.reset')}
          </button>
          <button type="button" className={styles.primary} onClick={check}>
            {t('connect.ui.check')}
          </button>
        </div>
        {session.report && <GradeReportCard report={session.report} />}
      </aside>
    </div>
  );
}
