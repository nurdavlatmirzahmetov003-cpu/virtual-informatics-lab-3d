/**
 * Lab camera: animated flights between the overview and the zones, orbit and
 * zoom (mouse, touch, keyboard) around the current subject, and the pose the
 * minimap draws. A drag cancels a running flight; reduced motion jumps.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Spherical, Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { LAB_ORBIT, LAB_OVERVIEW } from '@/data/lab/zones';
import { clampToHall, shotFor } from '@/lib/lab/navigation';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { framingScale } from '@/lib/three/framing';
import { labCameraPose, useLabStore } from '@/store/labStore';

/** Overlay widths (px): the subject is framed in the canvas area they leave free. */
const PANEL_W = 380;
const WIDE = 960;

/** Smooth-step flight: duration grows with the distance, 0.9–2.2 s. */
interface Flight {
  active: boolean;
  t: number;
  duration: number;
  fromPos: Vector3;
  fromTarget: Vector3;
  toPos: Vector3;
  toTarget: Vector3;
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function LabCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<OrbitControlsImpl>(null);
  const reduced = useReducedMotion();
  const focus = useLabStore((s) => s.focus);
  const token = useLabStore((s) => s.flightToken);
  const flight = useRef<Flight>({ active: false, t: 0, duration: 1, fromPos: new Vector3(), fromTarget: new Vector3(), toPos: new Vector3(), toTarget: new Vector3() });
  const nudged = useRef({ zoom: 0, orbit: 0 });
  const tmp = useRef({ s: new Spherical(), v: new Vector3() });
  const aspect = size.width / Math.max(1, size.height);

  // start a flight whenever the focus changes or a reset is requested
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const shot = shotFor(focus);
    const f = flight.current;
    const target = new Vector3(...shot.target);
    // pull back on narrow screens so the subject fits
    const pos = new Vector3(...shot.position).sub(target).multiplyScalar(focus ? framingScale(aspect) : Math.max(1, framingScale(aspect) * 0.92)).add(target);
    f.fromPos.copy(camera.position);
    f.fromTarget.copy(c.target);
    f.toPos.copy(pos);
    f.toTarget.copy(target);
    const span = f.fromPos.distanceTo(f.toPos) + f.fromTarget.distanceTo(f.toTarget);
    f.duration = Math.min(2.2, Math.max(0.9, span / 9));
    f.t = 0;
    f.active = true;
    invalidate();
  }, [focus, token, camera, aspect, invalidate]);

  // a drag or wheel cancels the flight (the user takes over)
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const cancel = () => {
      flight.current.active = false;
    };
    c.addEventListener('start', cancel);
    return () => c.removeEventListener('start', cancel);
  }, []);

  // the hall is ~25 m across: see all of it from the (pulled-back) portrait overview
  useEffect(() => {
    const far = camera.far;
    camera.far = 140;
    camera.updateProjectionMatrix();
    return () => {
      camera.far = far;
      camera.updateProjectionMatrix();
    };
  }, [camera]);

  // overlay panel on the left on wide screens: shift the frame right
  useEffect(() => {
    if (size.width >= WIDE) camera.setViewOffset(size.width, size.height, -PANEL_W / 2, 0, size.width, size.height);
    else camera.clearViewOffset();
    return () => camera.clearViewOffset();
  }, [camera, size.width, size.height]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const f = flight.current;
    if (f.active) {
      f.t = reduced ? 1 : Math.min(1, f.t + delta / f.duration);
      const k = ease(f.t);
      camera.position.lerpVectors(f.fromPos, f.toPos, k);
      // arc a little higher mid-flight so the camera clears furniture
      camera.position.y += Math.sin(Math.PI * k) * Math.min(2.5, f.fromPos.distanceTo(f.toPos) * 0.12);
      c.target.lerpVectors(f.fromTarget, f.toTarget, k);
      if (f.t >= 1) f.active = false;
    }

    // keyboard / button nudges: zoom and orbit steps around the target
    const { nudge } = useLabStore.getState();
    const dz = nudge.zoom - nudged.current.zoom;
    const dorbit = nudge.orbit - nudged.current.orbit;
    if (dz || dorbit) {
      nudged.current = { ...nudge };
      f.active = false;
      const { s, v } = tmp.current;
      v.copy(camera.position).sub(c.target);
      s.setFromVector3(v);
      const limits = useLabStore.getState().focus ? LAB_ORBIT.zone : LAB_ORBIT.overview;
      s.radius = Math.min(limits.max, Math.max(limits.min, s.radius * Math.pow(0.85, dz)));
      s.theta += dorbit * 0.35;
      camera.position.copy(c.target).add(v.setFromSpherical(s));
    }

    // distance limits apply once the camera has arrived (a flight crosses them)
    const lim = useLabStore.getState().focus ? LAB_ORBIT.zone : LAB_ORBIT.overview;
    c.minDistance = f.active ? 0.3 : lim.min;
    c.maxDistance = f.active ? 100 : lim.max * (useLabStore.getState().focus ? 1 : Math.max(1, framingScale(aspect)));

    // never orbit around a point outside the hall
    const t = clampToHall([c.target.x, c.target.y, c.target.z]);
    c.target.set(t[0], t[1], t[2]);
    c.update();

    labCameraPose.x = camera.position.x;
    labCameraPose.z = camera.position.z;
    labCameraPose.yaw = Math.atan2(c.target.x - camera.position.x, c.target.z - camera.position.z);
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      enablePan={false}
      minPolarAngle={0.15}
      // stay above the floor
      maxPolarAngle={focus ? Math.PI * 0.48 : Math.PI * 0.42}
      target={[...LAB_OVERVIEW.target]}
    />
  );
}
