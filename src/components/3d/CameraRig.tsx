import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_STATES, type CameraStateName } from '@/data/camera/cameraStates';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { framingScale } from '@/lib/three/framing';

interface CameraRigProps {
  /** Named shot to move to; changing it starts a damped transition. */
  state: CameraStateName;
  /** Seconds-ish time constant of the transition. */
  smoothTime?: number;
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
}

const POSITION_EPSILON = 0.002;

/** Frame-rate independent exponential damping factor. */
function dampFactor(smoothTime: number, dt: number) {
  return 1 - Math.exp(-dt / Math.max(0.0001, smoothTime / 4));
}

/**
 * Interpolates camera position, target and FOV towards a named camera state,
 * then hands control back to damped OrbitControls. Any user drag cancels the
 * transition immediately so the user always feels in control.
 */
export function CameraRig({ state, smoothTime = 1.1, autoRotate = false, enableZoom = true, enablePan = false }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const controls = useRef<OrbitControlsImpl>(null);
  const transitioning = useRef(true);
  const goalPos = useRef(new Vector3());
  const goalTarget = useRef(new Vector3());
  const goalFov = useRef(camera.fov);
  const reducedMotion = useReducedMotion();
  const shot = CAMERA_STATES[state];

  useEffect(() => {
    goalTarget.current.set(...shot.target);
    goalPos.current
      .set(...shot.position)
      .sub(goalTarget.current)
      .multiplyScalar(framingScale(aspect))
      .add(goalTarget.current);
    goalFov.current = shot.fov;
    transitioning.current = true;
  }, [shot, aspect]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const cancel = () => {
      transitioning.current = false;
    };
    c.addEventListener('start', cancel);
    return () => c.removeEventListener('start', cancel);
  }, []);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || !transitioning.current) return;
    const k = reducedMotion ? 1 : dampFactor(smoothTime, Math.min(dt, 0.1));
    camera.position.lerp(goalPos.current, k);
    c.target.lerp(goalTarget.current, k);
    if (Math.abs(camera.fov - goalFov.current) > 0.01) {
      camera.fov += (goalFov.current - camera.fov) * k;
      camera.updateProjectionMatrix();
    }
    if (
      camera.position.distanceTo(goalPos.current) < POSITION_EPSILON &&
      c.target.distanceTo(goalTarget.current) < POSITION_EPSILON
    ) {
      transitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.6}
      zoomSpeed={0.7}
      enableZoom={enableZoom}
      enablePan={enablePan}
      minDistance={shot.minDistance ?? 0.3}
      maxDistance={(shot.maxDistance ?? 10) * framingScale(aspect)}
      // keep the camera above the floor plane
      maxPolarAngle={Math.PI * 0.49}
      autoRotate={autoRotate && !reducedMotion}
      autoRotateSpeed={0.35}
    />
  );
}
