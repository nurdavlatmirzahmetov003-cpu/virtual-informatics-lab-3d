/**
 * Zone 11 (V4 §4.3): the robots' yard — garages with each robot's name,
 * charging pad and battery bar, the mini pitch, the play corner, the work
 * props and the lounge, with the robots living their day in it (the shared
 * yard simulation, services/robots/yardSim.ts): working, walking to their
 * garage when the battery runs low, sleeping while they charge, waking up,
 * playing football and resting in the lounge.
 *
 * Draw calls: the yard is one mesh, the docks one, the name plates one, the
 * ball one; each robot 4–6 (fewer robots on Low). Far from the yard (the
 * camera at another zone) the simulation steps five times a second.
 * A click on a robot (or, focused on the yard, coming close) makes it say a
 * tip (§4.5).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Vector3, type Group, type Mesh, type ShaderMaterial } from 'three';
import { ROSTER, robotById, type RobotId } from '@/data/robots/roster';
import { PITCH } from '@/data/robots/yard';
import { zoneById } from '@/data/lab/zones';
import type { Agent } from '@/lib/robots/life';
import type { TranslationKey } from '@/lib/i18n';
import { useDisposable } from '@/hooks/useDisposable';
import { useCanvasFonts } from '@/hooks/useCanvasFonts';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settingsStore';
import { useBitStore } from '@/store/bitStore';
import { useLabStore } from '@/store/labStore';
import { useRobotsStore } from '@/store/robotsStore';
import { advanceYard, yardWorld } from '@/services/robots/yardSim';
import { sayRobotTip } from '@/services/robots/robotTips';
import { Robot, type RobotParts } from '../../robots/Robot';
import { poseOf, poseRobot } from '../../robots/robotMotion';
import type { ZoneContentProps } from '../zoneData';
import { DOCK_FRAGMENT, DOCK_VERTEX, dockGlow, nameplates, yardStatic } from './yardGeometry';

const ZONE = zoneById('robots');
const FAR = 13;

export function RobotsZone({ detail }: ZoneContentProps) {
  const t = useT();
  const theme = useTheme();
  const light = theme === 'light';
  const fonts = useCanvasFonts();
  const level = useQualityPreset().level;
  const low = level === 'low';
  const reduced = useReducedMotion();
  const save = useRobotsStore((s) => s.save);
  const levels = save.levels;
  const world = useMemo(() => yardWorld(low, levels), [low, levels]);
  const camera = useThree((s) => s.camera);

  const staticGeo = useDisposable(() => yardStatic(light), [light]);
  const dockGeo = useDisposable(dockGlow, []);
  const names = ROSTER.map((r) => t(`robots.list.${r.id}.name` as TranslationKey));
  const namesKey = names.join('|');
  const plates = useMemo(() => nameplates(namesKey.split('|')),
    // the fonts are in once `fonts` turns 1: draw the names again
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namesKey, fonts],
  );
  useEffect(() => () => {
    plates.geo.dispose();
    plates.texture.dispose();
  }, [plates]);

  const dockMat = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uBattery: { value: new Array(10).fill(1) }, uCharging: { value: new Array(10).fill(0) }, uTime: { value: 0 }, uLight: { value: 1 } }), []);
  const ball = useRef<Mesh>(null);
  const holders = useRef(new Map<RobotId, Group>());
  const acc = useRef(0);
  const centre = useMemo(() => new Vector3(ZONE.center[0], 0.5, ZONE.center[1]), []);
  const tmp = useMemo(() => new Vector3(), []);

  useFrame(({ clock }, delta) => {
    const far = camera.position.distanceTo(centre) > FAR;
    // the simulation runs on (still for reduced motion: the robots stand where they are)
    if (!reduced) {
      acc.current += Math.min(delta, 0.25);
      if (!far || acc.current >= 0.2) {
        advanceYard(world, acc.current, far ? 0.2 : 0.1);
        acc.current = 0;
      }
    }
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uLight.value = light ? 1 : 0;
    world.agents.forEach((a, i) => {
      uniforms.uBattery.value[i] = a.state === 'away' ? 0 : a.battery;
      uniforms.uCharging.value[i] = a.state === 'charging' ? 1 : 0;
      const g = holders.current.get(a.id);
      if (!g) return;
      g.position.set(a.pos[0], 0, a.pos[1]);
      // turn smoothly towards the heading
      let d = a.yaw - g.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      g.rotation.y += d * Math.min(1, delta * 8);
    });
    if (ball.current) {
      ball.current.visible = !!world.match;
      ball.current.position.set(world.ball.pos[0], PITCH.ball, world.ball.pos[1]);
      ball.current.rotation.x += world.ball.vel[1] * delta * 12;
      ball.current.rotation.z -= world.ball.vel[0] * delta * 12;
    }
    // focused on the yard: a robot the camera comes close to offers a tip
    if (useLabStore.getState().focus === 'robots' && !far) {
      for (const a of world.agents) {
        if (a.state === 'away' || a.state === 'charging') continue;
        tmp.set(ZONE.center[0] + a.pos[0], 0.6, ZONE.center[1] + a.pos[1]);
        if (camera.position.distanceTo(tmp) < 2.2) {
          sayRobotTip(a.id, 'near', useSettingsStore.getState().language, useBitStore.getState().voice);
          break;
        }
      }
    }
  });

  const click = (id: RobotId) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    sayRobotTip(id, 'click', useSettingsStore.getState().language, useBitStore.getState().voice);
  };

  const solid = level === 'low' || level === 'medium' ? <meshLambertMaterial vertexColors /> : <meshStandardMaterial vertexColors roughness={0.6} metalness={0.05} />;
  return (
    <group name="robots-yard">
      <mesh geometry={staticGeo} receiveShadow castShadow={detail === 'full'}>
        {solid}
      </mesh>
      <mesh geometry={dockGeo}>
        <shaderMaterial ref={dockMat} vertexShader={DOCK_VERTEX} fragmentShader={DOCK_FRAGMENT} uniforms={uniforms} toneMapped={false} />
      </mesh>
      <mesh geometry={plates.geo}>
        <meshBasicMaterial map={plates.texture} toneMapped={false} />
      </mesh>
      <mesh ref={ball} visible={false} castShadow>
        <sphereGeometry args={[PITCH.ball, 16, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {world.agents
        .filter((a) => a.state !== 'away')
        .map((a, i) => (
          <YardRobot key={a.id} agent={a} phase={i * 0.7} onClick={click(a.id)} holder={(g) => (g ? holders.current.set(a.id, g) : holders.current.delete(a.id))} />
        ))}
    </group>
  );
}

function YardRobot({ agent, phase, onClick, holder }: { agent: Agent; phase: number; onClick: (e: ThreeEvent<MouseEvent>) => void; holder: (g: Group | null) => void }) {
  const r = robotById(agent.id);
  const wear = useRobotsStore((s) => s.save.wear[agent.id]);
  const animate = useMemo(() => (p: RobotParts, time: number) => poseRobot(r.kind, p, poseOf(agent), time, phase), [r.kind, agent, phase]);
  const box = useRef<Mesh>(null);
  useFrame(() => {
    if (box.current) box.current.visible = agent.carrying;
  });
  return (
    <group ref={holder} position={[agent.pos[0], 0, agent.pos[1]]} rotation-y={agent.yaw}>
      <group scale={r.scale}>
        <Robot kind={r.kind} accent={r.accent} glow={r.glow} animate={animate} stillAt={phase} onClick={onClick} wear={wear} name={`yard-${agent.id}`}>
          {agent.id === 'cargo' && (
            <mesh ref={box} position={[0, 0.45, -0.05]} visible={false}>
              <boxGeometry args={[0.3, 0.22, 0.26]} />
              <meshLambertMaterial color="#c9a072" />
            </mesh>
          )}
        </Robot>
      </group>
    </group>
  );
}
