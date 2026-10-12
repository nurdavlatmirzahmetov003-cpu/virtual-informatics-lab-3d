/**
 * 3D printer teardown (V2-5b) — [PLACEHOLDER] procedural "bed-slinger" FDM
 * printer (the common school type): the print head rides the X gantry, the
 * heated bed slides on Y, the gantry climbs on a Z lead screw, the control
 * board sits in the base and the PSU on the side.
 *
 * While assembled it can print a demo vase: the head circles in X, the bed
 * answers in Y, the gantry rises one layer at a time and the object grows
 * layer by layer (rig.print.t). Taking it apart sends the head, bed, four
 * steppers, belts and screw, board and PSU onto the mat in front.
 *
 * Frame: origin at the centre of the base underside, +Z the front.
 */
import { useContext, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { rel, route, type Vec3 } from '@/lib/teardown/timeline';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { Card } from './pieces';
import { RigContext, usePartProgress, type TeardownRig } from './rig';
import { SubMotion, TeardownPart, type PartMotion } from './TeardownPart';

const ORDER = TEARDOWNS.printer_3d.parts;
const BASE_H = 0.06;
const BED_TOP = 0.095;
const PRINT_Z = 0.02;
const GANTRY_Z = PRINT_Z - 0.045;
/** Gantry beam height above the nozzle tip. */
const HEAD_H = 0.07;
const LAYERS = 24;
const LAYER_H = 0.0018;
const VASE_R = 0.028;
const MOTOR = 0.042;

const dark = { color: '#1f2329', metalness: 0.5, roughness: 0.45 } as const;
const alu = { color: '#2b2f37', metalness: 0.8, roughness: 0.35 } as const;

/** Where the demo print puts the head (x), bed (z offset) and layer (y) now. */
function printPose(rig: TeardownRig) {
  const t = rig.print.t;
  if (t <= 0) return { x: 0, z: 0, y: 0, h: 0 };
  const layer = Math.min(LAYERS - 1, Math.floor(t * LAYERS));
  const turn = (t * LAYERS - layer) * Math.PI * 2;
  const y = (layer + 1) * LAYER_H;
  return { x: VASE_R * Math.cos(turn), z: -VASE_R * Math.sin(turn), y, h: y };
}

/**
 * Moves its children with the demo print: head in X, bed in Z, gantry in Y.
 * Inside a part the offset fades out as the part is taken out, so it lands
 * exactly at its resting place.
 */
function PrintFollow({ x = false, y = false, z = false, children }: { x?: boolean; y?: boolean; z?: boolean; children: ReactNode }) {
  const rig = useContext(RigContext)!;
  const progress = usePartProgress();
  const g = useRef<Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const p = printPose(rig);
    const k = 1 - progress();
    g.current.position.set(x ? p.x * k : 0, y ? p.y * k : 0, z ? p.z * k : 0);
  });
  return <group ref={g}>{children}</group>;
}

const out = (at: Vec3, rest: Vec3, label: Vec3 | null, first: Vec3 = [0, 0.08, 0], clear = 0.08): PartMotion => ({ at, path: route(first, rel(at, rest), clear), label });

const X_MOTOR: Vec3 = [-0.205, BED_TOP + HEAD_H, GANTRY_Z];
const Y_MOTOR: Vec3 = [0, BASE_H + MOTOR / 2, -0.205];
const Z_MOTOR: Vec3 = [-0.215, BASE_H + MOTOR / 2, GANTRY_Z];
const E_MOTOR: Vec3 = [0.235, 0.36, -0.02];
const sub = (at: Vec3, rest: Vec3, clear = 0.1) => route([0, 0.04, 0.06], rel(at, rest), clear);

const MOTION: Record<string, PartMotion> = {
  extruder: out([0, BED_TOP, PRINT_Z], [-0.3, 0, 0.44], [0, 0.085, 0.03], [0, 0.03, 0.08]),
  heated_bed: out([0, BED_TOP, PRINT_Z], [0, 0.036, 0.44], [0, 0.03, 0.1], [0, 0.1, 0], 0.06),
  steppers: { at: [0, 0, 0], path: [], label: null },
  belts: { at: [0, 0, 0], path: [], label: null },
  // the board slides out of the front of the base
  control_board: out([-0.06, 0.022, 0.06], [0.3, 0.002, 0.44], [0, 0.02, 0], [0, 0, 0.24], 0.04),
  psu: out([0.25, 0.115, -0.05], [0.47, 0.055, 0.0], [0, 0.075, 0], [0.06, 0, 0], 0.05),
};

/** Base, uprights, top bar, display box and filament spool: what stays. */
function Frame() {
  return (
    <group>
      <RoundedBox args={[0.44, BASE_H, 0.4]} radius={0.006} smoothness={2} position-y={BASE_H / 2} castShadow receiveShadow>
        <meshStandardMaterial {...dark} />
      </RoundedBox>
      {/* Y rail */}
      <mesh position={[0, BASE_H + 0.005, PRINT_Z]}>
        <boxGeometry args={[0.04, 0.01, 0.4]} />
        <meshStandardMaterial {...alu} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.215, BASE_H + 0.21, GANTRY_Z - 0.02]} castShadow>
          <boxGeometry args={[0.02, 0.42, 0.04]} />
          <meshStandardMaterial {...alu} />
        </mesh>
      ))}
      <mesh position={[0, BASE_H + 0.43, GANTRY_Z - 0.02]} castShadow>
        <boxGeometry args={[0.45, 0.02, 0.04]} />
        <meshStandardMaterial {...alu} />
      </mesh>
      {/* spool of orange PLA on the top bar */}
      <group position={[0, BASE_H + 0.5, GANTRY_Z - 0.02]} rotation-z={Math.PI / 2}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.012, 48]} />
          <meshStandardMaterial color="#1c1f25" roughness={0.6} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.085, 0.085, 0.05, 48]} />
          <meshStandardMaterial color="#f97316" roughness={0.55} />
        </mesh>
      </group>
      {/* control knob and screen */}
      <group position={[0.15, BASE_H / 2, 0.2]}>
        <mesh position-z={0.004}>
          <boxGeometry args={[0.1, 0.045, 0.008]} />
          <meshStandardMaterial color="#111317" />
        </mesh>
        <mesh position={[-0.012, 0, 0.0085]}>
          <planeGeometry args={[0.058, 0.034]} />
          <meshStandardMaterial color="#000" emissive="#38bdf8" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0.035, 0, 0.012]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.008, 0.008, 0.008, 24]} />
          <meshStandardMaterial color="#c7ccd4" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** X gantry beam: rides up with the print. */
function Gantry() {
  return (
    <PrintFollow y>
      <mesh position={[0, BED_TOP + HEAD_H, GANTRY_Z]} castShadow>
        <boxGeometry args={[0.41, 0.02, 0.02]} />
        <meshStandardMaterial {...alu} />
      </mesh>
    </PrintFollow>
  );
}

/** Print head: carriage, heatsink, heater block (glows while printing), nozzle, part-cooling fan. */
function Extruder() {
  const rig = useContext(RigContext)!;
  const heater = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    if (heater.current) heater.current.emissiveIntensity = rig.print.active ? 1.4 : 0.15;
  });
  return (
    <PrintFollow x y>
      {/* nozzle tip at the origin */}
      <mesh position-y={0.004} rotation-x={Math.PI}>
        <coneGeometry args={[0.004, 0.008, 16]} />
        <meshStandardMaterial color="#d4a017" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position-y={0.014}>
        <boxGeometry args={[0.02, 0.012, 0.016]} />
        <meshStandardMaterial ref={heater} color="#9aa0a8" metalness={0.7} roughness={0.35} emissive="#f97316" emissiveIntensity={0.15} />
      </mesh>
      <mesh position-y={0.036}>
        <cylinderGeometry args={[0.011, 0.011, 0.03, 20]} />
        <meshStandardMaterial color="#b9bdc4" metalness={0.85} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.05, 0.05, 0.03]} radius={0.004} smoothness={2} position={[0, 0.04, 0.012]} castShadow>
        <meshStandardMaterial color="#111317" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.04, 0.0275]}>
        <circleGeometry args={[0.016, 24]} />
        <meshStandardMaterial color="#2a2e36" />
      </mesh>
      {/* carriage plate on the gantry */}
      <mesh position={[0, HEAD_H, GANTRY_Z - PRINT_Z + 0.016]}>
        <boxGeometry args={[0.06, 0.05, 0.006]} />
        <meshStandardMaterial {...dark} />
      </mesh>
    </PrintFollow>
  );
}

function stripes() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 8;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(0, 0, 4, 8);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 6, 4, 2);
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The printed vase: grows layer by layer, visible lines on its side. */
function Print() {
  const rig = useContext(RigContext)!;
  const mesh = useRef<Mesh>(null);
  const tex = useDisposable(stripes, []);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const { h } = printPose(rig);
    m.visible = h > 0;
    m.scale.set(1, Math.max(h, 0.0001), 1);
    m.position.y = h / 2;
    tex.repeat.set(6, Math.max(1, Math.round(h / LAYER_H)));
  });
  return (
    <mesh ref={mesh} castShadow>
      <cylinderGeometry args={[VASE_R, VASE_R * 0.8, 1, 40, 1, true]} />
      <meshStandardMaterial map={tex} roughness={0.5} side={2} />
    </mesh>
  );
}

/** Heated bed: textured build sheet on springs over the Y carriage; the print sits on it. */
function HeatedBed() {
  return (
    <PrintFollow z>
      <mesh position-y={-0.002} castShadow receiveShadow>
        <boxGeometry args={[0.235, 0.004, 0.235]} />
        <meshStandardMaterial color="#1b1d22" roughness={0.75} />
      </mesh>
      <mesh position-y={-0.0065}>
        <boxGeometry args={[0.235, 0.005, 0.235]} />
        <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.35} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * 0.1, 0, sz * 0.1]}>
            <mesh position-y={-0.019}>
              <cylinderGeometry args={[0.005, 0.005, 0.02, 12]} />
              <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position-y={-0.036}>
              <cylinderGeometry args={[0.012, 0.012, 0.006, 20]} />
              <meshStandardMaterial color="#111317" />
            </mesh>
          </group>
        )),
      )}
      <mesh position-y={-0.031}>
        <boxGeometry args={[0.2, 0.004, 0.22]} />
        <meshStandardMaterial {...alu} />
      </mesh>
      <Print />
    </PrintFollow>
  );
}

function Stepper() {
  return (
    <group>
      <RoundedBox args={[MOTOR, MOTOR, MOTOR]} radius={0.003} smoothness={2} castShadow>
        <meshStandardMaterial color="#111317" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <mesh key={s} position-y={s * (MOTOR / 2 - 0.004)}>
          <boxGeometry args={[MOTOR + 0.001, 0.008, MOTOR + 0.001]} />
          <meshStandardMaterial color="#9aa0a8" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Four motors (X, Y, Z, extruder); each comes out on its own and they line up on the mat. */
function Steppers() {
  const rest = (x: number): Vec3 => [x, MOTOR / 2, 0.62];
  return (
    <>
      <SubMotion at={X_MOTOR} path={sub(X_MOTOR, rest(-0.16))} label={[0, 0.04, 0]}>
        <PrintFollow y>
          <Stepper />
        </PrintFollow>
      </SubMotion>
      <SubMotion at={Y_MOTOR} path={sub(Y_MOTOR, rest(-0.055))}>
        <Stepper />
      </SubMotion>
      <SubMotion at={Z_MOTOR} path={sub(Z_MOTOR, rest(0.05))}>
        <Stepper />
      </SubMotion>
      <SubMotion at={E_MOTOR} path={sub(E_MOTOR, rest(0.155))}>
        <Stepper />
      </SubMotion>
    </>
  );
}

/** X belt (rides the gantry), Y belt under the bed, Z lead screw. */
function Belts() {
  const X_BELT: Vec3 = [0, BED_TOP + HEAD_H + 0.012, GANTRY_Z + 0.012];
  const Y_BELT: Vec3 = [0, BASE_H + 0.011, PRINT_Z];
  const Z_SCREW: Vec3 = [-0.19, BASE_H + 0.2, GANTRY_Z];
  const belt = { color: '#0b0d11', roughness: 0.8 } as const;
  return (
    <>
      <SubMotion at={X_BELT} path={sub(X_BELT, [0, 0.003, 0.72])} label={[0, 0.02, 0]}>
        <PrintFollow y>
          {[-0.004, 0.004].map((y) => (
            <mesh key={y} position-y={y}>
              <boxGeometry args={[0.37, 0.002, 0.006]} />
              <meshStandardMaterial {...belt} />
            </mesh>
          ))}
        </PrintFollow>
      </SubMotion>
      <SubMotion at={Y_BELT} path={sub(Y_BELT, [0, 0.003, 0.77])} turn={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.006, 0.002, 0.34]} />
          <meshStandardMaterial {...belt} />
        </mesh>
      </SubMotion>
      <SubMotion at={Z_SCREW} path={sub(Z_SCREW, [0, 0.005, 0.82])} turn={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.004, 0.004, 0.36, 12]} />
          <meshStandardMaterial color="#d6d9de" metalness={0.95} roughness={0.2} />
        </mesh>
      </SubMotion>
    </>
  );
}

function ControlBoard() {
  return (
    <group>
      <Card size={[0.1, 0.0016, 0.07]} color="#1e3a5f" seed={71} chips={[[-0.03, 0.02, 0.012], [0.02, -0.015, 0.01]]} />
      {[-0.03, -0.01, 0.01, 0.03].map((x) => (
        <mesh key={x} position={[x, 0.004, 0.022]}>
          <boxGeometry args={[0.012, 0.006, 0.012]} />
          <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Psu() {
  return (
    <group>
      <RoundedBox args={[0.05, 0.11, 0.2]} radius={0.003} smoothness={2} castShadow>
        <meshStandardMaterial color="#b9bdc4" metalness={0.8} roughness={0.35} />
      </RoundedBox>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0.0255, 0.03 - (i % 2) * 0.012, -0.07 + Math.floor(i / 2) * 0.012]} rotation-y={Math.PI / 2}>
          <circleGeometry args={[0.004, 12]} />
          <meshStandardMaterial color="#1b1d22" />
        </mesh>
      ))}
    </group>
  );
}

export default function PrinterTeardown() {
  const t = useT();
  const name = (id: string) => t(`teardown.printer_3d.parts.${id}.name` as TranslationKey);
  const content = useMemo<Record<string, ReactNode>>(
    () => ({
      extruder: <Extruder />,
      heated_bed: <HeatedBed />,
      steppers: <Steppers />,
      belts: <Belts />,
      control_board: <ControlBoard />,
      psu: <Psu />,
    }),
    [],
  );
  return (
    <group position-z={-0.12}>
      <Frame />
      <Gantry />
      {ORDER.map((id, i) => (
        <TeardownPart key={id} id={id} index={i} name={name(id)} motion={MOTION[id]}>
          {content[id]}
        </TeardownPart>
      ))}
    </group>
  );
}
