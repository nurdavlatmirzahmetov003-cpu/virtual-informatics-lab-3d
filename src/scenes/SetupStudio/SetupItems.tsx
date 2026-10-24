/**
 * The user's setup on the desk — shared by the Setup Studio scene (static)
 * and the final assembly scene (`animated`: every piece follows assemblyRig).
 * Models are scaled to each product's real size and painted with the chosen
 * finish; parts left out of the build are not shown.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, Plane, Vector3, type Group, type Material, type Mesh, type MeshStandardMaterial, type Object3D } from 'three';
import { ModelLoader } from '@/components/3d/ModelLoader';
import type { HardwareItem } from '@/data/hardware/types';
import { CASE_FINISHES, type CaseFinish, type Finish, type PeripheralTheme } from '@/data/studio/options';
import type { ResolvedBuild } from '@/lib/studio/build';
import { applyPaint, type PaintFinish } from '@/lib/three/finish';
import { isTieredModel } from '@/lib/three/modelUrls';
import { DeskMat } from '@/scenes/DeskScene/models/DeskMat';
import { useMonitorWallpaper } from '@/scenes/DeskScene/models/useMonitorWallpaper';
import { HEADSET, KEYBOARD, MAT, MONITOR, MOUSE, SPEAKERS } from '@/scenes/DeskScene/layout';
import { PCCase, type PcRigMode } from '@/scenes/DeskScene/pc/PCCase';
import type { PartId } from '@/scenes/DeskScene/pc/parts';
import { assemblyRig, type PieceKey } from './assembly/assemblyRig';
import { Chair } from './Chair';
import { notifySetupChanged, rgbColorOf } from './setupShared';

const WHITE_PAINT: PaintFinish = { color: '#e6e8ec', metalness: 0.05, roughness: 0.42 };
type Vec3 = readonly [number, number, number];
type Fit = { axis: 0 | 1 | 2; size: number; rotation?: Vec3; align: 'floor'; offset?: Vec3 };


interface ProductModelProps {
  product: HardwareItem;
  axis: 0 | 1 | 2;
  rotation?: Vec3;
  offset?: Vec3;
  paint: PaintFinish | null;
  /** Extra setup once the GLB is ready (e.g. the monitor wallpaper). */
  prepare?: (root: Object3D) => void;
  position?: Vec3;
  'rotation-y'?: number;
  stretchY?: number;
}

/**
 * A catalog model at the product's real size, painted with the chosen finish.
 * Per-product models (`products/<id>.glb`, V2-2a) are built at real size,
 * facing the user, on the ground; shared legacy models are fitted here.
 */
function ProductModel({ product, axis, rotation, offset, paint, prepare, stretchY = 1, ...group }: ProductModelProps) {
  const [root, setRoot] = useState<Object3D | null>(null);
  const size = product.modelSize ?? 0.1;
  const own = isTieredModel(product.modelPath);
  const fit = useMemo<Fit | undefined>(() => (own ? undefined : { axis, size, rotation, offset, align: 'floor' }), [own, axis, size, rotation, offset]);
  const position = own && offset && group.position ? ([group.position[0] + offset[0], group.position[1] + offset[1], group.position[2] + offset[2]] as const) : own && offset ? offset : group.position;
  const onLoaded = useCallback(
    (r: Object3D) => {
      prepare?.(r);
      setRoot(r);
    },
    [prepare],
  );
  useEffect(() => {
    if (!root) return;
    applyPaint(root, paint, { onlyDark: true, preserveMarks: product.category === 'keyboard' });
    notifySetupChanged();
  }, [root, paint, product.category]);

  return (
    <ModelLoader
      url={`${import.meta.env.BASE_URL}assets/models/${product.modelPath}`}
      fit={fit}
      onLoaded={onLoaded}
      position={position ? [...position] : undefined}
      rotation-y={group['rotation-y'] ?? 0}
      scale-y={own ? 1 : stretchY}
    />
  );
}

/** Which peripherals are white for a theme ("mixed": white input devices, dark screen and audio). */
function peripheralPaint(theme: PeripheralTheme, part: 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'speakers') {
  if (theme === 'white') return WHITE_PAINT;
  if (theme === 'mixed' && (part === 'keyboard' || part === 'mouse')) return WHITE_PAINT;
  return null;
}

/**
 * Wraps a piece of the setup. Static: renders as is. Animated: hidden until
 * its step, then eases in from `from` (an offset in metres) — or unrolls
 * along X for the desk mat.
 */
function Piece({ k, animated, from = [0, 0.22, 0], unroll, children }: { k: PieceKey; animated: boolean; from?: Vec3; unroll?: { pivotX: number }; children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g || !animated) return;
    const p = assemblyRig.pieces[k];
    g.visible = p > 0.001;
    if (unroll) {
      g.scale.x = Math.max(0.001, p);
      g.position.x = unroll.pivotX * (1 - g.scale.x);
      return;
    }
    const r = 1 - p;
    g.position.set(from[0] * r, from[1] * r, from[2] * r);
  });
  return <group ref={group} visible={!animated}>{children}</group>;
}

/* ── monitor ─────────────────────────────────────────────── */

/** Height (fraction of the panel width) where the ultrawide GLB's stand meets the panel. */
const STAND_SPLIT = 1.5 / 10.727;
function monitorStretch(product: HardwareItem) {
  if (isTieredModel(product.modelPath)) return 1;
  const resolution = String(product.specifications.find(s => s.key === 'resolution')?.value ?? '').match(/(\d+)\s*[×x]\s*(\d+)/);
  const aspect = resolution ? Number(resolution[1]) / Number(resolution[2]) : 21 / 9;
  return (21 / 9) / aspect;
}

/**
 * Monitor drawn as two clipped copies of the same GLB, so the stand can be
 * set on the desk before the panel is mounted on it. The clip plane follows
 * its copy in world space every frame.
 */
function ClippedMonitor({ product, paint, part, onScreen }: { product: HardwareItem; paint: PaintFinish | null; part: 'stand' | 'panel'; onScreen?: (root: Object3D) => void }) {
  const holder = useRef<Group>(null);
  const plane = useMemo(() => new Plane(new Vector3(0, part === 'stand' ? -1 : 1, 0), 0), [part]);
  const world = useMemo(() => new Vector3(), []);
  const stretchY = monitorStretch(product);
  // own models: the panel starts just under the screen (bottom bezel); shared ultrawide: fixed ratio
  const split = useRef((product.modelSize ?? 0.6) * STAND_SPLIT * stretchY);
  const prepare = useCallback(
    (root: Object3D) => {
      onScreen?.(root);
      if (isTieredModel(product.modelPath) && holder.current) {
        root.updateWorldMatrix(true, true);
        const box = new Box3();
        root.traverse((obj) => {
          const mesh = obj as Mesh;
          if (mesh.isMesh && (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).some((m) => m.name === 'Screen')) box.expandByObject(mesh);
        });
        if (!box.isEmpty()) split.current = box.min.y - holder.current.getWorldPosition(new Vector3()).y - 0.02;
      }
      root.traverse((obj) => {
        const mesh = obj as Mesh;
        if (!mesh.isMesh) return;
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m: Material) => {
          m.clippingPlanes = [plane];
          m.clipShadows = true;
        });
      });
    },
    [onScreen, plane, product.modelPath],
  );
  useFrame(() => {
    const h = holder.current;
    if (!h) return;
    h.getWorldPosition(world);
    const y = world.y + split.current;
    plane.constant = part === 'stand' ? y : -y;
  });
  return (
    <group ref={holder}>
      <ProductModel product={product} axis={0} paint={paint} prepare={prepare} stretchY={stretchY} />
    </group>
  );
}

/** Screens dim to black until the assembly switches the monitor on. */
function useScreenPower(animated: boolean) {
  const screens = useRef(new Set<MeshStandardMaterial>());
  const wallpaper = useMonitorWallpaper();
  const onScreen = useCallback(
    (root: Object3D) => {
      wallpaper(root);
      root.traverse((obj) => {
        const mesh = obj as Mesh;
        if (!mesh.isMesh) return;
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => {
          if (m.name === 'Screen') screens.current.add(m as MeshStandardMaterial);
        });
      });
    },
    [wallpaper],
  );
  useFrame(() => {
    if (!animated) return;
    const on = assemblyRig.monitorOn;
    for (const m of screens.current) {
      m.emissiveIntensity = 0.65 * on;
      m.color.setScalar(0.04 + 0.96 * on);
    }
  });
  return onScreen;
}

const landed = (p: number) => Math.abs(p - 1) < 0.001;

function Monitor({ product, paint, animated }: { product: HardwareItem; paint: PaintFinish | null; animated: boolean }) {
  const onScreen = useScreenPower(animated);
  const pair = useRef<Group>(null);
  const whole = useRef<Group>(null);
  useFrame(() => {
    if (!animated || !pair.current || !whole.current) return;
    const done = landed(assemblyRig.pieces.monitorStand) && landed(assemblyRig.pieces.monitor);
    pair.current.visible = !done;
    whole.current.visible = done;
  });
  if (!animated) {
    return (
      <group position={[...MONITOR.position]}>
        <ProductModel product={product} axis={0} paint={paint} prepare={onScreen} stretchY={monitorStretch(product)} />
      </group>
    );
  }
  return (
    <group position={[...MONITOR.position]}>
      <group ref={pair}>
        <Piece k="monitorStand" animated from={[0, 0.2, 0.05]}>
          <ClippedMonitor product={product} paint={paint} part="stand" />
        </Piece>
        <Piece k="monitor" animated from={[0, 0.3, 0]}>
          <ClippedMonitor product={product} paint={paint} part="panel" onScreen={onScreen} />
        </Piece>
      </group>
      {/* once both halves have landed, one unclipped copy draws instead of two clipped ones */}
      <group ref={whole} visible={false}>
        <ProductModel product={product} axis={0} paint={paint} prepare={onScreen} stretchY={monitorStretch(product)} />
      </group>
    </group>
  );
}

/* ── PC ──────────────────────────────────────────────────── */

/** Finish a catalog case model already has (V2-2b); other finishes are painted on. */
const NATIVE_CASE_FINISH: Readonly<Record<string, CaseFinish>> = { 'case-lianli-o11d-evo': 'white', 'case-nzxt-h5-flow-2024': 'white', 'case-bitlab-aero': 'white' };

/** System unit with case paint and RGB; parts missing from the build are hidden. */
function SetupPC({ build, finish, rig }: { build: ResolvedBuild; finish: Finish; rig: PcRigMode }) {
  const group = useRef<Group>(null);
  const applied = useRef('');
  const own = build.case && isTieredModel(build.case.modelPath) ? build.case : null;
  const native = own ? (NATIVE_CASE_FINISH[own.id] ?? 'black') : 'black';
  const paint = finish.case === native ? null : CASE_FINISHES[finish.case];
  const hide = useMemo<PartId[]>(() => (['motherboard', 'cpu', 'cooler', 'ram', 'gpu', 'ssd', 'psu'] as const).filter(id => !build[id === 'cooler' ? 'cooling' : id]), [build]);
  const found = useRef<Object3D | null>(null);
  useFrame(() => {
    // look the chassis up again only when it was replaced (detail level loaded)
    if (!found.current?.parent) found.current = group.current?.getObjectByName(own ? `asset:${own.id}.glb` : 'asset:chassis.glb') ?? null;
    const chassis = found.current;
    if (!chassis) return;
    const key = `${chassis.uuid}:${finish.case}`;
    if (applied.current === key) return;
    // a dark case keeps its light trims (wood, silver) when painted
    applyPaint(chassis, paint, { onlyDark: native === 'black' });
    applied.current = key;
    notifySetupChanged();
  });
  return (
    <group ref={group}>
      <PCCase rig={rig} hide={hide} interactive={false} rgbColor={rgbColorOf(finish)} build={build} />
    </group>
  );
}

const MOUSE_ROT = [0, Math.PI, 0] as const;
const CHAIR_POSITION = [-1.12, 0, 0.4] as const;
const HEADSET_OFFSET = [0, 0.045, 0] as const;
const MAT_PIVOT = { pivotX: MAT.position[0] - MAT.size[0] / 2 };

/**
 * `pcRig`: who drives the system unit (default: the assembly timeline when
 * animated, else a fixed pose; the home hero leaves it to the scroll story).
 */
export function SetupItems({ build, finish, animated = false, pcRig }: { build: ResolvedBuild; finish: Finish; animated?: boolean; pcRig?: PcRigMode }) {
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
  const rightSpeaker = useMemo(() => speakers && { ...speakers, modelPath: speakers.modelPath.replace('speaker_left', 'speaker_right') }, [speakers]);

  return (
    <>
      <Piece k="mat" animated={animated} unroll={MAT_PIVOT}>
        <DeskMat />
      </Piece>
      {monitor && <Monitor key={monitor.id} product={monitor} paint={paints.monitor} animated={animated} />}
      {keyboard && (
        <Piece k="keyboard" animated={animated} from={[0, 0.08, 0.3]}>
          <ProductModel key={keyboard.id} product={keyboard} axis={0} paint={paints.keyboard} position={KEYBOARD.position} />
        </Piece>
      )}
      {mouse && (
        <Piece k="mouse" animated={animated} from={[0.18, 0.06, 0.16]}>
          <ProductModel key={mouse.id} product={mouse} axis={2} rotation={MOUSE_ROT} paint={paints.mouse} position={MOUSE.position} rotation-y={MOUSE.yaw} />
        </Piece>
      )}
      {speakers && rightSpeaker && (
        <Piece k="speakers" animated={animated} from={[0, 0.24, 0]}>
          <ProductModel key={`${speakers.id}-l`} product={speakers} axis={1} paint={paints.speakers} position={SPEAKERS.left.position} rotation-y={SPEAKERS.left.yaw} />
          <ProductModel key={`${speakers.id}-r`} product={rightSpeaker} axis={1} paint={paints.speakers} position={SPEAKERS.right.position} rotation-y={SPEAKERS.right.yaw} />
        </Piece>
      )}
      {headset && (
        <group position={[...HEADSET.position]}>
          <Piece k="headsetStand" animated={animated} from={[0, 0.2, 0]}>
            <mesh position-y={0.007} castShadow>
              <cylinderGeometry args={[0.055, 0.06, 0.014, 40]} />
              <meshStandardMaterial color="#25282d" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position-y={0.135} castShadow>
              <cylinderGeometry args={[0.006, 0.006, 0.25, 20]} />
              <meshStandardMaterial color="#555962" metalness={0.9} roughness={0.3} />
            </mesh>
          </Piece>
          <Piece k="headset" animated={animated} from={[0, 0.16, 0]}>
            <ProductModel key={headset.id} product={headset} axis={1} offset={HEADSET_OFFSET} paint={paints.headset} rotation-y={HEADSET.yaw} />
          </Piece>
        </group>
      )}
      {chair && (
        <Piece k="chair" animated={animated} from={[-0.25, 0, 0.7]}>
          {isTieredModel(chair.modelPath) ? (
            <ProductModel key={chair.id} product={chair} axis={1} paint={null} position={CHAIR_POSITION} rotation-y={0.75} />
          ) : (
            <Chair key={chair.id} height={chair.modelSize} upholstery={chairWhite ? '#d8d9dd' : '#1c1d21'} position={[...CHAIR_POSITION]} rotation-y={0.75} />
          )}
        </Piece>
      )}
      {build.case && (
        <Piece k="pcCase" animated={animated} from={[0.45, 0, 0.05]}>
          <SetupPC build={build} finish={finish} rig={pcRig ?? (animated ? 'external' : 'fixed')} />
        </Piece>
      )}
    </>
  );
}
