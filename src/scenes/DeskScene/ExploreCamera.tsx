import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_STATES } from '@/data/camera/cameraStates';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { framingScale } from '@/lib/three/framing';
import { sceneFocus } from '@/lib/three/sceneFocus';
import { usePcStore } from '@/store/pcStore';
import { PART_INDEX, PARTS, partWorldCenter, type PartDef } from './pc/parts';
import { pcRig } from './pc/pcRig';
import { cameraHandoff } from './storyRig';
import { deviceCenter, DEVICE_DISTANCE, type DeviceId } from './devices';

/** Preferred viewing direction for part close-ups: front-left, slightly above. */
const VIEW_DIR = new Vector3(-0.62, 0.32, 0.72).normalize();

/**
 * Free 360° camera for explore mode: damped orbit + zoom (no pan), floor-safe
 * polar limit, auto-rotate, fly-to-part on selection and a reset to the
 * exploded overview. Starts exactly where the story camera left off.
 */
export function ExploreCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const size = useThree((s) => s.size);
  const controls = useRef<OrbitControlsImpl>(null);
  const reducedMotion = useReducedMotion();
  const selected = usePcStore((s) => s.selectedPart);
  const device = usePcStore((s) => s.selectedDevice);
  const autoRotate = usePcStore((s) => s.autoRotate);
  const resetToken = usePcStore((s) => s.resetToken);
  const fly = useRef({ active: false, part: null as PartDef | null, device: null as DeviceId | null, pos: new Vector3(), target: new Vector3(), dir: new Vector3() });

  useLayoutEffect(() => {
    const c = controls.current;
    if (!c) return;
    camera.clearViewOffset();
    c.target.copy(cameraHandoff.target);
    c.update();
  }, [camera]);

  useEffect(() => {
    const f = fly.current;
    if (!selected) return;
    f.part = PARTS[PART_INDEX[selected]];
    f.device = null;
    f.active = true;
  }, [selected]);

  useEffect(() => {
    if (!device) return;
    fly.current.part = null;
    fly.current.device = device;
    fly.current.active = true;
  }, [device]);

  useEffect(() => {
    if (resetToken === 0) return;
    const f = fly.current;
    const shot = CAMERA_STATES.EXPLODED;
    f.part = null;
    f.device = usePcStore.getState().selectedDevice;
    f.pos.set(...shot.position);
    f.target.set(...shot.target);
    f.active = true;
  }, [resetToken]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const cancel = () => {
      fly.current.active = false;
    };
    c.addEventListener('start', cancel);
    return () => c.removeEventListener('start', cancel);
  }, []);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const f = fly.current;
    const targetFov = device === 'mouse' ? 32 : device ? 36 : 38;
    const fovStep = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 3.5);
    if (Math.abs(camera.fov - targetFov) > 0.001) {
      camera.fov += (targetFov - camera.fov) * fovStep;
      camera.updateProjectionMatrix();
    }
    if (f.active) {
      if (f.part) {
        // follow the part while it moves (explode / assemble toggles)
        partWorldCenter(f.part, pcRig.explode, f.target);
        f.dir.copy(camera.position).sub(f.target).normalize().lerp(VIEW_DIR, 0.6).normalize();
        f.pos.copy(f.target).addScaledVector(f.dir, f.part.focusDistance * framingScale(aspect));
      } else if (f.device) {
        deviceCenter(f.device, f.target);
        f.dir.set(f.device === 'monitor' ? -0.12 : -0.62, f.device === 'keyboard' || f.device === 'mouse' ? 0.8 : 0.32, 0.9).normalize();
        f.pos.copy(f.target).addScaledVector(f.dir, DEVICE_DISTANCE[f.device] * framingScale(aspect));
      }
      const k = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 3.5);
      camera.position.lerp(f.pos, k);
      c.target.lerp(f.target, k);
      // arrived (and the part has stopped moving): hand control back so orbit / auto-rotate work
      const settled = Math.abs(pcRig.explode - (usePcStore.getState().exploded ? 1 : 0)) < 0.002;
      if (camera.position.distanceTo(f.pos) < 0.003 && c.target.distanceTo(f.target) < 0.003 && (!f.part || settled)) f.active = false;
    }
    cameraHandoff.target.copy(c.target);
    sceneFocus.target.copy(c.target);
    sceneFocus.bokehScale = f.part ? 1.4 : 0.5;
    if (device && aspect > 0.9) camera.setViewOffset(size.width, size.height, -size.width * 0.13, 0, size.width, size.height);
    else if (camera.view?.enabled) camera.clearViewOffset();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      enablePan={false}
      minDistance={0.14}
      maxDistance={5}
      // stay above the desk plane
      maxPolarAngle={Math.PI * 0.48}
      autoRotate={autoRotate && !reducedMotion}
      autoRotateSpeed={0.9}
    />
  );
}
