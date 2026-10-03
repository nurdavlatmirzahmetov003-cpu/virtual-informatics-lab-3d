/**
 * [PLACEHOLDER] Single-tower air cooler: nickel cold plate + mounting bar,
 * 4 copper heat pipes, 46-fin aluminium stack (instanced), brushed top cover,
 * 120 mm push fan. Board frame (local Z = out of the board).
 */
import { useLayoutEffect, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Matrix4, type InstancedMesh } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { tubeAlong } from '@/lib/three/geometry';
import { FAN } from './constants';
import { Fan, type FanGeometries } from '../models/Fan';
import type { PcTextures } from './usePcTextures';

const FINS = { count: 46, start: 0.046, pitch: 0.0023, w: 0.052, h: 0.125 };
const STACK_END = FINS.start + FINS.count * FINS.pitch;
const PIPES = [-0.027, -0.009, 0.009, 0.027];

export function CpuCooler({ tex, fan }: { tex: PcTextures; fan: FanGeometries }) {
  const fins = useRef<InstancedMesh>(null);
  const pipes = useDisposable(
    () =>
      // heat pipes: out of the base, through the stack, capped above it
      Object.fromEntries(
        PIPES.map((v, i) => [
          `pipe${i}`,
          tubeAlong(
          [
            [i % 2 ? 0.006 : -0.006, v * 0.5, 0.008],
            [i % 2 ? 0.01 : -0.01, v * 0.8, 0.026],
            [i % 2 ? 0.012 : -0.012, v, FINS.start],
            [i % 2 ? 0.012 : -0.012, v, STACK_END + 0.004],
          ],
          0.003,
          24,
          10,
          ),
        ]),
      ),
    [],
  );

  useLayoutEffect(() => {
    const mesh = fins.current;
    if (!mesh) return;
    const m = new Matrix4();
    for (let i = 0; i < FINS.count; i++) {
      m.makeTranslation(0, 0, FINS.start + i * FINS.pitch);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  return (
    <group rotation-y={-Math.PI / 2}>
      {/* cold plate + mounting bar */}
      <mesh position-z={0.0085}>
        <boxGeometry args={[0.04, 0.04, 0.0065]} />
        <meshStandardMaterial color="#c9cdd3" metalness={1} roughness={0.22} />
      </mesh>
      <RoundedBox args={[0.012, 0.075, 0.004]} radius={0.0015} position-z={0.0135}>
        <meshStandardMaterial color="#2b2e34" metalness={0.8} roughness={0.35} />
      </RoundedBox>
      {Object.values(pipes).map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <meshStandardMaterial color="#c07a45" metalness={1} roughness={0.25} />
        </mesh>
      ))}
      <instancedMesh ref={fins} args={[undefined, undefined, FINS.count]} castShadow receiveShadow>
        <boxGeometry args={[FINS.w, FINS.h, 0.0004]} />
        <meshStandardMaterial color="#c3c7ce" metalness={0.9} roughness={0.3} />
      </instancedMesh>
      {/* top cover */}
      <RoundedBox args={[0.056, 0.128, 0.004]} radius={0.0015} position-z={STACK_END + 0.002} castShadow>
        <meshStandardMaterial color="#1b1d22" metalness={0.8} roughness={0.3} roughnessMap={tex.brushed} />
      </RoundedBox>
      {/* push fan on the intake side (faces case front = local +X) */}
      <Fan size={FAN} geometries={fan} rotation-y={Math.PI / 2} position={[FINS.w / 2 + 0.0135, 0, (FINS.start + STACK_END) / 2]} speed={5} />
    </group>
  );
}
