import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { ModelLoader } from '@/components/3d/ModelLoader';
import type { PartId } from './parts';
import { FRONT_FANS, PSU, RAM } from './constants';
import { caseInterior, fanFit, files, fits, frontFans, productFits, psuFit, rotorFit, sataFitFor, type CaseInterior } from './fits';

const url = (name: string) => `${import.meta.env.BASE_URL}assets/models/hardware/${name}.glb`;
const productUrl = (product: HardwareItem) => `${import.meta.env.BASE_URL}assets/models/${product.modelPath}`;
import { pcRig } from './pcRig';
import type { HardwareItem } from '@/data/hardware/types';
import { LiquidCooler } from './LiquidCooler';
import { isTieredModel } from '@/lib/three/modelUrls';

/**
 * A row of 120 mm fans along Y. Deliberately not instanced (measured in
 * Phase 9 on Intel UHD / D3D11): instanced copies need their own shader
 * variants (+7 programs, ≈ 0.7 s more compiling at load) and spinning
 * rotors would rewrite the instance buffer every frame, which stalled the
 * GPU (74 → 54 FPS) — all to save 13 draw calls for 3 fans and 2–4 RAM sticks.
 */
export function HardwareFans({ ys, z = 0, fallback }: { ys: readonly number[]; z?: number; fallback: ReactNode }) {
  const frames = useMemo(() => ys.map((y) => [0, y, z] as const), [ys, z]);
  return (
    <>
      {frames.map((p, i) => <ModelLoader key={i} url={url('fan_frame')} fit={fanFit} position={[...p]} fallback={i === 0 ? fallback : null} />)}
      {ys.map((y) => (
        <Rotor key={y} y={y} z={z} />
      ))}
    </>
  );
}

function Rotor({ y, z }: { y: number; z: number }) {
  const rotor = useRef<Group>(null);
  const reduced = useReducedMotion();
  useFrame((_, delta) => {
    if (rotor.current && !reduced) rotor.current.rotation.z -= Math.min(delta, 0.05) * 8 * pcRig.fanSpeed;
  });
  return (
    <group ref={rotor} position={[0, y, z + 0.0018]}>
      <ModelLoader url={url('fan_rotor')} fit={rotorFit} castShadow={false} fallback={null} />
    </group>
  );
}

/** 2 or 4 identical modules in the DIMM slots (one cached file, see HardwareFans on instancing). */
function RamSticks({ count, fallback, product }: { count: number; fallback: ReactNode; product?: HardwareItem }) {
  const positions = useMemo(() => Array.from({ length: Math.min(4, count) }, (_, i) => [0, 0, RAM.pitch * (count === 2 ? i * 2 + 1 : i)] as const), [count]);
  const own = product && isTieredModel(product.modelPath);
  return (
    <>
      {positions.map((p, i) => (
        <ModelLoader key={i} url={own ? productUrl(product) : url(files.ram)} fit={own ? productFits.ram : fits.ram} position={[...p]} fallback={i === 0 ? fallback : null} />
      ))}
    </>
  );
}

/** Licensed PBR components; PCPart retains ownership of all choreography. */
const PROCEDURAL_INTERIOR = caseInterior();

/** `interior`: the case the part is installed in (its floor, shroud and front panel, see fits.ts). */
export function HardwarePart({ id, fallback, product, rgbColor, deferDetail = false, interior = PROCEDURAL_INTERIOR }: { id: PartId; fallback: ReactNode; product?: HardwareItem; rgbColor?: string | null; deferDetail?: boolean; interior?: CaseInterior }) {
  const own = !!product && isTieredModel(product.modelPath);
  const fit = useMemo(() => {
    if (id === 'fans') return null;
    if (id === 'psu') return psuFit(interior, PSU.y, own);
    if (own) return id === 'ssd' && /SATA/.test(product?.model ?? '') ? sataFitFor(interior) : productFits[id];
    const base = fits[id];
    if (id === 'gpu' && product?.modelSize) return { ...base, size: product.modelSize, offset: [-0.07, 0, product.modelSize / 2] as const };
    if (id === 'cooler' && product?.compatibility.coolerHeightMm) {
      const height = product.compatibility.coolerHeightMm / 1000;
      return { ...base, size: height, offset: [-height / 2, 0, 0.01] as const };
    }
    return base;
  }, [id, product, own, interior]);
  const fans = useMemo(() => frontFans(interior), [interior]);
  if (id === 'fans') return <HardwareFans ys={fans.ys} z={fans.z - FRONT_FANS.z} fallback={fallback} />;
  if (id === 'cooler' && product?.compatibility.radiatorMm) return <LiquidCooler radiatorMm={product.compatibility.radiatorMm} rgbColor={rgbColor} />;
  if (id === 'ram') {
    const count = product ? Number(product.model.match(/\((\d+)\s*[×x]/)?.[1] ?? 2) : RAM.count;
    return <RamSticks count={count} fallback={fallback} product={product} />;
  }
  return <ModelLoader key={own ? product!.id : id} url={own ? productUrl(product!) : url(files[id])} fit={fit!} fallback={fallback} deferDetail={deferDetail} />;
}
