import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Spherical, Vector3, type PerspectiveCamera } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { framingScale } from '@/lib/three/framing';
import { sceneFocus } from '@/lib/three/sceneFocus';
import { CHAPTERS, STORY_TIMING } from './chapters';
import { storyRig } from './storyRig';

const YAW_LIMIT = 0.55;
const PITCH_LIMIT = 0.22;
/**
 * Portrait screens: the hero copy sits at the top (subject pushed down), the
 * info panels are a bottom sheet (subject lifted). Fractions of view height.
 */
const PORTRAIT_SHIFT = { hero: -0.14, panels: 0.2 };
/** Story progress range of the hero → first chapter transition. */
const STORY_LENGTH = STORY_TIMING.firstHold + (CHAPTERS.length - 1) * (STORY_TIMING.transition + STORY_TIMING.hold);
const HERO_EXIT = [
  STORY_TIMING.firstHold / STORY_LENGTH,
  (STORY_TIMING.firstHold + STORY_TIMING.transition) / STORY_LENGTH,
] as const;

/**
 * Camera for the scroll story. Position / target / FOV come from the GSAP
 * timeline (via storyRig); the user can additionally drag to orbit around
 * the current subject with inertia. Double-click resets the orbit.
 */
export function StoryCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const element = useThree((s) => s.gl.domElement);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const reducedMotion = useReducedMotion();

  const drag = useRef({ active: false, x: 0, y: 0, yaw: 0, pitch: 0, yawGoal: 0, pitchGoal: 0 });
  const tmp = useRef({ target: new Vector3(), offset: new Vector3(), sph: new Spherical() });

  useEffect(() => () => camera.clearViewOffset(), [camera]);

  useEffect(() => {
    const d = drag.current;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      d.active = true;
      d.x = e.clientX;
      d.y = e.clientY;
      element.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!d.active) return;
      d.yawGoal = Math.max(-YAW_LIMIT, Math.min(YAW_LIMIT, d.yawGoal - (e.clientX - d.x) * 0.005));
      d.pitchGoal = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, d.pitchGoal + (e.clientY - d.y) * 0.003));
      d.x = e.clientX;
      d.y = e.clientY;
    };
    const up = (e: PointerEvent) => {
      d.active = false;
      if (element.hasPointerCapture(e.pointerId)) element.releasePointerCapture(e.pointerId);
    };
    const reset = () => {
      d.yawGoal = 0;
      d.pitchGoal = 0;
    };
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    element.addEventListener('dblclick', reset);
    return () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
      element.removeEventListener('dblclick', reset);
    };
  }, [element]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const r = storyRig;
    const d = drag.current;
    const { target, offset, sph } = tmp.current;

    // inertia toward the drag goal
    const k = 1 - Math.exp(-dt * 7);
    d.yaw += (d.yawGoal - d.yaw) * k;
    d.pitch += (d.pitchGoal - d.pitch) * k;

    // slow idle drift on the opening shot only
    const idleWeight = reducedMotion || d.active ? 0 : Math.max(0, 1 - r.progress / 0.06);
    const idle = Math.sin(state.clock.elapsedTime * 0.16) * 0.07 * idleWeight;

    target.set(r.tx, r.ty, r.tz);
    offset.set(r.px - r.tx, r.py - r.ty, r.pz - r.tz).multiplyScalar(framingScale(aspect));
    sph.setFromVector3(offset);
    sph.theta += d.yaw + idle;
    sph.phi = Math.max(0.25, Math.min(1.45, sph.phi - d.pitch));
    offset.setFromSpherical(sph);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    if (Math.abs(camera.fov - r.fov) > 0.001) {
      camera.fov = r.fov;
      camera.updateProjectionMatrix();
    }

    if (aspect < 0.9) {
      const t = Math.min(1, Math.max(0, (r.progress - HERO_EXIT[0]) / (HERO_EXIT[1] - HERO_EXIT[0])));
      const shift = PORTRAIT_SHIFT.hero + (PORTRAIT_SHIFT.panels - PORTRAIT_SHIFT.hero) * t * t * (3 - 2 * t);
      camera.setViewOffset(size.width, size.height, 0, size.height * shift, size.width, size.height);
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    }

    sceneFocus.target.set(r.fx, r.fy, r.fz);
    sceneFocus.bokehScale = r.bokeh;
  });

  return null;
}
