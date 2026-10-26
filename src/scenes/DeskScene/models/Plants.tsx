/**
 * Monstera in a glazed ceramic pot (V4 §2.3): procedural and cheap — every
 * leaf is one instance of a cupped, veined leaf with its holes cut in alpha and every stalk one
 * instance of a thin stem, so a plant costs four draw calls (pot, soil,
 * stalks, leaves) whatever its size. Built standing on y = 0, front +Z.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, LatheGeometry, Matrix4, Quaternion, SRGBColorSpace, Vector2, Vector3, type InstancedMesh } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useQualityPreset } from '@/hooks/useQualityPreset';

/** Half the leaf's width at `u` (0 at the stalk, 1 at the tip): a heart with a soft tip. */
const halfWidth = (u: number) => 0.5 * Math.sin(Math.PI * Math.min(1, u * 0.92 + 0.08)) ** 0.75 * (1 - 0.15 * u);

/**
 * A monstera leaf 1 unit long from its stalk (origin) to its tip (+Y): a
 * subdivided grid, so the cup across and the arch along stay smooth up close.
 */
function leafGeometry(): BufferGeometry {
  const ROWS = 22;
  const COLS = 10;
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let r = 0; r <= ROWS; r++) {
    const u = r / ROWS;
    const hw = halfWidth(u);
    for (let c = 0; c <= COLS; c++) {
      const v = (c / COLS) * 2 - 1;
      const x = v * hw;
      // cupped across, arching along: a living leaf, not a flat card
      pos.push(x, u, 0.22 * x * x - 0.18 * u * u + 0.1 * u);
      uv.push(v * 0.5 + 0.5, u);
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * (COLS + 1) + c;
      index.push(i, i + 1, i + COLS + 1, i + 1, i + COLS + 2, i + COLS + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/**
 * The leaf's surface: light midrib and veins on a neutral ground (each leaf's
 * instance colour tints it green) and the fenestrations cut out as alpha.
 */
function leafTexture(): CanvasTexture {
  const W = 256;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const y = (u: number) => H * (1 - u);
  ctx.fillStyle = '#cfd6cc';
  ctx.fillRect(0, 0, W, H);
  // veins fan out from the midrib towards the edges
  ctx.strokeStyle = '#e9efe6';
  ctx.lineCap = 'round';
  for (let k = 1; k <= 9; k++) {
    const u0 = 0.06 + k * 0.095;
    for (const side of [-1, 1]) {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W / 2, y(u0));
      ctx.quadraticCurveTo(W / 2 + side * W * 0.25, y(u0 + 0.05), W / 2 + side * W * 0.5, y(u0 + 0.14));
      ctx.stroke();
    }
  }
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(W / 2, y(0));
  ctx.lineTo(W / 2, y(1));
  ctx.stroke();
  // fenestrations: slots between the veins, from near the midrib to near the edge
  ctx.globalCompositeOperation = 'destination-out';
  for (let k = 1; k <= 6; k++) {
    const u0 = 0.15 + k * 0.1;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(W / 2 + side * W * 0.27, y(u0 + 0.05));
      ctx.rotate(side * -0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, W * 0.15, 8 + k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Glazed pot: a lathe with a rolled rim, wider at the top. */
function potGeometry(r: number, h: number): BufferGeometry {
  const pts = [
    [0, 0],
    [r * 0.72, 0],
    [r * 0.76, h * 0.04],
    [r * 0.92, h * 0.55],
    [r, h * 0.94],
    [r * 1.04, h * 0.97],
    [r * 1.02, h],
    [r * 0.92, h],
    [r * 0.9, h * 0.9],
  ].map(([x, y]) => new Vector2(x, y));
  return new LatheGeometry(pts, 40);
}

export interface MonsteraProps {
  /** Height of the tallest leaf above the floor it stands on (m). */
  height: number;
  /** Pot radius and height (m). */
  pot: [radius: number, height: number];
  potColor: string;
  leaves?: number;
  seed?: number;
  position?: readonly [number, number, number];
  yaw?: number;
}

export function Monstera({ height, pot: [pr, ph], potColor, leaves = 9, seed = 5, position, yaw = 0 }: MonsteraProps) {
  const cheap = useQualityPreset().level === 'low';
  const leafMesh = useRef<InstancedMesh>(null);
  const stemMesh = useRef<InstancedMesh>(null);
  const geo = useDisposable(() => ({ leaf: leafGeometry(), pot: potGeometry(pr, ph) }), [pr, ph]);
  const leafMap = useDisposable(() => leafTexture(), []);

  const layout = useMemo(() => {
    let r = seed * 7919 + 13;
    const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    const plantH = height - ph;
    const list: { stem: Matrix4; leaf: Matrix4; shade: number }[] = [];
    for (let i = 0; i < leaves; i++) {
      // golden-angle spread, the younger leaves taller and more upright
      const a = i * 2.39996 + rand() * 0.4;
      const k = i / Math.max(1, leaves - 1);
      const tilt = 0.55 - 0.35 * k + rand() * 0.12;
      const len = plantH * (0.5 + 0.28 * k) * (0.9 + rand() * 0.15);
      const out = new Vector3(Math.cos(a), 0, Math.sin(a));
      const dir = out.clone().multiplyScalar(Math.sin(tilt)).add(new Vector3(0, Math.cos(tilt), 0)).normalize();
      const base = new Vector3(out.x * pr * 0.25, ph * 0.92, out.z * pr * 0.25);
      const tip = base.clone().addScaledVector(dir, len);
      // stalk: a unit cylinder along +Y, turned onto `dir` and stretched from base to tip
      const stem = new Matrix4().compose(base.clone().addScaledVector(dir, len / 2), new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir), new Vector3(1, len, 1));
      // leaf: its length runs outward and a little up, its face looks up and out
      const size = plantH * (0.42 + 0.22 * k) * (0.9 + rand() * 0.2);
      const elev = 0.15 + 0.5 * k + rand() * 0.15;
      const along = out.clone().multiplyScalar(Math.cos(elev)).add(new Vector3(0, Math.sin(elev), 0)).normalize();
      // right-handed basis: across × along = the leaf's face, which looks up
      const across = out.clone().cross(new Vector3(0, 1, 0)).normalize();
      const face = across.clone().cross(along).normalize();
      const leaf = new Matrix4().makeBasis(across.multiplyScalar(size), along.multiplyScalar(size), face.multiplyScalar(size)).setPosition(tip);
      list.push({ stem, leaf, shade: (rand() - 0.5) * 0.1 });
    }
    return list;
  }, [height, pr, ph, leaves, seed]);

  useLayoutEffect(() => {
    const lm = leafMesh.current;
    const sm = stemMesh.current;
    if (!lm || !sm) return;
    const c = new Color();
    layout.forEach(({ stem, leaf, shade }, i) => {
      lm.setMatrixAt(i, leaf);
      lm.setColorAt(i, c.set('#3f9a55').offsetHSL(0, 0, shade));
      sm.setMatrixAt(i, stem);
    });
    lm.instanceMatrix.needsUpdate = true;
    if (lm.instanceColor) lm.instanceColor.needsUpdate = true;
    sm.instanceMatrix.needsUpdate = true;
    lm.computeBoundingSphere();
    sm.computeBoundingSphere();
  }, [layout]);

  return (
    <group position={position ? [...position] : undefined} rotation-y={yaw}>
      <mesh geometry={geo.pot} castShadow receiveShadow>
        {cheap ? <meshLambertMaterial color={potColor} side={DoubleSide} /> : <meshStandardMaterial color={potColor} roughness={0.22} metalness={0.05} side={DoubleSide} />}
      </mesh>
      <mesh position-y={ph * 0.9} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[pr * 0.9, 28]} />
        <meshLambertMaterial color="#3a2a1f" />
      </mesh>
      <instancedMesh ref={stemMesh} args={[undefined, undefined, layout.length]} castShadow>
        <cylinderGeometry args={[0.0045 * (height / 0.4), 0.006 * (height / 0.4), 1, 6]} />
        <meshLambertMaterial color="#4f8a45" />
      </instancedMesh>
      <instancedMesh ref={leafMesh} args={[geo.leaf, undefined, layout.length]} castShadow receiveShadow>
        {cheap ? <meshLambertMaterial map={leafMap} alphaTest={0.5} side={DoubleSide} /> : <meshStandardMaterial map={leafMap} alphaTest={0.5} side={DoubleSide} roughness={0.5} />}
      </instancedMesh>
    </group>
  );
}
