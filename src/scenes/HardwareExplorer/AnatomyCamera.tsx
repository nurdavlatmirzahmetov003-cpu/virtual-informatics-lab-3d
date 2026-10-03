import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_STATES } from '@/data/camera/cameraStates';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { framingScale } from '@/lib/three/framing';
import { useAnatomyStore } from '@/store/anatomyStore';
import { itemCenter, OVERVIEW, PLACEMENTS } from './layout';

/** Overlay sizes (px) of ExplorerPage: the subject is framed in the space they leave free. */
const LIST_W = 368;
const PANEL_W = 488;
const WIDE = 960;

/** Free area of the canvas and the view offset that centres the subject in it. */
function freeArea(width: number, height: number, focused: boolean) {
  const wide = width >= WIDE;
  const left = wide ? LIST_W : 0;
  const right = wide && focused ? PANEL_W : 0;
  const top = wide ? 64 : focused ? 110 : 290;
  const bottom = wide ? 0 : focused ? height * 0.5 + 12 : 90;
  const w = Math.max(1, width - left - right);
  const h = Math.max(1, height - top - bottom);
  // shots are tuned for a desktop canvas below the top bar; pull back when less height is free
  const scale = Math.max(framingScale(w / h), Math.min(2.4, (height - 64) / h));
  return { scale, x: width / 2 - (left + w / 2), y: height / 2 - (top + h / 2) };
}

/**
 * Overview of the active category ↔ smooth fly-to on the selected device.
 * Any drag cancels a running flight; the view offset keeps the subject
 * centred in the area left free by the list and the info panel.
 */
export function AnatomyCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const controls = useRef<OrbitControlsImpl>(null);
  const reduced = useReducedMotion();
  const category = useAnatomyStore((s) => s.category);
  const selected = useAnatomyStore((s) => s.selected);
  const resetToken = useAnatomyStore((s) => s.resetToken);
  const fly = useRef({ active: true, pos: new Vector3(), target: new Vector3(), fov: 36 });
  const offset = useRef({ x: 0, y: 0 });
  const shot = CAMERA_STATES[OVERVIEW[category]];

  useEffect(() => {
    const f = fly.current;
    const overviewPos = new Vector3(...shot.position);
    const placement = selected ? PLACEMENTS[category].find((p) => p.id === selected) : undefined;
    // frame for the area the overlays leave free, not the whole canvas
    const { scale } = freeArea(size.width, size.height, Boolean(placement));
    if (placement) {
      f.target.set(...itemCenter(placement));
      // look from where the overview camera stands, a little higher for flat parts
      const dir = overviewPos.sub(f.target).normalize();
      if (category === 'internal') dir.y = Math.max(dir.y, 0.75);
      dir.normalize();
      f.pos.copy(f.target).addScaledVector(dir, placement.distance * scale);
    } else {
      f.target.set(...shot.target);
      f.pos.copy(overviewPos).sub(f.target).multiplyScalar(scale).add(f.target);
    }
    f.fov = shot.fov;
    f.active = true;
  }, [category, selected, resetToken, shot, size.width, size.height]);

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
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 3.2);
    if (f.active) {
      camera.position.lerp(f.pos, k);
      c.target.lerp(f.target, k);
      if (camera.position.distanceTo(f.pos) < 0.002 && c.target.distanceTo(f.target) < 0.002) f.active = false;
    }
    if (Math.abs(camera.fov - f.fov) > 0.01) {
      camera.fov += (f.fov - camera.fov) * k;
      camera.updateProjectionMatrix();
    }

    // keep the subject in the free area between the overlays
    const goal = freeArea(size.width, size.height, useAnatomyStore.getState().selected !== null);
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
      maxDistance={(shot.maxDistance ?? 3) * framingScale(aspect)}
      // stay above the desk plane
      maxPolarAngle={Math.PI * 0.47}
    />
  );
}
