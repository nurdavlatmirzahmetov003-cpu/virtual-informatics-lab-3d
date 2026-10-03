import type { LucideIcon } from 'lucide-react';
import {
  Armchair,
  Box,
  CircuitBoard,
  CodeXml,
  Cpu,
  Fan,
  Gamepad2,
  Gpu,
  GraduationCap,
  HardDrive,
  Headphones,
  Keyboard,
  Layers,
  MemoryStick,
  Monitor,
  Mouse,
  PcCase,
  Radio,
  Speaker,
  Table2,
  Zap,
} from 'lucide-react';
import type { HardwareCategory, SetupPurpose } from '@/data/hardware/types';

export const CATEGORY_ICON: Record<HardwareCategory, LucideIcon> = {
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
  speakers: Speaker,
  desk: Table2,
  chair: Armchair,
  case: PcCase,
  cpu: Cpu,
  cooling: Fan,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  gpu: Gpu,
  ssd: HardDrive,
  psu: Zap,
};

export const PURPOSE_ICON: Record<SetupPurpose, LucideIcon> = {
  gaming: Gamepad2,
  study: GraduationCap,
  programming: CodeXml,
  design3d: Box,
  streaming: Radio,
  universal: Layers,
};
