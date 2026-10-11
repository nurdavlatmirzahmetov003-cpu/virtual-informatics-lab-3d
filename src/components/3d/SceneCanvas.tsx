import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import { CAMERA_STATES, type CameraStateName } from '@/data/camera/cameraStates';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { usePageVisible } from '@/hooks/usePageVisible';
import { useT } from '@/hooks/useT';
import { detectWebGL } from '@/lib/webgl';
import { useSceneStatus } from '@/store/sceneStatusStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QualityController } from './QualityController';
import { PostEffects } from './PostEffects';
import { WebGLFallback } from './WebGLFallback';
import styles from './SceneCanvas.module.css';
import { PerformanceReadout } from './PerformanceReadout';

interface SceneCanvasProps {
  children: ReactNode;
  /** Where the camera starts before any CameraRig transition. */
  initialCamera?: CameraStateName;
  /** Accessible description of what the scene shows. */
  label: string;
  className?: string;
  /**
   * CSS touch-action for the canvas. `none` (default) gives the scene every
   * gesture; `pan-y` keeps vertical swipes scrolling the page (scroll stories).
   */
  touchAction?: 'none' | 'pan-y';
  /** Stop rendering (e.g. while a full-screen viewer covers the scene). */
  paused?: boolean;
}

/** Mounted inside the scene's Suspense boundary: renders only once every asset resolved. */
function ReadySignal() {
  const setReady = useSceneStatus((s) => s.setReady);
  useEffect(() => {
    setReady(true);
    return () => setReady(false);
  }, [setReady]);
  return null;
}

/**
 * The single place a WebGL canvas is created. Pages mount their own scene
 * inside it; unmounting the page disposes the renderer and GPU resources,
 * so laboratories are never all resident at once.
 */
export function SceneCanvas({ children, initialCamera = 'HOME_WIDE', label, className, touchAction = 'none', paused = false }: SceneCanvasProps) {
  const t = useT();
  const preset = useQualityPreset();
  const visible = usePageVisible();
  const webgl = useMemo(() => detectWebGL(), []);
  const [attempt, setAttempt] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  // a replaced canvas releases its context on unmount: its "lost" event is not a GPU problem
  const generation = useRef(0);
  const [metrics, setMetrics] = useState('Sampling…');
  const [measured, setMeasured] = useState('');
  const measure = useRef<(() => string) | null>(null);
  const onMeasureReady = useCallback((fn: () => string) => { measure.current = fn; }, []);
  const debug = import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');
  const cam = CAMERA_STATES[initialCamera];
  const setExpected = useSceneStatus((s) => s.setExpected);

  useEffect(() => {
    if (webgl === 'none') return;
    setExpected(true);
    return () => setExpected(false);
  }, [webgl, setExpected]);

  if (webgl === 'none') return <WebGLFallback />;

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} role="img" aria-label={label}>
      <ErrorBoundary
        onError={(error) => {
          console.error('[SceneCanvas] render error', error);
          // release the loader so the error message is visible
          setExpected(false);
        }}
        fallback={(_, reset) => (
          <div className={styles.error} role="alert">
            <h2>{t('errors.sceneTitle')}</h2>
            <p>{t('errors.sceneBody')}</p>
            <button
              type="button"
              onClick={() => {
                setAttempt((n) => n + 1);
                setExpected(true);
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
          style={{ touchAction }}
          frameloop={visible && !paused ? 'always' : 'never'}
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
            // reading shader logs forces a synchronous wait for every compile; dev only
            gl.debug.checkShaderErrors = import.meta.env.DEV;
            // GPU reset / memory pressure: say so, and rebuild the canvas once the context is back
            const mine = generation.current;
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              if (mine !== generation.current) return;
              e.preventDefault();
              console.warn('[SceneCanvas] WebGL context lost');
              setContextLost(true);
            });
            gl.domElement.addEventListener('webglcontextrestored', () => {
              if (mine !== generation.current) return;
              generation.current++;
              setContextLost(false);
              setAttempt((n) => n + 1);
            });
            gl.toneMapping = NeutralToneMapping;
            gl.toneMappingExposure = 1;
            gl.outputColorSpace = SRGBColorSpace;
            camera.lookAt(...cam.target);
          }}
        >
          <QualityController preset={preset} />
          {debug && <PerformanceReadout onSample={setMetrics} onMeasureReady={onMeasureReady} />}
          <Suspense fallback={null}>
            {children}
            <ReadySignal />
          </Suspense>
          {preset.postprocessing && <PostEffects preset={preset} />}
        </Canvas>
      </ErrorBoundary>
      {contextLost && (
        <div className={styles.error} role="alert">
          <h2>{t('errors.contextLostTitle')}</h2>
          <p>{t('errors.contextLostBody')}</p>
          <button
            type="button"
            onClick={() => {
              generation.current++;
              setContextLost(false);
              setAttempt((n) => n + 1);
            }}
          >
            {t('errors.retry')}
          </button>
        </div>
      )}
      {debug && <output aria-label="3D performance" style={{ position: 'absolute', right: 24, top: 78, zIndex: 20, padding: '10px 16px', background: '#05080de0', color: '#8ee8c5', font: '12px monospace', borderRadius: 12, pointerEvents: 'none' }}>{metrics}</output>}
      {debug && <div style={{ position: 'absolute', right: 24, top: 120, zIndex: 20, maxWidth: 480, background: '#05080de0', padding: 12, fontSize: 11 }}><button onClick={() => setMeasured(measure.current?.() ?? 'Not ready')}>Measure scene</button><output aria-label="Scene benchmark" style={{ display: 'block', overflowWrap: 'anywhere' }}>{measured}</output></div>}
    </div>
  );
}
