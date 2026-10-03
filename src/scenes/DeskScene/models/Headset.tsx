/**
 * [PLACEHOLDER] Procedural over-ear headset resting on an aluminium stand:
 * steel headband with padded strap, yokes, closed-back cups, memory-foam
 * cushions. Replace with an optimised GLB.
 */
import { useDisposable } from '@/hooks/useDisposable';
import { latheProfile, tubeAlong } from '@/lib/three/geometry';
import { brushedMetalTexture } from '@/lib/three/proceduralTextures';
import { HEADSET } from '../layout';

const POLE = 0.26;
const BAND_R = 0.082;

export function Headset() {
  const res = useDisposable(
    () => ({
      cup: latheProfile([
        [0, 0.026],
        [0.022, 0.025],
        [0.034, 0.02],
        [0.04, 0.01],
        [0.041, 0],
      ]),
      cradle: tubeAlong(
        [
          [0, POLE - 0.006, -0.045],
          [0, POLE + 0.006, -0.02],
          [0, POLE + 0.006, 0.02],
          [0, POLE - 0.006, 0.045],
        ],
        0.008,
        32,
        12,
      ),
      brushed: brushedMetalTexture([1, 3]),
    }),
    [],
  );

  const bandY = POLE + 0.014 - BAND_R; // band rests on the cradle

  return (
    <group position={[...HEADSET.position]} rotation-y={HEADSET.yaw}>
      {/* stand */}
      <mesh position-y={0.005} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.058, 0.01, 48]} />
        <meshStandardMaterial color="#3a3d44" metalness={0.9} roughness={0.3} roughnessMap={res.brushed} />
      </mesh>
      <mesh position-y={POLE / 2} castShadow>
        <cylinderGeometry args={[0.0075, 0.0085, POLE, 24]} />
        <meshStandardMaterial color="#3a3d44" metalness={0.9} roughness={0.3} roughnessMap={res.brushed} />
      </mesh>
      <mesh geometry={res.cradle} castShadow>
        <meshStandardMaterial color="#111215" roughness={0.85} />
      </mesh>

      {/* headset */}
      <group position-y={bandY}>
        {/* steel band + padded strap (drapes over the cradle) */}
        <mesh castShadow>
          <torusGeometry args={[BAND_R, 0.0045, 12, 64, Math.PI]} />
          <meshStandardMaterial color="#2b2d33" metalness={0.85} roughness={0.35} />
        </mesh>
        <mesh scale={[1, 1, 2.2]} castShadow>
          <torusGeometry args={[BAND_R - 0.008, 0.0075, 14, 64, Math.PI]} />
          <meshStandardMaterial color="#141518" roughness={0.9} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * BAND_R, -0.035, 0]}>
            {/* yoke */}
            <mesh position-y={0.018}>
              <boxGeometry args={[0.006, 0.05, 0.012]} />
              <meshStandardMaterial color="#2b2d33" metalness={0.8} roughness={0.35} />
            </mesh>
            {/* cup (axis along X, closed back outward) */}
            <mesh geometry={res.cup} rotation-z={s > 0 ? -Math.PI / 2 : Math.PI / 2} position-x={s * 0.002} castShadow>
              <meshPhysicalMaterial color="#17181c" roughness={0.38} clearcoat={0.4} clearcoatRoughness={0.3} side={2} />
            </mesh>
            {/* cushion */}
            <mesh rotation-y={Math.PI / 2} position-x={-s * 0.006} scale={[1, 1.15, 1]} castShadow>
              <torusGeometry args={[0.031, 0.011, 16, 48]} />
              <meshStandardMaterial color="#101114" roughness={0.95} />
            </mesh>
            {/* accent ring */}
            <mesh rotation-y={Math.PI / 2} position-x={s * 0.0215}>
              <torusGeometry args={[0.022, 0.0012, 8, 48]} />
              <meshStandardMaterial color="#6d7179" metalness={0.9} roughness={0.28} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
