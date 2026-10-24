/**
 * The lab's helper robots (0.37):
 *   - an advisor in front of every zone (instanced: 4 draw calls for all of
 *     them) — a click opens the zone and the advisor presents it with Bit's voice;
 *   - a cleaning robot driving its loop through the aisles;
 *   - a courier bringing parcels from the entrance to the showcase;
 *   - a builder at the PC build bench, screwing the board in.
 * Routes and places: data/lab/robots.ts. Still for reduced motion.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Color, Matrix4, PlaneGeometry, Quaternion, Vector3, type Group, type InstancedMesh } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { zoneById } from '@/data/lab/zones';
import { ADVISOR_ZONES, BUILDER, CLEANER_ROUTE, CLEANER_SPEED, COURIER_ROUTE, COURIER_SPEED, PARCEL_STACK, advisorPlace, zoneToWorld } from '@/data/lab/robots';
import type { TranslationKey } from '@/lib/i18n';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import { useLabStore } from '@/store/labStore';
import { bitVoice, useVoiceStore } from '@/services/bit/voice';
import { brandMarkTexture } from './brandMark';
import { Robot, type RobotParts } from './Robot';
import { parcelGeometry, robotGeometry } from './robotKit';
import { routeAt, routeLength } from './route';

const k = (s: string) => s as TranslationKey;
const GLOW = new Color('#38d6f5').multiplyScalar(1.6);

/* ── advisors ─────────────────────────────────────────────── */

function Advisors() {
  const t = useT();
  const cheap = ['low', 'medium'].includes(useQualityPreset().level);
  const reduced = useReducedMotion();
  const geo = useMemo(() => robotGeometry('advisor'), []);
  const solid = useRef<InstancedMesh>(null);
  const accent = useRef<InstancedMesh>(null);
  const glow = useRef<InstancedMesh>(null);
  const logo = useRef<InstancedMesh>(null);
  const places = useMemo(
    () =>
      ADVISOR_ZONES.map((id) => {
        const z = zoneById(id);
        const p = advisorPlace(z);
        const at = zoneToWorld(z, p.local);
        return { id, at, yaw: Math.atan2(z.facing[0], z.facing[1]) + p.yaw, accent: z.accent };
      }),
    [],
  );
  const speaking = useRef<string | null>(null);

  useLayoutEffect(() => {
    const col = new Color();
    places.forEach((p, i) => accent.current?.setColorAt(i, col.set(p.accent)));
    if (accent.current?.instanceColor) accent.current.instanceColor.needsUpdate = true;
  }, [places]);

  // The matrices are written once. Rewriting an instance buffer every frame stalls the GPU on
  // ANGLE / Direct3D 11 (measured: 124 → 87 FPS on Low), so the idle bob, the sway and the
  // talking nod run in the vertex shader from these uniforms.
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uTalk: { value: -1 }, uLevel: { value: 0 } }), []);
  const logoGeo = useDisposable(() => new PlaneGeometry(geo.logo.size, geo.logo.size).translate(...geo.logo.at), [geo]);
  useLayoutEffect(() => {
    const m = new Matrix4();
    const q = new Quaternion();
    const up = new Vector3(0, 1, 0);
    // a little smaller than the teacher: helpers, not the star
    const scale = new Vector3(0.85, 0.85, 0.85);
    places.forEach((p, i) => {
      m.compose(new Vector3(p.at[0], 0, p.at[1]), q.setFromAxisAngle(up, p.yaw), scale);
      for (const r of [solid, accent, glow, logo]) r.current?.setMatrixAt(i, m);
    });
    for (const r of [solid, accent, glow, logo]) {
      if (!r.current) continue;
      r.current.instanceMatrix.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
  }, [places]);
  useFrame(({ clock }) => {
    if (!reduced) uniforms.uTime.value = clock.elapsedTime;
    const v = useVoiceStore.getState();
    const talking = speaking.current && v.owner === `advisor:${speaking.current}` && v.speaking ? places.findIndex((p) => p.id === speaking.current) : -1;
    uniforms.uTalk.value = talking;
    uniforms.uLevel.value = talking >= 0 ? bitVoice.level() : 0;
  });
  const sway = useMemo(
    () => (shader: { uniforms: Record<string, unknown>; vertexShader: string }) => {
      Object.assign(shader.uniforms, uniforms);
      const turn = `
        float aid = float(gl_InstanceID);
        float ang = 0.12 * sin(uTime * 0.4 + aid * 1.3) + (int(aid) == uTalk ? uLevel * 0.08 : 0.0);
        mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));`;
      shader.vertexShader = `uniform float uTime;
uniform int uTalk;
uniform float uLevel;
${shader.vertexShader}`
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>${turn}
  objectNormal.xz = rot * objectNormal.xz;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  { float aid2 = float(gl_InstanceID); float ang2 = 0.12 * sin(uTime * 0.4 + aid2 * 1.3) + (int(aid2) == uTalk ? uLevel * 0.08 : 0.0); transformed.xz = mat2(cos(ang2), -sin(ang2), sin(ang2), cos(ang2)) * transformed.xz; transformed.y += 0.035 * sin(uTime * 1.5 + aid2); }`);
    },
    [uniforms],
  );

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6 || e.instanceId === undefined) return;
    e.stopPropagation();
    const p = places[e.instanceId];
    if (!p) return;
    useLabStore.getState().focusZone(p.id);
    bitVoice.stop();
    speaking.current = p.id;
    useVoiceStore.setState({ owner: `advisor:${p.id}` });
    bitVoice.say(t(k(`lab.zones.${p.id}.description`)), () => useVoiceStore.setState({ owner: `advisor:${p.id}` }));
  };
  const hover = (on: boolean) => () => void (document.body.style.cursor = on ? 'pointer' : '');

  const n = places.length;
  return (
    <group name="advisors">
      <instancedMesh ref={solid} args={[geo.solid, undefined, n]} castShadow onClick={click} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        {cheap ? <meshLambertMaterial vertexColors onBeforeCompile={sway} /> : <meshStandardMaterial vertexColors metalness={0.2} roughness={0.32} onBeforeCompile={sway} />}
      </instancedMesh>
      <instancedMesh ref={accent} args={[geo.accent, undefined, n]} castShadow onClick={click}>
        {cheap ? <meshLambertMaterial onBeforeCompile={sway} /> : <meshStandardMaterial metalness={0.15} roughness={0.4} onBeforeCompile={sway} />}
      </instancedMesh>
      <instancedMesh ref={glow} args={[geo.glow, undefined, n]}>
        <meshBasicMaterial color={GLOW} toneMapped={false} onBeforeCompile={sway} />
      </instancedMesh>
      <instancedMesh ref={logo} args={[logoGeo, undefined, n]}>
        <meshBasicMaterial map={brandMarkTexture()} transparent toneMapped={false} onBeforeCompile={sway} />
      </instancedMesh>
    </group>
  );
}

/* ── cleaner ──────────────────────────────────────────────── */

function Cleaner() {
  const length = useMemo(() => routeLength(CLEANER_ROUTE, true), []);
  const distance = useRef(0);
  const animate = (p: RobotParts, _t: number, dt: number) => {
    distance.current = (distance.current + dt * CLEANER_SPEED) % length;
    const { at, heading } = routeAt(CLEANER_ROUTE, distance.current, true);
    p.root.position.set(at[0], 0, at[1]);
    // turn smoothly into the new direction at each corner
    let d = heading - p.root.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    p.root.rotation.y += d * Math.min(1, dt * 4);
  };
  return <Robot kind="cleaner" accent="#4ade80" glow="#4ade80" position={[CLEANER_ROUTE[0][0], 0, CLEANER_ROUTE[0][1]]} animate={animate} name="cleaner-robot" />;
}

/* ── courier ──────────────────────────────────────────────── */

function Parcel({ geo }: { geo: ReturnType<typeof parcelGeometry> }) {
  return (
    <mesh geometry={geo} castShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

const DROP_PAUSE = 2.5;

function Courier() {
  const length = useMemo(() => routeLength(COURIER_ROUTE, false), []);
  const parcelGeo = useMemo(() => parcelGeometry(), []);
  const state = useRef({ t: 0 });
  const parcel = useRef<Group>(null);
  const stack = useRef<Group>(null);
  const drive = length / COURIER_SPEED;
  const cycle = drive * 2 + DROP_PAUSE * 2;
  const delivered = useRef(0);
  const animate = (p: RobotParts, _t: number, dt: number) => {
    const s = state.current;
    const before = s.t;
    s.t = (s.t + dt) % cycle;
    // phases: drive in loaded, unload, drive back empty, wait at the door
    let d: number;
    let loaded: boolean;
    if (s.t < drive) {
      d = s.t * COURIER_SPEED;
      loaded = true;
    } else if (s.t < drive + DROP_PAUSE) {
      d = length;
      loaded = s.t < drive + DROP_PAUSE * 0.4;
    } else if (s.t < drive * 2 + DROP_PAUSE) {
      d = length - (s.t - drive - DROP_PAUSE) * COURIER_SPEED;
      loaded = false;
    } else {
      d = 0;
      loaded = false;
    }
    if (before < drive + DROP_PAUSE * 0.4 && s.t >= drive + DROP_PAUSE * 0.4) delivered.current = (delivered.current % 3) + 1;
    const { at, heading } = routeAt(COURIER_ROUTE, Math.max(0, Math.min(length, d)), false);
    p.root.position.set(at[0], 0, at[1]);
    const goal = s.t > drive + DROP_PAUSE && s.t < drive * 2 + DROP_PAUSE ? heading + Math.PI : heading;
    let delta = goal - p.root.rotation.y;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    p.root.rotation.y += delta * Math.min(1, dt * 3);
    if (parcel.current) parcel.current.visible = loaded;
    if (stack.current) stack.current.children.forEach((c, i) => (c.visible = i < delivered.current));
  };
  return (
    <>
      <Robot kind="courier" accent="#f5b83d" position={[COURIER_ROUTE[0][0], 0, COURIER_ROUTE[0][1]]} animate={animate} name="courier-robot">
        <group ref={parcel} position={[0, 0.45, -0.05]}>
          <Parcel geo={parcelGeo} />
        </group>
      </Robot>
      {/* the delivered parcels beside the showcase (up to three, then the showcase is "restocked") */}
      <group ref={stack} position={[PARCEL_STACK[0], 0.11, PARCEL_STACK[1]]} rotation-y={0.3}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[i === 2 ? 0.05 : i * 0.32 - 0.16, i === 2 ? 0.22 : 0, 0]} visible={false}>
            <Parcel geo={parcelGeo} />
          </group>
        ))}
      </group>
    </>
  );
}

/* ── builder ──────────────────────────────────────────────── */

function Builder() {
  const zone = zoneById(BUILDER.zone);
  const at = zoneToWorld(zone, BUILDER.local);
  const yaw = Math.atan2(zone.facing[0], zone.facing[1]) + BUILDER.yaw;
  const animate = (p: RobotParts, time: number) => {
    // turning the screwdriver: arm forward and down, small twists, a pause every few seconds
    if (p.arm) {
      const work = time % 6 < 4.5;
      const goal = work ? -1.25 + 0.08 * Math.sin(time * 9) : -0.2;
      p.arm.rotation.x += (goal - p.arm.rotation.x) * 0.1;
      p.arm.rotation.z = work ? 0.25 * Math.sin(time * 12) * 0.3 : 0;
    }
    p.root.position.y = 0.006 * Math.sin(time * 3);
  };
  return <Robot kind="builder" accent="#f5b83d" glow="#56dbf8" position={[at[0], 0, at[1]]} yaw={yaw} animate={animate} name="builder-robot" />;
}

export function LabRobots() {
  return (
    <group name="lab-robots">
      <Advisors />
      <Cleaner />
      <Courier />
      <Builder />
    </group>
  );
}
