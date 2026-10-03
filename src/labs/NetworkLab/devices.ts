import type { Device, DeviceRole, DeviceType, HostConfig, InterfaceConfig, PortSpec } from './types';

const eth = (id: string, label = id) => ({ id, label, kind: 'eth', capacity: 1 }) as const satisfies PortSpec;
const wifi = (id: string, capacity = 1) => ({ id, label: 'Wi-Fi', kind: 'wifi', capacity }) as const satisfies PortSpec;

interface DeviceSpec {
  role: DeviceRole;
  ports: readonly PortSpec[];
  /** Name prefix: PC1, R1, SW1… */
  prefix: string;
  /** Drawing size in workspace units. */
  width: number;
  height: number;
}

export const DEVICE_SPECS: Record<DeviceType, DeviceSpec> = {
  pc: { role: 'host', ports: [eth('eth0', 'Eth0')], prefix: 'PC', width: 122, height: 82 },
  laptop: { role: 'host', ports: [eth('eth0', 'Eth0'), wifi('wlan0')], prefix: 'LAPTOP', width: 122, height: 82 },
  server: { role: 'host', ports: [eth('eth0', 'Eth0')], prefix: 'SRV', width: 122, height: 82 },
  printer: { role: 'host', ports: [eth('eth0', 'Eth0')], prefix: 'PRN', width: 122, height: 82 },
  smartphone: { role: 'host', ports: [wifi('wlan0')], prefix: 'PHONE', width: 122, height: 82 },
  router: { role: 'router', ports: ['g0', 'g1', 'g2', 'g3'].map((id, i) => eth(id, `Gi0/${i}`)), prefix: 'R', width: 152, height: 82 },
  switch: { role: 'bridge', ports: Array.from({ length: 8 }, (_, i) => eth(`p${i + 1}`, `Fa0/${i + 1}`)), prefix: 'SW', width: 200, height: 74 },
  accessPoint: { role: 'bridge', ports: [eth('eth0', 'Uplink'), wifi('wlan', 8)], prefix: 'AP', width: 128, height: 82 },
};

export const roleOf = (type: DeviceType): DeviceRole => DEVICE_SPECS[type].role;
export const portsOf = (type: DeviceType) => DEVICE_SPECS[type].ports;
export const portSpec = (type: DeviceType, port: string) => DEVICE_SPECS[type].ports.find((p) => p.id === port);
export const isHost = (d: Device) => roleOf(d.type) === 'host';
export const isRouter = (d: Device) => d.type === 'router';
export const isBridge = (d: Device) => roleOf(d.type) === 'bridge';
/** Computers for tasks that say "computer": desktops and laptops. */
export const isComputer = (d: Device) => d.type === 'pc' || d.type === 'laptop';

export const emptyHostConfig = (): HostConfig => ({ ip: '', mask: '255.255.255.0', gateway: '', dns: '' });
export const emptyInterface = (): InterfaceConfig => ({ ip: '', mask: '255.255.255.0' });

/** First free name for the type: PC1, PC2… */
export function nextName(devices: readonly Device[], type: DeviceType): string {
  const taken = new Set(devices.map((d) => d.name));
  const prefix = DEVICE_SPECS[type].prefix;
  for (let i = 1; ; i++) if (!taken.has(`${prefix}${i}`)) return `${prefix}${i}`;
}

export function createDevice(devices: readonly Device[], type: DeviceType, x: number, y: number, id?: string): Device {
  const name = nextName(devices, type);
  const device: Device = { id: id ?? name, type, name, x, y };
  if (roleOf(type) === 'host') device.config = emptyHostConfig();
  if (type === 'router') device.interfaces = Object.fromEntries(portsOf(type).map((p) => [p.id, emptyInterface()]));
  return device;
}
