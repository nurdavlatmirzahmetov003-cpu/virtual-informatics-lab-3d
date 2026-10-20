/**
 * Bit's guided walks (texts in content/<lang>.ts): the site tour — one stop
 * per main section — and step-by-step lessons for the labs and the main
 * sections. Pure data.
 */
import type { LabZoneId } from '@/data/lab/zones';
import type { AnatomyCategory, AnatomyId } from '@/data/hardware/anatomy';
import type { SectionId } from './sections';

export const TOUR_STOPS = ['home', 'lab', 'explorer', 'labs', 'studio', 'tasks', 'progress', 'live'] as const satisfies readonly SectionId[];
export type TourStop = (typeof TOUR_STOPS)[number];

/** Sections with a lesson; each lesson opens its section and talks the student through it (0.37: the 3D lab, games, live games, tasks and results too). */
export const LESSON_IDS = ['network', 'logic', 'algorithms', 'assembly', 'connect', 'sim', 'experiments', 'explorer', 'studio', 'lab', 'games', 'live', 'tasks', 'progress'] as const satisfies readonly SectionId[];
export type LessonId = (typeof LESSON_IDS)[number];

/** Steps per lesson (content/<lang>.ts must have exactly this many — checked by the tests). */
export const LESSON_STEPS = 4;

/**
 * What Bit points at in 3D during a lesson step (0.37): a lab zone the
 * camera flies to, a lab device it flies to and lights up (its panel opens),
 * or a part of the Computer Anatomy scene.
 */
export type LessonPoint = { zone: LabZoneId } | { device: string } | { anatomy: AnatomyId | null; category: AnatomyCategory };

/** Per lesson, per step: the object the step talks about (null: nothing to show). */
export const LESSON_POINTS: Partial<Record<LessonId, readonly (LessonPoint | null)[]>> = {
  lab: [{ zone: 'workstation' }, { device: 'cpu' }, { device: 'router' }, { zone: 'showcase' }],
  explorer: [{ anatomy: null, category: 'external' }, { anatomy: 'monitor', category: 'external' }, { anatomy: 'cpu', category: 'internal' }, null],
};

export const lessonPoint = (lesson: LessonId, step: number): LessonPoint | null => LESSON_POINTS[lesson]?.[step] ?? null;
