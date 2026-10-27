/**
 * V4 §4.1 «Біздің роботтар»: the roster, in one place. Every robot of the
 * lab — the ones already at work in the hall (cleaner, courier, builder,
 * presenter, teacher, the zone guides) and the new ones — with its look
 * (a robot-kit kind and its own colour), its topic for the tips it teaches
 * (§4.5), its size in the robots' yard and how fast it walks there.
 * Names, jobs, fun facts and skills live in the locales under
 * `robots.list.<id>.*`. Pure data: the page, the yard, the server and the
 * tests read it.
 */
import type { RobotKind } from '@/scenes/LabSpace/robots/robotKit';

export const ROBOT_IDS = ['guide', 'cleaner', 'cargo', 'presenter', 'assembler', 'teacher', 'guard', 'inspector', 'librarian', 'coach'] as const;
export type RobotId = (typeof ROBOT_IDS)[number];

/** What a robot teaches about (§4.5). */
export const TIP_TOPICS = ['cyber', 'room', 'posture', 'etiquette', 'facts'] as const;
export type TipTopic = (typeof TIP_TOPICS)[number];

export interface RobotProfile {
  id: RobotId;
  kind: RobotKind;
  /** Its own colour: shirt, garage, name plate. */
  accent: string;
  /** Eyes and lights. */
  glow: string;
  topic: TipTopic;
  /** Scale of the kit model in the yard (the kit builds robots about 1–1.6 m tall). */
  scale: number;
  /** Footprint radius in the yard at that scale (m): what the walking keeps clear. */
  radius: number;
  /** Walking speed in the yard (m/s). */
  speed: number;
  /** The robot already works in the hall too (the yard is where it lives off duty). */
  inHall: boolean;
}

export const ROSTER: readonly RobotProfile[] = [
  { id: 'guide', kind: 'advisor', accent: '#22d3ee', glow: '#38d6f5', topic: 'etiquette', scale: 0.72, radius: 0.17, speed: 0.55, inHall: true },
  { id: 'cleaner', kind: 'cleaner', accent: '#4ade80', glow: '#4ade80', topic: 'room', scale: 1, radius: 0.24, speed: 0.4, inHall: true },
  { id: 'cargo', kind: 'courier', accent: '#f5b83d', glow: '#38d6f5', topic: 'facts', scale: 0.72, radius: 0.26, speed: 0.5, inHall: true },
  { id: 'presenter', kind: 'presenter', accent: '#5f7bff', glow: '#38d6f5', topic: 'etiquette', scale: 0.7, radius: 0.17, speed: 0.5, inHall: true },
  { id: 'assembler', kind: 'builder', accent: '#fb923c', glow: '#56dbf8', topic: 'facts', scale: 0.72, radius: 0.2, speed: 0.42, inHall: true },
  { id: 'teacher', kind: 'teacher', accent: '#a95cf5', glow: '#38d6f5', topic: 'etiquette', scale: 0.72, radius: 0.17, speed: 0.5, inHall: true },
  { id: 'guard', kind: 'guard', accent: '#3b82f6', glow: '#38d6f5', topic: 'cyber', scale: 0.72, radius: 0.18, speed: 0.55, inHall: false },
  { id: 'inspector', kind: 'inspector', accent: '#f97316', glow: '#38d6f5', topic: 'room', scale: 0.72, radius: 0.18, speed: 0.5, inHall: false },
  { id: 'librarian', kind: 'librarian', accent: '#8b5cf6', glow: '#38d6f5', topic: 'facts', scale: 0.72, radius: 0.17, speed: 0.45, inHall: false },
  { id: 'coach', kind: 'coach', accent: '#ef4444', glow: '#38d6f5', topic: 'posture', scale: 0.72, radius: 0.17, speed: 0.65, inHall: false },
];

export const isRobotId = (v: unknown): v is RobotId => typeof v === 'string' && (ROBOT_IDS as readonly string[]).includes(v);
export const robotById = (id: RobotId) => ROSTER.find((r) => r.id === id)!;
