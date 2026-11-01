/** Parametric AIO: pump block on the CPU, braided hoses, the radiator at the case's radiator mount and its fans. */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Matrix4, Quaternion, Vector3, type BufferGeometry, type MeshStandardMaterial } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { finnedHeatsink, tubeAlong } from '@/lib/three/geometry';
import { HardwareFans, OwnModel } from './HardwareParts';
import { ModelLoader } from '@/components/3d/ModelLoader';
import type { HardwareItem } from '@/data/hardware/types';
import { FanArray } from './ShowcaseCase';
import { ON_BOARD } from './mounts';
import type { CoolerPlacement, FanMount, Vec3 } from './mounts';
import { pcRig } from './pcRig';

/** Radiator core thickness and width (120 mm class). */
const CORE = { thick: 0.027, width: 0.12 };

/** BitLab's white AIO (make-showcase.py): its own pump and radiator models, white sleeved hoses, ARGB fans. */
const WHITE_AIO: Record<string, { radiator: string; fan: string }> = {
  'cool-bitlab-aero-360': { radiator: 'products/rad-bitlab-360.glb', fan: 'fan-bitlab-120' },
};
const ON_BOARD_POSE = { axis: 1 as const, rotation: ON_BOARD };

export function LiquidCooler({ pump, rgbColor, product }: { pump: CoolerPlacement; rgbColor?: string | null; product?: HardwareItem }) {
  // BitLab's own radiator model is 360 mm: a shorter mount gets the parametric radiator at its real length
  const white = product && (pump.radiator?.mm ?? 360) >= 360 ? WHITE_AIO[product.id] : undefined;
  const light = useRef<MeshStandardMaterial>(null);
  const rad = pump.radiator;
  const frame = useMemo(() => {
    if (!rad) return null;
    const along = new Vector3(...rad.along).normalize();
    const normal = new Vector3(...rad.normal).normalize();
    const width = new Vector3().crossVectors(normal, along).normalize();
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(width, normal, along));
    const centre = new Vector3(...rad.p).sub(new Vector3(...pump.p));
    const length = rad.mm / 1000;
    const count = Math.max(1, Math.round(length / 0.12));
    // fans on the inner side, pushing air out through the core
    const fans: FanMount[] = Array.from({ length: count }, (_, i) => {
      const p = centre.clone().addScaledVector(along, -length / 2 + 0.06 + i * 0.12).addScaledVector(normal, -(CORE.thick / 2 + 0.0125));
      return { p: p.toArray() as unknown as Vec3, n: rad.normal, group: 'top', size: 0.12 };
    });
    // hoses leave the pump towards the board's top edge and enter the radiator's end tank by the rear
    const port = (side: number) => centre.clone().addScaledVector(along, -length / 2 - 0.004).addScaledVector(width, side * 0.022).addScaledVector(normal, -0.004);
    const hose = (side: number) => {
      const end = port(side);
      const start = new Vector3(-0.018, 0.026, side * 0.012);
      const mid1 = new Vector3(-0.05, 0.06, side * 0.016 - 0.02);
      const mid2 = end.clone().addScaledVector(normal, -0.05).addScaledVector(along, -0.02);
      return [start, mid1, mid2, end].map((v) => v.toArray() as [number, number, number]);
    };
    return { q, centre, length, fans, hoses: [hose(-1), hose(1)] };
  }, [rad, pump.p]);

  const geo = useDisposable(() => {
    const g: Record<string, BufferGeometry> = {};
    if (frame) {
      [g.hoseA, g.hoseB] = frame.hoses.map((pts) => tubeAlong(pts, 0.0055, 48));
      g.fins = finnedHeatsink(CORE.width - 0.01, frame.length - 0.01, CORE.thick - 0.004, Math.round(frame.length * 140), 0.003);
    }
    return g;
  }, [frame]);
  useFrame(() => {
    if (light.current) light.current.emissiveIntensity = rgbColor === null ? 0 : pcRig.rgbPower * 1.3;
  });

  if (white && product) {
    return (
      <group>
        <OwnModel product={product} fit={ON_BOARD_POSE} />
        {[geo.hoseA, geo.hoseB].map(
          (g, i) =>
            g && (
              <mesh key={i} geometry={g} castShadow>
                <meshStandardMaterial color="#eceef2" roughness={0.78} metalness={0} />
              </mesh>
            ),
        )}
        {frame && (
          <>
            <group position={frame.centre} quaternion={frame.q}>
              <ModelLoader url={`${import.meta.env.BASE_URL}assets/models/${white.radiator}`} />
            </group>
            <FanArray fans={frame.fans} model={`${import.meta.env.BASE_URL}assets/models/products/${white.fan}.glb`} />
          </>
        )}
      </group>
    );
  }

  return (
    <group>
      {/* pump block, its cap facing the glass */}
      <mesh rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.03, 0.03, pump.size[0], 48]} />
        <meshStandardMaterial color="#16191f" metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position-x={-pump.size[0] / 2 - 0.0002} rotation-y={-Math.PI / 2}>
        <circleGeometry args={[0.026, 48]} />
        <meshStandardMaterial color="#080b11" metalness={0.3} roughness={0.15} />
      </mesh>
      <mesh position-x={-pump.size[0] / 2 - 0.0004} rotation-y={-Math.PI / 2}>
        <torusGeometry args={[0.026, 0.0012, 8, 48]} />
        <meshStandardMaterial ref={light} color="#223340" emissive={rgbColor ?? '#38d6f5'} emissiveIntensity={0} />
      </mesh>
      {[geo.hoseA, geo.hoseB].map((g, i) => g && (
        <mesh key={i} geometry={g} castShadow>
          <meshStandardMaterial color="#111418" roughness={0.64} metalness={0.05} />
        </mesh>
      ))}
      {frame && geo.fins && (
        <>
          <group position={frame.centre} quaternion={frame.q}>
            <RoundedBox args={[CORE.width, CORE.thick, frame.length + 0.03]} radius={0.004} smoothness={2} castShadow>
              <meshStandardMaterial color="#171a20" metalness={0.75} roughness={0.4} />
            </RoundedBox>
            <mesh geometry={geo.fins} rotation-x={Math.PI / 2} position-y={-CORE.thick / 2 - 0.0005}>
              <meshStandardMaterial color="#252a32" metalness={0.85} roughness={0.36} />
            </mesh>
          </group>
          <HardwareFans fans={frame.fans} />
        </>
      )}
    </group>
  );
}
