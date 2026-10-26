/**
 * Monstera in a glazed ceramic pot (V4 §2.3): procedural and cheap — every
 * leaf is one instance of a split, cupped leaf shape and every stalk one
 * instance of a thin stem, so a plant costs four draw calls (pot, soil,
 * stalks, leaves) whatever its size. Built standing on y = 0, front +Z.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, DoubleSide, LatheGeometry, Matrix4, Quaternion, Shape, ShapeGeometry, Vector2, Vector3, type BufferGeometry, type InstancedMesh } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useQualityPreset } from '@/hooks/useQualityPreset';

/** A monstera leaf 1 unit long from its stalk (origin) to its tip (+Y), with the splits and holes it is known for. */
function leafGeometry(): BufferGeometry {
  const outline = new Shape();
  const N = 28;
  for (let i = 0; i <= N; i++) {
    // a heart: wide in the middle, a notch where the stalk joins, a soft tip
    const t = (i / N) * Math.PI * 2;
    const x = 0.5 * Math.sin(t) * (1 - 0.12 * Math.cos(2 * t));
    const y = 0.5 - 0.5 * Math.cos(t) + 0.06 * Math.cos(t) ** 2 - (Math.abs(Math.sin(t)) < 0.25 ? 0.06 * (1 - Math.abs(Math.sin(t)) / 0.25) : 0);
    if (i === 0) outline.moveTo(x, y);
    else outline.lineTo(x, y);
  }
  // fenestrations: long slots fanning out from the midrib on both sides
  for (const side of [-1, 1]) {
    for (const [cy, len, w] of [[0.3, 0.2, 0.035], [0.5, 0.22, 0.04], [0.68, 0.17, 0.035]] as const) {
      const hole = new Shape();
      const steps = 10;
      const angle = side * (0.5 + cy * 0.4);
      const dir = new Vector2(Math.sin(angle), Math.cos(angle));
      const n = new Vector2(-dir.y, dir.x);
      const c = new Vector2(side * (0.13 + len / 2), cy);
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const p = c.clone().addScaledVector(dir.clone().set(side, 0.25 * side).normalize(), (Math.cos(a) * len) / 2).addScaledVector(n, Math.sin(a) * w * 0.5);
        if (i === 0) hole.moveTo(p.x, p.y);
        else hole.lineTo(p.x, p.y);
      }
      outline.holes.push(hole);
    }
  }
  const g = new ShapeGeometry(outline, 2);
  // cupped across, arching along: a living leaf, not a flat card
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, 0.22 * x * x - 0.18 * y * y + 0.1 * y);
  }
  g.computeVertexNormals();
  return g;
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
      lm.setColorAt(i, c.set('#2f7a43').offsetHSL(0, 0, shade));
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
        {cheap ? <meshLambertMaterial side={DoubleSide} /> : <meshStandardMaterial side={DoubleSide} roughness={0.5} />}
      </instancedMesh>
    </group>
  );
}
