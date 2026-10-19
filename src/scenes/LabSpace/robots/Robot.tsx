/**
 * One helper robot (0.37) from the robot kit: 3–5 draw calls (shell with its
 * accent colour, glow, BitLab logo, plus an arm / head when the kind moves
 * them). `animate` runs every frame with the robot's parts; the mouth glow
 * opens with Bit's voice while `speaking()` says so.
 */
import { forwardRef, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Color, type Group } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { bitVoice } from '@/services/bit/voice';
import { brandMarkTexture } from './brandMark';
import { robotGeometry, withAccent, type RobotGeometry, type RobotKind } from './robotKit';

export interface RobotParts {
  root: Group;
  arm: Group | null;
  head: Group | null;
  geo: RobotGeometry;
}

export interface RobotProps {
  kind: RobotKind;
  accent: string;
  glow?: string;
  position?: readonly [number, number, number];
  yaw?: number;
  animate?: (parts: RobotParts, time: number, delta: number) => void;
  speaking?: () => boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  children?: ReactNode;
  name?: string;
}

export const Robot = forwardRef<Group, RobotProps>(function Robot({ kind, accent, glow = '#38d6f5', position, yaw = 0, animate, speaking, onClick, children, name }, ref) {
  const geo = useMemo(() => robotGeometry(kind), [kind]);
  // shell and accent in one draw call (the accent never changes on these robots)
  const body = useMemo(() => withAccent(geo.solid, geo.accent, accent), [geo, accent]);
  useEffect(
    () => () => {
      for (const g of [geo.solid, geo.accent, geo.glow, geo.arm?.geo, geo.head?.geo, geo.head?.glow]) g?.dispose();
    },
    [geo],
  );
  useEffect(() => () => body.dispose(), [body]);
  const level = useQualityPreset().level;
  const cheap = level === 'low' || level === 'medium';
  const reduced = useReducedMotion();
  const root = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const head = useRef<Group>(null);
  const glowColor = useMemo(() => new Color(glow).multiplyScalar(1.6), [glow]);
  const logo = brandMarkTexture();

  useFrame(({ clock }, delta) => {
    const r = root.current;
    if (!r) return;
    if (!reduced) animate?.({ root: r, arm: arm.current, head: head.current, geo }, clock.elapsedTime, Math.min(delta, 0.1));
    // a talking robot nods a little with Bit's voice
    if (head.current && speaking?.()) head.current.rotation.x = Math.min(0.12, bitVoice.level() * 0.25);
  });

  const solid = cheap ? <meshLambertMaterial vertexColors /> : <meshStandardMaterial vertexColors metalness={0.2} roughness={0.32} />;
  return (
    <group
      ref={(g) => {
        root.current = g;
        if (typeof ref === 'function') ref(g);
        else if (ref) ref.current = g;
      }}
      name={name}
      position={position ? [...position] : undefined}
      rotation-y={yaw}
      onClick={onClick}
    >
      <mesh geometry={body} castShadow>
        {solid}
      </mesh>
      <mesh geometry={geo.glow}>
        <meshBasicMaterial color={glowColor} toneMapped={false} />
      </mesh>
      <mesh position={[...geo.logo.at]} rotation={geo.logo.rot ? [...geo.logo.rot] : undefined}>
        <planeGeometry args={[geo.logo.size, geo.logo.size]} />
        <meshBasicMaterial map={logo} transparent toneMapped={false} />
      </mesh>
      {geo.arm && (
        <group ref={arm} position={[...geo.arm.pivot]}>
          <mesh geometry={geo.arm.geo} castShadow>
            {solid}
          </mesh>
        </group>
      )}
      {geo.head && (
        <group ref={head} position={[...geo.head.pivot]}>
          <mesh geometry={geo.head.geo} castShadow>
            {solid}
          </mesh>
          <mesh geometry={geo.head.glow}>
            <meshBasicMaterial color={glowColor} toneMapped={false} />
          </mesh>
        </group>
      )}
      {children}
    </group>
  );
});
