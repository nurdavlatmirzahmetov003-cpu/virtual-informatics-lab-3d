import type { Move, RacerState, Symptoms } from '@/labs/LiveGames/races';
import type { FaultId } from '@/labs/SystemSim/faults';

/**
 * What every hands-on 3D game view gets (0.37): the racer's state (the
 * arena replays it locally, a live room gets it from the server) and the
 * way to make a move. The view never judges a move itself.
 */
export interface HandsOnView {
  seed: number;
  state: RacerState;
  faults: readonly FaultId[];
  move: (m: Move) => void;
  /** Fault race in a live room: the server shows the symptoms and keeps the causes (`faults` is empty then). */
  symptoms?: Symptoms | null;
  rounds?: number;
}
