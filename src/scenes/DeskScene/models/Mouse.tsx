/**
 * [PLACEHOLDER] Procedural ergonomic wireless gaming mouse: sculpted shell
 * (deformed sphere) with UV-painted button seams, rubber scroll wheel in a
 * recessed slot, side buttons, subtle logo light. Replace with an optimised GLB.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { mouseBodyGeometry, mouseSurface, type MouseShape } from '@/lib/three/geometry';
import { mouseShellTextures } from '@/lib/three/proceduralTextures';
import { MOUSE } from '../layout';
import { storyRig } from '../storyRig';

const SHAPE: MouseShape = { length: 0.122, width: 0.064, height: 0.039 };

/** Point on the shell from unit-sphere direction (for placing parts). */
function onShell(x: number, y: number, z: number) {
  const n = new Vector3(x, y, z).normalize();
  return mouseSurface(SHAPE, n.x, n.y, n.z);
}

export function Mouse() {
  const group = useRef<Group>(null);
  const res = useDisposable(() => {
    const shell = mouseShellTextures(SHAPE);
    return {
      body: mouseBodyGeometry(SHAPE),
      seams: shell.color,
      logo: shell.emissive,
    };
  }, []);

  const wheelPos = onShell(0, 0.85, -0.55);
  const side1 = onShell(-1, 0.32, -0.12);
  const side2 = onShell(-1, 0.32, 0.12);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.rotation.y = MOUSE.yaw + storyRig.mouseSpin;
    g.position.y = MOUSE.position[1] + storyRig.mouseLift;
  });

  return (
    <group ref={group} position={[...MOUSE.position]}>
      <mesh geometry={res.body} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#2a2c32"
          map={res.seams}
          roughness={0.48}
          clearcoat={0.25}
          clearcoatRoughness={0.5}
          emissive="#38d6f5"
          emissiveMap={res.logo}
          emissiveIntensity={1.4}
        />
      </mesh>
      {/* wheel slot + rubber wheel (protrudes ~4 mm above the shell) */}
      <group position={[0, wheelPos.y, wheelPos.z]}>
        <mesh position-y={-0.003}>
          <boxGeometry args={[0.0085, 0.006, 0.02]} />
          <meshStandardMaterial color="#050506" roughness={0.9} />
        </mesh>
        <mesh rotation-z={Math.PI / 2} position-y={-0.0065} castShadow>
          <cylinderGeometry args={[0.0105, 0.0105, 0.0068, 32]} />
          <meshStandardMaterial color="#1d1f24" roughness={0.75} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} rotation-y={Math.PI / 2} position={[s * 0.0035, -0.0065, 0]}>
            <torusGeometry args={[0.0103, 0.0008, 8, 40]} />
            <meshStandardMaterial color="#3a3d44" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>
      {/* side (thumb) buttons */}
      {[side1, side2].map((p, i) => (
        <mesh key={i} position={[p.x - 0.0008, p.y, p.z]} rotation={[Math.PI / 2, 0, 0.25]} castShadow>
          <capsuleGeometry args={[0.0032, 0.014, 6, 12]} />
          <meshStandardMaterial color="#202227" roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      {/* PTFE feet */}
      {[-0.04, 0.04].map((z) => (
        <mesh key={z} position={[0, 0.0004, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.03, 0.008]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
