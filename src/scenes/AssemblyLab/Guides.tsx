import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BoxGeometry, EdgesGeometry, type Group, type LineBasicMaterial, type LineSegments, type Mesh, type MeshBasicMaterial } from 'three';
import { useT } from '@/hooks/useT';
import { STEPS, type StepId } from '@/labs/AssemblyLab';
import { useAssemblyLabStore } from '@/store/assemblyLabStore';
import { useDisposable } from '@/hooks/useDisposable';
import { dragState } from './dragState';
import { BENCH_ROT, CASE_ROT, GHOST_SIZE, stepRotation, targetPosition } from './layout';
import styles from './labels.module.css';

const ghostRotation = (step: StepId, installed: readonly StepId[]) => (step === 'motherboard' ? BENCH_ROT : step === 'mountBoard' ? CASE_ROT : stepRotation(step, installed));

/**
 * Transparent placement guide at the right slot: for the carried part while
 * it is near (brighter when a release would snap), or for the hinted step.
 * Stays mounted and is resized per step, so no Html root is torn down mid-render.
 */
function Ghost({ source }: { source: 'drag' | 'hint' }) {
  const t = useT();
  const group = useRef<Group>(null);
  const box = useRef<Group>(null);
  const fill = useRef<Mesh>(null);
  const edges = useRef<LineSegments>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const geo = useDisposable(() => {
    const unit = new BoxGeometry(1, 1, 1);
    return { unit, edges: new EdgesGeometry(unit) };
  }, []);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const s = useAssemblyLabStore.getState();
    const installed = s.assembly.installed;
    const step = source === 'drag' ? dragState.step : s.hinted;
    const carried = step !== null && dragState.step === step;
    const show = step !== null && !installed.includes(step) && (source === 'drag' ? dragState.near : !carried);
    g.visible = show;
    if (tag.current) tag.current.dataset.hidden = String(!show);
    if (!show || step === null) return;
    g.position.copy(targetPosition(STEPS[step].target, installed));
    g.quaternion.copy(ghostRotation(step, installed));
    box.current?.scale.set(...GHOST_SIZE[step]);
    const snap = carried && dragState.snap;
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 5);
    (fill.current!.material as MeshBasicMaterial).opacity = snap ? 0.34 : 0.12 + pulse * 0.1;
    (edges.current!.material as LineBasicMaterial).color.set(snap ? '#9cffe6' : '#38d6f5');
    if (tag.current) {
      tag.current.dataset.snap = String(snap);
      tag.current.textContent = t(snap ? 'pcLab.ghost.release' : 'pcLab.ghost.here');
    }
  });

  return (
    <group ref={group} visible={false}>
      <group ref={box}>
        <mesh ref={fill} geometry={geo.unit} renderOrder={10}>
          <meshBasicMaterial color="#55e4ce" transparent opacity={0.15} depthWrite={false} toneMapped={false} />
        </mesh>
        <lineSegments ref={edges} geometry={geo.edges} renderOrder={11}>
          <lineBasicMaterial color="#38d6f5" transparent opacity={0.95} depthTest={false} toneMapped={false} />
        </lineSegments>
      </group>
      <Html center position={[0, 0, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <span ref={tag} className={styles.ghostTag} data-hidden="true" />
      </Html>
    </group>
  );
}

/** Expanding ring where a part was just installed (green) or refused (red). */
function Flash() {
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const { flash, assembly } = useAssemblyLabStore.getState();
    const age = flash ? (performance.now() - flash.at) / 700 : 1;
    m.visible = age < 1;
    if (!flash || age >= 1) return;
    m.position.copy(targetPosition(flash.target, assembly.installed));
    m.scale.setScalar(0.04 + age * 0.16);
    const mat = m.material as MeshBasicMaterial;
    mat.color.set(flash.ok ? '#3ddc97' : '#ff5c7a');
    mat.opacity = (1 - age) * 0.55;
  });
  return (
    <mesh ref={mesh} visible={false} renderOrder={12}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial transparent depthWrite={false} toneMapped={false} wireframe />
    </mesh>
  );
}

export function Guides() {
  return (
    <>
      <Ghost source="drag" />
      <Ghost source="hint" />
      <Flash />
    </>
  );
}
