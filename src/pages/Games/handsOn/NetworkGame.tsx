/**
 * «Build the network» (0.37): three computers, a switch, a router and a
 * server on the bench, no cables. Tap a socket, then another: a cable runs
 * between them. Tap a socket that has a cable to pull it out. The router's
 * two used ports show their addresses — the one in the computers' network
 * (192.168.1.1) belongs to the switch, the other to the server. Each
 * computer's lamp turns green once its PING reaches the server.
 */
import { useMemo, useState } from 'react';
import { Html, RoundedBox } from '@react-three/drei';
import { Cable as CableIcon, Unplug } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { portsOf } from '@/labs/NetworkLab/devices';
import { ping } from '@/labs/NetworkLab/ping';
import { linksAt } from '@/labs/NetworkLab/topology';
import type { Network } from '@/labs/NetworkLab/types';
import { NET_PCS, NET_ROUTER, NET_SERVER, NET_SWITCH, parseEnd, routerPorts, startNetwork } from '@/labs/LiveGames/networkGame';
import { Cable } from '@/scenes/LabSpace/zones/common';
import { GameStage } from './GameStage';
import type { HandsOnView } from './types';
import styles from './HandsOn.module.css';

type V3 = [number, number, number];

/** Where each device stands on the bench (its base centre) and its sockets in its own frame (front +Z). */
const DEVICES: Record<string, { at: V3; ports: Record<string, V3> }> = {
  PC1: { at: [-0.86, 0, 0.02], ports: { eth0: [0, 0.05, 0.101] } },
  PC2: { at: [-0.62, 0, 0.02], ports: { eth0: [0, 0.05, 0.101] } },
  PC3: { at: [-0.38, 0, 0.02], ports: { eth0: [0, 0.05, 0.101] } },
  [NET_SWITCH]: { at: [-0.02, 0, 0.12], ports: Object.fromEntries(portsOf('switch').map((p, i) => [p.id, [-0.119 + i * 0.034, 0.024, 0.081] as V3])) },
  [NET_ROUTER]: { at: [0.38, 0, 0.1], ports: Object.fromEntries(portsOf('router').map((p, i) => [p.id, [-0.075 + i * 0.05, 0.026, 0.081] as V3])) },
  [NET_SERVER]: { at: [0.78, 0, 0.0], ports: { eth0: [0, 0.07, 0.111] } },
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const portAt = (device: string, port: string): V3 => add(DEVICES[device].at, DEVICES[device].ports[port]);

/** The network in the state, or the seed's unwired one. */
const netOf = (state: HandsOnView['state'], seed: number): Network => state.net ?? startNetwork(seed);

function Socket({ at, busy, picked, label, onPick }: { at: V3; busy: boolean; picked: boolean; label: string; onPick: () => void }) {
  return (
    <group position={at}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <boxGeometry args={[0.022, 0.018, 0.012]} />
        <meshStandardMaterial color={picked ? '#facc15' : busy ? '#22c55e' : '#0e1116'} emissive={picked ? '#facc15' : busy ? '#16a34a' : '#000000'} emissiveIntensity={picked || busy ? 0.6 : 0} roughness={0.5} />
      </mesh>
      {/* a bigger, invisible hit area for fingers */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
      >
        <boxGeometry args={[0.032, 0.03, 0.03]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, -0.022, 0.006]} center zIndexRange={[18, 0]} className={styles.portTag}>
        <span>{label}</span>
      </Html>
    </group>
  );
}

function Computer({ id, works }: { id: string; works: boolean }) {
  const at = DEVICES[id].at;
  return (
    <group position={at}>
      <RoundedBox args={[0.09, 0.2, 0.2]} radius={0.008} position-y={0.1} castShadow>
        <meshStandardMaterial color="#20242c" metalness={0.3} roughness={0.45} />
      </RoundedBox>
      {/* the lamp: green once this computer reaches the server */}
      <mesh position={[0, 0.17, 0.101]}>
        <circleGeometry args={[0.007, 20]} />
        <meshBasicMaterial color={works ? '#22c55e' : '#ef4444'} toneMapped={false} />
      </mesh>
      {/* the monitor on its stand, behind the tower */}
      <group position={[0, 0, -0.17]}>
        <mesh position={[0, 0.006, 0]} castShadow>
          <boxGeometry args={[0.09, 0.012, 0.06]} />
          <meshStandardMaterial color="#2a2e36" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.07, -0.01]} castShadow>
          <boxGeometry args={[0.018, 0.12, 0.012]} />
          <meshStandardMaterial color="#2a2e36" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.22, 0.14, 0.012]} />
          <meshStandardMaterial color="#111318" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.2, 0.0065]}>
          <planeGeometry args={[0.206, 0.126]} />
          <meshBasicMaterial color={works ? '#1d6f4a' : '#1b2a3a'} toneMapped={false} />
        </mesh>
      </group>
      <Html position={[0, 0.25, 0]} center zIndexRange={[18, 0]} className={styles.deviceTag}>
        <b>{id}</b>
        <small>192.168.1.{10 + NET_PCS.indexOf(id as (typeof NET_PCS)[number])}</small>
      </Html>
    </group>
  );
}

function Box({ id, size, color, title, sub }: { id: string; size: V3; color: string; title: string; sub?: string }) {
  return (
    <group position={DEVICES[id].at}>
      <RoundedBox args={size} radius={0.006} position-y={size[1] / 2} castShadow>
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.42} />
      </RoundedBox>
      <Html position={[0, size[1] + 0.05, 0]} center zIndexRange={[18, 0]} className={styles.deviceTag}>
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </Html>
    </group>
  );
}

/** A cable from socket to socket, sagging a little in front of the devices. */
function Wire({ a, b }: { a: V3; b: V3 }) {
  const mid: V3 = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 0.005, Math.max(a[2], b[2]) + 0.09];
  return <Cable points={[a, add(a, [0, 0, 0.03]), mid, add(b, [0, 0, 0.03]), b]} radius={0.0035} color="#3b82f6" />;
}

export default function NetworkGame({ seed, state, move }: HandsOnView) {
  const t = useT();
  const net = netOf(state, seed);
  const [picked, setPicked] = useState<string | null>(null);
  const { lan, wan } = useMemo(() => routerPorts(seed), [seed]);
  const works = useMemo(() => Object.fromEntries(NET_PCS.map((pc) => [pc, ping(net, pc, NET_SERVER).ok])), [net]);
  const busy = (key: string) => {
    const end = parseEnd(net, key);
    return !!end && linksAt(net, end).length > 0;
  };
  const tap = (key: string) => {
    if (picked === key) return setPicked(null);
    if (!picked) {
      if (busy(key)) move({ t: 'cut', end: key });
      else setPicked(key);
      return;
    }
    move({ t: 'cable', a: picked, b: key });
    setPicked(null);
  };
  // short socket names on the devices (Gi0/0 → 0, p3 → 3); the full name is in the list below
  const portLabel = (device: string, port: string) => (device === NET_ROUTER || device === NET_SWITCH ? port.slice(1) : 'Eth');
  const fullLabel = (device: string, port: string) => (device === NET_ROUTER ? portsOf('router').find((p) => p.id === port)!.label : device === NET_SWITCH ? `Fa0/${port.slice(1)}` : 'Eth0');
  const routerSub = (port: string) => (port === lan ? '192.168.1.1' : port === wan ? '10.0.0.1' : '—');

  return (
    <div className={styles.game}>
      <div className={`${styles.stage} ${styles.tall}`}>
        <GameStage label={t('games3d.network.scene')} position={[0, 0.95, 1.45]} target={[0, 0.08, 0.05]} table={[2.05, 0.7]}>
          {NET_PCS.map((pc) => (
            <Computer key={pc} id={pc} works={works[pc]} />
          ))}
          <Box id={NET_SWITCH} size={[0.3, 0.048, 0.16]} color="#2b3442" title={t('games3d.network.switch')} />
          <Box id={NET_ROUTER} size={[0.24, 0.052, 0.16]} color="#e8eaee" title={t('games3d.network.router')} sub="Gi0/0 … Gi0/3" />
          <Box id={NET_SERVER} size={[0.16, 0.32, 0.22]} color="#1c2028" title={t('games3d.network.server')} sub="10.0.0.10" />
          {/* the router's addresses sit right above their sockets */}
          {portsOf('router').map((p) => (
            <Html key={p.id} position={add(portAt(NET_ROUTER, p.id), [0, 0.05 + (Number(p.id.slice(1)) % 2) * 0.028, 0])} center zIndexRange={[18, 0]} className={styles.ipTag}>
              <span data-used={routerSub(p.id) !== '—' || undefined}>{routerSub(p.id)}</span>
            </Html>
          ))}
          {Object.entries(DEVICES).flatMap(([device, d]) =>
            Object.keys(d.ports).map((port) => {
              const key = `${device}.${port}`;
              return <Socket key={key} at={portAt(device, port)} busy={busy(key)} picked={picked === key} label={portLabel(device, port)} onPick={() => tap(key)} />;
            }),
          )}
          {net.links.map((l) => (
            <Wire key={l.id} a={portAt(l.a.device, l.a.port)} b={portAt(l.b.device, l.b.port)} />
          ))}
        </GameStage>
      </div>
      <p className={styles.say} data-tone={picked ? 'info' : 'hint'} role="status" aria-live="polite">
        {picked ? t('games3d.network.picked', { port: picked }) : t('games3d.network.start')}
      </p>
      <section className={styles.tray} aria-label={t('games3d.network.ping')}>
        <h3>{t('games3d.network.ping')}</h3>
        <div className={styles.tiles}>
          {NET_PCS.map((pc) => (
            <span key={pc} className={styles.chip} data-ok={works[pc]}>
              {pc} → {NET_SERVER}: {works[pc] ? t('games3d.network.reply') : t('games3d.network.noReply')}
            </span>
          ))}
        </div>
        <details className={styles.ports}>
          <summary>{t('games3d.network.list')}</summary>
          {Object.entries(DEVICES).map(([device, d]) => (
            <div key={device} className={styles.portRow}>
              <b>{device}</b>
              {Object.keys(d.ports).map((port) => {
                const key = `${device}.${port}`;
                const on = busy(key);
                return (
                  <button key={key} type="button" className={styles.tile} data-state={picked === key ? 'picked' : on ? 'done' : 'idle'} aria-pressed={picked === key} onClick={() => tap(key)}>
                    {on ? <Unplug size={13} aria-hidden="true" /> : <CableIcon size={13} aria-hidden="true" />}
                    {fullLabel(device, port)}
                    {device === NET_ROUTER && <small> {routerSub(port)}</small>}
                  </button>
                );
              })}
            </div>
          ))}
        </details>
      </section>
    </div>
  );
}
