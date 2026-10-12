/**
 * Canvas of the Connection Lab: studio light (procedural, nothing to
 * download but the models), a camera framed per task (stepping back on a
 * narrow screen) and orbit controls that pause while a plug is in hand.
 */
import { lazy, Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { NeutralToneMapping, SRGBColorSpace, Vector3 } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import type { ConnectTaskId } from '@/labs/ConnectLab';
import { useConnectLabStore } from '@/store/connectLabStore';

const PcScene = lazy(() => import('./PcScene'));
const NetScene = lazy(() => import('./NetScene'));

const SHOTS: Record<ConnectTaskId, { position: [number, number, number]; target: [number, number, number] }> = {
  // behind the desk, looking at the back of the PC
  pc: { position: [0.06, 1.3, -1.32], target: [0.46, 0.93, -0.26] },
  ethernet: { position: [-0.42, 1.28, 0.98], target: [0.06, 0.8, -0.02] },
  wifi: { position: [-0.2, 1.22, 1.0], target: [0.04, 0.86, -0.04] },
};

function Framing({ position, target }: { position: [number, number, number]; target: [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  useEffect(() => {
    const t = new Vector3(...target);
    const off = new Vector3(...position).sub(t);
    off.multiplyScalar(aspect < 1.3 ? Math.min(2, (1.3 / aspect) ** 0.7) : 1);
    camera.position.copy(t).add(off);
    camera.lookAt(t);
  }, [camera, aspect, position, target]);
  return null;
}

function Controls({ target }: { target: [number, number, number] }) {
  const carrying = useConnectLabStore((s) => s.carrying);
  return <OrbitControls makeDefault target={target} enabled={!carrying} enablePan={false} enableDamping minDistance={0.25} maxDistance={3} maxPolarAngle={Math.PI * 0.62} />;
}

export default function ConnectStage({ task, names, label }: { task: ConnectTaskId; names: Record<string, string>; label: string }) {
  const shot = SHOTS[task];
  const shadows = useQualityPreset().shadows;
  return (
    <Canvas
      key={task}
      role="img"
      aria-label={label}
      dpr={[1, 1.75]}
      shadows={shadows}
      camera={{ position: shot.position, fov: 40, near: 0.01, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      onPointerMissed={() => {
        const s = useConnectLabStore.getState();
        if (s.carrying && !s.dragging) s.drop();
      }}
      style={{ touchAction: 'none' }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[-1.2, 2.6, -1.8]} intensity={2} color="#fff3e6" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-1.4, 1.4, 1.4, -1.4, 0.1, 7]} />
      </directionalLight>
      <directionalLight position={[1.6, 1.4, 1.4]} intensity={0.9} color="#9fdcff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-4, 1, -2]} rotation-y={Math.PI / 2} scale={[4, 1, 1]} />
        <Lightformer form="rect" color="#7fdcff" intensity={1} position={[4, 1, 2]} rotation-y={-Math.PI / 2} scale={[4, 0.5, 1]} />
      </Environment>
      <Framing position={shot.position} target={shot.target} />
      <Suspense fallback={null}>{task === 'pc' ? <PcScene names={names} /> : <NetScene names={names} wifiTask={task === 'wifi'} />}</Suspense>
      <Controls target={shot.target} />
    </Canvas>
  );
}
