import type { CameraStateName } from '@/data/camera/cameraStates';
import type { ResolvedBuild } from '@/lib/studio/build';
import type { PartId } from '@/scenes/DeskScene/pc/parts';
import type { PieceKey } from './assemblyRig';

/** What a step animates in assemblyRig. */
export type StepTarget =
  | { kind: 'piece'; key: PieceKey }
  | { kind: 'part'; key: PartId }
  | { kind: 'value'; key: 'glassOpen' | 'cables' | 'fanSpeed' | 'rgb' | 'monitorOn' | 'light'; to: number };

export interface AssemblyStep {
  /** Caption key under `assembly.steps`. */
  id: string;
  shot: CameraStateName;
  targets: readonly StepTarget[];
  /** Seconds at full speed. */
  duration: number;
  ease: string;
}

const piece = (key: PieceKey): StepTarget => ({ kind: 'piece', key });
const part = (key: PartId): StepTarget => ({ kind: 'part', key });

/**
 * The cinematic order (MASTER_PROMPT §15), keeping only what the user built:
 * desk set first, then the system unit opened, filled, wired, lit, closed,
 * and finally the monitor and the room lights come on.
 */
export function assemblySteps(build: ResolvedBuild): AssemblyStep[] {
  const settle = 'power3.out';
  const glide = 'power2.inOut';
  const steps: Array<AssemblyStep | false> = [
    !!build.monitor && { id: 'monitorStand', shot: 'ASSEMBLY_MONITOR', targets: [piece('monitorStand')], duration: 1.1, ease: settle },
    !!build.monitor && { id: 'monitor', shot: 'ASSEMBLY_MONITOR', targets: [piece('monitor')], duration: 1.3, ease: settle },
    { id: 'mat', shot: 'ASSEMBLY_DESK', targets: [piece('mat')], duration: 1.2, ease: glide },
    !!build.keyboard && { id: 'keyboard', shot: 'ASSEMBLY_DESK', targets: [piece('keyboard')], duration: 1.1, ease: settle },
    !!build.mouse && { id: 'mouse', shot: 'ASSEMBLY_DESK', targets: [piece('mouse')], duration: 1.0, ease: settle },
    !!build.speakers && { id: 'speakers', shot: 'ASSEMBLY_AUDIO', targets: [piece('speakers')], duration: 1.1, ease: settle },
    !!build.headset && { id: 'headsetStand', shot: 'ASSEMBLY_AUDIO', targets: [piece('headsetStand')], duration: 0.9, ease: settle },
    !!build.headset && { id: 'headset', shot: 'ASSEMBLY_AUDIO', targets: [piece('headset')], duration: 0.9, ease: settle },
    !!build.chair && { id: 'chair', shot: 'ASSEMBLY_START', targets: [piece('chair')], duration: 1.4, ease: glide },
    !!build.case && { id: 'pcCase', shot: 'ASSEMBLY_PC', targets: [piece('pcCase')], duration: 1.4, ease: settle },
    !!build.case && { id: 'sidePanel', shot: 'ASSEMBLY_PC', targets: [{ kind: 'value', key: 'glassOpen', to: 1 }], duration: 1.5, ease: glide },
    !!build.motherboard && { id: 'motherboard', shot: 'PC_INTERIOR', targets: [part('motherboard')], duration: 1.3, ease: settle },
    !!build.cpu && { id: 'cpu', shot: 'PC_INTERIOR', targets: [part('cpu')], duration: 1.1, ease: settle },
    !!build.ram && { id: 'ram', shot: 'PC_INTERIOR', targets: [part('ram')], duration: 1.0, ease: settle },
    !!build.ssd && { id: 'ssd', shot: 'PC_INTERIOR', targets: [part('ssd')], duration: 0.9, ease: settle },
    !!build.cooling && { id: 'cooler', shot: 'PC_INTERIOR', targets: [part('cooler')], duration: 1.1, ease: settle },
    !!build.psu && { id: 'psu', shot: 'PC_INTERIOR', targets: [part('psu')], duration: 1.1, ease: settle },
    !!build.gpu && { id: 'gpu', shot: 'PC_INTERIOR', targets: [part('gpu')], duration: 1.3, ease: settle },
    !!build.case && { id: 'cables', shot: 'PC_INTERIOR', targets: [{ kind: 'value', key: 'cables', to: 1 }], duration: 0.7, ease: 'power1.inOut' },
    !!build.case && { id: 'fans', shot: 'PC_INTERIOR', targets: [{ kind: 'value', key: 'fanSpeed', to: 1 }], duration: 1.4, ease: 'power2.in' },
    !!build.case && { id: 'rgb', shot: 'ASSEMBLY_PC', targets: [{ kind: 'value', key: 'rgb', to: 1 }], duration: 1.0, ease: 'power1.inOut' },
    !!build.case && { id: 'glassClose', shot: 'ASSEMBLY_PC', targets: [{ kind: 'value', key: 'glassOpen', to: 0 }], duration: 1.5, ease: glide },
    !!build.monitor && { id: 'monitorOn', shot: 'ASSEMBLY_MONITOR', targets: [{ kind: 'value', key: 'monitorOn', to: 1 }], duration: 1.0, ease: 'power2.out' },
    { id: 'lights', shot: 'ASSEMBLY_START', targets: [{ kind: 'value', key: 'light', to: 1 }], duration: 1.4, ease: 'power2.inOut' },
  ];
  return steps.filter((s): s is AssemblyStep => Boolean(s));
}
