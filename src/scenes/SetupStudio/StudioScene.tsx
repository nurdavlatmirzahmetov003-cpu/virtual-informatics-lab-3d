/**
 * Setup Studio scene: the hero desk and room, populated from the studio
 * store. Every product change swaps / rescales its model at once; colour
 * finishes repaint materials while keeping their normal / roughness maps.
 * Parts left empty (headset, speakers, chair…) are simply not shown.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group, Object3D } from 'three';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { ModelLoader } from '@/components/3d/ModelLoader';
import type { HardwareItem } from '@/data/hardware/types';
import { CASE_FINISHES, RGB_COLORS, type Finish, type PeripheralTheme } from '@/data/studio/options';
import { resolveBuild } from '@/lib/studio/build';
import { applyPaint, type PaintFinish } from '@/lib/three/finish';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { DeskMat } from '@/scenes/DeskScene/models/DeskMat';
import { Room } from '@/scenes/DeskScene/models/Room';
import { useMonitorWallpaper } from '@/scenes/DeskScene/models/useMonitorWallpaper';
import { HEADSET, KEYBOARD, MONITOR, MOUSE, SPEAKERS } from '@/scenes/DeskScene/layout';
import { PCCase } from '@/scenes/DeskScene/pc/PCCase';
import { useStudioStore } from '@/store/studioStore';
import { Chair } from './Chair';
import { StudioCamera } from './StudioCamera';

/** Poly Haven "Studio Small 09" (CC0) — reflections only. */
const HDRI = `${import.meta.env.BASE_URL}assets/hdr/studio_small_09_1k.hdr`;
const WHITE_PAINT: PaintFinish = { color: '#e6e8ec', metalness: 0.05, roughness: 0.42 };

/** Shadows are static: re-render the map only for a moment after something changed. */
const shadows = { until: 0 };
const requestShadows = (ms = 600) => {
  shadows.until = Math.max(shadows.until, performance.now() + ms);
};

function StudioShadows() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    requestShadows(4000);
    return useStudioStore.subscribe((s, prev) => {
      if (s.build !== prev.build || s.finish !== prev.finish) requestShadows(1500);
    });
  }, []);
  useFrame(() => {
    gl.shadowMap.autoUpdate = false;
    if (performance.now() < shadows.until) gl.shadowMap.needsUpdate = true;
  });
  return null;
}

type Fit = { axis: 0 | 1 | 2; size: number; rotation?: readonly [number, number, number]; align: 'floor'; offset?: readonly [number, number, number] };

/** A catalog model scaled to the product's real size and painted with the chosen finish. */
interface ProductModelProps {
  product: HardwareItem;
  axis: 0 | 1 | 2;
  rotation?: readonly [number, number, number];
  offset?: readonly [number, number, number];
  paint: PaintFinish | null;
  /** Extra setup once the GLB is ready (e.g. the monitor wallpaper). */
  prepare?: (root: Object3D) => void;
  position?: readonly [number, number, number];
  'rotation-y'?: number;
}

function ProductModel({ product, axis, rotation, offset, paint, prepare, ...group }: ProductModelProps) {
  const [root, setRoot] = useState<Object3D | null>(null);
  const size = product.modelSize ?? 0.1;
  const fit = useMemo<Fit>(() => ({ axis, size, rotation, offset, align: 'floor' }), [axis, size, rotation, offset]);
  const onLoaded = useCallback(
    (r: Object3D) => {
      prepare?.(r);
      setRoot(r);
    },
    [prepare],
  );
  useEffect(() => {
    if (!root) return;
    applyPaint(root, paint, { onlyDark: true });
    requestShadows();
  }, [root, paint]);

  return (
    <ModelLoader
      url={`${import.meta.env.BASE_URL}assets/models/${product.modelPath}`}
      fit={fit}
      onLoaded={onLoaded}
      position={group.position ? [...group.position] : undefined}
      rotation-y={group['rotation-y'] ?? 0}
    />
  );
}

function MonitorModel(props: Omit<ProductModelProps, 'prepare' | 'axis'>) {
  const wallpaper = useMonitorWallpaper();
  return <ProductModel {...props} axis={0} prepare={wallpaper} />;
}

/** Which peripherals are white for a theme ("mixed": white input devices, dark screen and audio). */
function peripheralPaint(theme: PeripheralTheme, part: 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'speakers') {
  if (theme === 'white') return WHITE_PAINT;
  if (theme === 'mixed' && (part === 'keyboard' || part === 'mouse')) return WHITE_PAINT;
  return null;
}

const MOUSE_ROT = [0, Math.PI, 0] as const;
const HEADSET_OFFSET = [0, 0.045, 0] as const;

function rgbColorOf(finish: Finish): string | null {
  if (finish.rgb === 'off') return null;
  return finish.rgb === 'custom' ? finish.rgbCustom : RGB_COLORS[finish.rgb];
}

/** System unit: the hero PC, assembled and static, with case paint and RGB colour. */
function StudioPC({ finish }: { finish: Finish }) {
  const group = useRef<Group>(null);
  const applied = useRef('');
  const paint = finish.case === 'black' ? null : CASE_FINISHES[finish.case];
  useFrame(() => {
    const chassis = group.current?.getObjectByName('asset:chassis.glb');
    if (!chassis) return;
    const key = `${chassis.uuid}:${finish.case}`;
    if (applied.current === key) return;
    applyPaint(chassis, paint);
    applied.current = key;
    requestShadows();
  });
  return (
    <group ref={group}>
      <PCCase fixed interactive={false} rgbColor={rgbColorOf(finish)} />
    </group>
  );
}

export default function StudioScene() {
  const buildIds = useStudioStore((s) => s.build);
  const finish = useStudioStore((s) => s.finish);
  const build = useMemo(() => resolveBuild(buildIds), [buildIds]);
  const theme = finish.peripherals;
  const paints = useMemo(
    () => ({
      monitor: peripheralPaint(theme, 'monitor'),
      keyboard: peripheralPaint(theme, 'keyboard'),
      mouse: peripheralPaint(theme, 'mouse'),
      headset: peripheralPaint(theme, 'headset'),
      speakers: peripheralPaint(theme, 'speakers'),
    }),
    [theme],
  );
  const { monitor, keyboard, mouse, headset, speakers, chair } = build;
  const chairWhite = theme === 'white' && chair?.colors.includes('white');

  return (
    <>
      <EnvironmentLighting hdri={HDRI} environmentIntensity={0.6} intensity={1} shadowExtent={1.5} fog={[4, 12]} />
      <StudioCamera />
      <StudioShadows />
      <Room />
      <Desk surface={finish.desk} />
      <DeskMat />

      {monitor && <MonitorModel key={monitor.id} product={monitor} paint={paints.monitor} position={MONITOR.position} />}
      {keyboard && <ProductModel key={keyboard.id} product={keyboard} axis={0} paint={paints.keyboard} position={KEYBOARD.position} />}
      {mouse && <ProductModel key={mouse.id} product={mouse} axis={2} rotation={MOUSE_ROT} paint={paints.mouse} position={MOUSE.position} rotation-y={MOUSE.yaw} />}
      {headset && (
        <group position={[...HEADSET.position]}>
          <ProductModel key={headset.id} product={headset} axis={1} offset={HEADSET_OFFSET} paint={paints.headset} rotation-y={HEADSET.yaw} />
          <mesh position-y={0.007} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 0.014, 40]} />
            <meshStandardMaterial color="#25282d" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position-y={0.135} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.25, 20]} />
            <meshStandardMaterial color="#555962" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      )}
      {speakers && (
        <>
          <ProductModel key={`${speakers.id}-l`} product={speakers} axis={1} paint={paints.speakers} position={SPEAKERS.left.position} rotation-y={SPEAKERS.left.yaw} />
          <ProductModel key={`${speakers.id}-r`} product={{ ...speakers, modelPath: speakers.modelPath.replace('speaker_left', 'speaker_right') }} axis={1} paint={paints.speakers} position={SPEAKERS.right.position} rotation-y={SPEAKERS.right.yaw} />
        </>
      )}
      {chair && <Chair key={chair.id} height={chair.modelSize} upholstery={chairWhite ? '#d8d9dd' : '#1c1d21'} position={[-1.12, 0, 0.4]} rotation-y={0.75} />}

      {build.case && <StudioPC finish={finish} />}
    </>
  );
}
