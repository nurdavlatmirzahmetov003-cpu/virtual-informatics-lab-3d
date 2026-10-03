import { useRef, type ComponentProps, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { ModelLoader } from '@/components/3d/ModelLoader';
import type { PartId } from './parts';
import { FRONT_FANS, RAM } from './constants';
import { pcRig } from './pcRig';

type Fit = NonNullable<ComponentProps<typeof ModelLoader>['fit']>;
const fits: Record<Exclude<PartId, 'fans'>, Fit> = {
  motherboard: { axis: 1, size: 0.305, rotation: [0, -Math.PI / 2, 0], offset: [-0.024, 0, 0] },
  cpu: { axis: 1, size: 0.04, rotation: [0, -Math.PI / 2, 0], offset: [-0.003, 0, 0] },
  cooler: { axis: 0, size: 0.148, rotation: [0, 0, -Math.PI / 2], offset: [-0.078, 0, 0.01] },
  ram: { axis: 1, size: 0.133, rotation: [Math.PI / 2, 0, Math.PI / 2], offset: [-0.029, 0, 0] },
  gpu: { axis: 2, size: 0.323, rotation: [0, -Math.PI / 2, 0], offset: [-0.07, 0, 0.1615] },
  ssd: { axis: 2, size: 0.08, rotation: [0, -Math.PI / 2, 0], offset: [-0.002, 0, 0] },
  psu: { axis: 0, size: 0.15 },
};
const files = { motherboard: 'motherboard_x570', cpu: 'cpu_am4', cooler: 'cooler_tower', ram: 'ram_rgb', gpu: 'gpu_triple_fan', ssd: 'ssd_m2', psu: 'psu' };
const fanFit: Fit = { axis: 0, size: 0.12, rotation: [Math.PI / 2, 0, 0] };
const rotorFit: Fit = { axis: 0, size: 0.0935, rotation: [Math.PI / 2, 0, 0] };
const url = (name: string) => `${import.meta.env.BASE_URL}assets/models/hardware/${name}.glb`;

function HardwareFan({ y, fallback }: { y: number; fallback: ReactNode }) {
  const rotor = useRef<Group>(null);
  const reduced = useReducedMotion();
  useFrame((_, delta) => { if (rotor.current && !reduced) rotor.current.rotation.z -= Math.min(delta, 0.05) * 8 * pcRig.fanSpeed; });
  return <group position-y={y}>
    <ModelLoader url={url('fan_frame')} fit={fanFit} fallback={fallback} />
    <group ref={rotor} position-z={0.0018}><ModelLoader url={url('fan_rotor')} fit={rotorFit} castShadow={false} fallback={null} /></group>
  </group>;
}

/** Licensed PBR components; PCPart retains ownership of all choreography. */
export function HardwarePart({ id, fallback }: { id: PartId; fallback: ReactNode }) {
  if (id === 'fans') return <>{FRONT_FANS.ys.map((y, i) => <HardwareFan key={y} y={y} fallback={i === 0 ? <group position-y={-y}>{fallback}</group> : null} />)}</>;
  if (id === 'ram') return <>{Array.from({ length: RAM.count }, (_, i) => <ModelLoader key={i} url={url(files.ram)} fit={fits.ram} position-z={RAM.pitch * i} fallback={i === 0 ? fallback : null} />)}</>;
  return <ModelLoader url={url(files[id])} fit={fits[id]} fallback={fallback} />;
}
