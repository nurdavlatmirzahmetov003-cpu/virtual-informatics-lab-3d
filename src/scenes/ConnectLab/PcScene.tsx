/**
 * "Connect the computer" (V2-6): the desk seen from behind. The system unit
 * is the showcase build (V2-2b catalog models); its sockets are found from
 * the models' own port markers (`port_<kind>_<n>` on the motherboard, the
 * graphics card and the PSU), so every socket sits exactly where it is on
 * the real part. Monitor, keyboard, mouse, speakers and a power strip each
 * hold one end of their cable; the student plugs the free ends in.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MeshStandardMaterial, Vector3, type Group } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFront, fanBladesGeometry, fanFrameShape } from '@/lib/three/geometry';
import { showcaseBuild } from '@/lib/studio/showcase';
import { PC_SCENARIO } from '@/labs/ConnectLab';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { DESK_TOP, KEYBOARD, MONITOR, MOUSE, PC, PC_CENTER, SPEAKERS } from '@/scenes/DeskScene/layout';
import { Chassis } from '@/scenes/DeskScene/pc/Chassis';
import { BOARD_FACE, CPU, FAN, GPU, MB, PSU, RAM, SSD } from '@/scenes/DeskScene/pc/constants';
import { HardwarePart } from '@/scenes/DeskScene/pc/HardwareParts';
import { pcRig } from '@/scenes/DeskScene/pc/pcRig';
import { usePcTextures } from '@/scenes/DeskScene/pc/usePcTextures';
import { Product } from '@/scenes/LabSpace/zones/common';
import { clearAnchors, setAnchor } from './anchors';
import { Cable, DragController, PortHotspots } from './ConnectKit';

/** Where the plug of a cable lies before it is plugged in (behind the desk's devices). */
const STRIP: [number, number, number] = [0.3, DESK_TOP, -0.33];
const BACK = new Vector3(0, 0, -1);
/** Point the dragged plug moves around: the middle of the rear panel. */
const PC_WORK: [number, number, number] = [PC_CENTER[0], PC_CENTER[1], PC_CENTER[2] - PC.size[2] / 2 - 0.05];

/** The PC's parts that carry sockets, at their installed places (case-local). */
const OWNERS = [
  { owner: 'motherboard', part: 'motherboard', at: [MB.x, MB.y, MB.z] },
  { owner: 'gpu', part: 'gpu', at: [BOARD_FACE, GPU.y, GPU.z0] },
  { owner: 'psu', part: 'psu', at: [PSU.x, PSU.y, PSU.z] },
] as const;
const OTHER = [
  { part: 'cpu', at: [BOARD_FACE, CPU.y, CPU.z] },
  { part: 'cooler', at: [BOARD_FACE, CPU.y, CPU.z] },
  { part: 'ram', at: [BOARD_FACE, RAM.y, RAM.z] },
  { part: 'ssd', at: [BOARD_FACE, SSD.y, SSD.z] },
] as const;

/** Reads the port markers inside each socket-carrying part and keeps the anchors current. */
function MarkerScan({ groups, onFound }: { groups: React.RefObject<Record<string, Group | null>>; onFound: (n: number) => void }) {
  const tick = useRef(0);
  const found = useRef(0);
  const p = useMemo(() => new Vector3(), []);
  useFrame(() => {
    // markers appear when the models resolve and move on LOD switches: refresh twice a second
    if (tick.current++ % 30 !== 0) return;
    let n = 0;
    for (const [owner, g] of Object.entries(groups.current ?? {})) {
      g?.traverse((o) => {
        const m = /^port_(.+)_(\d+)$/.exec(o.name);
        if (!m) return;
        const id = `${owner}.${m[1]}_${m[2]}`;
        if (!PC_SCENARIO.ports.some((x) => x.id === id)) return;
        o.getWorldPosition(p);
        setAnchor(id, p, BACK);
        n++;
      });
    }
    if (n !== found.current) {
      found.current = n;
      onFound(n);
    }
  });
  return null;
}

function SystemUnit({ onFound }: { onFound: (n: number) => void }) {
  const build = useMemo(() => showcaseBuild(), []);
  const tex = usePcTextures();
  const res = useDisposable(() => {
    const rgb = new MeshStandardMaterial({ color: '#000000', emissive: '#4fdcff', emissiveIntensity: 1.2, roughness: 0.4 });
    return { fanFrame: extrudeFront(fanFrameShape(FAN, FAN * 0.47), 0.025, { bevel: 0.0015 }), fanBlades: fanBladesGeometry(FAN * 0.45), rgb };
  }, []);
  const groups = useRef<Record<string, Group | null>>({});
  useFrame(() => {
    pcRig.parts = null;
    pcRig.hidden.clear();
    pcRig.explode = 0;
    pcRig.glassOpen = 0;
    pcRig.cables = 1;
    pcRig.interior = pcRig.glow = 1;
    pcRig.fanSpeed = pcRig.rgbPower = 1;
  });
  return (
    <group position={[...PC_CENTER]}>
      <Chassis tex={tex} fan={{ frame: res.fanFrame, blades: res.fanBlades }} rgb={res.rgb} product={build.case} />
      {OWNERS.map(({ owner, part, at }) => (
        <group
          key={owner}
          position={[...at]}
          ref={(g) => {
            groups.current[owner] = g;
          }}
        >
          <HardwarePart id={part} fallback={null} product={build[part]} />
        </group>
      ))}
      {OTHER.map(({ part, at }) => (
        <group key={part} position={[...at]}>
          <HardwarePart id={part} fallback={null} product={build[part === 'cooler' ? 'cooling' : part]} />
        </group>
      ))}
      <MarkerScan groups={groups} onFound={onFound} />
    </group>
  );
}

/** A power strip on the desk: the power cable starts here. */
function PowerStrip() {
  return (
    <group position={STRIP}>
      <RoundedBox args={[0.3, 0.04, 0.06]} radius={0.008} smoothness={2} position-y={0.02} castShadow>
        <meshStandardMaterial color="#f1f2f4" roughness={0.5} />
      </RoundedBox>
      {[-0.09, -0.03, 0.03].map((x) => (
        <mesh key={x} position={[x, 0.0405, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.016, 24]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
      ))}
      <mesh position={[0.11, 0.041, 0]}>
        <boxGeometry args={[0.03, 0.006, 0.02]} />
        <meshStandardMaterial color="#000" emissive="#ef4444" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

const MOUSE_ROT = [0, Math.PI, 0] as const;

export default function PcScene({ names }: { names: Record<string, string> }) {
  const build = useMemo(() => showcaseBuild(), []);
  const [found, setFound] = useState(0);
  useEffect(() => clearAnchors, []);
  const ids = useMemo(() => PC_SCENARIO.ports.map((p) => p.id), []);
  const floor = DESK_TOP + 0.002;
  const right = SPEAKERS.right.position;
  return (
    <group>
      <Desk />
      <group position={[...MONITOR.position]}>{build.monitor && <Product product={build.monitor.modelPath.replace(/^products\/|\.glb$/g, '')} />}</group>
      {build.keyboard && <Product product={build.keyboard.modelPath.replace(/^products\/|\.glb$/g, '')} position={[...KEYBOARD.position]} />}
      {build.mouse && <Product product={build.mouse.modelPath.replace(/^products\/|\.glb$/g, '')} position={[...MOUSE.position]} rotation={[...MOUSE_ROT]} />}
      {build.speakers &&
        [SPEAKERS.left, SPEAKERS.right].map((s, i) => (
          <group key={i} position={[...s.position]} rotation-y={s.yaw}>
            <Product product={build.speakers!.modelPath.replace(/^products\/|\.glb$/g, '')} />
          </group>
        ))}
      <PowerStrip />
      <SystemUnit onFound={setFound} />

      {/* each cable hangs from its device; its plug waits behind the PC */}
      <Cable kind="hdmi" floor={floor} from={[MONITOR.position[0], DESK_TOP + 0.1, MONITOR.position[2] - 0.09]} ends={[{ id: 'monitor', park: [0.2, floor + 0.005, -0.4], parkDir: [1, 0, 0] }]} />
      <Cable kind="usb_a" floor={floor} from={[KEYBOARD.position[0] + 0.12, KEYBOARD.position[1] + 0.01, KEYBOARD.position[2] - 0.07]} ends={[{ id: 'keyboard', park: [0.27, floor + 0.004, -0.46], parkDir: [1, 0, 0] }]} />
      <Cable kind="usb_a" floor={floor} from={[MOUSE.position[0], MOUSE.position[1] + 0.01, MOUSE.position[2] - 0.06]} ends={[{ id: 'mouse', park: [0.34, floor + 0.004, -0.5], parkDir: [1, 0, 0] }]} />
      <Cable kind="audio_3_5" floor={floor} from={[right[0], DESK_TOP + 0.04, right[2] - 0.05]} ends={[{ id: 'speakers', park: [0.42, floor + 0.004, -0.44], parkDir: [1, 0, 0] }]} />
      <Cable kind="power_ac" floor={floor} from={[STRIP[0] + 0.03, DESK_TOP + 0.045, STRIP[2]]} ends={[{ id: 'power', park: [0.47, floor + 0.011, -0.36], parkDir: [1, 0, 0] }]} />

      <PortHotspots ids={ids} names={names} version={found} />
      <DragController work={PC_WORK} />
    </group>
  );
}
