import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_STATES } from '@/data/camera/cameraStates';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { framingScale } from '@/lib/three/framing';
import { useStudioStore } from '@/store/studioStore';

/** Overlay sizes (px) of SetupStudioPage, so the setup is framed in the space they leave free. */
const LEFT_W = 416;
const RIGHT_W = 356;
const WIDE = 1280;
/** The room has a wall behind the desk: orbit stops ±0.6π from the front. */
const AZIMUTH_LIMIT = Math.PI * 0.6;

function freeArea(width: number, height: number) {
  const wide = width >= WIDE;
  const left = wide ? LEFT_W : 0;
  const right = wide ? RIGHT_W : 0;
  const top = wide ? 64 : 120;
  const bottom = wide ? 64 : height * 0.48;
  const w = Math.max(1, width - left - right);
  const h = Math.max(1, height - top - bottom);
  const scale = Math.max(framingScale(w / h), Math.min(2.2, (height - 128) / h));
  return { scale, x: width / 2 - (left + w / 2), y: height / 2 - (top + h / 2) };
}

/**
 * 360° viewer: damped orbit + zoom (no pan), reset to the start shot, slow
 * auto-rotation sweep. A reset flight is cancelled as soon as the user drags.
 */
export function StudioCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useRef<OrbitControlsImpl>(null);
  const reduced = useReducedMotion();
  const autoRotate = useStudioStore((s) => s.autoRotate);
  const resetToken = useStudioStore((s) => s.cameraReset);
  const fly = useRef({ active: true, pos: new Vector3(), target: new Vector3() });
  const offset = useRef({ x: 0, y: 0 });
  const sweep = useRef(1);
  const shot = CAMERA_STATES.STUDIO_WIDE;

  useEffect(() => {
    const f = fly.current;
    const { scale } = freeArea(size.width, size.height);
    f.target.set(...shot.target);
    f.pos.set(...shot.position).sub(f.target).multiplyScalar(scale).add(f.target);
    f.active = true;
  }, [resetToken, shot, size.width, size.height]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const cancel = () => {
      fly.current.active = false;
    };
    c.addEventListener('start', cancel);
    return () => c.removeEventListener('start', cancel);
  }, []);

  useEffect(() => () => camera.clearViewOffset(), [camera]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const f = fly.current;
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 3);
    if (f.active) {
      camera.position.lerp(f.pos, k);
      c.target.lerp(f.target, k);
      if (camera.position.distanceTo(f.pos) < 0.002 && c.target.distanceTo(f.target) < 0.002) f.active = false;
    }
    // Auto-rotation sweeps back and forth: the wall behind the desk closes the circle.
    if (autoRotate && !reduced && !f.active) {
      const az = c.getAzimuthalAngle();
      if (az > AZIMUTH_LIMIT * 0.92) sweep.current = -1;
      else if (az < -AZIMUTH_LIMIT * 0.92) sweep.current = 1;
      c.setAzimuthalAngle(az + sweep.current * Math.min(delta, 0.05) * 0.22);
    }
    const goal = freeArea(size.width, size.height);
    const o = offset.current;
    o.x += (goal.x - o.x) * k;
    o.y += (goal.y - o.y) * k;
    if (Math.abs(o.x) < 0.5 && Math.abs(o.y) < 0.5) {
      if (camera.view?.enabled) camera.clearViewOffset();
    } else {
      camera.setViewOffset(size.width, size.height, o.x, o.y, size.width, size.height);
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      enablePan={false}
      minDistance={shot.minDistance}
      maxDistance={shot.maxDistance}
      // stay above the floor and out of the wall behind the desk
      maxPolarAngle={Math.PI * 0.48}
      minAzimuthAngle={-AZIMUTH_LIMIT}
      maxAzimuthAngle={AZIMUTH_LIMIT}
    />
  );
}
