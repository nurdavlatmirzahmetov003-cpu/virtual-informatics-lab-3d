import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CAMERA_STATES, type CameraStateName } from '@/data/camera/cameraStates';
import type { ResolvedBuild } from '@/lib/studio/build';
import { assemblyRig, resetAssemblyRig } from './assemblyRig';
import { assemblySteps, type StepTarget } from './steps';

const FINAL_SHOT: CameraStateName = 'HOME_WIDE';

function shotValues(name: CameraStateName) {
  const s = CAMERA_STATES[name];
  return { px: s.position[0], py: s.position[1], pz: s.position[2], tx: s.target[0], ty: s.target[1], tz: s.target[2] };
}

function tweenTarget(tl: gsap.core.Timeline, target: StepTarget, at: number, duration: number, ease: string) {
  if (target.kind === 'piece') tl.to(assemblyRig.pieces, { [target.key]: 1, duration, ease }, at);
  else if (target.kind === 'part') tl.to(assemblyRig.parts, { [target.key]: 1, duration, ease }, at);
  else tl.to(assemblyRig, { [target.key]: target.to, duration, ease }, at);
}

export interface AssemblyStepInfo {
  index: number;
  total: number;
  id: string;
}

interface SetupAssemblyTimelineProps {
  build: ResolvedBuild;
  /** Start only once the scene's models are loaded. */
  ready: boolean;
  /** prefers-reduced-motion: short version, no camera flights. */
  reduced: boolean;
  /** Changing it replays the sequence from the empty desk. */
  runId: number;
  /** Changing it jumps to the end. */
  skipToken: number;
  onStep?: (step: AssemblyStepInfo) => void;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Final setup assembly as one GSAP timeline (MASTER_PROMPT §15, §43): empty
 * desk → every selected product eases into place in order → the PC is opened,
 * filled, wired, lit and closed → monitor and room lights come on → the camera
 * settles on the hero angle with the lights slightly dimmed. Writes only
 * `assemblyRig`; any scene that reads the rig can replay it. Renders nothing.
 */
export function SetupAssemblyTimeline({ build, ready, reduced, runId, skipToken, onStep, onProgress, onComplete }: SetupAssemblyTimelineProps) {
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const callbacks = useRef({ onStep, onProgress, onComplete });
  useEffect(() => {
    callbacks.current = { onStep, onProgress, onComplete };
  });
  const buildRef = useRef(build);
  useEffect(() => {
    buildRef.current = build;
  });

  useEffect(() => {
    if (!ready) return;
    const steps = assemblySteps(buildRef.current);
    const speed = reduced ? 0.18 : 1;
    resetAssemblyRig(false);
    Object.assign(assemblyRig.camera, shotValues(reduced ? FINAL_SHOT : 'ASSEMBLY_START'));

    const tl = gsap.timeline({
      onUpdate: () => callbacks.current.onProgress?.(tl.progress()),
      onComplete: () => callbacks.current.onComplete?.(),
    });
    let t = reduced ? 0.2 : 0.9; // hold on the empty desk first
    let shot: CameraStateName = 'ASSEMBLY_START';
    steps.forEach((step, i) => {
      if (!reduced && step.shot !== shot) {
        // glide to the next station; the piece starts as the camera arrives
        tl.to(assemblyRig.camera, { ...shotValues(step.shot), duration: 1.3, ease: 'power2.inOut' }, t);
        t += 0.85;
        shot = step.shot;
      }
      tl.call(() => callbacks.current.onStep?.({ index: i + 1, total: steps.length, id: step.id }), undefined, t);
      const d = step.duration * speed;
      for (const target of step.targets) tweenTarget(tl, target, t, d, step.ease);
      t += d * 0.85 + 0.12 * speed;
    });
    // presentation: hero angle, lights settle slightly lower
    tl.call(() => callbacks.current.onStep?.({ index: steps.length, total: steps.length, id: 'present' }), undefined, t);
    if (!reduced) tl.to(assemblyRig.camera, { ...shotValues(FINAL_SHOT), duration: 2.4, ease: 'power2.inOut' }, t);
    tl.to(assemblyRig, { light: 0.85, duration: 2 * speed + 0.2, ease: 'power1.inOut' }, t + 0.2);

    timeline.current = tl;
    return () => {
      tl.kill();
      timeline.current = null;
    };
  }, [ready, reduced, runId]);

  useEffect(() => {
    if (skipToken > 0) timeline.current?.progress(1);
  }, [skipToken]);

  return null;
}
