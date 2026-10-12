/**
 * Laptop + router on a desk (V2-6, Ethernet and Wi-Fi tasks). Both are
 * [PLACEHOLDER] procedural models with real port layouts: the laptop's left
 * side (USB-C, HDMI, RJ-45, USB-A, audio), the router's back (WAN blue,
 * LAN 1–4 yellow, DC in). The laptop screen shows the network state; the
 * router's link LEDs and Wi-Fi waves react.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CanvasTexture, SRGBColorSpace, Vector3, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import { ETHERNET_SCENARIO, dhcpLease, portById } from '@/labs/ConnectLab';
import { useConnectLabStore } from '@/store/connectLabStore';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { DESK_TOP } from '@/scenes/DeskScene/layout';
import { clearAnchors, setAnchor } from './anchors';
import { Cable, DragController, PortHotspots } from './ConnectKit';

const LAPTOP: [number, number, number] = [-0.2, DESK_TOP, 0.06];
/** Turned so its left side (the sockets) faces the camera. */
const LAPTOP_YAW = 0.9;
const ROUTER: [number, number, number] = [0.32, DESK_TOP, -0.12];
const ROUTER_YAW = 2.3;
const NET_WORK: [number, number, number] = [0.05, DESK_TOP + 0.05, 0.0];

/** Socket positions in each device's own frame (and the way out of the socket). */
const LAPTOP_PORTS: Record<string, [number, number, number]> = {
  'laptop.usb_c_1': [-0.1605, 0.009, -0.07],
  'laptop.hdmi_1': [-0.1605, 0.009, -0.045],
  'laptop.ethernet_1': [-0.1605, 0.0095, -0.01],
  'laptop.usb_a_1': [-0.1605, 0.009, 0.03],
  'laptop.audio_3_5_1': [-0.1605, 0.009, 0.065],
};
const ROUTER_PORTS: Record<string, [number, number, number]> = {
  'router.ethernet_0': [-0.09, 0.02, -0.0855],
  'router.ethernet_1': [-0.05, 0.02, -0.0855],
  'router.ethernet_2': [-0.022, 0.02, -0.0855],
  'router.ethernet_3': [0.006, 0.02, -0.0855],
  'router.ethernet_4': [0.034, 0.02, -0.0855],
  'router.dc_in_1': [0.095, 0.02, -0.0855],
};
const LEFT: [number, number, number] = [-1, 0, 0];
const REAR: [number, number, number] = [0, 0, -1];
const HOLE: Record<string, [number, number]> = { usb_c: [0.009, 0.0032], hdmi: [0.015, 0.0055], ethernet: [0.016, 0.0125], usb_a: [0.0125, 0.0048], audio_3_5: [0.0042, 0.0042], dc_in: [0.008, 0.008] };

/** Registers the sockets of a device placed at `at` turned by `yaw`; `out` in device frame. */
function useAnchors(ports: Record<string, [number, number, number]>, at: [number, number, number], yaw: number, out: [number, number, number], onSet: () => void) {
  useEffect(() => {
    const p = new Vector3();
    const o = new Vector3(...out).applyAxisAngle(new Vector3(0, 1, 0), yaw);
    for (const [id, local] of Object.entries(ports)) {
      p.set(...local).applyAxisAngle(new Vector3(0, 1, 0), yaw).add(new Vector3(...at));
      setAnchor(id, p, o);
    }
    onSet();
  }, [ports, at, yaw, out, onSet]);
}

function screenTexture(lines: string[], ok: boolean) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 512, 320);
    g.addColorStop(0, '#0b1220');
    g.addColorStop(1, ok ? '#0f3b2e' : '#1f2937');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = ok ? '#4ade80' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(256, 110, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1220';
    ctx.font = '700 40px "Manrope Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ok ? '✓' : '…', 256, 124);
    ctx.fillStyle = '#eef2f8';
    lines.forEach((l, i) => {
      ctx.font = `${i === 0 ? 700 : 500} ${i === 0 ? 30 : 24}px "Manrope Variable", sans-serif`;
      ctx.fillText(l, 256, 196 + i * 38);
    });
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The laptop screen: link state and the address DHCP gave. */
function LaptopScreen({ wifiTask }: { wifiTask: boolean }) {
  const t = useT();
  const plugged = useConnectLabStore((s) => s.plugs.ethernet.plugged);
  const joined = useConnectLabStore((s) => s.wifi.joined);
  const ports = Object.values(plugged).map((p) => portById(ETHERNET_SCENARIO, p));
  const wired = !wifiTask && ports.some((p) => p?.owner === 'laptop') && ports.some((p) => p?.role === 'lan');
  const ok = wifiTask ? joined !== null : wired;
  const lease = dhcpLease(wifiTask ? 'laptop-wifi' : 'laptop-eth');
  const title = wifiTask ? (joined ? `Wi-Fi: ${joined}` : 'Wi-Fi') : 'Ethernet';
  const lines = ok ? [title, `IP ${lease.ip}`, `${t('connect.dhcp.gateway')} ${lease.gateway}`] : [title, t('connect.dhcp.waiting')];
  const tex = useDisposable(() => screenTexture(lines, ok), [lines.join('|'), ok]);
  return (
    <mesh position-z={0.0032}>
      <planeGeometry args={[0.3, 0.19]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function Laptop({ wifiTask }: { wifiTask: boolean }) {
  return (
    <group position={LAPTOP} rotation-y={LAPTOP_YAW}>
      <RoundedBox args={[0.32, 0.018, 0.22]} radius={0.005} smoothness={3} position-y={0.009} castShadow>
        <meshStandardMaterial color="#b9bdc4" metalness={0.85} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.0182, -0.025]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.28, 0.105]} />
        <meshStandardMaterial color="#15171c" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.0182, 0.07]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.11, 0.065]} />
        <meshStandardMaterial color="#a9aeb6" metalness={0.6} roughness={0.25} />
      </mesh>
      {/* left-side sockets */}
      {Object.entries(LAPTOP_PORTS).map(([id, [x, y, z]]) => {
        const [w, h] = HOLE[id.split('.')[1].replace(/_\d+$/, '')];
        return (
          <mesh key={id} position={[x - 0.0002, y, z]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial color="#0b0d11" roughness={0.9} />
          </mesh>
        );
      })}
      <group position={[0, 0.018, -0.108]} rotation-x={-0.28}>
        <group position-y={0.105}>
          <RoundedBox args={[0.32, 0.21, 0.006]} radius={0.003} smoothness={2} castShadow>
            <meshStandardMaterial color="#1c1f25" metalness={0.5} roughness={0.35} />
          </RoundedBox>
          <LaptopScreen wifiTask={wifiTask} />
        </group>
      </group>
    </group>
  );
}

/** Router with its back panel, link LEDs and Wi-Fi waves. */
function Router({ wifiTask }: { wifiTask: boolean }) {
  const plugged = useConnectLabStore((s) => s.plugs.ethernet.plugged);
  const joined = useConnectLabStore((s) => s.wifi.joined);
  const used = useMemo(() => new Set(Object.values(plugged)), [plugged]);
  const waves = useRef<Group>(null);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    const g = waves.current;
    if (!g) return;
    g.visible = wifiTask && joined !== null;
    if (!g.visible) return;
    g.children.forEach((c, i) => {
      const k = reduced ? 0.5 + i * 0.2 : ((clock.elapsedTime * 0.6 + i / 3) % 1);
      c.scale.setScalar(0.4 + k * 1.4);
      ((c as Mesh).material as MeshStandardMaterial).opacity = 0.55 * (1 - k);
    });
  });
  return (
    <group position={ROUTER} rotation-y={ROUTER_YAW}>
      <RoundedBox args={[0.24, 0.042, 0.17]} radius={0.01} smoothness={3} position-y={0.021} castShadow>
        <meshStandardMaterial color="#e6e8ec" metalness={0.05} roughness={0.4} />
      </RoundedBox>
      {[-0.09, -0.03, 0.03, 0.09].map((x) => (
        <mesh key={x} position={[x, 0.12, -0.075]} rotation-x={-0.1} castShadow>
          <capsuleGeometry args={[0.006, 0.15, 4, 12]} />
          <meshStandardMaterial color="#e6e8ec" roughness={0.4} />
        </mesh>
      ))}
      {/* back panel sockets: WAN blue, LAN yellow, DC black; a green LED over each live port */}
      {Object.entries(ROUTER_PORTS).map(([id, [x, y, z]]) => {
        const wan = id === 'router.ethernet_0';
        const dc = id.includes('dc_in');
        return (
          <group key={id} position={[x, y, z]}>
            <mesh rotation-y={Math.PI}>
              <planeGeometry args={dc ? [0.009, 0.009] : [0.016, 0.0135]} />
              <meshStandardMaterial color={dc ? '#0b0d11' : wan ? '#2563eb' : '#facc15'} roughness={0.6} />
            </mesh>
            {!dc && (
              <mesh position={[0, 0.013, -0.0002]} rotation-y={Math.PI}>
                <circleGeometry args={[0.0016, 10]} />
                <meshStandardMaterial color="#000" emissive={used.has(id) || wan ? '#4ade80' : '#1f2937'} emissiveIntensity={used.has(id) || wan ? 1.6 : 0.2} toneMapped={false} />
              </mesh>
            )}
          </group>
        );
      })}
      <group ref={waves} position={[0, 0.2, -0.075]} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.09, 0.096, 48]} />
            <meshStandardMaterial color="#38d6f5" emissive="#38d6f5" emissiveIntensity={1.2} transparent opacity={0.4} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function NetScene({ names, wifiTask }: { names: Record<string, string>; wifiTask: boolean }) {
  useEffect(() => clearAnchors, []);
  // the hotspots render once the sockets are registered
  const [version, setVersion] = useState(0);
  const bump = useMemo(() => () => setVersion((v) => v + 1), []);
  useAnchors(LAPTOP_PORTS, LAPTOP, LAPTOP_YAW, LEFT, bump);
  useAnchors(ROUTER_PORTS, ROUTER, ROUTER_YAW, REAR, bump);
  const ids = useMemo(() => (wifiTask ? [] : ETHERNET_SCENARIO.ports.map((p) => p.id)), [wifiTask]);
  const floor = DESK_TOP + 0.002;
  return (
    <group>
      <Desk />
      <Laptop wifiTask={wifiTask} />
      <Router wifiTask={wifiTask} />
      {!wifiTask && (
        <>
          <Cable kind="ethernet" floor={floor} ends={[{ id: 'patch.a', park: [0.05, floor + 0.007, 0.16], parkDir: [-1, 0, 0] }, { id: 'patch.b', park: [0.16, floor + 0.007, 0.2], parkDir: [1, 0, 0] }]} />
          <PortHotspots ids={ids} names={names} version={version} />
          <DragController work={NET_WORK} />
        </>
      )}
    </group>
  );
}
