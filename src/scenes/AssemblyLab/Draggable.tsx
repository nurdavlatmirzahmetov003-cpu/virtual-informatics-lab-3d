import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Plane, Quaternion, Raycaster, Vector2, Vector3, type Group } from 'three';
import { STEPS, type StepId } from '@/labs/AssemblyLab';
import { useAssemblyLabStore } from '@/store/assemblyLabStore';
import { SETTLE_MS, dragState, resolveTarget } from './dragState';
import { NEAR, SNAP, targetPosition } from './layout';
import styles from './labels.module.css';

interface Props {
  step: StepId;
  /** Visual centre while waiting (world). */
  rest: (installed: readonly StepId[]) => Vector3;
  rotation: (installed: readonly StepId[]) => Quaternion;
  /** Visual centre relative to the part origin (part orientation). */
  center: Vector3;
  /** Hidden after install (an installed twin takes over). */
  handOver: boolean;
  /** False once nothing can be done with it. */
  grabbable: boolean;
  label: string;
  children: ReactNode;
}

/**
 * Pick-up / carry / release in 3D. The part moves on a camera-facing plane
 * through its target, so it slides towards the right spot naturally; on
 * release the store decides (install, order mistake, wrong slot, or just
 * back to the tray).
 */
export function Draggable({ step, rest, rotation, center, handOver, grabbable, label, children }: Props) {
  const group = useRef<Group>(null);
  const turn = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const getState = useThree((s) => s.get);
  const raycaster = useMemo(() => new Raycaster(), []);
  const ndc = useMemo(() => new Vector2(), []);
  const installedAt = useAssemblyLabStore((s) => s.installedAt[step]);
  const hinted = useAssemblyLabStore((s) => s.hinted === step);
  const pos = useMemo(() => new Vector3(), []);
  const quat = useMemo(() => new Quaternion(), []);
  const hit = useMemo(() => new Vector3(), []);
  const offset = useMemo(() => new Vector3(), []);
  const init = useRef(false);
  const drag = useRef<{ plane: Plane } | null>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const { assembly } = useAssemblyLabStore.getState();
    const installed = assembly.installed;
    const goalRot = rotation(installed);
    let goal: Vector3;
    const done = installed.includes(step);
    if (drag.current) goal = hit;
    else if (done) goal = targetPosition(STEPS[step].target, installed);
    else goal = rest(installed);
    if (!init.current) {
      pos.copy(goal);
      quat.copy(goalRot);
      init.current = true;
    }
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * (drag.current ? 22 : 9));
    const before = pos.clone();
    pos.lerp(goal, k);
    quat.slerp(goalRot, k);
    dragState.moving = Math.max(dragState.moving, before.distanceTo(pos) > 1e-4 ? 1 : 0);
    g.position.copy(pos);
    turn.current?.quaternion.copy(quat);
    if (inner.current) inner.current.position.copy(offset.copy(center).negate());
    g.visible = !(handOver && done && installedAt !== undefined && performance.now() - installedAt > SETTLE_MS);
    if (labelRef.current) labelRef.current.dataset.hidden = String(!grabbable || done || Boolean(drag.current));
    if (drag.current) {
      dragState.step = step;
      dragState.pos.copy(pos);
      // judged at the cursor, like the release itself
      const d = hit.distanceTo(targetPosition(STEPS[step].target, installed));
      dragState.near = d < NEAR;
      dragState.snap = d < SNAP;
    }
  });

  // carrying is tracked on window: the pointer may leave the part (and the canvas) mid-drag
  const listeners = useRef<(() => void) | null>(null);
  useEffect(() => () => listeners.current?.(), []);

  const release = (clientX: number, clientY: number, cancelled: boolean) => {
    listeners.current?.();
    listeners.current = null;
    if (!drag.current) return;
    project(clientX, clientY);
    drag.current = null;
    dragState.step = null;
    dragState.near = dragState.snap = false;
    const controls = getState().controls as { enabled: boolean } | null;
    if (controls) controls.enabled = true;
    const s = useAssemblyLabStore.getState();
    if (cancelled) s.endDrag();
    else s.drop(step, resolveTarget(step, hit, s.assembly.installed)); // where the cursor is, not the smoothed part
  };

  /** Pointer (client px) → point on the carry plane; the projection includes the view offset. */
  const project = (clientX: number, clientY: number) => {
    const d = drag.current;
    if (!d) return;
    const r = gl.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(d.plane, hit);
  };

  const begin = (e: ThreeEvent<PointerEvent>) => {
    const s = useAssemblyLabStore.getState();
    if (!grabbable || s.report || s.assembly.installed.includes(step) || e.button !== 0 || drag.current) return;
    e.stopPropagation();
    const target = targetPosition(STEPS[step].target, s.assembly.installed);
    // carried on a camera-facing plane through its target: under the cursor, and able to reach the slot exactly
    const normal = camera.getWorldDirection(new Vector3()).negate();
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, target);
    hit.copy(e.ray.intersectPlane(plane, new Vector3()) ?? pos);
    drag.current = { plane };
    // stop the orbit at once (the React prop catches up a frame later)
    const controls = getState().controls as { enabled: boolean } | null;
    if (controls) controls.enabled = false;
    s.startDrag(step);
    const onMove = (ev: PointerEvent) => ev.pointerId === e.pointerId && project(ev.clientX, ev.clientY);
    const onUp = (ev: PointerEvent) => ev.pointerId === e.pointerId && release(ev.clientX, ev.clientY, false);
    const onCancel = (ev: PointerEvent) => ev.pointerId === e.pointerId && release(ev.clientX, ev.clientY, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    listeners.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  };

  return (
    <group
      ref={group}
      onPointerDown={begin}
      onPointerOver={(e) => {
        if (!grabbable) return;
        e.stopPropagation();
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <group ref={turn}>
        <group ref={inner}>{children}</group>
      </group>
      {/* always mounted: unmounting an Html root mid-render makes React complain */}
      <Html position={[0, 0.07, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
        <span ref={labelRef} className={styles.label} data-hinted={hinted} data-hidden={!grabbable}>
          {label}
        </span>
      </Html>
    </group>
  );
}
