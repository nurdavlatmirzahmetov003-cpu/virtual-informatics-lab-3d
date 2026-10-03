import type { LucideIcon } from 'lucide-react';
import { Boxes, BrainCircuit, ClipboardCheck, Cpu, FlaskConical, Network, Trophy, Workflow, Wrench } from 'lucide-react';

export type ModuleId = 'hardware' | 'assembly' | 'network' | 'algorithms' | 'logic' | 'experiments' | 'studio' | 'assignments' | 'results';

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
  { id: 'hardware', icon: Cpu, status: 'ready', to: '/explorer', tone: '#38d6f5', size: 'wide' },
  { id: 'assembly', icon: Wrench, status: 'ready', to: '/labs/assembly', tone: '#ffb547', size: 'normal' },
  { id: 'network', icon: Network, status: 'ready', to: '/labs/network', tone: '#3ddc97', size: 'normal' },
  { id: 'algorithms', icon: Workflow, status: 'beta', to: '/labs/algorithms', tone: '#a78bfa', size: 'normal' },
  { id: 'logic', icon: BrainCircuit, status: 'beta', to: '/labs/logic', tone: '#ff7ab6', size: 'normal' },
  { id: 'experiments', icon: FlaskConical, status: 'beta', to: '/labs/experiments', tone: '#7dd3fc', size: 'normal' },
  { id: 'studio', icon: Boxes, status: 'ready', to: '/studio', tone: '#3b82ff', size: 'wide' },
  { id: 'assignments', icon: ClipboardCheck, status: 'ready', to: '/assignments', tone: '#facc15', size: 'normal' },
  { id: 'results', icon: Trophy, status: 'ready', to: '/progress', tone: '#3ddc97', size: 'normal' },
];
