import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Color, type Group } from 'three';
import { captureMaterials, restoreMaterials, type MatRecord } from '@/lib/three/materialFx';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { activePart, usePcStore } from '@/store/pcStore';
import { useStoryStore } from '@/store/storyStore';
import { CHAPTER_INDEX } from '../chapters';
import { explodeOffset, PART_INDEX, type PartDef } from './parts';
import { pcRig } from './pcRig';
import { pathOffset, type EntryPath } from './mounts';
import { playSfx } from '@/lib/audio/sfx';
import styles from '@/components/3d/Hotspot.module.css';

const HIGHLIGHT = new Color('#38d6f5');
const tint = new Color();
const DIM = 0.72; // how much non-active parts darken
/** Fallback approach when the mounting system gave none (case-local offset). */
const INSTALL_FROM: EntryPath = { entry: [-0.22, 0, 0] };
/** Extra drift while the part is still outside the case: it arrives from above and towards the viewer. */
const DRIFT_X = [-0.12, 0.07, 0.05] as const;
const DRIFT_Z = [0, 0.05, -0.14] as const;
const smooth = (x: number) => x * x * (3 - 2 * x);

/**
 * Installing offset for progress `e` (1 waiting … 0 seated): from a drifting
 * start outside the case to the entry point, then the straight approach onto
 * the anchor (mounts.ts pathOffset; the last half of the move).
 */
function installOffset(path: EntryPath, e: number, out: [number, number, number]) {
  if (e <= 0.5) return pathOffset(path, e / 0.5, out);
  pathOffset(path, 1, out);
  const t = smooth((e - 0.5) / 0.5);
  const d = path.entry[2] !== 0 && path.entry[0] === 0 ? DRIFT_Z : DRIFT_X;
  out[0] += d[0] * t;
  out[1] += d[1] * t;
  out[2] += d[2] * t;
  return out;
}

type V3 = readonly [number, number, number];
const ORIGIN: V3 = [0, 0, 0];

/**
 * Wraps one PC component: drives its exploded position, highlights it when
 * active (others dim), and makes it clickable with a numbered hotspot.
 * `at`: where the mounting system installed it (centre of its box, case-local).
 */
export function PCPart({ def, at = ORIGIN, children, enabled = true }: { def: PartDef; at?: V3; children: ReactNode; enabled?: boolean }) {
  const t = useT();
  const group = useRef<Group>(null);
  const records = useRef<MatRecord[]>([]);
  const assetVersion = useRef(-1);
  const metadata = useMemo(() => ({ pcPart: true, assetVersion: 0 }), []);
  const fx = useRef({ hi: 0, dim: 0, flash: 0, last: 1 });
  const path = useRef<[number, number, number]>([0, 0, 0]);
  const explode = useRef<[number, number, number]>([0, 0, 0]);
  const mode = usePcStore((s) => s.mode);
  const device = usePcStore((s) => s.selectedDevice);
  const chapter = useStoryStore((s) => s.chapter);
  const enterExplore = usePcStore((s) => s.enterExplore);
  const selectPart = usePcStore((s) => s.selectPart);
  const hoverPart = usePcStore((s) => s.hoverPart);
  const selected = usePcStore((s) => s.selectedPart === def.id || (s.mode === 'story' && s.storyPart === def.id));

  // interactive only when parts are spread out (exploded chapter) or in 360° mode
  const interactive = enabled && (mode === 'explore' ? !device : chapter === CHAPTER_INDEX.exploded);

  // Capture each material's original look once the children have mounted.
  useEffect(() => {
    records.current = captureMaterials(group.current);
    return () => {
      // restore so a remount starts clean
      restoreMaterials(records.current);
    };
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.visible = !pcRig.hidden.has(def.id);
    const e = pcRig.parts?.[def.id] ?? pcRig.explode;
    const installing = pcRig.parts !== null;
    // magnified around its own centre (the group origin), so the hotspot and fly-to target stay aligned
    g.scale.setScalar(installing ? 1 : 1 + ((def.magnify ?? 1) - 1) * e);
    // read each frame: the layout depends on the build on screen (pcRig.explodeAs, pcRig.entry)
    if (installing) {
      const o = installOffset(pcRig.entry[def.id] ?? INSTALL_FROM, e, path.current);
      g.position.set(at[0] + o[0], at[1] + o[1], at[2] + o[2]);
      // seated: a click and a short glow
      if (fx.current.last > 0.004 && e <= 0.004 && g.visible) {
        fx.current.flash = 1;
        playSfx('snap');
      }
      fx.current.last = e;
    } else {
      const move = (explode.current = explodeOffset(def, at));
      g.position.set(at[0] + move[0] * e, at[1] + move[1] * e, at[2] + move[2] * e);
      fx.current.last = 0;
    }
    // GLBs resolve asynchronously after this wrapper mounts.
    const newlyLoaded = records.current.length === 0 || assetVersion.current !== g.userData.assetVersion;
    if (newlyLoaded) { records.current = captureMaterials(g); assetVersion.current = g.userData.assetVersion; }

    const active = enabled ? activePart() : null;
    fx.current.flash = Math.max(0, fx.current.flash - Math.min(delta, 0.1) * 2.2);
    const goalHi = Math.max(active === def.id ? 1 : 0, fx.current.flash * 3);
    const goalDim = active && active !== def.id ? 1 : 0;
    const s = fx.current;
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 8);
    const hi = s.hi + (goalHi - s.hi) * k;
    const dim = s.dim + (goalDim - s.dim) * k;
    if (!newlyLoaded && Math.abs(hi - s.hi) < 1e-4 && Math.abs(dim - s.dim) < 1e-4) return; // settled: skip material writes
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
      userData={metadata}
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
        <Html position={[0, 0, 0]} center zIndexRange={[5, 0]} className={styles.anchor}>
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
