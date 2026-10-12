/**
 * Wi-Fi task data: the networks a school laptop sees, how each is secured,
 * and the DHCP lease the router hands out once the laptop is on the network.
 */
export type Security = 'open' | 'wep' | 'wpa2' | 'wpa3';

export interface WifiNetwork {
  ssid: string;
  security: Security;
  /** Bars, 1–4. */
  signal: 1 | 2 | 3 | 4;
  /** The key, for networks the class knows (on the router sticker); null: unknown. */
  key: string | null;
}

/** The school's own network, printed on the router sticker. */
export const SCHOOL_SSID = 'Mektep-WiFi';
export const SCHOOL_KEY = 'Bilim2026';

export const NETWORKS: readonly WifiNetwork[] = [
  { ssid: 'Free_WiFi_Kafe', security: 'open', signal: 4, key: '' },
  { ssid: SCHOOL_SSID, security: 'wpa3', signal: 4, key: SCHOOL_KEY },
  { ssid: 'Mektep-Guest', security: 'wep', signal: 3, key: '12345' },
  { ssid: 'TP-Link_8F2A', security: 'wpa2', signal: 2, key: null },
];

export const isSecure = (s: Security) => s === 'wpa2' || s === 'wpa3';
export const networkBySsid = (ssid: string) => NETWORKS.find((n) => n.ssid === ssid);

/** Result of trying to join: joined, or why not. Open networks join, but with a warning. */
export type JoinResult = { joined: true } | { joined: false; reason: 'wrongKey' | 'wep' | 'unknown' };

export function join(ssid: string, key: string): JoinResult {
  const n = networkBySsid(ssid);
  if (!n) return { joined: false, reason: 'unknown' };
  if (n.security === 'open') return { joined: true };
  // WEP is broken in minutes: the lab refuses it, like a school device policy would
  if (n.security === 'wep') return { joined: false, reason: 'wep' };
  if (n.key === null || key.trim() !== n.key) return { joined: false, reason: 'wrongKey' };
  return { joined: true };
}

export interface Lease {
  ip: string;
  mask: string;
  gateway: string;
  dns: string;
  hours: number;
}

/**
 * What the router's DHCP server gives a device: an address from its pool
 * (192.168.1.100–199), the subnet mask, itself as the gateway and DNS.
 * `client` picks the address so each scenario gets a stable, distinct one.
 */
export function dhcpLease(client: 'laptop-eth' | 'laptop-wifi'): Lease {
  const host = client === 'laptop-eth' ? 101 : 102;
  return { ip: `192.168.1.${host}`, mask: '255.255.255.0', gateway: '192.168.1.1', dns: '192.168.1.1', hours: 24 };
}

/** The four DHCP messages (DORA), in order. */
export const DHCP_STEPS = ['discover', 'offer', 'request', 'ack'] as const;
