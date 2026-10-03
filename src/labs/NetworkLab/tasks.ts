/**
 * The four graded Network Lab tasks. Every rule reads the actual topology and
 * settings (links, L2 reachability, addresses, PING results) — never where a
 * device is drawn — so any correct layout earns full marks.
 */
import type { Exercise, Feedback, RuleResult } from '@/services/grading';
import { emptyHostConfig, emptyInterface, isComputer, isRouter, portsOf } from './devices';
import { diagnose, type Issue } from './diagnose';
import { addressProblem, cidr, parseIp, parseMask, sameSubnet } from './ipv4';
import { ping } from './ping';
import { deviceById, l2Reach, linksOf, otherEnd } from './topology';
import type { Device, DeviceType, HostConfig, Network, PingResult } from './types';

export const NETWORK_TASK_IDS = ['connect3', 'routerLan', 'addressing', 'repair'] as const;
export type NetworkTaskId = (typeof NETWORK_TASK_IDS)[number];

export interface NetworkTask extends Exercise<Network> {
  task: NetworkTaskId;
  start: () => Network;
  /** Suggested PING pair for the toolbar. */
  ping: [string, string];
}

// ---------------------------------------------------------------------------
// Builders for the prepared networks

type HostSeed = [id: string, type: DeviceType, x: number, y: number, config?: Partial<HostConfig>];

function host([id, type, x, y, config]: HostSeed): Device {
  return { id, type, name: id, x, y, config: { ...emptyHostConfig(), ...config } };
}

function router(id: string, x: number, y: number, interfaces: Record<string, [string, string]>): Device {
  const all = Object.fromEntries(portsOf('router').map((p) => [p.id, emptyInterface()]));
  for (const [port, [ip, mask]] of Object.entries(interfaces)) all[port] = { ip, mask };
  return { id, type: 'router', name: id, x, y, interfaces: all };
}

const bridge = (id: string, type: 'switch' | 'accessPoint', x: number, y: number): Device => ({ id, type, name: id, x, y });

/** "PC1.eth0-SW1.p1" */
function cables(...specs: string[]) {
  return specs.map((s, i) => {
    const [a, b] = s.split('-').map((end) => {
      const [device, port] = end.split('.');
      return { device, port };
    });
    return { id: `L${i + 1}`, a, b, medium: 'eth' as const };
  });
}

// ---------------------------------------------------------------------------
// Shared rule helpers

const fb = (key: string, params?: Feedback['params'], detail?: Feedback): Feedback => ({ key: `network.feedback.${key}`, params, detail });
const share = (good: number, total: number) => (total ? good / total : 0);
const result = (good: number, total: number, feedback: Feedback[]): RuleResult => ({ passed: total > 0 && good === total, partial: share(good, total), feedback });
const issueFeedback = (i: Issue) => fb(`issue.${i.code}`, i.params);
const pingFeedback = (r: PingResult, a: Device, b: Device) =>
  fb('pingFailed', { source: a.name, target: b.name }, { key: `network.ping.${r.reason}`, params: r.params });

const computers = (net: Network) => net.devices.filter(isComputer);

/** Devices the task prepared; a deleted one fails the rule with a clear note. */
function expected(net: Network, ids: readonly string[]): { present: Device[]; missing: Feedback[] } {
  const present: Device[] = [];
  const missing: Feedback[] = [];
  for (const id of ids) {
    const d = deviceById(net, id);
    if (d) present.push(d);
    else missing.push(fb('deviceMissing', { name: id }));
  }
  return { present, missing };
}

function pingRule(net: Network, pairs: Array<[Device, Device]>): RuleResult {
  if (!pairs.length) return { passed: false, feedback: [fb('nothingToPing')] };
  const failures: Feedback[] = [];
  let ok = 0;
  for (const [a, b] of pairs) {
    const r = ping(net, a.id, b.id);
    if (r.ok) ok++;
    else if (failures.length < 4) failures.push(pingFeedback(r, a, b));
  }
  return result(ok, pairs.length, failures);
}

const allPairs = (list: Device[]) => list.flatMap((a, i) => list.slice(i + 1).map((b) => [a, b] as [Device, Device]));

/** The router port that faces a switch — the LAN side. */
function lanInterface(net: Network): { router: Device; port: string; key: string } | null {
  for (const r of net.devices.filter(isRouter)) {
    for (const l of linksOf(net, r.id)) {
      const mine = l.a.device === r.id ? l.a : l.b;
      if (deviceById(net, otherEnd(l, r.id).device)?.type === 'switch') return { router: r, port: mine.port, key: `${r.id}:${mine.port}` };
    }
  }
  return null;
}

/** Hosts whose address is valid, unique and inside `subnet`. */
function addressRule(net: Network, hosts: Device[], subnet: { ip: number; mask: number } | null, extra: Feedback[] = []): RuleResult {
  const issues = diagnose(net);
  const feedback = [...extra];
  let good = 0;
  for (const h of hosts) {
    const own = issues.filter((i) => i.device === h.id && ['noIp', 'invalidIp', 'invalidMask', 'reservedIp', 'duplicateIp'].includes(i.code));
    if (own.length) {
      feedback.push(...own.map(issueFeedback));
      continue;
    }
    const ip = parseIp(h.config!.ip)!;
    const mask = parseMask(h.config!.mask)!;
    if (subnet && (!sameSubnet(ip, subnet.ip, subnet.mask) || mask !== subnet.mask)) {
      feedback.push(fb('wrongSubnet', { name: h.name, ip: h.config!.ip, net: cidr(ip, mask), expected: cidr(subnet.ip, subnet.mask) }));
      continue;
    }
    good++;
  }
  return result(good, hosts.length, feedback);
}

function interfaceOf(r: Device, port: string) {
  const i = r.interfaces?.[port];
  return i && !addressProblem(i.ip, i.mask) ? { ip: parseIp(i.ip)!, mask: parseMask(i.mask)!, text: i.ip } : null;
}

function gatewayRule(hosts: Device[], gateway: string | null): RuleResult {
  if (!gateway) return { passed: false, feedback: [fb('routerNotConfigured')] };
  const wrong = hosts.filter((h) => h.config!.gateway.trim() !== gateway);
  return result(hosts.length - wrong.length, hosts.length, wrong.map((h) => fb(h.config!.gateway.trim() ? 'wrongGateway' : 'noGateway', { name: h.name, gateway: h.config!.gateway, expected: gateway })));
}

// ---------------------------------------------------------------------------
// Tasks

const meta = (task: NetworkTaskId) => ({
  id: `network:${task}`,
  type: 'network',
  task,
  instructions: { key: `network.tasks.${task}.instructions` },
  expectedResult: { key: `network.tasks.${task}.expected` },
  maxScore: 10,
  hints: [1, 2, 3].map((n) => ({ key: `network.tasks.${task}.hint${n}` })),
});
const rule = (id: string) => ({ key: `network.rules.${id}` });

const connect3: NetworkTask = {
  ...meta('connect3'),
  ping: ['PC1', 'PC3'],
  start: () => ({
    devices: [
      host(['PC1', 'pc', 150, 130, { ip: '192.168.1.10' }]),
      host(['PC2', 'pc', 150, 320, { ip: '192.168.1.11' }]),
      host(['PC3', 'pc', 150, 510, { ip: '192.168.1.12' }]),
    ],
    links: [],
  }),
  gradingRules: [
    {
      id: 'threeComputers',
      points: 1,
      label: rule('threeComputers'),
      evaluate: (net) => {
        const n = computers(net).length;
        return { passed: n >= 3, partial: n / 3, feedback: n >= 3 ? [] : [fb('needComputers', { count: n, need: 3 })] };
      },
    },
    {
      id: 'allCabled',
      points: 2,
      label: rule('allCabled'),
      evaluate: (net) => {
        const list = computers(net);
        const loose = list.filter((d) => linksOf(net, d.id).length === 0);
        return result(list.length - loose.length, Math.max(3, list.length), loose.map((d) => fb('issue.noCable', { name: d.name })));
      },
    },
    {
      id: 'oneSegment',
      points: 2,
      label: rule('oneSegment'),
      evaluate: (net) => {
        const list = computers(net);
        if (list.length < 2) return { passed: false, feedback: [fb('needComputers', { count: list.length, need: 3 })] };
        const reach = l2Reach(net, list[0].id);
        const apart = list.slice(1).filter((d) => !reach.has(d.id));
        return result(list.length - apart.length, Math.max(3, list.length), apart.map((d) => fb('separated', { a: list[0].name, b: d.name })));
      },
    },
    {
      id: 'addressing',
      points: 2,
      label: rule('addressingSame'),
      evaluate: (net) => {
        const list = computers(net);
        const first = list.find((d) => !addressProblem(d.config!.ip, d.config!.mask));
        const subnet = first ? { ip: parseIp(first.config!.ip)!, mask: parseMask(first.config!.mask)! } : null;
        return addressRule(net, list, subnet);
      },
    },
    { id: 'pingAll', points: 3, label: rule('pingAll'), evaluate: (net) => pingRule(net, allPairs(computers(net))) },
  ],
};

const routerLan: NetworkTask = {
  ...meta('routerLan'),
  ping: ['PC1', 'R1'],
  start: () => ({ devices: [], links: [] }),
  gradingRules: [
    {
      id: 'devicesPresent',
      points: 1,
      label: rule('devicesPresent'),
      evaluate: (net) => {
        const missing: Feedback[] = [];
        if (!net.devices.some(isRouter)) missing.push(fb('missingRouter'));
        if (!net.devices.some((d) => d.type === 'switch')) missing.push(fb('missingSwitch'));
        const n = computers(net).length;
        if (n < 2) missing.push(fb('needComputers', { count: n, need: 2 }));
        return { passed: missing.length === 0, partial: (3 - missing.length) / 3, feedback: missing };
      },
    },
    {
      id: 'routerSwitch',
      points: 2,
      label: rule('routerSwitch'),
      evaluate: (net) => (lanInterface(net) ? { passed: true } : { passed: false, feedback: [fb('noRouterSwitchCable')] }),
    },
    {
      id: 'computersOnSwitch',
      points: 1,
      label: rule('computersOnSwitch'),
      evaluate: (net) => {
        const lan = lanInterface(net);
        const list = computers(net);
        if (!lan) return { passed: false, feedback: [fb('noRouterSwitchCable')] };
        const reach = l2Reach(net, lan.key);
        const apart = list.filter((d) => !reach.has(d.id));
        return result(list.length - apart.length, Math.max(2, list.length), apart.map((d) => fb('notOnLan', { name: d.name, router: lan.router.name })));
      },
    },
    {
      id: 'routerAddress',
      points: 2,
      label: rule('routerAddress'),
      evaluate: (net) => {
        const lan = lanInterface(net);
        if (!lan) return { passed: false, feedback: [fb('noRouterSwitchCable')] };
        const iface = interfaceOf(lan.router, lan.port);
        if (!iface) return { passed: false, feedback: [fb('routerNotConfigured', { router: lan.router.name })] };
        return addressRule(net, computers(net), iface);
      },
    },
    {
      id: 'gateways',
      points: 2,
      label: rule('gateways'),
      evaluate: (net) => {
        const lan = lanInterface(net);
        return gatewayRule(computers(net), lan ? (interfaceOf(lan.router, lan.port)?.text ?? null) : null);
      },
    },
    {
      id: 'pingAll',
      points: 2,
      label: rule('pingRouterAll'),
      evaluate: (net) => {
        const lan = lanInterface(net);
        const list = computers(net);
        return pingRule(net, [...(lan ? list.map((d) => [d, lan.router] as [Device, Device]) : []), ...allPairs(list)]);
      },
    },
  ],
};

const ADDRESSING_HOSTS = ['PC1', 'PC2', 'LAPTOP1', 'PRN1'] as const;
const blank = { ip: '', mask: '', gateway: '', dns: '' };

const addressing: NetworkTask = {
  ...meta('addressing'),
  ping: ['PC1', 'SRV1'],
  start: () => ({
    devices: [
      router('R1', 500, 110, { g0: ['192.168.10.1', '255.255.255.0'], g1: ['10.10.0.1', '255.255.255.0'] }),
      host(['SRV1', 'server', 850, 110, { ip: '10.10.0.10', gateway: '10.10.0.1', dns: '10.10.0.10' }]),
      bridge('SW1', 'switch', 500, 300),
      host(['PC1', 'pc', 170, 500, blank]),
      host(['PC2', 'pc', 390, 500, blank]),
      host(['LAPTOP1', 'laptop', 610, 500, blank]),
      host(['PRN1', 'printer', 830, 500, blank]),
    ],
    links: cables('R1.g0-SW1.p8', 'R1.g1-SRV1.eth0', 'PC1.eth0-SW1.p1', 'PC2.eth0-SW1.p2', 'LAPTOP1.eth0-SW1.p3', 'PRN1.eth0-SW1.p4'),
  }),
  gradingRules: [
    {
      id: 'hostAddresses',
      points: 3,
      label: rule('hostAddresses'),
      evaluate: (net) => {
        const { present, missing } = expected(net, ADDRESSING_HOSTS);
        const r = deviceById(net, 'R1');
        const iface = r && interfaceOf(r, 'g0');
        const res = addressRule(net, present, iface ? { ip: iface.ip, mask: iface.mask } : null, missing);
        return { ...res, passed: res.passed && !missing.length, partial: share(present.length * (res.partial ?? 0), ADDRESSING_HOSTS.length) };
      },
    },
    {
      id: 'masks',
      points: 2,
      label: rule('masks'),
      evaluate: (net) => {
        const { present, missing } = expected(net, ADDRESSING_HOSTS);
        const mask = deviceById(net, 'R1')?.interfaces?.g0.mask ?? '255.255.255.0';
        const wrong = present.filter((h) => h.config!.mask.trim() !== mask);
        return result(present.length - wrong.length, ADDRESSING_HOSTS.length, [...missing, ...wrong.map((h) => fb('wrongMask', { name: h.name, mask: h.config!.mask || '—', expected: mask }))]);
      },
    },
    {
      id: 'gateways',
      points: 2,
      label: rule('gateways'),
      evaluate: (net) => {
        const { present, missing } = expected(net, ADDRESSING_HOSTS);
        const r = deviceById(net, 'R1');
        const res = gatewayRule(present, r ? (interfaceOf(r, 'g0')?.text ?? null) : null);
        return { ...res, passed: res.passed && !missing.length, feedback: [...missing, ...(res.feedback ?? [])] };
      },
    },
    {
      id: 'dns',
      points: 1,
      label: rule('dns'),
      evaluate: (net) => {
        const { present, missing } = expected(net, ADDRESSING_HOSTS);
        const dns = deviceById(net, 'SRV1')?.config?.ip ?? '10.10.0.10';
        const wrong = present.filter((h) => h.config!.dns.trim() !== dns);
        return result(present.length - wrong.length, ADDRESSING_HOSTS.length, [...missing, ...wrong.map((h) => fb(h.config!.dns.trim() ? 'wrongDns' : 'noDns', { name: h.name, dns: h.config!.dns, expected: dns }))]);
      },
    },
    {
      id: 'pingServer',
      points: 2,
      label: rule('pingServer'),
      evaluate: (net) => {
        const { present } = expected(net, ADDRESSING_HOSTS);
        const server = deviceById(net, 'SRV1');
        if (!server) return { passed: false, feedback: [fb('deviceMissing', { name: 'SRV1' })] };
        const r = pingRule(net, present.map((h) => [h, server] as [Device, Device]));
        return { ...r, passed: r.passed && present.length === ADDRESSING_HOSTS.length, partial: share(present.length * (r.partial ?? 0), ADDRESSING_HOSTS.length) };
      },
    },
  ],
};

const REPAIR_HOSTS = ['PC1', 'PC2', 'PC3', 'LAPTOP1', 'PRN1'] as const;

const repair: NetworkTask = {
  ...meta('repair'),
  ping: ['PC2', 'SRV1'],
  start: () => ({
    devices: [
      router('R1', 500, 110, { g0: ['192.168.1.1', '255.255.255.0'], g1: ['172.16.0.1', '255.255.255.0'] }),
      host(['SRV1', 'server', 850, 110, { ip: '172.16.0.10', gateway: '172.16.0.1', dns: '172.16.0.10' }]),
      bridge('SW1', 'switch', 500, 300),
      host(['PC1', 'pc', 130, 500, { ip: '192.168.1.10', gateway: '192.168.1.1', dns: '172.16.0.10' }]),
      host(['PC2', 'pc', 315, 500, { ip: '192.168.1.11', gateway: '192.168.1.1', dns: '172.16.0.10' }]),
      host(['PC3', 'pc', 500, 500, { ip: '192.168.1.10', gateway: '192.168.1.1', dns: '172.16.0.10' }]),
      host(['LAPTOP1', 'laptop', 685, 500, { ip: '192.168.2.15', gateway: '192.168.1.1', dns: '172.16.0.10' }]),
      host(['PRN1', 'printer', 870, 500, { ip: '192.168.1.20', gateway: '192.168.1.254', dns: '172.16.0.10' }]),
    ],
    // PC2 has no cable, PC3 repeats PC1's address, LAPTOP1 is in another subnet, PRN1 has a wrong gateway
    links: cables('R1.g0-SW1.p8', 'R1.g1-SRV1.eth0', 'PC1.eth0-SW1.p1', 'PC3.eth0-SW1.p3', 'LAPTOP1.eth0-SW1.p4', 'PRN1.eth0-SW1.p5'),
  }),
  gradingRules: [
    {
      id: 'cables',
      points: 2,
      label: rule('cablesLan'),
      evaluate: (net) => {
        const { present, missing } = expected(net, REPAIR_HOSTS);
        const reach = l2Reach(net, 'R1:g0');
        const apart = present.filter((d) => !reach.has(d.id));
        return result(present.length - apart.length, REPAIR_HOSTS.length, [
          ...missing,
          ...apart.map((d) => (linksOf(net, d.id).length ? fb('notOnLan', { name: d.name, router: 'R1' }) : fb('issue.noCable', { name: d.name }))),
        ]);
      },
    },
    {
      id: 'uniqueIps',
      points: 2,
      label: rule('uniqueIps'),
      evaluate: (net) => {
        const dup = diagnose(net).filter((i) => i.code === 'duplicateIp');
        return { passed: dup.length === 0, feedback: dup.map(issueFeedback) };
      },
    },
    {
      id: 'lanSubnet',
      points: 2,
      label: rule('lanSubnet'),
      evaluate: (net) => {
        const { present, missing } = expected(net, REPAIR_HOSTS);
        const r = deviceById(net, 'R1');
        const iface = r && interfaceOf(r, 'g0');
        const res = addressRule(net, present, iface ? { ip: iface.ip, mask: iface.mask } : null, missing);
        return { ...res, passed: res.passed && !missing.length, partial: share(present.length * (res.partial ?? 0), REPAIR_HOSTS.length) };
      },
    },
    {
      id: 'gateways',
      points: 2,
      label: rule('gateways'),
      evaluate: (net) => {
        const { present, missing } = expected(net, REPAIR_HOSTS);
        const r = deviceById(net, 'R1');
        const res = gatewayRule(present, r ? (interfaceOf(r, 'g0')?.text ?? null) : null);
        return { ...res, passed: res.passed && !missing.length, feedback: [...missing, ...(res.feedback ?? [])] };
      },
    },
    {
      id: 'pingServer',
      points: 2,
      label: rule('pingServer'),
      evaluate: (net) => {
        const { present } = expected(net, REPAIR_HOSTS);
        const server = deviceById(net, 'SRV1');
        if (!server) return { passed: false, feedback: [fb('deviceMissing', { name: 'SRV1' })] };
        const r = pingRule(net, present.map((h) => [h, server] as [Device, Device]));
        return { ...r, passed: r.passed && present.length === REPAIR_HOSTS.length, partial: share(present.length * (r.partial ?? 0), REPAIR_HOSTS.length) };
      },
    },
  ],
};

export const NETWORK_TASKS: Record<NetworkTaskId, NetworkTask> = { connect3, routerLan, addressing, repair };
export const isNetworkTaskId = (v: unknown): v is NetworkTaskId => NETWORK_TASK_IDS.includes(v as NetworkTaskId);
