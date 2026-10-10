/**
 * Final setup presentation: the user's build assembling itself on the hero
 * desk (driven by SetupAssemblyTimeline through assemblyRig), then a slow
 * orbit with "inside" and "exploded" views of the PC.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, type DirectionalLight, type PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { useScenePalette } from '@/hooks/useTheme';
import { CAMERA_STATES, type CameraStateName } from '@/data/camera/cameraStates';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { resolveBuild, type ResolvedBuild } from '@/lib/studio/build';
import { framingScale } from '@/lib/three/framing';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { isTieredModel } from '@/lib/three/modelUrls';
import { ProductDesk } from '../ProductDesk';
import { Room } from '@/scenes/DeskScene/models/Room';
import type { PartId } from '@/scenes/DeskScene/pc/parts';
import { pcRig } from '@/scenes/DeskScene/pc/pcRig';
import { useAssemblyStore, type AssemblyView } from '@/store/assemblyStore';
import { useStudioStore } from '@/store/studioStore';
import { SetupItems } from '../SetupItems';
import { STUDIO_HDRI, setupChanged } from '../setupShared';
import { assemblyRig, INSTALL_ORDER } from './assemblyRig';

const VIEW_SHOT: Record<AssemblyView, CameraStateName> = { orbit: 'STUDIO_WIDE', inside: 'PC_INTERIOR', exploded: 'EXPLODED' };
/** Leave room for the optional desktop configuration panel. */
const PANEL_W = 380;

/** Feeds pcRig from the assembly rig while assembling, then from the chosen view. */
function AssemblyPcController({ build }: { build: ResolvedBuild }) {
  const absent = useMemo(() => INSTALL_ORDER.filter(id => id !== 'fans' && !build[id === 'cooler' ? 'cooling' : id]), [build]);
  useFrame((_, delta) => {
    const { phase, view } = useAssemblyStore.getState();
    if (phase === 'assembling') {
      const parts: Partial<Record<PartId, number>> = { fans: 0 };
      const hidden = new Set<PartId>();
      for (const id of INSTALL_ORDER) {
        const p = assemblyRig.parts[id];
        parts[id] = 1 - p;
        if (p <= 0.001 || absent.includes(id)) hidden.add(id);
      }
      pcRig.parts = parts;
      pcRig.hidden = hidden;
      pcRig.explode = 0;
      pcRig.glassOpen = assemblyRig.glassOpen;
      pcRig.cables = assemblyRig.cables;
      pcRig.fanSpeed = assemblyRig.fanSpeed;
      pcRig.rgbPower = assemblyRig.rgb;
      pcRig.glow = assemblyRig.rgb;
      pcRig.interior = Math.max(assemblyRig.glassOpen, assemblyRig.rgb);
      return;
    }
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 3);
    const explode = view === 'exploded' ? 1 : 0;
    const glass = view === 'orbit' ? 0 : 1;
    pcRig.parts = null;
    if (pcRig.hidden.size !== absent.length || absent.some(id => !pcRig.hidden.has(id))) pcRig.hidden = new Set(absent);
    pcRig.explode += (explode - pcRig.explode) * k;
    pcRig.glassOpen += (glass - pcRig.glassOpen) * k;
    pcRig.cables = pcRig.fanSpeed = pcRig.rgbPower = pcRig.glow = pcRig.interior = 1;
  });
  return null;
}

/** Room light level: scales image-based lighting and the key/fill/rim lights together. */
function AssemblyLighting() {
  const scene = useThree((s) => s.scene);
  const { envBoost } = useScenePalette();
  const gl = useThree((s) => s.gl);
  const lights = useRef<DirectionalLight[] | null>(null);
  const refreshUntil = useRef(0);
  const previous = useRef('');
  useEffect(() => {
    gl.localClippingEnabled = true; // the monitor stand / panel are clipped copies
    const changed = () => { refreshUntil.current = performance.now() + 2000; };
    setupChanged.listeners.add(changed);
    changed();
    return () => {
      setupChanged.listeners.delete(changed);
      gl.localClippingEnabled = false;
    };
  }, [gl]);
  useFrame(() => {
    if (!lights.current) {
      const found: DirectionalLight[] = [];
      scene.traverse((o) => {
        const l = o as DirectionalLight;
        if (l.isDirectionalLight) {
          l.userData.baseIntensity ??= l.intensity;
          found.push(l);
        }
      });
      if (found.length) lights.current = found;
    }
    const level = assemblyRig.light;
    scene.environmentIntensity = 0.6 * envBoost * (0.35 + 0.65 * level);
    for (const l of lights.current ?? []) l.intensity = (l.userData.baseIntensity as number) * level;
    // objects keep moving until the presentation: keep the shadow map current
    gl.shadowMap.autoUpdate = false;
    const state = useAssemblyStore.getState();
    const signature = `${state.phase}:${state.view}`;
    if (signature !== previous.current) { refreshUntil.current = performance.now() + 3000; previous.current = signature; }
    if (state.phase === 'assembling' || performance.now() < refreshUntil.current) gl.shadowMap.needsUpdate = true;
  });
  return null;
}

/**
 * Follows the timeline's camera while assembling (no user input), then hands
 * over to damped orbit controls: view shots and a full 360-degree turn.
 */
function AssemblyCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useRef<OrbitControlsImpl>(null);
  const reduced = useReducedMotion();
  const phase = useAssemblyStore((s) => s.phase);
  const view = useAssemblyStore((s) => s.view);
  const autoRotate = useAssemblyStore((s) => s.autoRotate);
  const configOpen = useAssemblyStore((s) => s.configOpen);
  const fly = useRef({ active: false, pos: new Vector3(), target: new Vector3() });
  const offset = useRef(0);
  const lookAt = useMemo(() => new Vector3(), []);
  const aspect = size.width / Math.max(1, size.height);

  useEffect(() => {
    if (phase !== 'done') return;
    const shot = CAMERA_STATES[VIEW_SHOT[view]];
    const f = fly.current;
    f.target.set(...shot.target);
    if (view === 'exploded') f.target.x += 0.15;
    const availableAspect = size.width >= 1000 && configOpen ? (size.width - PANEL_W) / size.height : aspect;
    const scale = framingScale(availableAspect) * (size.width >= 1000 && configOpen ? 1.15 : 1) * (aspect < .7 && view === 'exploded' ? 1.18 : 1);
    f.pos.set(...shot.position).sub(new Vector3(...shot.target)).multiplyScalar(scale * (view === 'exploded' ? 1.4 : 1)).add(f.target);
    f.active = true;
  }, [phase, view, aspect, size.width, size.height, configOpen]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const cancel = () => {
      fly.current.active = false;
    };
    c.addEventListener('start', cancel);
    return () => c.removeEventListener('start', cancel);
  }, []);

  useEffect(() => () => camera.clearViewOffset(), [camera]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 2.6);
    if (phase === 'assembling') {
      const r = assemblyRig.camera;
      const scale = framingScale(aspect);
      lookAt.set(r.tx, r.ty, r.tz);
      camera.position.set(r.px, r.py, r.pz).sub(lookAt).multiplyScalar(scale).add(lookAt);
      c.target.copy(lookAt);
      camera.lookAt(lookAt);
    } else {
      const f = fly.current;
      if (f.active) {
        camera.position.lerp(f.pos, k);
        c.target.lerp(f.target, k);
        if (camera.position.distanceTo(f.pos) < 0.003 && c.target.distanceTo(f.target) < 0.003) f.active = false;
      } else if (autoRotate && !reduced) {
        const az = c.getAzimuthalAngle();
        c.setAzimuthalAngle(az + Math.min(delta, 0.05) * 0.12);
      }
    }
    // keep the setup centred left of the configuration panel on wide screens
    const goal = phase === 'done' && configOpen && size.width >= 1000 ? PANEL_W / 2 : 0;
    offset.current += (goal - offset.current) * k;
    if (Math.abs(offset.current) < 0.5) {
      if (camera.view?.enabled) camera.clearViewOffset();
    } else {
      camera.setViewOffset(size.width, size.height, offset.current, 0, size.width, size.height);
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={phase === 'done'}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      enablePan={false}
      minDistance={0.3}
      maxDistance={8}
      maxPolarAngle={Math.PI * 0.48}
    />
  );
}

export default function AssemblyScene() {
  const buildIds = useStudioStore((s) => s.build);
  const finish = useStudioStore((s) => s.finish);
  const build = useMemo(() => resolveBuild(buildIds), [buildIds]);

  return (
    <>
      <EnvironmentLighting hdri={STUDIO_HDRI} environmentIntensity={0.6} intensity={1} shadowExtent={1.5} fog={[4, 12]} />
      <AssemblyLighting />
      <AssemblyCamera />
      <AssemblyPcController build={build} />
      <Room orbit />
      {build.desk && isTieredModel(build.desk.modelPath) ? <ProductDesk key={build.desk.id} product={build.desk} surface={finish.desk} /> : <Desk surface={finish.desk} />}
      <SetupItems build={build} finish={finish} animated />
    </>
  );
}
