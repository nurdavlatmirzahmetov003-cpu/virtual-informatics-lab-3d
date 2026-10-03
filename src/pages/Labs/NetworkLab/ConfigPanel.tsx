import { useState } from 'react';
import { Cable, Trash2, Unplug } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import {
  COMMON_MASKS, addressProblem, cidr, deviceById, hostIssues, isBridge, isHost, isRouter, linksAt, linksOf, otherEnd, parseIp, parseMask,
  portSpec, portsOf, roleOf, routerIssues, type Device, type HostConfig, type Issue, type Network,
} from '@/labs/NetworkLab';
import { DEVICE_ICONS, DEVICE_TONE } from './deviceIcons';
import type { NetworkLabActions, Selection } from './useNetworkLab';
import styles from './NetworkLab.module.css';

const tk = (key: string) => key as TranslationKey;
const issueText = (t: ReturnType<typeof useT>, i: Issue) => t(tk(`network.feedback.issue.${i.code}`), i.params);

function subnetOf(ip: string, mask: string) {
  return addressProblem(ip, mask) ? null : cidr(parseIp(ip)!, parseMask(mask)!);
}

function Field({ id, label, value, onChange, error, placeholder, list, hint }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  list?: string;
  hint?: string;
}) {
  return (
    <div className={styles.field} data-invalid={Boolean(error)}>
      <label htmlFor={id}>
        {label}
        {hint && <small>{hint}</small>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={list}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        maxLength={15}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

function Connections({ network, device, actions }: { network: Network; device: Device; actions: NetworkLabActions }) {
  const t = useT();
  const [target, setTarget] = useState('');
  const links = linksOf(network, device.id);
  const others = network.devices.filter((d) => d.id !== device.id);
  const chosen = others.some((d) => d.id === target) ? target : (others[0]?.id ?? '');
  return (
    <section className={styles.configBlock}>
      <h3>{t('network.config.links')}</h3>
      {links.length === 0 ? (
        <p className={styles.muted}>{t('network.config.noLinks')}</p>
      ) : (
        <ul className={styles.linkList}>
          {links.map((l) => {
            const mine = l.a.device === device.id ? l.a : l.b;
            const other = otherEnd(l, device.id);
            const od = deviceById(network, other.device);
            return (
              <li key={l.id}>
                <span>{portSpec(device.type, mine.port)?.label}</span>
                <b>
                  {od?.name} · {od && portSpec(od.type, other.port)?.label}
                </b>
                <button type="button" onClick={() => actions.unplug(l.id)} aria-label={`${t('network.config.unplug')}: ${od?.name ?? ''}`}>
                  <Unplug size={14} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {others.length > 0 && (
        <div className={styles.connectRow}>
          <label htmlFor={`net-${device.id}-connect`} className={styles.visuallyHidden}>
            {t('network.config.connectTo')}
          </label>
          <select id={`net-${device.id}-connect`} value={chosen} onChange={(e) => setTarget(e.target.value)}>
            {others.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => chosen && actions.connectDevices(device.id, chosen)}>
            <Cable size={14} aria-hidden="true" /> {t('network.config.connect')}
          </button>
        </div>
      )}
    </section>
  );
}

function HostFields({ network, device, actions }: { network: Network; device: Device; actions: NetworkLabActions }) {
  const t = useT();
  const c = device.config!;
  const issues = hostIssues(network, device);
  const error = (field: keyof HostConfig) => {
    const i = issues.find((x) => x.field === field && x.code !== 'noIp');
    return i ? issueText(t, i) : undefined;
  };
  const set = (field: keyof HostConfig) => (v: string) => actions.setHost(device.id, { [field]: v });
  const net = subnetOf(c.ip, c.mask);
  const id = (f: string) => `net-${device.id}-${f}`;
  return (
    <section className={styles.configBlock}>
      <Field id={id('ip')} label={t('network.config.ip')} value={c.ip} onChange={set('ip')} error={error('ip')} placeholder="192.168.1.10" />
      <Field id={id('mask')} label={t('network.config.mask')} value={c.mask} onChange={set('mask')} error={error('mask')} placeholder="255.255.255.0" list="net-masks" />
      <Field id={id('gateway')} label={t('network.config.gateway')} value={c.gateway} onChange={set('gateway')} error={error('gateway')} placeholder="192.168.1.1" hint={t('network.config.optional')} />
      <Field id={id('dns')} label={t('network.config.dns')} value={c.dns} onChange={set('dns')} error={error('dns')} placeholder="8.8.8.8" hint={t('network.config.optional')} />
      {net && <p className={styles.subnet}>{t('network.config.subnet', { net })}</p>}
    </section>
  );
}

function RouterFields({ network, device, actions }: { network: Network; device: Device; actions: NetworkLabActions }) {
  const t = useT();
  const issues = routerIssues(network, device);
  return (
    <section className={styles.configBlock}>
      <h3>{t('network.config.interfaces')}</h3>
      {issues
        .filter((i) => i.code === 'interfacesOverlap')
        .map((i) => (
          <p key={i.code + i.params.a + i.params.b} className={styles.fieldError}>
            {issueText(t, i)}
          </p>
        ))}
      <ol className={styles.ifaceList}>
        {portsOf(device.type).map((p) => {
          const i = device.interfaces![p.id];
          const link = linksAt(network, { device: device.id, port: p.id })[0];
          const peer = link && deviceById(network, otherEnd(link, device.id).device);
          const issue = issues.find((x) => x.code === 'interfaceInvalid' && x.field === p.id);
          const net = subnetOf(i.ip, i.mask);
          const id = (f: string) => `net-${device.id}-${p.id}-${f}`;
          return (
            <li key={p.id} data-used={Boolean(link)}>
              <header>
                <b>{p.label}</b>
                <span>{peer ? `→ ${peer.name}` : t('network.workspace.portFree')}</span>
              </header>
              <div className={styles.ifaceFields}>
                <Field id={id('ip')} label={t('network.config.ip')} value={i.ip} onChange={(v) => actions.setInterface(device.id, p.id, { ip: v })} placeholder={link ? '192.168.1.1' : t('network.config.unused')} />
                <Field id={id('mask')} label={t('network.config.mask')} value={i.mask} onChange={(v) => actions.setInterface(device.id, p.id, { mask: v })} list="net-masks" />
              </div>
              {issue && i.ip.trim() && <p className={styles.fieldError}>{t(tk(`network.ping.${issue.params.problem}`), { name: device.name, ip: i.ip, mask: i.mask })}</p>}
              {net && <p className={styles.subnet}>{t('network.config.subnet', { net })}</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ConfigPanel({ network, selection, actions }: { network: Network; selection: Selection; actions: NetworkLabActions }) {
  const t = useT();
  const device = selection?.kind === 'device' ? deviceById(network, selection.id) : undefined;
  const link = selection?.kind === 'link' ? network.links.find((l) => l.id === selection.id) : undefined;

  if (link) {
    const a = deviceById(network, link.a.device);
    const b = deviceById(network, link.b.device);
    return (
      <div className={styles.config}>
        <h2 className={styles.configTitle}>
          <Cable size={18} aria-hidden="true" /> {a?.name} ↔ {b?.name}
        </h2>
        <p className={styles.muted}>
          {a && portSpec(a.type, link.a.port)?.label} → {b && portSpec(b.type, link.b.port)?.label} · {link.medium === 'wifi' ? 'Wi-Fi' : 'Ethernet'}
        </p>
        <button type="button" className={styles.dangerButton} onClick={() => actions.unplug(link.id)}>
          <Unplug size={15} aria-hidden="true" /> {t('network.workspace.removeCable')}
        </button>
      </div>
    );
  }

  if (!device) return <p className={styles.configEmpty}>{t('network.config.empty')}</p>;

  const Icon = DEVICE_ICONS[device.type];
  const valid = isHost(device) ? hostIssues(network, device).length === 0 : isRouter(device) ? routerIssues(network, device).length === 0 : true;
  return (
    <div className={styles.config} key={device.id}>
      <header className={styles.configHead} style={{ ['--tone' as string]: DEVICE_TONE[device.type] }}>
        <span className={styles.paletteIcon}>
          <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <label htmlFor={`net-${device.id}-name`} className={styles.visuallyHidden}>
            {t('network.config.name')}
          </label>
          <input
            id={`net-${device.id}-name`}
            className={styles.nameInput}
            defaultValue={device.name}
            maxLength={16}
            onBlur={(e) => {
              actions.rename(device.id, e.target.value);
              e.target.value = deviceById(network, device.id)?.name ?? e.target.value;
            }}
          />
          <small>
            {t(tk(`network.devices.${device.type}`))} · {t(tk(`network.role.${roleOf(device.type)}`))}
          </small>
        </div>
        {!isBridge(device) && <span className={styles.validity} data-valid={valid} title={valid ? t('network.config.valid') : undefined} />}
      </header>

      {isHost(device) && <HostFields network={network} device={device} actions={actions} />}
      {isRouter(device) && <RouterFields network={network} device={device} actions={actions} />}
      {isBridge(device) && <p className={styles.note}>{t('network.config.noIp', { type: t(tk(`network.devices.${device.type}`)) })}</p>}
      <Connections network={network} device={device} actions={actions} />

      <button type="button" className={styles.dangerButton} onClick={() => actions.remove(device.id)}>
        <Trash2 size={15} aria-hidden="true" /> {t('network.config.remove')}
      </button>
      <datalist id="net-masks">
        {COMMON_MASKS.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
}
