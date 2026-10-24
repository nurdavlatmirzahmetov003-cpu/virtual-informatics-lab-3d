import { Binary, Cable, Cpu, Laptop, Network, PlugZap, ScanSearch, Smartphone, Stethoscope, Waypoints, type LucideIcon } from 'lucide-react';
import type { ArcadeGame } from '@/labs/Arcade';

/** Icon and colour of each arena game (cards, play screen). */
export const GAME_ICON: Record<ArcadeGame, LucideIcon> = {
  device: ScanSearch,
  ports: Cable,
  order: Cpu,
  binary: Binary,
  subnet: Network,
  phone: Smartphone,
  laptop: Laptop,
  pcbuild: Cpu,
  plug: PlugZap,
  network: Waypoints,
  fault: Stethoscope,
};
export const GAME_TONE: Record<ArcadeGame, string> = {
  device: '#56dbf8',
  ports: '#ffb35c',
  order: '#52e3a4',
  binary: '#b7a2ff',
  subnet: '#ff8a7a',
  phone: '#7c9cff',
  laptop: '#4fd1c5',
  pcbuild: '#52e3a4',
  plug: '#ffb35c',
  network: '#38bdf8',
  fault: '#ff7d95',
};
