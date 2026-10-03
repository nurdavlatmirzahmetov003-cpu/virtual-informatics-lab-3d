import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Color, type Group, type Material, type Mesh, type MeshStandardMaterial } from 'three';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { activePart, usePcStore } from '@/store/pcStore';
import { useStoryStore } from '@/store/storyStore';
import { CHAPTER_INDEX } from '../chapters';
import { PART_INDEX, type PartDef } from './parts';
import { pcRig } from './pcRig';
import styles from './Hotspot.module.css';

const HIGHLIGHT = new Color('#38d6f5');
const tint = new Color();
const DIM = 0.72; // how much non-active parts darken

interface MatRecord {
  mat: MeshStandardMaterial;
  color: Color;
  emissive: Color;
  env: number;
}

/**
 * Wraps one PC component: drives its exploded position, highlights it when
 * active (others dim), and makes it clickable with a numbered hotspot.
 */
export function PCPart({ def, children }: { def: PartDef; children: ReactNode }) {
  const t = useT();
  const group = useRef<Group>(null);
  const records = useRef<MatRecord[]>([]);
  const fx = useRef({ hi: 0, dim: 0 });
  const mode = usePcStore((s) => s.mode);
  const chapter = useStoryStore((s) => s.chapter);
  const enterExplore = usePcStore((s) => s.enterExplore);
  const selectPart = usePcStore((s) => s.selectPart);
  const hoverPart = usePcStore((s) => s.hoverPart);
  const selected = usePcStore((s) => s.selectedPart === def.id || (s.mode === 'story' && s.storyPart === def.id));

  // interactive only when parts are spread out (exploded chapter) or in 360° mode
  const interactive = mode === 'explore' || chapter === CHAPTER_INDEX.exploded;

  // Capture each material's original look once the children have mounted.
  useEffect(() => {
    const list: MatRecord[] = [];
    const seen = new Set<Material>();
    group.current?.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const sm = m as MeshStandardMaterial;
        if (seen.has(m) || m.userData.shared || !sm.color || !sm.emissive) continue;
        seen.add(m);
        list.push({ mat: sm, color: sm.color.clone(), emissive: sm.emissive.clone(), env: sm.envMapIntensity ?? 1 });
      }
    });
    records.current = list;
    return () => {
      // restore so a remount starts clean
      for (const r of list) {
        r.mat.color.copy(r.color);
        r.mat.emissive.copy(r.emissive);
        r.mat.envMapIntensity = r.env;
      }
    };
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const e = pcRig.explode;
    g.position.set(def.anchor[0] + def.explode[0] * e, def.anchor[1] + def.explode[1] * e, def.anchor[2] + def.explode[2] * e);
    if (def.magnify) g.scale.setScalar(1 + (def.magnify - 1) * e);

    const active = activePart();
    const goalHi = active === def.id ? 1 : 0;
    const goalDim = active && active !== def.id ? 1 : 0;
    const s = fx.current;
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 8);
    const hi = s.hi + (goalHi - s.hi) * k;
    const dim = s.dim + (goalDim - s.dim) * k;
    if (Math.abs(hi - s.hi) < 1e-4 && Math.abs(dim - s.dim) < 1e-4) return; // settled: skip material writes
    s.hi = hi;
    s.dim = dim;
    const shade = 1 - DIM * dim;
    for (const r of records.current) {
      r.mat.color.copy(r.color).multiplyScalar(shade);
      r.mat.envMapIntensity = r.env * shade;
      r.mat.emissive.copy(r.emissive).multiplyScalar(shade).add(tint.copy(HIGHLIGHT).multiplyScalar(0.09 * hi));
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (mode === 'explore') selectPart(def.id);
    else enterExplore(def.id);
  };

  const name = t(`pc.parts.${def.id}.name` as TranslationKey);

  return (
    <group
      ref={group}
      onClick={interactive ? onClick : undefined}
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              hoverPart(def.id);
              document.body.style.cursor = 'pointer';
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              hoverPart(null);
              document.body.style.cursor = '';
            }
          : undefined
      }
    >
      {children}
      {interactive && (
        <Html position={[...def.center]} center zIndexRange={[5, 0]} className={styles.anchor}>
          <button
            type="button"
            className={styles.hotspot}
            data-active={selected}
            aria-label={name}
            onClick={() => (mode === 'explore' ? selectPart(def.id) : enterExplore(def.id))}
            onPointerEnter={() => hoverPart(def.id)}
            onPointerLeave={() => hoverPart(null)}
          >
            <span className={styles.index}>{PART_INDEX[def.id] + 1}</span>
            <span className={styles.label}>{name}</span>
          </button>
        </Html>
      )}
    </group>
  );
}
