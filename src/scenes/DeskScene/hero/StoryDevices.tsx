import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { heroPresence } from './heroCycle';

/** How long after the hero is ready the story's devices start loading (hidden). */
const PRELOAD_MS = 2500;

/**
 * The story's own devices (the chapters describe these models). Hidden while
 * the living hero setup is on the desk; they drop in as it flies out. They
 * load a moment after the hero, so the first frame only waits for one setup.
 */
export function StoryDevices({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const id = window.setInterval(() => {
      if (heroPresence.ready || heroPresence.away > 0) setMounted(true);
    }, PRELOAD_MS);
    return () => window.clearInterval(id);
  }, [mounted]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    if (heroPresence.away > 0 && !mounted) setMounted(true);
    // second half of the hand-over: the hero setup has left by then
    const a = Math.max(0, heroPresence.away * 2 - 1);
    g.visible = a > 0.001;
    // hidden: skip the matrix updates of its few hundred nodes too
    g.matrixWorldAutoUpdate = g.visible;
    // drops in from above as the hero setup leaves
    const u = 1 - a;
    g.position.y = u * u * 0.35;
  });

  return (
    <group ref={group} visible={false}>
      {mounted && <Suspense fallback={null}>{children}</Suspense>}
    </group>
  );
}
