/** IPv4 helpers on unsigned 32-bit numbers. */

export function parseIp(text: string | undefined): number | null {
  const parts = (text ?? '').trim().split('.');
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null;
  return parts.reduce((n, p) => (n * 256 + Number(p)) >>> 0, 0);
}

export function formatIp(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
}

/** A contiguous mask from /1 to /30 (a /31–/32 leaves no room for hosts here). */
export function parseMask(text: string | undefined): number | null {
  const mask = parseIp(text);
  if (mask === null) return null;
  const inverse = ~mask >>> 0;
  const contiguous = (inverse & (inverse + 1)) === 0;
  const prefix = prefixLength(mask);
  return contiguous && prefix >= 1 && prefix <= 30 ? mask : null;
}

export function prefixLength(mask: number): number {
  let bits = 0;
  for (let m = mask >>> 0; m & 0x80000000; m = (m << 1) >>> 0) bits++;
  return bits;
}

export function maskFromPrefix(prefix: number): string {
  return formatIp(prefix <= 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);
}

export const networkOf = (ip: number, mask: number) => (ip & mask) >>> 0;
export const sameSubnet = (a: number, b: number, mask: number) => networkOf(a, mask) === networkOf(b, mask);

/** "192.168.1.0/24" */
export function cidr(ip: number, mask: number): string {
  return `${formatIp(networkOf(ip, mask))}/${prefixLength(mask)}`;
}

export type AddressProblem = 'noIp' | 'invalidIp' | 'invalidMask' | 'reservedIp';

/**
 * Checks an address a device can use: valid syntax and mask, not the
 * network or broadcast address, not 0.x, loopback or multicast.
 */
export function addressProblem(ipText: string | undefined, maskText: string | undefined): AddressProblem | null {
  if (!(ipText ?? '').trim()) return 'noIp';
  const ip = parseIp(ipText);
  if (ip === null) return 'invalidIp';
  const mask = parseMask(maskText);
  if (mask === null) return 'invalidMask';
  const host = ip & ~mask;
  const first = ip >>> 24;
  if (host === 0 || host >>> 0 === ~mask >>> 0 || first === 0 || first === 127 || first >= 224) return 'reservedIp';
  return null;
}

export const COMMON_MASKS = ['255.255.255.0', '255.255.0.0', '255.0.0.0', '255.255.255.128', '255.255.255.192', '255.255.255.252'] as const;
