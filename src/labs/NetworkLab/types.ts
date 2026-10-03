/**
 * Network Lab data model. Pure data: positions are only for drawing —
 * connectivity, addressing and grading never look at x / y.
 */

export const DEVICE_TYPES = ['pc', 'laptop', 'router', 'switch', 'server', 'accessPoint', 'printer', 'smartphone'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

/** host: has one IP config · bridge: L2 (switch, access point) · router: one IP per port. */
export type DeviceRole = 'host' | 'bridge' | 'router';
export type PortKind = 'eth' | 'wifi';

export interface PortSpec {
  id: string;
  /** Short label shown on hover, e.g. "Gi0/1", "Wi-Fi". */
  label: string;
  kind: PortKind;
  /** Links the port accepts: 1 for a cable, more for an access point radio. */
  capacity: number;
}

export interface HostConfig {
  ip: string;
  mask: string;
  gateway: string;
  dns: string;
}

export interface InterfaceConfig {
  ip: string;
  mask: string;
}

export interface Device {
  id: string;
  type: DeviceType;
  /** Display name, unique in the network (PC1, R1…). */
  name: string;
  x: number;
  y: number;
  /** Hosts only. */
  config?: HostConfig;
  /** Routers only: port id → interface address. */
  interfaces?: Record<string, InterfaceConfig>;
}

export interface Endpoint {
  device: string;
  port: string;
}

export interface Link {
  id: string;
  a: Endpoint;
  b: Endpoint;
  medium: PortKind;
}

export interface Network {
  devices: Device[];
  links: Link[];
}

/** Why a connection attempt was refused. */
export type ConnectError = 'sameDevice' | 'unknownPort' | 'portBusy' | 'kindMismatch' | 'wifiNeedsAccessPoint' | 'alreadyLinked' | 'noFreePort';

export type PingReason =
  | 'ok'
  | 'sourceNotHost'
  | 'noCable'
  | 'noIp'
  | 'invalidIp'
  | 'invalidMask'
  | 'reservedIp'
  | 'targetNoIp'
  | 'targetInvalidIp'
  | 'duplicateIp'
  | 'differentSubnet'
  | 'gatewayOutsideSubnet'
  | 'gatewayUnreachable'
  | 'gatewayNotRouter'
  | 'noRoute'
  | 'routerPortNoCable'
  | 'targetNoCable'
  | 'noPath'
  | 'sameSubnetBehindRouter'
  | 'unknownHost';

export interface PingResult {
  ok: boolean;
  reason: PingReason;
  /** 'reply' when the request arrived but the answer could not come back. */
  direction: 'request' | 'reply';
  /** Device ids the packet passes, in order (request, then reply when ok). */
  hops: string[];
  /** Where the packet stopped (failures only). */
  stoppedAt: string | null;
  params: Record<string, string | number>;
}
