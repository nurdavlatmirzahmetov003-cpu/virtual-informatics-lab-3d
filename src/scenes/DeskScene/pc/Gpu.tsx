/**
 * [PLACEHOLDER] Triple-fan graphics card: angular shroud with fan openings,
 * aluminium fin stack visible through the rotors, PCB, brushed backplate,
 * gold PCIe x16 fingers, I/O bracket with ports and vents, 12-pin power
 * header and an edge light bar.
 *
 * Case frame: card grows from the board toward −X (height), along +Z
 * (length); Y is its thickness, fans face −Y.
 */
import { useLayoutEffect, useRef } from 'react';
import { Matrix4, Path, Shape, type InstancedMesh, type Material } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFlat } from '@/lib/three/geometry';
import { GPU } from './constants';
import { Fan, type FanGeometries } from '../models/Fan';
import type { PcTextures } from './usePcTextures';

const { len: LEN, height: HGT } = GPU;
const FAN_Z = [LEN * 0.2, LEN * 0.5, LEN * 0.8];
const FAN_R = 0.045;
const SHROUD = { bottom: -0.025, height: 0.034 };
const FIN_COUNT = 70;
const X0 = -0.004; // clearance from the board
const PCB_Y = GPU.pcbY;

/** Shroud outline in the card plane (X = height, Y = −length) with chamfers and fan holes. */
function shroudShape() {
  const s = new Shape();
  const c = 0.012;
  s.moveTo(X0, 0);
  s.lineTo(X0 - HGT + c, 0);
  s.lineTo(X0 - HGT, -c);
  s.lineTo(X0 - HGT, -LEN + c * 2);
  s.lineTo(X0 - HGT + c * 2, -LEN);
  s.lineTo(X0, -LEN);
  s.closePath();
  for (const z of FAN_Z) {
    const hole = new Path();
    hole.absarc(X0 - HGT / 2, -z, FAN_R + 0.002, 0, Math.PI * 2, true);
    s.holes.push(hole);
  }
  return s;
}

export function Gpu({ tex, fan, light }: { tex: PcTextures; fan: FanGeometries; light: Material }) {
  const fins = useRef<InstancedMesh>(null);
  const geo = useDisposable(() => ({ shroud: extrudeFlat(shroudShape(), SHROUD.height, { bevel: 0.0025 }) }), []);

  useLayoutEffect(() => {
    const mesh = fins.current;
    if (!mesh) return;
    const m = new Matrix4();
    for (let i = 0; i < FIN_COUNT; i++) {
      m.makeTranslation(X0 - HGT / 2, PCB_Y - 0.01, 0.012 + (i * (LEN - 0.03)) / (FIN_COUNT - 1));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  return (
    <group>
      {/* shroud */}
      <mesh geometry={geo.shroud} position-y={SHROUD.bottom} castShadow receiveShadow>
        <meshStandardMaterial color="#1f2126" metalness={0.65} roughness={0.36} />
      </mesh>
      {/* silver accent on the glass-facing edge */}
      <mesh position={[X0 - HGT - 0.0005, SHROUD.bottom + SHROUD.height * 0.7, LEN * 0.45]}>
        <boxGeometry args={[0.001, 0.003, LEN * 0.55]} />
        <meshStandardMaterial color="#c9cdd3" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[X0 - HGT - 0.0008, SHROUD.bottom + SHROUD.height * 0.35, LEN * 0.55]} material={light}>
        <boxGeometry args={[0.0012, 0.0035, LEN * 0.6]} />
      </mesh>

      {/* fin stack between shroud and PCB */}
      <instancedMesh ref={fins} args={[undefined, undefined, FIN_COUNT]}>
        <boxGeometry args={[HGT - 0.012, 0.018, 0.0005]} />
        <meshStandardMaterial color="#aeb3bb" metalness={0.9} roughness={0.32} />
      </instancedMesh>

      {/* fans recessed in the shroud openings */}
      {FAN_Z.map((z) => (
        <Fan
          key={z}
          size={0.12}
          geometries={fan}
          frameless
          scale={(FAN_R * 2) / 0.12}
          position={[X0 - HGT / 2, SHROUD.bottom + 0.012, z]}
          rotation-x={Math.PI / 2}
          speed={5.5}
        />
      ))}

      {/* PCB + backplate */}
      <mesh position={[X0 - HGT / 2 + 0.004, PCB_Y, LEN / 2]}>
        <boxGeometry args={[HGT - 0.012, 0.0016, LEN - 0.012]} />
        <meshStandardMaterial map={tex.pcbSsd} roughness={0.55} />
      </mesh>
      <mesh position={[X0 - HGT / 2, SHROUD.bottom + SHROUD.height + 0.0065, LEN / 2]} castShadow>
        <boxGeometry args={[HGT - 0.004, 0.0018, LEN - 0.006]} />
        <meshStandardMaterial color="#34373d" metalness={0.85} roughness={0.3} roughnessMap={tex.brushed} />
      </mesh>
      {/* PCIe x16 gold fingers (into the board slot) */}
      <mesh position={[X0 + 0.003, PCB_Y, 0.075]}>
        <boxGeometry args={[0.007, 0.0017, 0.089]} />
        <meshStandardMaterial color="#d4a843" metalness={1} roughness={0.25} />
      </mesh>
      {/* 12-pin power header on the top edge */}
      <mesh position={[X0 - HGT + 0.006, SHROUD.bottom + SHROUD.height + 0.01, LEN * 0.68]}>
        <boxGeometry args={[0.012, 0.01, 0.02]} />
        <meshStandardMaterial color="#0b0c0e" roughness={0.6} />
      </mesh>

      {/* I/O bracket with vents + display outputs */}
      <group position={[X0 - 0.06, 0, -0.004]}>
        <mesh>
          <boxGeometry args={[0.12, 0.058, 0.0015]} />
          <meshStandardMaterial color="#8d9198" metalness={0.9} roughness={0.3} alphaMap={tex.fineMesh} alphaTest={0.5} alphaToCoverage side={2} />
        </mesh>
        {[-0.04, -0.02, 0.0, 0.025].map((x, i) => (
          <mesh key={x} position={[x, -0.016, -0.0012]}>
            <boxGeometry args={[i === 3 ? 0.015 : 0.016, 0.006, 0.002]} />
            <meshStandardMaterial color="#050506" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
