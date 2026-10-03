/**
 * Static checks of a network's addressing (no packets): what a teacher would
 * spot by reading each device's settings. Used for inline field validation
 * and for grading feedback.
 */
import { isHost, isRouter, portsOf } from './devices';
import { addressProblem, cidr, formatIp, parseIp, parseMask, sameSubnet } from './ipv4';
import { addressOwners } from './ping';
import { linksAt, linksOf } from './topology';
import type { Device, Network } from './types';

export type IssueCode =
  | 'noCable'
  | 'noIp'
  | 'invalidIp'
  | 'invalidMask'
  | 'reservedIp'
  | 'duplicateIp'
  | 'gatewayInvalid'
  | 'gatewayOutsideSubnet'
  | 'dnsInvalid'
  | 'interfaceInvalid'
  | 'interfacesOverlap';

export interface Issue {
  code: IssueCode;
  device: string;
  /** Router port or config field the issue is about. */
  field?: 'ip' | 'mask' | 'gateway' | 'dns' | string;
  params: Record<string, string | number>;
}

export function hostIssues(net: Network, d: Device): Issue[] {
  const c = d.config;
  if (!c) return [];
  const out: Issue[] = [];
  const params = { name: d.name };
  if (linksOf(net, d.id).length === 0) out.push({ code: 'noCable', device: d.id, params });
  const problem = addressProblem(c.ip, c.mask);
  if (problem) out.push({ code: problem, device: d.id, field: problem === 'invalidMask' ? 'mask' : 'ip', params: { ...params, ip: c.ip, mask: c.mask } });
  if (c.gateway.trim()) {
    const gw = parseIp(c.gateway);
    if (gw === null) out.push({ code: 'gatewayInvalid', device: d.id, field: 'gateway', params: { ...params, gateway: c.gateway } });
    else if (!problem && !sameSubnet(gw, parseIp(c.ip)!, parseMask(c.mask)!)) {
      out.push({ code: 'gatewayOutsideSubnet', device: d.id, field: 'gateway', params: { ...params, gateway: c.gateway, net: cidr(parseIp(c.ip)!, parseMask(c.mask)!) } });
    }
  }
  if (c.dns.trim() && parseIp(c.dns) === null) out.push({ code: 'dnsInvalid', device: d.id, field: 'dns', params: { ...params, dns: c.dns } });
  return out;
}

export function routerIssues(net: Network, d: Device): Issue[] {
  const out: Issue[] = [];
  const configured: Array<{ port: string; ip: number; mask: number }> = [];
  for (const p of portsOf(d.type)) {
    const i = d.interfaces?.[p.id];
    if (!i) continue;
    const used = linksAt(net, { device: d.id, port: p.id }).length > 0;
    if (!i.ip.trim() && !used) continue;
    const problem = addressProblem(i.ip, i.mask);
    if (problem) out.push({ code: 'interfaceInvalid', device: d.id, field: p.id, params: { name: d.name, port: p.label, problem } });
    else configured.push({ port: p.label, ip: parseIp(i.ip)!, mask: parseMask(i.mask)! });
  }
  for (let a = 0; a < configured.length; a++) {
    for (let b = a + 1; b < configured.length; b++) {
      const x = configured[a];
      const y = configured[b];
      if (sameSubnet(x.ip, y.ip, Math.min(x.mask, y.mask) >>> 0)) {
        out.push({ code: 'interfacesOverlap', device: d.id, params: { name: d.name, a: x.port, b: y.port, net: cidr(x.ip, x.mask) } });
      }
    }
  }
  return out;
}

/** All issues, including addresses used twice. */
export function diagnose(net: Network): Issue[] {
  const out: Issue[] = [];
  for (const d of net.devices) {
    if (isHost(d)) out.push(...hostIssues(net, d));
    if (isRouter(d)) out.push(...routerIssues(net, d));
  }
  const owners = addressOwners(net);
  const seen = new Map<number, string>();
  for (const o of owners) {
    const first = seen.get(o.ip);
    if (first !== undefined && first !== o.device.name) {
      const port = o.key.includes(':') ? o.key.split(':')[1] : undefined;
      out.push({ code: 'duplicateIp', device: o.device.id, field: port ?? 'ip', params: { name: o.device.name, other: first, ip: formatIp(o.ip) } });
    } else seen.set(o.ip, o.device.name);
  }
  return out;
}
