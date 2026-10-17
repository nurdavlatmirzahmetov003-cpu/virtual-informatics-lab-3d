/**
 * Bit, the robot teacher (2026-10): a friendly hovering robot near the
 * entrance. It turns its head to the visitor, blinks, waves now and then,
 * and a click opens its check of the student's progress (TeacherPanel).
 * Procedural (about twenty meshes, no download); still for reduced motion.
 */
import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { Vector3, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import { ROBOT } from '@/data/lab/classroom';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { useLabStore } from '@/store/labStore';
import styles from './RobotTeacher.module.css';

const SHELL = { color: '#f4f6fa', metalness: 0.15, roughness: 0.22 } as const;
const JOINT = { color: '#2a3142', metalness: 0.7, roughness: 0.3 } as const;
const GLOW = '#38d6f5';

const tmp = new Vector3();

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
  const eyes = useRef<Group>(null);
  const tip = useRef<MeshStandardMaterial>(null);
  const ring = useRef<Mesh>(null);
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
    if (tip.current) tip.current.emissiveIntensity = 1.6 + (reduced ? 0 : Math.sin(time * 3) * 0.8);
    if (ring.current) ring.current.rotation.z = reduced ? 0 : time * 0.6;
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
        {/* hover base */}
        <mesh position-y={0.14} castShadow>
          <cylinderGeometry args={[0.2, 0.24, 0.1, 40]} />
          <meshStandardMaterial {...JOINT} />
        </mesh>
        <mesh ref={ring} position-y={0.085} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.2, 0.012, 10, 48]} />
          <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* torso */}
        <mesh position-y={0.52} scale={[1, 1, 0.82]} castShadow>
          <capsuleGeometry args={[0.2, 0.3, 8, 24]} />
          <meshStandardMaterial {...SHELL} />
        </mesh>
        {/* chest screen with a glowing ring */}
        <RoundedBox args={[0.24, 0.17, 0.02]} radius={0.03} smoothness={3} position={[0, 0.56, 0.158]}>
          <meshStandardMaterial color="#0b1222" metalness={0.3} roughness={0.15} />
        </RoundedBox>
        <mesh position={[0, 0.56, 0.17]}>
          <torusGeometry args={[0.045, 0.009, 10, 36]} />
          <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        {/* arms: left resting, right waving */}
        <group position={[-0.24, 0.66, 0]} rotation-z={-0.18}>
          <mesh>
            <sphereGeometry args={[0.055, 20, 16]} />
            <meshStandardMaterial {...JOINT} />
          </mesh>
          <mesh position-y={-0.16} castShadow>
            <capsuleGeometry args={[0.042, 0.2, 6, 16]} />
            <meshStandardMaterial {...SHELL} />
          </mesh>
          <mesh position-y={-0.32}>
            <sphereGeometry args={[0.05, 20, 16]} />
            <meshStandardMaterial {...JOINT} />
          </mesh>
        </group>
        <group ref={arm} position={[0.24, 0.66, 0]} rotation-z={0.18}>
          <mesh>
            <sphereGeometry args={[0.055, 20, 16]} />
            <meshStandardMaterial {...JOINT} />
          </mesh>
          <mesh position-y={-0.16} castShadow>
            <capsuleGeometry args={[0.042, 0.2, 6, 16]} />
            <meshStandardMaterial {...SHELL} />
          </mesh>
          <mesh position-y={-0.32}>
            <sphereGeometry args={[0.05, 20, 16]} />
            <meshStandardMaterial {...JOINT} />
          </mesh>
        </group>
        {/* neck and head */}
        <mesh position-y={0.83}>
          <cylinderGeometry args={[0.05, 0.06, 0.06, 20]} />
          <meshStandardMaterial {...JOINT} />
        </mesh>
        <group ref={head} position-y={1.0}>
          <RoundedBox args={[0.44, 0.32, 0.34]} radius={0.1} smoothness={4} castShadow>
            <meshStandardMaterial {...SHELL} />
          </RoundedBox>
          {/* face screen */}
          <RoundedBox args={[0.36, 0.22, 0.02]} radius={0.06} smoothness={4} position-z={0.165}>
            <meshStandardMaterial color="#070c18" metalness={0.4} roughness={0.08} />
          </RoundedBox>
          <group ref={eyes} position={[0, 0.02, 0.178]}>
            {[-0.075, 0.075].map((x) => (
              <mesh key={x} position-x={x} scale={[1, 1.35, 1]}>
                <circleGeometry args={[0.03, 24]} />
                <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.4} toneMapped={false} />
              </mesh>
            ))}
          </group>
          {/* smile */}
          <mesh position={[0, -0.035, 0.178]} rotation-z={Math.PI}>
            <torusGeometry args={[0.05, 0.007, 8, 24, Math.PI]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2} toneMapped={false} />
          </mesh>
          {/* ears */}
          {[-1, 1].map((s) => (
            <group key={s} position-x={s * 0.23} rotation-z={(s * Math.PI) / 2}>
              <mesh>
                <cylinderGeometry args={[0.06, 0.06, 0.04, 24]} />
                <meshStandardMaterial {...JOINT} />
              </mesh>
              <mesh position-y={s * -0.022}>
                <torusGeometry args={[0.04, 0.007, 8, 24]} />
                <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={1.8} toneMapped={false} />
              </mesh>
            </group>
          ))}
          {/* antenna */}
          <mesh position-y={0.22}>
            <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
            <meshStandardMaterial {...JOINT} />
          </mesh>
          <mesh position-y={0.29}>
            <sphereGeometry args={[0.028, 16, 12]} />
            <meshStandardMaterial ref={tip} color={GLOW} emissive={GLOW} emissiveIntensity={1.6} toneMapped={false} />
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
