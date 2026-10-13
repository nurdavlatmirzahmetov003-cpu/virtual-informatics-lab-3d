import type { LucideIcon } from 'lucide-react';
import { Boxes, BrainCircuit, Cable, ClipboardCheck, Cpu, FlaskConical, Flame, LandPlot, Network, Trophy, Workflow, Wrench } from 'lucide-react';

export type ModuleId = 'space' | 'hardware' | 'assembly' | 'connect' | 'network' | 'algorithms' | 'logic' | 'experiments' | 'sim' | 'studio' | 'assignments' | 'results';

/**
 * ready — finished module · beta — works, still being improved ·
 * soon — not built yet: the card shows "Жақында" and links nowhere.
 */
export type ModuleStatus = 'ready' | 'beta' | 'soon';

export interface LabModule {
  id: ModuleId;
  icon: LucideIcon;
  status: ModuleStatus;
  to: string;
  /** Accent colour of the card. */
  tone: string;
  /** Bento size on wide screens. */
  size: 'wide' | 'normal';
}

export const LAB_MODULES: readonly LabModule[] = [
  { id: 'space', icon: LandPlot, status: 'beta', to: '/lab', tone: '#e879f9', size: 'wide' },
  { id: 'hardware', icon: Cpu, status: 'ready', to: '/explorer', tone: '#38d6f5', size: 'wide' },
  { id: 'assembly', icon: Wrench, status: 'ready', to: '/labs/assembly', tone: '#ffb547', size: 'normal' },
  { id: 'connect', icon: Cable, status: 'beta', to: '/labs/connect', tone: '#f97316', size: 'normal' },
  { id: 'network', icon: Network, status: 'ready', to: '/labs/network', tone: '#3ddc97', size: 'normal' },
  { id: 'algorithms', icon: Workflow, status: 'ready', to: '/labs/algorithms', tone: '#a78bfa', size: 'normal' },
  { id: 'logic', icon: BrainCircuit, status: 'ready', to: '/labs/logic', tone: '#ff7ab6', size: 'normal' },
  { id: 'experiments', icon: FlaskConical, status: 'ready', to: '/labs/experiments', tone: '#7dd3fc', size: 'normal' },
  { id: 'sim', icon: Flame, status: 'beta', to: '/labs/sim', tone: '#f87171', size: 'normal' },
  { id: 'studio', icon: Boxes, status: 'ready', to: '/studio', tone: '#3b82ff', size: 'wide' },
  { id: 'assignments', icon: ClipboardCheck, status: 'ready', to: '/assignments', tone: '#facc15', size: 'normal' },
  { id: 'results', icon: Trophy, status: 'ready', to: '/progress', tone: '#3ddc97', size: 'normal' },
];
