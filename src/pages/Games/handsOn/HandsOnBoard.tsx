/**
 * The 3D view of a hands-on race (0.37), by race kind — shared by the arena
 * (a run against the clock) and the live class room (a race). Each view is
 * its own chunk: a game loads only its scene.
 */
import { lazy, Suspense } from 'react';
import type { RaceKind } from '@/labs/LiveGames/races';
import type { HandsOnView } from './types';
import styles from './HandsOn.module.css';

const BuildGame = lazy(() => import('./BuildGame'));
const PcBuildGame = lazy(() => import('./PcBuildGame'));
const PlugGame = lazy(() => import('./PlugGame'));
const NetworkGame = lazy(() => import('./NetworkGame'));
const FaultGame = lazy(() => import('./FaultGame'));

export function HandsOnBoard({ kind, ...view }: HandsOnView & { kind: RaceKind }) {
  return (
    <Suspense fallback={<span className={styles.loading} />}>
      {kind === 'phone' || kind === 'laptop' ? (
        <BuildGame kind={kind} {...view} />
      ) : kind === 'assembly' ? (
        <PcBuildGame {...view} />
      ) : kind === 'connect' ? (
        <PlugGame {...view} />
      ) : kind === 'network' ? (
        <NetworkGame {...view} />
      ) : (
        <FaultGame {...view} />
      )}
    </Suspense>
  );
}
