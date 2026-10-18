import { Binary, Cable, Cpu, Network, ScanSearch, type LucideIcon } from 'lucide-react';
import type { ArcadeGame } from '@/labs/Arcade';

/** Icon and colour of each arena game (cards, play screen). */
export const GAME_ICON: Record<ArcadeGame, LucideIcon> = { device: ScanSearch, ports: Cable, order: Cpu, binary: Binary, subnet: Network };
export const GAME_TONE: Record<ArcadeGame, string> = { device: '#56dbf8', ports: '#ffb35c', order: '#52e3a4', binary: '#b7a2ff', subnet: '#ff8a7a' };
