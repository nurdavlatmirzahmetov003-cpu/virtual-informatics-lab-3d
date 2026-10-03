import { Laptop, Monitor, Network, Printer, RadioTower, Router, Server, Smartphone, type LucideIcon } from 'lucide-react';
import type { DeviceType } from '@/labs/NetworkLab';

export const DEVICE_ICONS: Record<DeviceType, LucideIcon> = {
  pc: Monitor,
  laptop: Laptop,
  router: Router,
  switch: Network,
  server: Server,
  accessPoint: RadioTower,
  printer: Printer,
  smartphone: Smartphone,
};

/** Accent per device role, used for the tile glow. */
export const DEVICE_TONE: Record<DeviceType, string> = {
  pc: 'var(--net-host)',
  laptop: 'var(--net-host)',
  server: 'var(--net-server)',
  printer: 'var(--net-host)',
  smartphone: 'var(--net-host)',
  router: 'var(--net-router)',
  switch: 'var(--net-switch)',
  accessPoint: 'var(--net-switch)',
};
