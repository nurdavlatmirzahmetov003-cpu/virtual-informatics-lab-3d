/**
 * 360° viewer of one lab device: its own small canvas (the lab scene pauses
 * meanwhile), the model framed automatically, drag to rotate, wheel / pinch
 * to zoom, optional auto-rotation. Lighting is procedural (Lightformers), so
 * the viewer downloads nothing but the model itself.
 */
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { DeviceModel } from '@/scenes/LabSpace/devices/DeviceModel';

export default function DeviceViewer3D({ id, autoRotate, label }: { id: string; autoRotate: boolean; label: string }) {
  const reduced = useReducedMotion();
  return (
    <Canvas
      role="img"
      aria-label={label}
      dpr={[1, 1.75]}
      camera={{ position: [0.6, 0.45, 0.9], fov: 32, near: 0.005, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      style={{ touchAction: 'none' }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 3, 2]} intensity={2} color="#fff3e6" />
      <directionalLight position={[-2, 1.5, -1.5]} intensity={0.8} color="#9fdcff" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 1, 1]} />
        <Lightformer form="rect" color="#7fdcff" intensity={1} position={[4, 1, -2]} rotation-y={-Math.PI / 2} scale={[4, 0.5, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.25} maxDuration={reduced ? 0 : 0.6}>
          <DeviceModel id={id} />
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault enablePan={false} enableDamping autoRotate={autoRotate && !reduced} autoRotateSpeed={1.4} minDistance={0.02} maxDistance={8} />
    </Canvas>
  );
}
