/** [PLACEHOLDER] Procedural cloth desk mat with a stitched edge. */
import { useDisposable } from '@/hooks/useDisposable';
import { roundedSlab, tubeAlong } from '@/lib/three/geometry';
import { fabricTexture } from '@/lib/three/proceduralTextures';
import { MAT } from '../layout';
import { DEFAULT_DESK_TOP, matOn, type MatLayout } from '../deskFit';

const HOUSE = matOn(DEFAULT_DESK_TOP);

/** `layout`: where the mat lies on the desk in use (deskFit.ts); default: the house desk. */
export function DeskMat({ layout = HOUSE }: { layout?: MatLayout }) {
  const [w, d] = layout.size;
  const res = useDisposable(() => {
    const r = 0.018;
    const inset = 0.0025;
    const hw = w / 2 - inset;
    const hd = d / 2 - inset;
    // stitched border follows the rounded outline
    const pts: Array<[number, number, number]> = [];
    const corners: Array<[number, number, number]> = [
      [hw - r, hd - r, 0],
      [-hw + r, hd - r, Math.PI / 2],
      [-hw + r, -hd + r, Math.PI],
      [hw - r, -hd + r, (3 * Math.PI) / 2],
    ];
    for (const [cx, cz, a0] of corners) {
      for (let i = 0; i <= 6; i++) {
        const a = a0 + (i / 6) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * r, MAT.thickness - 0.0004, cz + Math.sin(a) * r]);
      }
    }
    pts.push(pts[0]);
    return {
      slab: roundedSlab(w, MAT.thickness, d, 0.02, 0.0012),
      stitch: tubeAlong(pts, 0.0011, 200, 6),
      fabric: fabricTexture([w * 40, d * 40]),
    };
  }, [w, d]);

  return (
    <group position={[...layout.position]}>
      <mesh geometry={res.slab} receiveShadow>
        <meshStandardMaterial
          color="#121419"
          roughness={0.95}
          roughnessMap={res.fabric}
          bumpMap={res.fabric}
          bumpScale={0.25}
          envMapIntensity={0.25}
        />
      </mesh>
      <mesh geometry={res.stitch}>
        <meshStandardMaterial color="#2a2e36" roughness={0.8} />
      </mesh>
    </group>
  );
}
