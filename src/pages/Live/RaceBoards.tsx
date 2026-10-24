/**
 * The racer's boards (V2-11b): tap-to-place versions of the assembly,
 * connection and diagnosis labs. They only send moves — the server checks
 * each one with the labs' own rules and answers with feedback.
 */
import { useMemo, useState } from 'react';
import { Cable, Check, Cpu, Plug, Stethoscope, Unplug, Volume2, Zap } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { STEP_BY_TARGET, STEP_IDS, TARGET_IDS, type StepId, type TargetId } from '@/labs/AssemblyLab';
import { PC_SCENARIO, type PortOwner } from '@/labs/ConnectLab';
import { FAULT_IDS } from '@/labs/SystemSim/faults';
import type { Symptoms } from '@/labs/LiveGames/races';
import { PC_ENDS, k, portLabel, portName } from './text';
import styles from './Live.module.css';

const collator = new Intl.Collator(['kk', 'ru', 'en']);
type Send = (m: Record<string, unknown>) => void;

/** Sorted by name, so the list never hints at the right order. */
const byLabel = <V,>(list: readonly V[], label: (v: V) => string) => [...list].sort((a, b) => collator.compare(label(a), label(b)));

const PORT_OWNERS: PortOwner[] = ['motherboard', 'gpu', 'psu'];

export function AssemblyBoard({ installed, send }: { installed: readonly string[]; send: Send }) {
  const t = useT();
  const [picked, setPicked] = useState<StepId | null>(null);
  const parts = useMemo(() => byLabel(STEP_IDS, (s) => t(k(`pcLab.steps.${s}.part`))), [t]);
  const slots = useMemo(() => byLabel(TARGET_IDS, (s) => t(k(`pcLab.steps.${STEP_BY_TARGET[s]}.slot`))), [t]);
  const put = (at: TargetId) => {
    if (!picked) return;
    send({ t: 'place', step: picked, at });
    setPicked(null);
  };
  return (
    <div className={styles.board}>
      <p className={styles.boardHint}>{picked ? t('live.assembly.selected', { part: t(k(`pcLab.steps.${picked}.part`)) }) : t('live.assembly.pick')}</p>
      <div className={styles.boardCols}>
        <section aria-label={t('live.assembly.parts')}>
          <h3>
            <Cpu size={15} aria-hidden="true" /> {t('live.assembly.parts')}
          </h3>
          <div className={styles.tiles}>
            {parts.map((s) => {
              const done = installed.includes(s);
              return (
                <button key={s} type="button" className={styles.tile} data-state={done ? 'done' : picked === s ? 'picked' : 'idle'} disabled={done} aria-pressed={picked === s} onClick={() => setPicked(picked === s ? null : s)}>
                  {done && <Check size={14} aria-hidden="true" />}
                  {t(k(`pcLab.steps.${s}.part`))}
                </button>
              );
            })}
          </div>
        </section>
        <section aria-label={t('live.assembly.slots')}>
          <h3>{t('live.assembly.slots')}</h3>
          <div className={styles.tiles}>
            {slots.map((target) => {
              const done = installed.includes(STEP_BY_TARGET[target]);
              return (
                <button key={target} type="button" className={styles.slot} data-state={done ? 'done' : 'idle'} disabled={done || !picked} onClick={() => put(target)}>
                  {done && <Check size={14} aria-hidden="true" />}
                  {t(k(`pcLab.steps.${STEP_BY_TARGET[target]}.slot`))}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export function ConnectBoard({ plugged, send }: { plugged: Readonly<Record<string, string>>; send: Send }) {
  const t = useT();
  const [picked, setPicked] = useState<string | null>(null);
  const endOfPort = Object.fromEntries(Object.entries(plugged).map(([end, port]) => [port, end]));
  const cableName = (end: string) => t(k(`connect.cables.${PC_ENDS.find((e) => e.id === end)?.cable ?? end}`));
  const plug = (port: string) => {
    if (!picked) return;
    send({ t: 'plug', end: picked, port });
    setPicked(null);
  };
  return (
    <div className={styles.board}>
      <p className={styles.boardHint}>{picked ? t('live.connect.selected', { cable: cableName(picked) }) : t('live.connect.pick')}</p>
      <div className={styles.boardCols}>
        <section aria-label={t('live.connect.ends')}>
          <h3>
            <Cable size={15} aria-hidden="true" /> {t('live.connect.ends')}
          </h3>
          <ul className={styles.ends}>
            {PC_ENDS.map((e) => {
              const at = plugged[e.id];
              const port = at ? PC_SCENARIO.ports.find((p) => p.id === at) : undefined;
              return (
                <li key={e.id}>
                  <button type="button" className={styles.tile} data-state={at ? 'done' : picked === e.id ? 'picked' : 'idle'} disabled={!!at} aria-pressed={picked === e.id} onClick={() => setPicked(picked === e.id ? null : e.id)}>
                    {at ? <Check size={14} aria-hidden="true" /> : <Plug size={14} aria-hidden="true" />}
                    <span>
                      {cableName(e.id)}
                      {port && <small>→ {portName(t, port)}</small>}
                    </span>
                  </button>
                  {at && (
                    <button type="button" className={styles.iconBtn} onClick={() => send({ t: 'unplug', end: e.id })} aria-label={`${t('live.connect.unplug')}: ${cableName(e.id)}`} title={t('live.connect.unplug')}>
                      <Unplug size={15} aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        <section aria-label={t('live.connect.ports')}>
          <h3>{t('live.connect.ports')}</h3>
          {PORT_OWNERS.map((owner) => (
            <div key={owner} className={styles.portGroup}>
              <h4>{t(k(`connect.owners.${owner}`))}</h4>
              <div className={styles.ports}>
                {PC_SCENARIO.ports
                  .filter((p) => p.owner === owner)
                  .map((p) => {
                    const by = endOfPort[p.id];
                    return (
                      <button key={p.id} type="button" className={styles.port} data-kind={p.kind} data-state={by ? 'done' : 'idle'} disabled={!picked} onClick={() => plug(p.id)} title={by ? cableName(by) : undefined}>
                        {portLabel(t, p)}
                        {by && <small>{cableName(by)}</small>}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export function SymptomList({ s }: { s: Symptoms }) {
  const t = useT();
  const load = s.shutdown === 'overheat' ? t('live.symptoms.overheat', { c: s.peakC ?? '' }) : s.shutdown === 'psu' ? t('live.symptoms.psu') : s.throttled ? t('live.symptoms.throttled') : t('live.symptoms.normal');
  return (
    <dl className={styles.symptoms}>
      <div>
        <dt>
          <Zap size={14} aria-hidden="true" /> {t('live.fault.post')}
        </dt>
        <dd>
          {t(k(`sim.outcome.${s.outcome}.title`))}
          {s.cpuFanWarning && <em>{t('live.symptoms.cpuFan')}</em>}
        </dd>
      </div>
      <div>
        <dt>
          <Volume2 size={14} aria-hidden="true" /> {t('live.fault.beep')}
        </dt>
        <dd>{t(k(`sim.beeps.${s.beep}`))}</dd>
      </div>
      {s.outcome === 'desktop' && (
        <div>
          <dt>
            <Cpu size={14} aria-hidden="true" /> {t('live.fault.load')}
          </dt>
          <dd>{load}</dd>
        </div>
      )}
    </dl>
  );
}

export function FaultBoard({ round, rounds, symptoms, send }: { round: number; rounds: number; symptoms: Symptoms | null; send: Send }) {
  const t = useT();
  const causes = useMemo(() => byLabel(FAULT_IDS, (f) => t(k(`sim.causes.${f}`))), [t]);
  return (
    <div className={styles.board}>
      <p className={styles.round}>
        <Stethoscope size={16} aria-hidden="true" /> {t('live.fault.round', { n: Math.min(round + 1, rounds), of: rounds })}
      </p>
      <div className={styles.dots} aria-hidden="true">
        {Array.from({ length: rounds }, (_, i) => (
          <i key={i} data-state={i < round ? 'done' : i === round ? 'now' : 'todo'} />
        ))}
      </div>
      {symptoms && (
        <section aria-label={t('live.fault.look')}>
          <h3>{t('live.fault.look')}</h3>
          <SymptomList s={symptoms} />
        </section>
      )}
      <section aria-label={t('live.fault.ask')}>
        <h3>{t('live.fault.ask')}</h3>
        <div className={styles.causes}>
          {causes.map((f) => (
            <button key={f} type="button" className={styles.tile} data-state="idle" onClick={() => send({ t: 'diagnose', cause: f })}>
              {t(k(`sim.causes.${f}`))}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
