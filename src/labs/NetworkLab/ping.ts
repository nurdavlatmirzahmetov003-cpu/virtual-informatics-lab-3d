/**
 * PING simulation: an ICMP echo request travels from the source to the
 * target and the reply must make it back. Each leg follows what real IPv4
 * hosts do — same subnet → straight across the switches; otherwise → to the
 * gateway router, which forwards out of the interface whose subnet holds the
 * destination. Single-router networks (no routing tables) by design.
 */
import { isBridge, isHost, isRouter, portSpec, portsOf } from './devices';
import { addressProblem, cidr, formatIp, parseIp, parseMask, sameSubnet } from './ipv4';
import { deviceById, deviceOfKey, l2Path, l2Reach, linksAt, linksOf, physicallyConnected } from './topology';
import type { Device, Network, PingReason, PingResult } from './types';

interface Owner {
  ip: number;
  mask: number;
  key: string;
  device: Device;
}

/** Every usable address in the network: host IPs and router interface IPs. */
export function addressOwners(net: Network): Owner[] {
  const out: Owner[] = [];
  for (const d of net.devices) {
    if (isHost(d) && d.config && !addressProblem(d.config.ip, d.config.mask)) {
      out.push({ ip: parseIp(d.config.ip)!, mask: parseMask(d.config.mask)!, key: d.id, device: d });
    }
    if (isRouter(d)) {
      for (const p of portsOf(d.type)) {
        const i = d.interfaces?.[p.id];
        if (i && !addressProblem(i.ip, i.mask)) out.push({ ip: parseIp(i.ip)!, mask: parseMask(i.mask)!, key: `${d.id}:${p.id}`, device: d });
      }
    }
  }
  return out;
}

interface Leg {
  ok: boolean;
  reason: PingReason;
  keys: string[];
  stoppedAt: string | null;
  params: Record<string, string | number>;
  reached?: Owner;
}

const fail = (reason: PingReason, keys: string[], stoppedAt: string, params: Record<string, string | number> = {}): Leg => ({
  ok: false,
  reason,
  keys,
  stoppedAt,
  params,
});

const nameOf = (net: Network, key: string) => deviceById(net, deviceOfKey(key))?.name ?? key;

/** Where an undeliverable frame dies: the first switch it reaches, else the sender. */
function firstHop(net: Network, fromKey: string): string[] {
  for (const k of l2Reach(net, fromKey)) {
    if (k === fromKey) continue;
    const d = deviceById(net, deviceOfKey(k));
    if (d && isBridge(d) && l2Path(net, fromKey, k)?.length === 2) return [fromKey, k];
  }
  return [fromKey];
}

/** Delivers inside one broadcast domain (ARP + switching). */
function deliverLocal(net: Network, owners: Owner[], fromKey: string, dst: number, prefix: string[]): Leg {
  const reach = l2Reach(net, fromKey);
  const owner = owners.find((o) => o.ip === dst && reach.has(o.key));
  if (owner) return { ok: true, reason: 'ok', keys: [...prefix, ...l2Path(net, fromKey, owner.key)!.slice(1)], stoppedAt: null, params: {}, reached: owner };

  const hop = firstHop(net, fromKey);
  const keys = [...prefix, ...hop.slice(1)];
  const at = hop.at(-1)!;
  const elsewhere = owners.find((o) => o.ip === dst);
  if (!elsewhere) return fail('unknownHost', keys, at, { ip: formatIp(dst) });
  const target = elsewhere.device;
  if (linksOf(net, target.id).length === 0) return fail('targetNoCable', keys, at, { target: target.name });
  if (physicallyConnected(net, deviceOfKey(fromKey), target.id)) return fail('sameSubnetBehindRouter', keys, at, { target: target.name, ip: formatIp(dst) });
  return fail('noPath', keys, at, { target: target.name, from: nameOf(net, fromKey) });
}

/** A router forwards out of the interface whose subnet contains `dst`. */
function routerForward(net: Network, owners: Owner[], router: Device, dst: number, prefix: string[]): Leg {
  const own = owners.find((o) => o.device.id === router.id && o.ip === dst);
  if (own) return { ok: true, reason: 'ok', keys: prefix, stoppedAt: null, params: {}, reached: own };
  const at = prefix.at(-1) ?? router.id;
  const egress = owners.find((o) => o.device.id === router.id && sameSubnet(o.ip, dst, o.mask));
  if (!egress) return fail('noRoute', prefix, at, { router: router.name, ip: formatIp(dst) });
  const port = egress.key.split(':')[1];
  if (linksAt(net, { device: router.id, port }).length === 0) {
    return fail('routerPortNoCable', prefix, at, { router: router.name, port: portSpec(router.type, port)?.label ?? port, net: cidr(egress.ip, egress.mask) });
  }
  return deliverLocal(net, owners, egress.key, dst, [...prefix, egress.key]);
}

/** One direction (request or reply) sent by a host using its own IP settings. */
function sendFromHost(net: Network, owners: Owner[], host: Device, dst: number): Leg {
  const c = host.config!;
  const ip = parseIp(c.ip)!;
  const mask = parseMask(c.mask)!;
  const start = [host.id];
  if (sameSubnet(ip, dst, mask)) return deliverLocal(net, owners, host.id, dst, start);

  const nets = { name: host.name, srcNet: cidr(ip, mask), dst: formatIp(dst) };
  if (!c.gateway.trim()) return fail('differentSubnet', start, host.id, nets);
  const gw = parseIp(c.gateway);
  if (gw === null || !sameSubnet(ip, gw, mask)) return fail('gatewayOutsideSubnet', start, host.id, { ...nets, gateway: c.gateway });

  const reach = l2Reach(net, host.id);
  const gwOwner = owners.find((o) => o.ip === gw && reach.has(o.key));
  if (!gwOwner) {
    const hop = firstHop(net, host.id);
    return fail('gatewayUnreachable', hop, hop.at(-1)!, { ...nets, gateway: c.gateway });
  }
  if (!isRouter(gwOwner.device)) return fail('gatewayNotRouter', l2Path(net, host.id, gwOwner.key)!, gwOwner.key, { ...nets, gateway: c.gateway, owner: gwOwner.device.name });
  return routerForward(net, owners, gwOwner.device, dst, l2Path(net, host.id, gwOwner.key)!);
}

/** Target address: a host's IP, or the router interface nearest the source. */
function targetAddress(net: Network, owners: Owner[], source: Device, target: Device): number | PingReason {
  if (isBridge(target)) return 'targetNoIp';
  if (isHost(target)) {
    const problem = addressProblem(target.config?.ip, target.config?.mask);
    if (problem === 'noIp') return 'targetNoIp';
    return problem ? 'targetInvalidIp' : parseIp(target.config!.ip)!;
  }
  const mine = owners.filter((o) => o.device.id === target.id);
  if (!mine.length) return 'targetNoIp';
  const reach = l2Reach(net, source.id);
  return (mine.find((o) => reach.has(o.key)) ?? mine[0]).ip;
}

function toResult(net: Network, leg: Leg, direction: PingResult['direction'], extraKeys: string[] = []): PingResult {
  const ids: string[] = [];
  for (const key of [...extraKeys, ...leg.keys]) {
    const id = deviceOfKey(key);
    if (ids.at(-1) !== id) ids.push(id);
  }
  return {
    ok: leg.ok,
    reason: leg.reason,
    direction,
    hops: ids,
    stoppedAt: leg.stoppedAt ? deviceOfKey(leg.stoppedAt) : null,
    params: { at: leg.stoppedAt ? nameOf(net, leg.stoppedAt) : '', ...leg.params },
  };
}

const early = (net: Network, reason: PingReason, at: string, params: Record<string, string | number>): PingResult => ({
  ok: false,
  reason,
  direction: 'request',
  hops: [at],
  stoppedAt: at,
  params: { at: deviceById(net, at)?.name ?? at, ...params },
});

export function ping(net: Network, sourceId: string, targetId: string): PingResult {
  const source = deviceById(net, sourceId);
  const target = deviceById(net, targetId);
  if (!source || !target) return early(net, 'unknownHost', sourceId, { ip: '' });
  const names = { source: source.name, target: target.name };
  if (!isHost(source)) return early(net, 'sourceNotHost', source.id, names);

  const problem = addressProblem(source.config?.ip, source.config?.mask);
  if (problem) return early(net, problem, source.id, { ...names, name: source.name, ip: source.config?.ip ?? '', mask: source.config?.mask ?? '' });
  if (linksOf(net, source.id).length === 0) return early(net, 'noCable', source.id, { ...names, name: source.name });

  const owners = addressOwners(net);
  const dst = targetAddress(net, owners, source, target);
  if (typeof dst !== 'number') return early(net, dst, source.id, { ...names, name: target.name, ip: target.config?.ip ?? '' });

  const src = parseIp(source.config!.ip)!;
  for (const ip of [src, dst]) {
    const same = owners.filter((o) => o.ip === ip);
    const devices = [...new Set(same.map((o) => o.device.name))];
    if (devices.length > 1) return early(net, 'duplicateIp', source.id, { ...names, ip: formatIp(ip), a: devices[0], b: devices[1] });
  }
  if (source.id === target.id) return { ok: true, reason: 'ok', direction: 'request', hops: [source.id], stoppedAt: null, params: { ...names, at: '' } };

  const request = sendFromHost(net, owners, source, dst);
  if (!request.ok) {
    const r = toResult(net, request, 'request');
    return { ...r, params: { ...names, ...r.params } };
  }

  const reply = isRouter(target) ? routerForward(net, owners, target, src, [request.reached!.key]) : sendFromHost(net, owners, target, src);
  const forward = toResult(net, request, 'request');
  const back = toResult(net, reply, 'reply');
  const hops = [...forward.hops, ...back.hops.slice(back.hops[0] === forward.hops.at(-1) ? 1 : 0)];
  return { ok: reply.ok, reason: reply.reason, direction: reply.ok ? 'request' : 'reply', hops, stoppedAt: back.stoppedAt, params: { ...names, ...back.params } };
}
