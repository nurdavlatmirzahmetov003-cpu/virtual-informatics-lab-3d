import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, type Group, type PerspectiveCamera } from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { STEP_IDS, type StepId } from '@/labs/AssemblyLab';
import type { ResolvedBuild } from '@/lib/studio/build';
import { showcaseBuild } from '@/lib/studio/showcase';
import { framingScale } from '@/lib/three/framing';
import { useAssemblyLabStore } from '@/store/assemblyLabStore';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { Room } from '@/scenes/DeskScene/models/Room';
import { HardwarePart } from '@/scenes/DeskScene/pc/HardwareParts';
import { PCCase } from '@/scenes/DeskScene/pc/PCCase';
import type { PartId } from '@/scenes/DeskScene/pc/parts';
import { pcRig } from '@/scenes/DeskScene/pc/pcRig';
import { Hdd } from '@/scenes/HardwareExplorer/placeholders';
import { STUDIO_HDRI } from '@/scenes/SetupStudio/setupShared';
import { Draggable } from './Draggable';
import { SETTLE_MS, dragState } from './dragState';
import { Guides } from './Guides';
import { BOARD_PARTS, CASE, DRIVE_BAY, TRAY, VISUAL_CENTER, boardOffset, boardPose, stepRotation } from './layout';
import { AntiStaticMat, CableBundle, TrayPad } from './props';

const tk = (key: string) => key as TranslationKey;
const BOOT_MS = 2200;
/** Camera framing of the powered-on PC: from the glass side, a little above. */
const SHOWCASE = { target: new Vector3(0.6, 0.98, -0.05), position: new Vector3(-0.12, 1.24, 0.78) };
const settled = (step: StepId) => {
  const s = useAssemblyLabStore.getState();
  const at = s.installedAt[step];
  return s.assembly.installed.includes(step) && at !== undefined && performance.now() - at > SETTLE_MS;
};
const productOf = (build: ResolvedBuild, id: PartId) => build[id === 'cooler' ? 'cooling' : id === 'fans' ? 'case' : id];
const stepOfBoardPart = (p: (typeof BOARD_PARTS)[number]): StepId => (p === 'ssd' ? 'nvme' : p);

/** Motherboard plus whatever is already mounted on it; moves as one piece. */
function BoardContents({ build }: { build: ResolvedBuild }) {
  const refs = useRef<Partial<Record<string, Group | null>>>({});
  useFrame(() => {
    for (const p of BOARD_PARTS) {
      const g = refs.current[p];
      if (g) g.visible = settled(stepOfBoardPart(p));
    }
  });
  return (
    <>
      <HardwarePart id="motherboard" fallback={null} product={build.motherboard} />
      {BOARD_PARTS.map((p) => (
        <group key={p} ref={(g) => void (refs.current[p] = g)} position={boardOffset(p)} visible={false}>
          <HardwarePart id={p} fallback={null} product={productOf(build, p)} />
        </group>
      ))}
    </>
  );
}

/** Drives the shared pcRig: which case parts show, cables, and the power-on. */
function LabRig() {
  const gl = useThree((s) => s.gl);
  useEffect(
    () => () => {
      pcRig.parts = null;
      pcRig.hidden = new Set();
      pcRig.cables = pcRig.fanSpeed = pcRig.rgbPower = 1;
      gl.shadowMap.autoUpdate = true;
    },
    [gl],
  );
  useFrame(() => {
    const s = useAssemblyLabStore.getState();
    const hidden = new Set<PartId>(['motherboard', 'cpu', 'cooler', 'ram', 'ssd']);
    for (const [step, part] of [['psu', 'psu'], ['gpu', 'gpu'], ['fans', 'fans']] as const) if (!settled(step)) hidden.add(part);
    if (hidden.size !== pcRig.hidden.size || [...hidden].some((h) => !pcRig.hidden.has(h))) pcRig.hidden = hidden;
    pcRig.parts = {};
    pcRig.explode = 0;
    pcRig.glassOpen = 1;
    pcRig.cables = settled('cables') ? 1 : 0;
    const boot = s.bootAt === null ? 0 : Math.min(1, Math.max(0, (performance.now() - s.bootAt) / BOOT_MS));
    const ease = boot * boot * (3 - 2 * boot);
    pcRig.fanSpeed = ease;
    pcRig.rgbPower = ease;
    pcRig.glow = ease;
    pcRig.interior = 0.75 + 0.25 * ease;
    // shadows are re-rendered only while something moves
    gl.shadowMap.autoUpdate = false;
    const recent = Object.values(s.installedAt).some((at) => at !== undefined && performance.now() - at < SETTLE_MS + 300);
    if (dragState.moving || recent || (boot > 0 && boot < 1)) gl.shadowMap.needsUpdate = true;
    dragState.moving = 0;
  });
  return null;
}

/** Orbit around the bench; switched off while a part is carried. */
function LabCamera() {
  const { camera, size } = useThree();
  const controls = useRef<Controls>(null);
  const dragging = useAssemblyLabStore((s) => s.dragging);
  useEffect(() => {
    const target = new Vector3(0.08, 0.84, 0.02);
    const pos = new Vector3(-0.22, 1.68, 1.78);
    const aspect = size.width / size.height;
    camera.position.copy(pos.sub(target).multiplyScalar(framingScale(aspect) * (aspect < 0.8 ? 1.15 : 1)).add(target));
    camera.lookAt(target);
    controls.current?.target.copy(target);
    controls.current?.update();
    const c = camera as PerspectiveCamera;
    // the task panel covers the right side on wide screens: shift the scene left
    if (size.width > 960) c.setViewOffset(size.width, size.height, 150, -30, size.width, size.height);
    else c.clearViewOffset();
    return () => c.clearViewOffset();
  }, [camera, size.width, size.height]);
  // when the PC powers on, glide to the open side of the case once (the student can orbit away after)
  const showcase = useRef<number | null>(null);
  const bootAt = useAssemblyLabStore((s) => s.bootAt);
  useEffect(() => {
    showcase.current = bootAt === null ? null : performance.now();
  }, [bootAt]);
  useFrame((_, delta) => {
    const start = showcase.current;
    const c = controls.current;
    if (start === null || !c) return;
    if (performance.now() - start > 2200) {
      showcase.current = null;
      return;
    }
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 3);
    c.target.lerp(SHOWCASE.target, k);
    camera.position.lerp(SHOWCASE.position, k);
    c.update();
  });
  return <OrbitControls ref={controls} makeDefault enabled={!dragging} enablePan={false} minDistance={0.45} maxDistance={4} maxPolarAngle={Math.PI * 0.47} enableDamping />;
}

const PAD_RADIUS: Partial<Record<StepId, number>> = { motherboard: 0.2, cpu: 0.04, cooler: 0.09, ram: 0.08, nvme: 0.055, psu: 0.11, gpu: 0.19, storage: 0.09, fans: 0.09, cables: 0.07 };

function TrayPads() {
  const installed = useAssemblyLabStore((s) => s.assembly.installed);
  const hinted = useAssemblyLabStore((s) => s.hinted);
  return (
    <>
      {STEP_IDS.filter((s) => s !== 'mountBoard' && !installed.includes(s)).map((s) => (
        <TrayPad key={s} x={TRAY[s].x} z={TRAY[s].z} radius={PAD_RADIUS[s] ?? 0.06} active={hinted === s} />
      ))}
    </>
  );
}

export default function AssemblyLabScene() {
  const t = useT();
  const build = showcaseBuild();
  const installed = useAssemblyLabStore((s) => s.assembly.installed);
  const boardStep: StepId = installed.includes('motherboard') ? 'mountBoard' : 'motherboard';
  const name = (s: StepId) => t(tk(`pcLab.steps.${s}.part`));

  const content: Partial<Record<StepId, ReactNode>> = {
    cpu: <HardwarePart id="cpu" fallback={null} product={build.cpu} />,
    cooler: <HardwarePart id="cooler" fallback={null} product={build.cooling} />,
    ram: <HardwarePart id="ram" fallback={null} product={build.ram} />,
    nvme: <HardwarePart id="ssd" fallback={null} product={build.ssd} />,
    psu: <HardwarePart id="psu" fallback={null} product={build.psu} />,
    gpu: <HardwarePart id="gpu" fallback={null} product={build.gpu} />,
    fans: <HardwarePart id="fans" fallback={null} />,
    storage: <Hdd />,
    cables: <CableBundle />,
  };

  return (
    <>
      <EnvironmentLighting hdri={STUDIO_HDRI} environmentIntensity={0.7} intensity={1} shadowExtent={1.4} fog={[5, 14]} />
      <LabRig />
      <LabCamera />
      <Room orbit />
      <Desk />
      <AntiStaticMat />
      <TrayPads />
      <PCCase rig="external" interactive={false} build={build} />
      {/* the extra 3.5" drive inside the case, once installed */}
      <InstalledDrive />

      <Draggable
        step={boardStep}
        rest={(ins) => {
          const pose = boardPose(ins);
          return pose.position.add(VISUAL_CENTER.motherboard.clone().applyQuaternion(pose.rotation));
        }}
        rotation={(ins) => boardPose(ins).rotation}
        center={VISUAL_CENTER.motherboard}
        handOver={false}
        grabbable={!installed.includes('mountBoard')}
        label={name(boardStep)}
      >
        <BoardContents build={build} />
      </Draggable>

      {(Object.keys(content) as StepId[]).map((s) => (
        <Draggable
          key={s}
          step={s}
          rest={() => TRAY[s].clone()}
          rotation={(ins) => stepRotation(s, ins)}
          center={VISUAL_CENTER[s]}
          handOver
          grabbable={!installed.includes(s)}
          label={name(s)}
        >
          {content[s]}
        </Draggable>
      ))}
      <Guides />
    </>
  );
}

function InstalledDrive() {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = settled('storage');
  });
  return (
    <group ref={g} position={CASE.clone().add(DRIVE_BAY)} visible={false}>
      <Hdd />
    </group>
  );
}
