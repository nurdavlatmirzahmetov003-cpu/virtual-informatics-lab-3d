/**
 * Bit, the robot teacher (2026-10): a friendly hovering robot near the
 * entrance. It turns its head to the visitor, blinks, waves now and then,
 * and a click opens its check of the student's progress (TeacherPanel).
 * Procedural (seven merged meshes, no download); still for reduced motion.
 */
import { useMemo, useRef, useState, type Ref } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CapsuleGeometry, CircleGeometry, Color, CylinderGeometry, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3, type Group, type Material, type Mesh, type MeshBasicMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ROBOT } from '@/data/lab/classroom';
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFront, roundedRectShape } from '@/lib/three/geometry';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { useLabStore } from '@/store/labStore';
import { mergePieces, type Piece, type Place } from './mergeParts';
import styles from './RobotTeacher.module.css';

const SHELL = '#f4f6fa';
const JOINT = '#2a3142';
const SCREEN = '#070c18';
const GLOW = '#38d6f5';

/** Rounded screen panel (w × h × d), centred on its origin. */
function panel(w: number, h: number, r: number, d: number) {
  const g = extrudeFront(roundedRectShape(w, h, r), d, { bevel: 0 });
  g.translate(0, 0, -d / 2);
  return g;
}

/** An arm hanging from its shoulder: joint, forearm, joint (local to the shoulder). */
const armPieces = (parents: readonly Place[] = []): Piece[] => [
  { geo: new SphereGeometry(0.055, 12, 8), color: JOINT, parents },
  { geo: new CapsuleGeometry(0.042, 0.2, 3, 10), at: [0, -0.16, 0], color: SHELL, parents },
  { geo: new SphereGeometry(0.05, 12, 8), at: [0, -0.32, 0], color: JOINT, parents },
];

/**
 * The robot's static parts merged per moving group and per material (seven
 * draw calls instead of two dozen): body, its glow, the waving arm, the head,
 * the head's glow, and the blinking eyes.
 */
function robotGeometry() {
  const LEFT_ARM: Place = { at: [-0.24, 0.66, 0], rot: [0, 0, -0.18] };
  const ear = (s: number): Place => ({ at: [s * 0.23, 0, 0], rot: [0, 0, (s * Math.PI) / 2] });
  return {
    body: mergePieces(
      [
        { geo: new CylinderGeometry(0.2, 0.24, 0.1, 28), at: [0, 0.14, 0], color: JOINT },
        { geo: new CapsuleGeometry(0.2, 0.3, 5, 20), at: [0, 0.52, 0], scale: [1, 1, 0.82], color: SHELL },
        { geo: panel(0.24, 0.17, 0.03, 0.02), at: [0, 0.56, 0.158], color: SCREEN },
        { geo: new CylinderGeometry(0.05, 0.06, 0.06, 12), at: [0, 0.83, 0], color: JOINT },
        ...armPieces([LEFT_ARM]),
      ],
      true,
    ),
    bodyGlow: mergePieces([
      { geo: new TorusGeometry(0.2, 0.012, 6, 32), at: [0, 0.085, 0], rot: [Math.PI / 2, 0, 0] },
      { geo: new TorusGeometry(0.045, 0.009, 6, 20), at: [0, 0.56, 0.17] },
    ]),
    arm: mergePieces(armPieces(), true),
    head: mergePieces(
      [
        { geo: new RoundedBoxGeometry(0.44, 0.32, 0.34, 3, 0.1), color: SHELL },
        { geo: panel(0.36, 0.22, 0.06, 0.02), at: [0, 0, 0.165], color: SCREEN },
        { geo: new CylinderGeometry(0.06, 0.06, 0.04, 16), color: JOINT, parents: [ear(-1)] },
        { geo: new CylinderGeometry(0.06, 0.06, 0.04, 16), color: JOINT, parents: [ear(1)] },
        { geo: new CylinderGeometry(0.008, 0.008, 0.12, 8), at: [0, 0.22, 0], color: JOINT },
      ],
      true,
    ),
    headGlow: mergePieces([
      // smile, ear rings and the antenna tip
      { geo: new TorusGeometry(0.05, 0.007, 5, 14, Math.PI), at: [0, -0.035, 0.178], rot: [0, 0, Math.PI] },
      { geo: new TorusGeometry(0.04, 0.007, 5, 18), at: [0, 0.022, 0], parents: [ear(-1)] },
      { geo: new TorusGeometry(0.04, 0.007, 5, 18), at: [0, -0.022, 0], parents: [ear(1)] },
      { geo: new SphereGeometry(0.028, 10, 8), at: [0, 0.29, 0] },
    ]),
    eyes: mergePieces([-0.075, 0.075].map((x) => ({ geo: new CircleGeometry(0.03, 16), at: [x, 0, 0] as const, scale: [1, 1.35, 1] as const }))),
  };
}

const tmp = new Vector3();
const GLOW_COLOR = new Color(GLOW);

/** The robot's shell: PBR on High / Ultra, Lambert (no environment lighting) on Low / Medium (V2-12 perf). */
function Solid({ cheap, roughness = 0.25 }: { cheap: boolean; roughness?: number }) {
  return cheap ? <meshLambertMaterial vertexColors /> : <meshStandardMaterial vertexColors metalness={0.25} roughness={roughness} />;
}

/** Glowing parts: emissive PBR (it feeds the bloom) or, without post-processing, an unlit colour as bright. */
function Glow({ cheap, power, ref }: { cheap: boolean; power: number; ref?: Ref<Material> }) {
  return cheap ? (
    <meshBasicMaterial ref={ref} color={GLOW_COLOR.clone().multiplyScalar(power)} toneMapped={false} />
  ) : (
    <meshStandardMaterial ref={ref} color={GLOW} emissive={GLOW} emissiveIntensity={power} toneMapped={false} />
  );
}

export function RobotTeacher() {
  const t = useT();
  const reduced = useReducedMotion();
  const light = useTheme() === 'light';
  const openTeacher = useLabStore((s) => s.openTeacher);
  const open = useLabStore((s) => s.teacher);
  const focus = useLabStore((s) => s.focus);
  const [hover, setHover] = useState(false);
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const eyes = useRef<Mesh>(null);
  const tip = useRef<Material>(null);
  const level = useQualityPreset().level;
  const cheap = level === 'low' || level === 'medium';
  const geo = useDisposable(robotGeometry, []);
  const waveUntil = useRef(0);

  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;
    const b = body.current;
    const h = head.current;
    if (!b || !h || !root.current) return;
    if (!reduced) b.position.y = 0.04 * Math.sin(time * 1.6);
    // head follows the visitor (camera), within a natural range
    root.current.worldToLocal(tmp.copy(camera.position));
    const yaw = Math.max(-0.7, Math.min(0.7, Math.atan2(tmp.x, tmp.z)));
    h.rotation.y += (yaw - h.rotation.y) * 0.08;
    // blink every few seconds
    if (eyes.current) eyes.current.scale.y = !reduced && time % 4.2 < 0.12 ? 0.15 : 1;
    // wave on hover and now and then
    if (hover || (!reduced && time % 11 < 0.05)) waveUntil.current = time + 2.2;
    const a = arm.current;
    if (a) {
      const waving = !reduced && time < waveUntil.current;
      const goal = waving ? 2.4 + 0.35 * Math.sin(time * 9) : 0.18;
      a.rotation.z += (goal - a.rotation.z) * 0.15;
    }
    const m = tip.current;
    if (m) {
      const k = 1.8 + (reduced ? 0 : Math.sin(time * 3) * 0.5);
      if (m instanceof MeshStandardMaterial) m.emissiveIntensity = k;
      else (m as MeshBasicMaterial).color.copy(GLOW_COLOR).multiplyScalar(k);
    }
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    openTeacher();
  };
  const bubble = useMemo(() => (focus ? t('lab.teacher.bubbleZone') : t('lab.teacher.bubble')), [focus, t]);

  return (
    <group ref={root} position={[...ROBOT.position]} rotation-y={ROBOT.yaw}>
      {/* floor glow under the hover base */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.004}>
        <circleGeometry args={[0.38, 40]} />
        <meshBasicMaterial color={GLOW} transparent opacity={light ? 0.18 : 0.26} toneMapped={false} />
      </mesh>
      <group
        ref={body}
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = '';
        }}
      >
        <mesh geometry={geo.body} castShadow>
          <Solid cheap={cheap} />
        </mesh>
        <mesh geometry={geo.bodyGlow}>
          <Glow cheap={cheap} power={2.2} />
        </mesh>
        {/* right arm: waves */}
        <group ref={arm} position={[0.24, 0.66, 0]} rotation-z={0.18}>
          <mesh geometry={geo.arm} castShadow>
            <Solid cheap={cheap} />
          </mesh>
        </group>
        <group ref={head} position-y={1.0}>
          <mesh geometry={geo.head} castShadow>
            <Solid cheap={cheap} roughness={0.2} />
          </mesh>
          <mesh geometry={geo.headGlow}>
            <Glow cheap={cheap} power={1.8} ref={tip} />
          </mesh>
          <mesh ref={eyes} geometry={geo.eyes} position={[0, 0.02, 0.178]}>
            <Glow cheap={cheap} power={2.4} />
          </mesh>
        </group>
      </group>
      {!open && (
        <Html position={[0, 1.55, 0]} center distanceFactor={7} zIndexRange={[18, 0]} className={styles.anchor}>
          <button type="button" className={styles.bubble} data-hover={hover} onClick={() => openTeacher()}>
            <b>{t('lab.teacher.name')}</b>
            <span>{bubble}</span>
          </button>
        </Html>
      )}
    </group>
  );
}
