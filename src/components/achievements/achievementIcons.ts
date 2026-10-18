import { Award, BadgePercent, BrainCircuit, Cable, CalendarCheck2, Compass, Cpu, Flame, FlaskConical, Footprints, Gauge, Gem, GraduationCap, Layers, Milestone, Mountain, Network, PcCase, Sparkles, Trophy, Workflow, Wrench, Zap, type LucideIcon } from 'lucide-react';
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
  honors: Award,
  streak3: Flame,
  streak7: Zap,
  dailyFive: CalendarCheck2,
  weeklyHero: Trophy,
  teardownPro: Layers,
  connector: Cable,
  fixer: Wrench,
  speedrun: Gauge,
};
