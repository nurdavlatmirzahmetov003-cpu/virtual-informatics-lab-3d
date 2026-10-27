/**
 * V4 §4.2: one robot in 360° — its own small canvas, drag to rotate, wheel
 * or pinch (and the page's buttons) to zoom, optional auto-spin, and the
 * pose the page asks for (idle, work, wave, dance). The robot wears what
 * the student dressed it in. Procedural lighting: nothing is downloaded.
 */
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { robotById, type RobotId } from '@/data/robots/roster';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import type { WardrobeSlot } from '@/services/robots/economy';
import { Robot, type RobotParts } from '@/scenes/LabSpace/robots/Robot';
import { poseRobot, type RobotPose } from '@/scenes/LabSpace/robots/robotMotion';

export interface RobotViewerHandle {
  zoom(dir: 1 | -1): void;
  reset(): void;
}

interface Props {
  robot: RobotId;
  pose: RobotPose;
  spin: boolean;
  wear: Partial<Record<WardrobeSlot, string>>;
  label: string;
}

const HOME = { position: [1.1, 1.0, 2.3] as const, target: [0, 0.55, 0] as const };

const RobotViewer3D = forwardRef<RobotViewerHandle, Props>(function RobotViewer3D({ robot, pose, spin, wear, label }, ref) {
  const reduced = useReducedMotion();
  const controls = useRef<OrbitControlsImpl>(null);
  const r = robotById(robot);

  useImperativeHandle(ref, () => ({
    zoom(dir) {
      const c = controls.current;
      if (!c) return;
      const cam = c.object;
      const v = cam.position.clone().sub(c.target).multiplyScalar(dir > 0 ? 0.8 : 1.25);
      const len = Math.min(c.maxDistance, Math.max(c.minDistance, v.length()));
      cam.position.copy(c.target).add(v.setLength(len));
      c.update();
    },
    reset() {
      const c = controls.current;
      if (!c) return;
      c.object.position.set(...HOME.position);
      c.target.set(...HOME.target);
      c.update();
    },
  }));

  // the kit builds robots 1–1.65 m tall: show each about the same size
  const scale = useMemo(() => (r.kind === 'cleaner' ? 1.7 : 1.15 / Math.max(1, { advisor: 1.34, courier: 1.0, presenter: 1.65, builder: 1.36, teacher: 1.4, guard: 1.48, inspector: 1.45, librarian: 1.36, coach: 1.42, bit: 1.1, cleaner: 0.2 }[r.kind])), [r.kind]);
  const animate = useMemo(() => (p: RobotParts, t: number) => poseRobot(r.kind, p, pose, t), [r.kind, pose]);

  return (
    <Canvas
      role="img"
      aria-label={label}
      dpr={[1, 1.75]}
      shadows
      camera={{ position: [...HOME.position], fov: 32, near: 0.05, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      style={{ touchAction: 'none' }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 3.5, 2.5]} intensity={2.1} color="#fff3e6" castShadow />
      <directionalLight position={[-2.5, 1.5, -1.5]} intensity={0.9} color="#9fdcff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 1, 1]} />
        <Lightformer form="rect" color={r.accent} intensity={0.8} position={[4, 1, -2]} rotation-y={-Math.PI / 2} scale={[4, 0.6, 1]} />
      </Environment>
      <group scale={scale}>
        <Robot key={robot} kind={r.kind} accent={r.accent} glow={r.glow} animate={animate} stillAt={0.6} wear={wear} name={`viewer-${robot}`} />
      </group>
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={3} blur={2.4} far={1.6} />
      <OrbitControls ref={controls} makeDefault target={[...HOME.target]} enablePan={false} enableDamping autoRotate={spin && !reduced} autoRotateSpeed={1.6} minDistance={1.1} maxDistance={5} minPolarAngle={0.2} maxPolarAngle={Math.PI / 2 - 0.04} />
    </Canvas>
  );
});

export default RobotViewer3D;
