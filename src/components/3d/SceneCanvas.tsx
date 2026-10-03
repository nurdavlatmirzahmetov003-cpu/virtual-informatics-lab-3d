import { Suspense, useMemo, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import { CAMERA_STATES, type CameraStateName } from '@/data/camera/cameraStates';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { usePageVisible } from '@/hooks/usePageVisible';
import { useT } from '@/hooks/useT';
import { detectWebGL } from '@/lib/webgl';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QualityController } from './QualityController';
import { PostEffects } from './PostEffects';
import { WebGLFallback } from './WebGLFallback';
import styles from './SceneCanvas.module.css';

interface SceneCanvasProps {
  children: ReactNode;
  /** Where the camera starts before any CameraRig transition. */
  initialCamera?: CameraStateName;
  /** Accessible description of what the scene shows. */
  label: string;
  className?: string;
}

/**
 * The single place a WebGL canvas is created. Pages mount their own scene
 * inside it; unmounting the page disposes the renderer and GPU resources,
 * so laboratories are never all resident at once.
 */
export function SceneCanvas({ children, initialCamera = 'HOME_WIDE', label, className }: SceneCanvasProps) {
  const t = useT();
  const preset = useQualityPreset();
  const visible = usePageVisible();
  const webgl = useMemo(() => detectWebGL(), []);
  const [attempt, setAttempt] = useState(0);
  const cam = CAMERA_STATES[initialCamera];

  if (webgl === 'none') return <WebGLFallback />;

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} role="img" aria-label={label}>
      <ErrorBoundary
        onError={(error) => console.error('[SceneCanvas] render error', error)}
        fallback={(_, reset) => (
          <div className={styles.error} role="alert">
            <h2>{t('errors.sceneTitle')}</h2>
            <p>{t('errors.sceneBody')}</p>
            <button
              type="button"
              onClick={() => {
                setAttempt((n) => n + 1);
                reset();
              }}
            >
              {t('errors.retry')}
            </button>
          </div>
        )}
      >
        <Canvas
          // antialias is a context attribute: remount the canvas when it changes
          key={`${attempt}-${preset.antialias ? 'aa' : 'noaa'}`}
          className={styles.canvas}
          frameloop={visible ? 'always' : 'never'}
          dpr={preset.dpr}
          shadows={preset.shadows ? 'percentage' : false}
          camera={{ position: [...cam.position], fov: cam.fov, near: 0.03, far: 60 }}
          gl={{
            antialias: preset.antialias,
            powerPreference: 'high-performance',
            alpha: false,
            stencil: false,
          }}
          onCreated={({ gl, camera }) => {
            gl.toneMapping = NeutralToneMapping;
            gl.toneMappingExposure = 1;
            gl.outputColorSpace = SRGBColorSpace;
            camera.lookAt(...cam.target);
          }}
        >
          <QualityController preset={preset} />
          <Suspense fallback={null}>{children}</Suspense>
          {preset.postprocessing && <PostEffects preset={preset} />}
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
