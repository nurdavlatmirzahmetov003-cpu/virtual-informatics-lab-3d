/**
 * Canvas of a teardown view: the device on a repair mat, procedural studio
 * lighting (nothing to download but the models), orbit / zoom, and the
 * driver that moves the timeline toward its goal every frame.
 */
import { lazy, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { NeutralToneMapping, SRGBColorSpace, Vector3 } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { advancePrint, approach } from '@/lib/teardown/timeline';
import type { TeardownId } from '@/data/teardown/teardowns';
import { publish, RigContext, type TeardownRig } from './rig';

const SCENES = {
  system_unit: lazy(() => import('./SystemUnitTeardown')),
  laptop: lazy(() => import('./LaptopTeardown')),
  smartphone: lazy(() => import('./SmartphoneTeardown')),
  tablet: lazy(() => import('./TabletTeardown')),
  all_in_one: lazy(() => import('./AllInOneTeardown')),
  printer_3d: lazy(() => import('./PrinterTeardown')),
};

/** Framing of each teardown: the device and the bench where its parts land. */
const SHOTS: Record<TeardownId, { position: [number, number, number]; target: [number, number, number]; mat: [number, number, number, number] }> = {
  system_unit: { position: [-0.17, 1.2, 1.95], target: [-0.17, 0.1, 0.32], mat: [-0.2, 0.3, 2.2, 1.5] },
  laptop: { position: [0.1, 0.8, 1.25], target: [0.1, 0.05, 0.17], mat: [0.12, 0.16, 1.3, 0.9] },
  smartphone: { position: [0.02, 0.34, 0.36], target: [0.02, 0, 0.005], mat: [0.02, 0, 0.52, 0.38] },
  tablet: { position: [0.02, 0.72, 0.92], target: [0.02, 0, 0.1], mat: [0.02, 0.06, 0.9, 0.85] },
  all_in_one: { position: [0, 0.95, 1.3], target: [0, 0, 0.1], mat: [0, 0.06, 1.35, 1.35] },
  printer_3d: { position: [0.06, 1.2, 1.72], target: [0.04, 0.21, 0.27], mat: [0.05, 0.28, 1.25, 1.3] },
};

function Driver({ rig }: { rig: TeardownRig }) {
  const reduced = useReducedMotion();
  useFrame((_, dt) => {
    rig.shown = approach(rig.shown, rig.goal, dt, rig.rate, reduced);
    if (rig.parts) for (const p of Object.values(rig.parts)) p.shown = approach(p.shown, p.goal, dt, rig.rate * rig.count * 0.6, reduced);
    if (rig.print.active) {
      rig.print.t = advancePrint(rig.print.t, dt, reduced);
      if (rig.print.t >= 1) rig.print.active = false;
    }
    publish(rig);
  });
  return null;
}

/** Shots are framed for a wide canvas; a narrow one (phone) steps back so the bench still fits. */
function Framing({ position, target }: { position: readonly number[]; target: readonly number[] }) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  useEffect(() => {
    const t = new Vector3(...target);
    const offset = new Vector3(...position).sub(t);
    const wide = 1.3;
    offset.multiplyScalar(aspect < wide ? Math.min(2.8, (wide / aspect) ** 1.05) : 1);
    camera.position.copy(t).add(offset);
    camera.lookAt(t);
  }, [camera, aspect, position, target]);
  return null;
}

/** Anti-static repair mat under the device. */
function Mat({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh position={[x, -0.001, z]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#27485c" roughness={0.9} />
    </mesh>
  );
}

export default function TeardownStage({ id, rig, label }: { id: TeardownId; rig: TeardownRig; label: string }) {
  const shot = SHOTS[id];
  const Scene = SCENES[id];
  const [mx, mz, mw, md] = shot.mat;
  // moving parts re-render the shadow map every frame: only where the preset has shadows
  const shadows = useQualityPreset().shadows;
  return (
    <Canvas
      role="img"
      aria-label={label}
      dpr={[1, 1.75]}
      shadows={shadows}
      camera={{ position: shot.position, fov: 38, near: 0.01, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      style={{ touchAction: 'none' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[1.2, 2.4, 1.6]} intensity={2.2} color="#fff3e6" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-1.2, 1.2, 1.2, -1.2, 0.1, 6]} />
      </directionalLight>
      <directionalLight position={[-1.5, 1.2, -1]} intensity={0.7} color="#9fdcff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 1, 1]} />
        <Lightformer form="rect" color="#7fdcff" intensity={1} position={[4, 1, -2]} rotation-y={-Math.PI / 2} scale={[4, 0.5, 1]} />
      </Environment>
      <Framing position={shot.position} target={shot.target} />
      <Mat x={mx} z={mz} w={mw} d={md} />
      <RigContext.Provider value={rig}>
        <Driver rig={rig} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </RigContext.Provider>
      <OrbitControls makeDefault target={shot.target} enablePan={false} enableDamping minDistance={0.25} maxDistance={5} maxPolarAngle={Math.PI * 0.62} />
    </Canvas>
  );
}
