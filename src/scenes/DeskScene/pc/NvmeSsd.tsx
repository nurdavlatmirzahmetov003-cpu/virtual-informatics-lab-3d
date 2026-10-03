/**
 * [PLACEHOLDER] M.2 2280 NVMe SSD: 80 × 22 mm PCB with gold edge connector
 * and key notch, controller, DRAM and two NAND packages, product label,
 * half-moon screw. Board frame (local X = case Z, local Z = out of the board).
 */
import { Shape } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFront } from '@/lib/three/geometry';
import type { PcTextures } from './usePcTextures';

const L = 0.08;
const Wd = 0.022;

function pcbShape() {
  // key notch at the connector end (M key)
  const s = new Shape();
  s.moveTo(-L / 2, -Wd / 2);
  s.lineTo(L / 2 - 0.002, -Wd / 2);
  s.absarc(L / 2 - 0.002, 0, 0.0025, -Math.PI / 2, Math.PI / 2, false); // screw half-moon
  s.lineTo(L / 2 - 0.002, Wd / 2);
  s.lineTo(-L / 2, Wd / 2);
  s.lineTo(-L / 2, Wd / 2 - 0.0055);
  s.lineTo(-L / 2 + 0.0035, Wd / 2 - 0.0055);
  s.lineTo(-L / 2 + 0.0035, Wd / 2 - 0.0075);
  s.lineTo(-L / 2, Wd / 2 - 0.0075);
  s.closePath();
  return s;
}

export function NvmeSsd({ tex }: { tex: PcTextures }) {
  const geo = useDisposable(() => ({ pcb: extrudeFront(pcbShape(), 0.0008, { bevel: 0 }) }), []);
  const chip = (x: number, w: number, h: number, t: number, color = '#15171b') => (
    <mesh position={[x, 0, 0.0008 + t / 2 + 0.0025]} castShadow>
      <boxGeometry args={[w, h, t]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} />
    </mesh>
  );

  return (
    <group rotation-y={-Math.PI / 2}>
      <mesh geometry={geo.pcb} position-z={0.0025} castShadow>
        <meshStandardMaterial map={tex.pcbSsd} roughness={0.5} />
      </mesh>
      {/* edge connector */}
      <mesh position={[-L / 2 + 0.002, -0.002, 0.0029]}>
        <boxGeometry args={[0.0036, 0.013, 0.0003]} />
        <meshStandardMaterial color="#d4a843" metalness={1} roughness={0.25} />
      </mesh>
      {chip(-0.024, 0.011, 0.011, 0.0012)}
      {chip(-0.011, 0.007, 0.009, 0.001)}
      {chip(0.005, 0.014, 0.016, 0.0013)}
      {chip(0.022, 0.014, 0.016, 0.0013)}
      {/* label sticker over the NAND */}
      <mesh position={[0.008, 0, 0.0025 + 0.0008 + 0.00145]}>
        <planeGeometry args={[0.05, 0.019]} />
        <meshStandardMaterial map={tex.ssdLabel} roughness={0.6} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* screw */}
      <mesh position={[L / 2 - 0.002, 0, 0.004]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.0022, 0.0022, 0.0012, 16]} />
        <meshStandardMaterial color="#8d9198" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}
