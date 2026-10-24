/**
 * "Build the network" (0.37 hands-on game): a router, a switch, three
 * computers and a server stand unwired. The player runs cables port to port
 * until every computer PINGs the server. The router's two used ports carry
 * the addresses of their networks; which port is which comes from the seed,
 * so the player has to read the labels (192.168.1.1 faces the computers,
 * 10.0.0.1 the server). Every check is NetworkLab's own (connect, ping).
 */
import { connect, deviceById, linksAt, linksOf, otherEnd } from '@/labs/NetworkLab/topology';
import { emptyHostConfig, emptyInterface, portsOf } from '@/labs/NetworkLab/devices';
import { ping } from '@/labs/NetworkLab/ping';
import type { Device, Endpoint, HostConfig, Network } from '@/labs/NetworkLab/types';
import { rng, shuffle } from './quiz';

export const NET_PCS = ['PC1', 'PC2', 'PC3'] as const;
export const NET_SERVER = 'SRV1';
export const NET_ROUTER = 'R1';
export const NET_SWITCH = 'SW1';
export const LAN_GATEWAY = '192.168.1.1';
export const WAN_GATEWAY = '10.0.0.1';
/** Cables a finished network needs: three computers, switch → router, router → server. */
export const NET_LINKS_NEEDED = NET_PCS.length + 2;

const host = (id: string, type: Device['type'], config: Partial<HostConfig>): Device => ({ id, type, name: id, x: 0, y: 0, config: { ...emptyHostConfig(), ...config } });

/** The router ports facing the computers (LAN) and the server (WAN) for a seed. */
export function routerPorts(seed: number): { lan: string; wan: string } {
  const [lan, wan] = shuffle(
    portsOf('router').map((p) => p.id),
    rng(seed ^ 0x3c6ef372),
  );
  return { lan, wan };
}

/** The unwired network of a seed. */
export function startNetwork(seed: number): Network {
  const { lan, wan } = routerPorts(seed);
  const interfaces = Object.fromEntries(portsOf('router').map((p) => [p.id, emptyInterface()]));
  interfaces[lan] = { ip: LAN_GATEWAY, mask: '255.255.255.0' };
  interfaces[wan] = { ip: WAN_GATEWAY, mask: '255.255.255.0' };
  return {
    devices: [
      { id: NET_ROUTER, type: 'router', name: NET_ROUTER, x: 0, y: 0, interfaces },
      { id: NET_SWITCH, type: 'switch', name: NET_SWITCH, x: 0, y: 0 },
      ...NET_PCS.map((id, i) => host(id, 'pc', { ip: `192.168.1.${10 + i}`, gateway: LAN_GATEWAY })),
      host(NET_SERVER, 'server', { ip: '10.0.0.10', gateway: WAN_GATEWAY }),
    ],
    links: [],
  };
}

/** "PC1.eth0" → endpoint (null when malformed or not a port of the network). */
export function parseEnd(net: Network, v: unknown): Endpoint | null {
  if (typeof v !== 'string' || v.length > 24) return null;
  const [device, port, extra] = v.split('.');
  if (extra !== undefined || !device || !port) return null;
  const d = deviceById(net, device);
  return d && portsOf(d.type).some((p) => p.id === port) ? { device, port } : null;
}

export const endKey = (e: Endpoint) => `${e.device}.${e.port}`;

/** Runs a cable; null when NetworkLab refuses it (busy port, the same device…). */
export function cable(net: Network, a: Endpoint, b: Endpoint): Network | null {
  const r = connect(net, a, b);
  return r.error ? null : r.network;
}

/** Pulls the cable out of a port (null when nothing is plugged in there). */
export function cut(net: Network, end: Endpoint): Network | null {
  const link = linksAt(net, end)[0];
  return link ? { ...net, links: net.links.filter((l) => l.id !== link.id) } : null;
}

/** Cables that are where a working network needs them. */
export function goodLinks(net: Network, seed: number): number {
  const { lan, wan } = routerPorts(seed);
  let good = 0;
  for (const pc of NET_PCS) if (linksOf(net, pc).some((l) => otherEnd(l, pc).device === NET_SWITCH)) good++;
  const routerTo = (port: string) => linksAt(net, { device: NET_ROUTER, port }).map((l) => otherEnd(l, NET_ROUTER).device);
  if (routerTo(lan).includes(NET_SWITCH)) good++;
  if (routerTo(wan).includes(NET_SERVER)) good++;
  return good;
}

/** The network of a seed with these cables run ("PC1.eth0", "SW1.p1" pairs; a live room's snapshot). */
export function networkFrom(seed: number, links: readonly (readonly [string, string])[]): Network {
  let net = startNetwork(seed);
  for (const [x, y] of links) {
    const a = parseEnd(net, x);
    const b = parseEnd(net, y);
    net = (a && b && cable(net, a, b)) || net;
  }
  return net;
}

/** Done: every computer reaches the server. */
export const networkWorks = (net: Network) => NET_PCS.every((pc) => ping(net, pc, NET_SERVER).ok);
