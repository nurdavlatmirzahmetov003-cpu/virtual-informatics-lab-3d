/**
 * Building blocks of the Connection Lab scenes: socket hotspots (name on
 * hover, click to plug the cable in hand), cables that bend as tubes through
 * a spline, plugs shaped by type, and the drag controller that drops a plug
 * on the socket nearest the pointer.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CatmullRomCurve3, Group, Mesh, Plane, Raycaster, TubeGeometry, Vector2, Vector3 } from 'three';
import type { PortKind } from '@/labs/ConnectLab';
import { useConnectLabStore } from '@/store/connectLabStore';
import { anchors, carry } from './anchors';
import styles from './ConnectKit.module.css';

// ── sockets ────────────────────────────────────────────────────────────────

/** One clickable marker per socket whose position is known. `version` bumps when markers are found. */
export function PortHotspots({ ids, names, version }: { ids: readonly string[]; names: Record<string, string>; version: number }) {
  const carrying = useConnectLabStore((s) => s.carrying);
  const plugged = useConnectLabStore((s) => s.plugs[s.task === 'wifi' ? 'ethernet' : s.task].plugged);
  const taken = useMemo(() => new Set(Object.values(plugged)), [plugged]);
  void version;
  return (
    <>
      {ids.map((id) => {
        const a = anchors.get(id);
        if (!a) return null;
        return (
          <Html key={id} position={a.pos.clone().addScaledVector(a.out, 0.004).toArray()} center zIndexRange={[30, 0]} className={styles.anchor}>
            <button
              type="button"
              className={styles.port}
              data-carrying={carrying !== null}
              data-taken={taken.has(id)}
              data-port={id}
              aria-label={names[id]}
              onClick={(e) => {
                e.stopPropagation();
                const s = useConnectLabStore.getState();
                if (s.carrying) s.plug(s.carrying, id);
              }}
            >
              <span className={styles.tip}>{names[id]}</span>
            </button>
          </Html>
        );
      })}
    </>
  );
}

// ── plugs and cables ───────────────────────────────────────────────────────

const PLUG: Record<PortKind, { size: [number, number, number]; color: string; round?: boolean }> = {
  usb_a: { size: [0.016, 0.008, 0.03], color: '#1f2329' },
  usb_c: { size: [0.012, 0.006, 0.026], color: '#e6e8ec' },
  hdmi: { size: [0.022, 0.009, 0.032], color: '#15171c' },
  displayport: { size: [0.022, 0.009, 0.032], color: '#15171c' },
  ethernet: { size: [0.016, 0.014, 0.03], color: '#60a5fa' },
  audio_3_5: { size: [0.008, 0.008, 0.03], color: '#22c55e', round: true },
  power_ac: { size: [0.032, 0.022, 0.04], color: '#111317' },
  dc_in: { size: [0.01, 0.01, 0.03], color: '#111317', round: true },
};
const CABLE_COLOR: Record<PortKind, string> = {
  usb_a: '#2b2f37', usb_c: '#e6e8ec', hdmi: '#15171c', displayport: '#15171c', ethernet: '#3b82f6', audio_3_5: '#2b2f37', power_ac: '#111317', dc_in: '#111317',
};

function PlugMesh({ kind }: { kind: PortKind }) {
  const p = PLUG[kind];
  const [w, h, l] = p.size;
  return (
    <group>
      {/* body behind the tip; +Z is the insertion direction, the tip ends at the origin */}
      {p.round ? (
        <mesh position-z={-l / 2 - 0.006} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[w * 0.75, w * 0.75, l, 16]} />
          <meshStandardMaterial color={p.color} roughness={0.45} />
        </mesh>
      ) : (
        <mesh position-z={-l / 2 - 0.006} castShadow>
          <boxGeometry args={[w, h, l]} />
          <meshStandardMaterial color={p.color} roughness={0.45} transparent={kind === 'ethernet'} opacity={kind === 'ethernet' ? 0.85 : 1} />
        </mesh>
      )}
      {/* metal tip */}
      <mesh position-z={-0.003} rotation-x={p.round ? Math.PI / 2 : 0}>
        {p.round ? <cylinderGeometry args={[w * 0.3, w * 0.3, 0.006, 12]} /> : <boxGeometry args={[w * 0.82, h * 0.7, 0.006]} />}
        <meshStandardMaterial color={kind === 'ethernet' ? '#e5e7eb' : '#c7ccd4'} metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

const DOWN = new Vector3(0, -1, 0);
const tmp = new Vector3();

/** Where a free end is now and which way its tip points (insertion direction). */
function endPose(end: string, park: Vector3, parkDir: Vector3, out: { pos: Vector3; dir: Vector3 }, camDir: Vector3) {
  const s = useConnectLabStore.getState();
  const sid = s.task === 'wifi' ? 'ethernet' : s.task;
  const port = s.plugs[sid].plugged[end];
  const a = port ? anchors.get(port) : undefined;
  if (a) {
    out.pos.copy(a.pos);
    out.dir.copy(a.out).negate();
  } else if (s.carrying === end && carry.set) {
    out.pos.copy(carry.pos);
    out.dir.copy(camDir);
  } else {
    out.pos.copy(park);
    out.dir.copy(parkDir);
  }
}

export interface FreeEnd {
  id: string;
  /** Resting place on the desk when not plugged in. */
  park: [number, number, number];
  /** Tip direction at rest (horizontal). */
  parkDir?: [number, number, number];
}

/**
 * A cable from a fixed point (`from`, the device it hangs from) or between
 * two free ends. The tube is rebuilt only when an end moves.
 */
export function Cable({ kind, from, ends, floor }: { kind: PortKind; from?: [number, number, number]; ends: readonly FreeEnd[]; floor: number }) {
  const camera = useThree((s) => s.camera);
  const mesh = useRef<Mesh>(null);
  const plugs = useRef<(Group | null)[]>([]);
  const last = useRef('');
  const radius = kind === 'power_ac' ? 0.0042 : kind === 'audio_3_5' ? 0.0022 : 0.003;
  const poses = useMemo(() => ends.map(() => ({ pos: new Vector3(), dir: new Vector3() })), [ends]);
  const parks = useMemo(() => ends.map((e) => ({ pos: new Vector3(...e.park), dir: new Vector3(...(e.parkDir ?? [0, 0, -1])).normalize() })), [ends]);
  const camDir = useMemo(() => new Vector3(), []);
  const pick = (e: { stopPropagation: () => void }, id: string) => {
    e.stopPropagation();
    const pose = poses[ends.findIndex((x) => x.id === id)];
    carry.pos.copy(pose.pos);
    carry.set = true;
    useConnectLabStore.getState().pick(id, true);
  };

  useEffect(() => () => mesh.current?.geometry.dispose(), []);

  useFrame(() => {
    camera.getWorldDirection(camDir);
    ends.forEach((e, i) => {
      endPose(e.id, parks[i].pos, parks[i].dir, poses[i], camDir);
      const g = plugs.current[i];
      if (g) {
        g.position.copy(poses[i].pos);
        g.lookAt(tmp.copy(poses[i].pos).add(poses[i].dir));
      }
    });
    const key = poses.map((p) => p.pos.toArray().map((v) => v.toFixed(3)).join(',')).join('|');
    if (key === last.current || !mesh.current) return;
    last.current = key;
    // spline: out of each plug's back, sagging down between
    const pts: Vector3[] = [];
    const tail = (p: { pos: Vector3; dir: Vector3 }, k: number) => p.pos.clone().addScaledVector(p.dir, -k);
    const sag = (a: Vector3, b: Vector3) => {
      const m = a.clone().lerp(b, 0.5);
      m.y = Math.max(floor + radius, Math.min(a.y, b.y) - 0.06 - a.distanceTo(b) * 0.08);
      return m;
    };
    if (from) {
      const a = new Vector3(...from);
      const b = poses[0];
      const bTail = tail(b, 0.06);
      pts.push(a, a.clone().add(DOWN.clone().multiplyScalar(0.03)), sag(a, bTail), bTail, tail(b, 0.03));
    } else {
      const [p, q] = poses;
      const pT = tail(p, 0.06);
      const qT = tail(q, 0.06);
      pts.push(tail(p, 0.03), pT, sag(pT, qT), qT, tail(q, 0.03));
    }
    const geo = new TubeGeometry(new CatmullRomCurve3(pts, false, 'catmullrom', 0.4), 64, radius, 8, false);
    mesh.current.geometry.dispose();
    mesh.current.geometry = geo;
  });

  return (
    <group>
      <mesh ref={mesh} castShadow>
        <meshStandardMaterial color={CABLE_COLOR[kind]} roughness={0.55} />
      </mesh>
      {ends.map((e, i) => (
        <group
          key={e.id}
          ref={(g) => {
            plugs.current[i] = g;
          }}
          onPointerDown={(ev) => pick(ev, e.id)}
          onPointerOver={() => (document.body.style.cursor = 'grab')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <PlugMesh kind={kind} />
          {/* generous invisible grab handle */}
          <mesh position-z={-0.02} visible={false}>
            <sphereGeometry args={[0.03, 8, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── dragging ───────────────────────────────────────────────────────────────

/**
 * While a plug is in hand it follows the pointer on a plane through the work
 * area facing the camera. Releasing a drag over (or near) a socket plugs it
 * in; releasing elsewhere puts it back. A click without a drag keeps it in
 * hand until a socket marker is clicked (or Esc / a click on empty space).
 */
export function DragController({ work }: { work: [number, number, number] }) {
  const { camera, gl } = useThree();
  const carrying = useConnectLabStore((s) => s.carrying);
  const [ray] = useState(() => new Raycaster());
  const [plane] = useState(() => new Plane());
  const ndc = useMemo(() => new Vector2(), []);
  const start = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!carrying) return;
    const el = gl.domElement;
    const normal = new Vector3();
    const toNdc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const move = (e: PointerEvent) => {
      toNdc(e);
      camera.getWorldDirection(normal);
      plane.setFromNormalAndCoplanarPoint(normal, new Vector3(...work));
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, carry.pos)) carry.set = true;
      if (!start.current) start.current = [e.clientX, e.clientY];
    };
    const up = (e: PointerEvent) => {
      const s = useConnectLabStore.getState();
      if (!s.carrying || !s.dragging) return;
      const moved = start.current ? Math.hypot(e.clientX - start.current[0], e.clientY - start.current[1]) : 0;
      start.current = null;
      if (moved < 6) {
        useConnectLabStore.setState({ dragging: false }); // a click: keep it in hand
        return;
      }
      // the socket nearest the pointer on screen, within reach
      const r = el.getBoundingClientRect();
      let best: string | null = null;
      let bestD = 34;
      for (const [id, a] of anchors) {
        const p = a.pos.clone().project(camera);
        const d = Math.hypot((p.x + 1) * 0.5 * r.width + r.left - e.clientX, (1 - p.y) * 0.5 * r.height + r.top - e.clientY);
        if (d < bestD && p.z < 1) {
          bestD = d;
          best = id;
        }
      }
      if (best) s.plug(s.carrying, best);
      else s.drop();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      start.current = null;
    };
  }, [carrying, camera, gl, ndc, plane, ray, work]);

  return null;
}
