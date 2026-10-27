/**
 * One helper robot (0.37) from the robot kit: 3–5 draw calls (shell with its
 * accent colour, glow, BitLab logo, plus an arm / head when the kind moves
 * them). `animate` runs every frame with the robot's parts; the mouth glow
 * opens with Bit's voice while `speaking()` says so. V4 §4.4: `wear` dresses
 * it from the wardrobe (a shirt repaints it; the rest is one or two merged
 * meshes, a worn hat replaces the robot's own).
 */
import { forwardRef, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Color, type Group, type MeshBasicMaterial } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { bitVoice } from '@/services/bit/voice';
import { brandMarkTexture } from './brandMark';
import type { WardrobeSlot } from '@/services/robots/economy';
import { robotGeometry, withAccent, type RobotGeometry, type RobotKind } from './robotKit';
import { shirtColour, wornGeometry } from './wardrobeKit';

export interface RobotParts {
  root: Group;
  arm: Group | null;
  head: Group | null;
  geo: RobotGeometry;
  /** The glowing eyes and lights, and their full colour (dim them for sleep). */
  glow: readonly MeshBasicMaterial[];
  glowColor: Color;
}

export interface RobotProps {
  kind: RobotKind;
  accent: string;
  glow?: string;
  position?: readonly [number, number, number];
  yaw?: number;
  animate?: (parts: RobotParts, time: number, delta: number) => void;
  /** With reduced motion, `animate` still runs, frozen at this time (a still pose instead of none). */
  stillAt?: number;
  speaking?: () => boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  children?: ReactNode;
  name?: string;
  /** Wardrobe items worn, by slot. */
  wear?: Partial<Record<WardrobeSlot, string>>;
}

export const Robot = forwardRef<Group, RobotProps>(function Robot({ kind, accent, glow = '#38d6f5', position, yaw = 0, animate, stillAt, speaking, onClick, children, name, wear }, ref) {
  const wearKey = JSON.stringify(wear ?? {});
  const colour = useMemo(() => shirtColour(accent, JSON.parse(wearKey)), [accent, wearKey]);
  const geo = useMemo(() => robotGeometry(kind, colour), [kind, colour]);
  // shell and accent in one draw call (the accent only changes with a new shirt)
  const body = useMemo(() => withAccent(geo.solid, geo.accent, colour), [geo, colour]);
  const worn = useMemo(() => wornGeometry(geo, JSON.parse(wearKey)), [geo, wearKey]);
  const ownHat = geo.hat && !JSON.parse(wearKey).hat;
  useEffect(() => () => void [worn.body, worn.head].forEach((g) => g?.dispose()), [worn]);
  useEffect(
    () => () => {
      for (const g of [geo.solid, geo.accent, geo.glow, geo.arm?.geo, geo.head?.geo, geo.head?.glow, geo.logo.geo, geo.hat?.geo]) g?.dispose();
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
  const glowBody = useRef<MeshBasicMaterial>(null);
  const glowHead = useRef<MeshBasicMaterial>(null);
  const logo = brandMarkTexture();

  useFrame(({ clock }, delta) => {
    const r = root.current;
    if (!r) return;
    const parts = { root: r, arm: arm.current, head: head.current, geo, glow: [glowBody.current, glowHead.current].filter((m): m is MeshBasicMaterial => !!m), glowColor };
    if (!reduced) animate?.(parts, clock.elapsedTime, Math.min(delta, 0.1));
    else if (stillAt !== undefined) animate?.(parts, stillAt, 0);
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
        <meshBasicMaterial ref={glowBody} color={glowColor} toneMapped={false} />
      </mesh>
      {worn.body && (
        <mesh geometry={worn.body} castShadow>
          {solid}
        </mesh>
      )}
      {geo.logo.geo ? (
        // printed on the shirt: a patch of the chest's own surface
        <mesh geometry={geo.logo.geo} position={[...geo.logo.at]} scale={geo.logo.scale ? [...geo.logo.scale] : undefined}>
          <meshBasicMaterial map={logo} transparent alphaTest={0.05} toneMapped={false} />
        </mesh>
      ) : (
        <mesh position={[...geo.logo.at]} rotation={geo.logo.rot ? [...geo.logo.rot] : undefined}>
          <planeGeometry args={[geo.logo.size, geo.logo.size]} />
          <meshBasicMaterial map={logo} transparent toneMapped={false} />
        </mesh>
      )}
      {ownHat && geo.hat && !geo.hat.onHead && (
        <mesh geometry={geo.hat.geo} castShadow>
          {solid}
        </mesh>
      )}
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
            <meshBasicMaterial ref={glowHead} color={glowColor} toneMapped={false} />
          </mesh>
          {worn.head && (
            <mesh geometry={worn.head} castShadow>
              {solid}
            </mesh>
          )}
        </group>
      )}
      {children}
    </group>
  );
});
