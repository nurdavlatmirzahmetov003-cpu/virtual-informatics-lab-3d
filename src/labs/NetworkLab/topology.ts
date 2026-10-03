/**
 * Immutable network edits and L2 reachability. Every edit returns a new
 * Network; invalid edits return the same object (or an error code).
 */
import { createDevice, isBridge, isRouter, portSpec, portsOf } from './devices';
import type { ConnectError, Device, DeviceType, Endpoint, HostConfig, InterfaceConfig, Link, Network } from './types';

export const MAX_DEVICES = 18;

export const emptyNetwork = (): Network => ({ devices: [], links: [] });
export const deviceById = (net: Network, id: string) => net.devices.find((d) => d.id === id);
export const linksOf = (net: Network, id: string) => net.links.filter((l) => l.a.device === id || l.b.device === id);
const sameEnd = (e: Endpoint, f: Endpoint) => e.device === f.device && e.port === f.port;
export const linksAt = (net: Network, end: Endpoint) => net.links.filter((l) => sameEnd(l.a, end) || sameEnd(l.b, end));
export const otherEnd = (link: Link, id: string): Endpoint => (link.a.device === id ? link.b : link.a);

export function addDevice(net: Network, type: DeviceType, x: number, y: number): Network {
  if (net.devices.length >= MAX_DEVICES) return net;
  const used = new Set(net.devices.map((d) => d.id));
  const device = createDevice(net.devices, type, x, y);
  let id = device.id;
  for (let i = 2; used.has(id); i++) id = `${device.id}-${i}`;
  return { ...net, devices: [...net.devices, { ...device, id }] };
}

export function removeDevice(net: Network, id: string): Network {
  return { devices: net.devices.filter((d) => d.id !== id), links: net.links.filter((l) => l.a.device !== id && l.b.device !== id) };
}

export function moveDevice(net: Network, id: string, x: number, y: number): Network {
  return { ...net, devices: net.devices.map((d) => (d.id === id ? { ...d, x, y } : d)) };
}

export function updateHostConfig(net: Network, id: string, patch: Partial<HostConfig>): Network {
  return { ...net, devices: net.devices.map((d) => (d.id === id && d.config ? { ...d, config: { ...d.config, ...patch } } : d)) };
}

export function updateInterface(net: Network, id: string, port: string, patch: Partial<InterfaceConfig>): Network {
  return {
    ...net,
    devices: net.devices.map((d) =>
      d.id === id && d.interfaces?.[port] ? { ...d, interfaces: { ...d.interfaces, [port]: { ...d.interfaces[port], ...patch } } } : d,
    ),
  };
}

export function renameDevice(net: Network, id: string, name: string): Network {
  const clean = name.trim().slice(0, 16);
  if (!clean || net.devices.some((d) => d.id !== id && d.name === clean)) return net;
  return { ...net, devices: net.devices.map((d) => (d.id === id ? { ...d, name: clean } : d)) };
}

export const freeSlots = (net: Network, device: Device, port: string) => (portSpec(device.type, port)?.capacity ?? 0) - linksAt(net, { device: device.id, port }).length;

/** Validates a cable / Wi-Fi association between two ports. */
export function canConnect(net: Network, a: Endpoint, b: Endpoint): ConnectError | null {
  if (a.device === b.device) return 'sameDevice';
  const da = deviceById(net, a.device);
  const db = deviceById(net, b.device);
  const pa = da && portSpec(da.type, a.port);
  const pb = db && portSpec(db.type, b.port);
  if (!da || !db || !pa || !pb) return 'unknownPort';
  if (pa.kind !== pb.kind) return 'kindMismatch';
  if (pa.kind === 'wifi' && (da.type === 'accessPoint') === (db.type === 'accessPoint')) return 'wifiNeedsAccessPoint';
  if (net.links.some((l) => (l.a.device === a.device && l.b.device === b.device) || (l.a.device === b.device && l.b.device === a.device))) return 'alreadyLinked';
  if (freeSlots(net, da, a.port) <= 0 || freeSlots(net, db, b.port) <= 0) return 'portBusy';
  return null;
}

export function connect(net: Network, a: Endpoint, b: Endpoint): { network: Network; error: ConnectError | null } {
  const error = canConnect(net, a, b);
  if (error) return { network: net, error };
  const medium = portSpec(deviceById(net, a.device)!.type, a.port)!.kind;
  let n = net.links.length + 1;
  while (net.links.some((l) => l.id === `L${n}`)) n++;
  return { network: { ...net, links: [...net.links, { id: `L${n}`, a, b, medium }] }, error: null };
}

/**
 * Connects a port to a device when the student drops a cable on the device
 * body rather than an exact port: picks the first compatible free port.
 */
export function connectToDevice(net: Network, from: Endpoint, targetId: string): { network: Network; error: ConnectError | null } {
  const target = deviceById(net, targetId);
  if (!target) return { network: net, error: 'unknownPort' };
  if (from.device === targetId) return { network: net, error: 'sameDevice' };
  const errors = new Set<ConnectError>();
  for (const port of portsOf(target.type)) {
    const error = canConnect(net, from, { device: targetId, port: port.id });
    if (!error) return connect(net, from, { device: targetId, port: port.id });
    errors.add(error);
  }
  // the most useful explanation wins: a compatible port that is busy means "no free port"
  const order: ConnectError[] = ['unknownPort', 'alreadyLinked', 'wifiNeedsAccessPoint', 'portBusy', 'kindMismatch'];
  const error = order.find((e) => errors.has(e)) ?? 'noFreePort';
  return { network: net, error: error === 'portBusy' ? 'noFreePort' : error };
}

/** Same, starting from a whole device: its first free port that fits the target. */
export function connectDevices(net: Network, fromId: string, targetId: string): { network: Network; error: ConnectError | null } {
  const source = deviceById(net, fromId);
  if (!source) return { network: net, error: 'unknownPort' };
  if (fromId === targetId) return { network: net, error: 'sameDevice' };
  if (linksOf(net, fromId).some((l) => otherEnd(l, fromId).device === targetId)) return { network: net, error: 'alreadyLinked' };
  let first: ConnectError | null = null;
  for (const port of portsOf(source.type)) {
    if (freeSlots(net, source, port.id) <= 0) continue;
    const r = connectToDevice(net, { device: fromId, port: port.id }, targetId);
    if (!r.error) return r;
    first ??= r.error;
  }
  return { network: net, error: first ?? 'noFreePort' };
}

export function disconnect(net: Network, linkId: string): Network {
  return { ...net, links: net.links.filter((l) => l.id !== linkId) };
}

// ---------------------------------------------------------------------------
// L2 reachability. Nodes: a host or a bridge is one node; each router port is
// its own node ("R1:g0") because a router separates broadcast domains.

export const nodeKey = (net: Network, end: Endpoint) => (isRouter(deviceById(net, end.device)!) ? `${end.device}:${end.port}` : end.device);
export const deviceOfKey = (key: string) => key.split(':')[0];

function neighbours(net: Network, key: string): string[] {
  const [id, port] = key.split(':');
  return net.links
    .filter((l) => (port ? (l.a.device === id && l.a.port === port) || (l.b.device === id && l.b.port === port) : l.a.device === id || l.b.device === id))
    .map((l) => nodeKey(net, otherEnd(l, id)));
}

/** Packets cross switches and access points; hosts and router ports end them. */
const forwards = (net: Network, key: string) => {
  const d = deviceById(net, deviceOfKey(key));
  return Boolean(d && isBridge(d));
};

/**
 * Shortest L2 path between two nodes (as node keys), or null. It may pass
 * only through switches / access points, never through a PC or a router.
 */
export function l2Path(net: Network, from: string, to: string): string[] | null {
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const key = queue.shift()!;
    if (key === to) {
      const path: string[] = [];
      for (let k: string | null = key; k !== null; k = prev.get(k)!) path.unshift(k);
      return path;
    }
    if (key !== from && !forwards(net, key)) continue;
    for (const next of neighbours(net, key)) {
      if (!prev.has(next)) {
        prev.set(next, key);
        queue.push(next);
      }
    }
  }
  return null;
}

/** Every node a broadcast from `from` reaches (its broadcast domain). */
export function l2Reach(net: Network, from: string): Set<string> {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const key = queue.shift()!;
    if (key !== from && !forwards(net, key)) continue;
    for (const next of neighbours(net, key)) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/** Any cable path at all, through any device — used to tell "not cabled" from "separated by a router". */
export function physicallyConnected(net: Network, a: string, b: string): boolean {
  const seen = new Set([a]);
  const queue = [a];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === b) return true;
    for (const l of linksOf(net, id)) {
      const next = otherEnd(l, id).device;
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}
