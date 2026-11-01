/**
 * V4 §4.2/4.3: how the roster's robots move — the same poses in the 360°
 * viewer and in the yard. Each pose writes the robot's own parts (the root
 * group's offset, the moving arm and head); the yard places the robot with
 * an outer group, so poses never fight the walking.
 *
 *   idle   a gentle bob (hovering kinds float), a look round
 *   walk   a quicker bob, the arm swings
 *   work   each robot's own job: vacuuming sweep, pointing, screwing, tapping
 *          the board, writing on the checklist, reading, blowing the whistle…
 *   wave   (level 2) the arm up, waving; a little hop for robots without one
 *   dance  (level 4) a turn and a bounce
 *   sleep  charging: settled, head down, eyes dimmed and breathing slowly
 *   wake   a stretch
 */
import type { Agent } from '@/lib/robots/life';
import type { RobotKind } from './robotKit';
import type { RobotParts } from './Robot';

export type RobotPose = 'idle' | 'walk' | 'work' | 'wave' | 'dance' | 'sleep' | 'wake';

const HOVER: ReadonlySet<RobotKind> = new Set(['advisor', 'teacher', 'librarian']);

function reset(p: RobotParts) {
  p.root.position.set(0, 0, 0);
  p.root.rotation.set(0, 0, 0);
  p.arm?.rotation.set(0, 0, 0);
  p.head?.rotation.set(0, 0, 0);
}

function eyes(p: RobotParts, level: number) {
  for (const m of p.glow) m.color.copy(p.glowColor).multiplyScalar(level);
}

/** Writes the pose at time `t` (s). `phase` staggers robots so they do not move in step. */
export function poseRobot(kind: RobotKind, p: RobotParts, pose: RobotPose, t: number, phase = 0) {
  reset(p);
  const tt = t + phase;
  const hover = HOVER.has(kind);
  eyes(p, 1);
  switch (pose) {
    case 'idle':
      p.root.position.y = hover ? 0.02 + Math.sin(tt * 2) * 0.018 : Math.abs(Math.sin(tt * 1.6)) * 0.006;
      if (p.head) p.head.rotation.y = Math.sin(tt * 0.6) * 0.25;
      if (p.arm) p.arm.rotation.x = Math.sin(tt * 1.3) * 0.08;
      if (!p.head) p.root.rotation.y = Math.sin(tt * 0.5) * 0.06;
      break;
    case 'walk':
      p.root.position.y = hover ? 0.03 + Math.sin(tt * 5) * 0.01 : Math.abs(Math.sin(tt * 8)) * 0.018;
      p.root.rotation.z = kind === 'cleaner' || kind === 'courier' ? 0 : Math.sin(tt * 8) * 0.025;
      if (p.arm) p.arm.rotation.x = Math.sin(tt * 8) * 0.45;
      break;
    case 'work':
      work(kind, p, tt);
      break;
    case 'wave':
      if (p.arm) {
        p.arm.rotation.z = 2.5 + Math.sin(tt * 9) * 0.35;
        if (p.head) p.head.rotation.z = Math.sin(tt * 4.5) * 0.08;
      } else {
        p.root.position.y = Math.abs(Math.sin(tt * 6)) * 0.06;
        p.root.rotation.y = Math.sin(tt * 6) * 0.35;
      }
      break;
    case 'dance':
      p.root.rotation.y = Math.sin(tt * 2.6) * 0.7;
      p.root.position.y = Math.abs(Math.sin(tt * 5.2)) * 0.05;
      p.root.rotation.z = Math.sin(tt * 5.2) * 0.06;
      if (p.arm) p.arm.rotation.z = 1.4 + Math.sin(tt * 5.2) * 0.9;
      if (p.head) p.head.rotation.z = Math.sin(tt * 2.6) * 0.15;
      break;
    case 'sleep':
      // eyes dimmed, breathing slowly
      eyes(p, 0.25 + 0.12 * (0.5 + 0.5 * Math.sin(tt * 1.2)));
      if (p.head) p.head.rotation.x = 0.32;
      else p.root.rotation.x = kind === 'cleaner' ? 0 : 0.06;
      if (p.arm) p.arm.rotation.x = 0.05;
      p.root.position.y = hover ? 0.005 : 0;
      break;
    case 'wake': {
      // a stretch: up on its toes, the arm high, eyes brightening
      const k = 0.5 + 0.5 * Math.sin(tt * 3);
      eyes(p, 0.6 + 0.4 * k);
      p.root.position.y = 0.02 * k;
      if (p.arm) p.arm.rotation.z = 2.2 * k;
      if (p.head) p.head.rotation.x = -0.15 * k;
      break;
    }
  }
}

function work(kind: RobotKind, p: RobotParts, t: number) {
  switch (kind) {
    case 'cleaner':
      // a vacuuming sweep from side to side
      p.root.rotation.y = Math.sin(t * 2.2) * 0.5;
      p.root.position.y = Math.abs(Math.sin(t * 9)) * 0.003;
      break;
    case 'courier':
      // loading: a lean back and forth over the forks
      p.root.rotation.x = Math.sin(t * 1.8) * 0.05;
      p.root.position.y = Math.abs(Math.sin(t * 3.6)) * 0.008;
      break;
    case 'presenter':
      if (p.arm) p.arm.rotation.set(-1.25 + Math.sin(t * 1.4) * 0.12, 0, 0.25);
      if (p.head) p.head.rotation.y = Math.sin(t * 0.9) * 0.3;
      break;
    case 'builder':
      // driving a screw: the arm forward, the wrist turning
      if (p.arm) p.arm.rotation.set(-1.2, Math.sin(t * 12) * 0.25, 0);
      p.root.rotation.x = 0.06;
      break;
    case 'teacher':
      if (p.arm) p.arm.rotation.set(-0.7 + Math.sin(t * 3) * 0.25, 0, 0.3);
      p.root.position.y = 0.02 + Math.sin(t * 2) * 0.01;
      break;
    case 'advisor':
      // showing the map on its tablet, turning to the visitors
      p.root.rotation.y = Math.sin(t * 0.9) * 0.45;
      p.root.position.y = 0.02 + Math.sin(t * 2) * 0.015;
      break;
    case 'guard':
      // a slow scan of the room, now and then a salute
      p.root.rotation.y = Math.sin(t * 0.7) * 0.5;
      if (p.arm) p.arm.rotation.set(Math.sin(t * 0.35) > 0.6 ? -2.3 : -0.2, 0, Math.sin(t * 0.35) > 0.6 ? 0.5 : 0);
      break;
    case 'inspector':
      // ticking the checklist
      if (p.arm) p.arm.rotation.set(-1.0 + Math.sin(t * 7) * 0.08, 0, -0.3 + Math.sin(t * 3.5) * 0.1);
      p.root.rotation.x = 0.05;
      break;
    case 'librarian':
      // reading the book in its hand
      if (p.arm) p.arm.rotation.set(-1.25 + Math.sin(t * 1.1) * 0.1, 0, -0.35);
      p.root.position.y = 0.02 + Math.sin(t * 1.6) * 0.012;
      break;
    case 'coach': {
      // the whistle: arm to the mouth every few seconds, a little jump
      const blow = Math.sin(t * 1.3) > 0.7;
      if (p.arm) p.arm.rotation.set(blow ? -2.0 : Math.sin(t * 4) * 0.3, 0, blow ? 0.55 : 0);
      p.root.position.y = blow ? Math.abs(Math.sin(t * 10)) * 0.02 : 0;
      break;
    }
    case 'bit':
      if (p.arm) p.arm.rotation.z = 2.4 + Math.sin(t * 8) * 0.3;
      break;
  }
}

/** What a robot in the yard looks like doing what its state says. */
export function poseOf(a: Pick<Agent, 'state' | 'moving'>): RobotPose {
  if (a.moving) return 'walk';
  switch (a.state) {
    case 'work':
      return 'work';
    case 'charging':
      return 'sleep';
    case 'waking':
      return 'wake';
    default:
      return 'idle';
  }
}
