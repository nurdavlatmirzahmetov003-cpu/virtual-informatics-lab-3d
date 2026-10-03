/**
 * [PLACEHOLDER] Procedural 2-way desktop monitor speakers: satin cabinet,
 * woofer (cone, surround, dust cap) with trim ring, soft-dome tweeter, front
 * reflex port. Replace with an optimised GLB.
 */
import { RoundedBox } from '@react-three/drei';
import { useDisposable } from '@/hooks/useDisposable';
import { driverGeometry, latheProfile } from '@/lib/three/geometry';
import { SPEAKERS } from '../layout';

const CAB = { w: 0.105, h: 0.175, d: 0.13 };

function Speaker({ position, yaw }: { position: readonly [number, number, number]; yaw: number }) {
  const geo = useDisposable(
    () => ({
      woofer: driverGeometry(0.037),
      tweeter: latheProfile([
        [0, 0.006],
        [0.006, 0.0052],
        [0.0105, 0.0022],
        [0.0125, 0],
      ]),
    }),
    [],
  );
  const front = CAB.d / 2 + 0.0005;

  return (
    <group position={[...position]} rotation-y={yaw}>
      <RoundedBox args={[CAB.w, CAB.h, CAB.d]} radius={0.008} smoothness={4} position-y={CAB.h / 2 + 0.004} castShadow receiveShadow>
        <meshPhysicalMaterial color="#18191d" roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.35} />
      </RoundedBox>
      {/* rubber pads */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.035, 0.002, 0]}>
          <boxGeometry args={[0.02, 0.004, CAB.d - 0.03]} />
          <meshStandardMaterial color="#0a0a0b" roughness={0.95} />
        </mesh>
      ))}
      <group position={[0, 0.004, front]}>
        {/* woofer */}
        <group position-y={0.06}>
          <mesh geometry={geo.woofer} rotation-x={Math.PI / 2} castShadow>
            <meshStandardMaterial color="#202227" roughness={0.7} side={2} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.0395, 0.0022, 12, 64]} />
            <meshStandardMaterial color="#6d7179" metalness={0.9} roughness={0.28} />
          </mesh>
        </group>
        {/* tweeter */}
        <group position-y={0.135}>
          <mesh geometry={geo.tweeter} rotation-x={Math.PI / 2}>
            <meshStandardMaterial color="#2a2c31" roughness={0.6} side={2} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.0145, 0.0018, 10, 48]} />
            <meshStandardMaterial color="#6d7179" metalness={0.9} roughness={0.28} />
          </mesh>
        </group>
        {/* reflex port */}
        <mesh position={[0, 0.016, -0.004]}>
          <boxGeometry args={[0.05, 0.007, 0.01]} />
          <meshStandardMaterial color="#030304" roughness={1} />
        </mesh>
        {/* power LED */}
        <mesh position={[0.038, 0.016, 0.0002]}>
          <circleGeometry args={[0.0013, 12]} />
          <meshBasicMaterial color="#9fe9ff" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export function Speakers() {
  return (
    <>
      <Speaker position={SPEAKERS.left.position} yaw={SPEAKERS.left.yaw} />
      <Speaker position={SPEAKERS.right.position} yaw={SPEAKERS.right.yaw} />
    </>
  );
}
