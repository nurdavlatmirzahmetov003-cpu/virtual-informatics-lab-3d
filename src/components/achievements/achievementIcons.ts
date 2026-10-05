import { BadgePercent, BrainCircuit, Compass, Cpu, FlaskConical, Footprints, Gem, GraduationCap, Milestone, Mountain, Network, PcCase, Sparkles, Workflow, type LucideIcon } from 'lucide-react';
import type { AchievementId } from '@/services/progress';

export const ACHIEVEMENT_ICONS: Record<AchievementId, LucideIcon> = {
  firstStep: Footprints,
  firstComputer: PcCase,
  perfectBuild: Gem,
  hardwareExpert: Cpu,
  networkMaster: Network,
  algorithmExplorer: Workflow,
  logicEngineer: BrainCircuit,
  experimenter: FlaskConical,
  lab100: BadgePercent,
  selfMade: Sparkles,
  persistent: Mountain,
  allRounder: Compass,
  halfway: Milestone,
  graduate: GraduationCap,
};
