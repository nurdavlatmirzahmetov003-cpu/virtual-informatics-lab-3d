/**
 * Canvas of the hands-on games that bring no lab scene of their own (0.37
 * «Find the fault», «Build the network»): studio light from lightformers
 * (nothing to download), a table top, orbit controls, and a camera that
 * steps back on a narrow (phone) screen so the whole bench stays in view.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { NeutralToneMapping, SRGBColorSpace, Vector3 } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';

function Framing({ position, target }: { position: readonly [number, number, number]; target: readonly [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  useEffect(() => {
    const t = new Vector3(...target);
    const off = new Vector3(...position).sub(t);
    // a phone held upright: step back until the whole bench is in the frame
    off.multiplyScalar(aspect < 1.4 ? Math.min(3, (1.4 / aspect) ** 1.15) : 1);
    camera.position.copy(t).add(off);
    camera.lookAt(t);
  }, [camera, aspect, position, target]);
  return null;
}

/**
 * Mounts the bench one frame after the canvas: the first drei <Html> label
 * mounted together with the canvas never attached to the page (seen with
 * the network game's first device label), one frame later every label does.
 */
function AfterMount({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return ready ? children : null;
}

export function GameStage({ label, position, target, table, children }: { label: string; position: readonly [number, number, number]; target: readonly [number, number, number]; table: readonly [number, number]; children: ReactNode }) {
  const shadows = useQualityPreset().shadows;
  return (
    <Canvas
      role="img"
      aria-label={label}
      dpr={[1, 1.75]}
      shadows={shadows}
      camera={{ position: [...position], fov: 40, near: 0.02, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      style={{ touchAction: 'none' }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[1.4, 2.6, 1.8]} intensity={2.1} color="#fff3e6" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-1.6, 1.6, 1.2, -1.2, 0.1, 7]} />
      </directionalLight>
      <directionalLight position={[-1.6, 1.3, -1]} intensity={0.7} color="#9fdcff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 1, 1]} />
        <Lightformer form="rect" color="#7fdcff" intensity={1} position={[4, 1, -2]} rotation-y={-Math.PI / 2} scale={[4, 0.5, 1]} />
      </Environment>
      <Framing position={position} target={target} />
      {/* the work table */}
      <mesh position={[target[0], -0.02, target[2]]} receiveShadow>
        <boxGeometry args={[table[0], 0.04, table[1]]} />
        <meshStandardMaterial color="#27485c" roughness={0.88} />
      </mesh>
      <AfterMount>{children}</AfterMount>
      <OrbitControls makeDefault target={[...target]} enablePan={false} enableDamping minDistance={0.4} maxDistance={4.5} maxPolarAngle={Math.PI * 0.48} />
    </Canvas>
  );
}
