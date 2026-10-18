/**
 * Bit's guided walks (texts in content/<lang>.ts): the site tour — one stop
 * per main section — and step-by-step lessons for the labs. Pure data.
 */
import type { SectionId } from './sections';

export const TOUR_STOPS = ['home', 'lab', 'explorer', 'labs', 'studio', 'tasks', 'progress', 'live'] as const satisfies readonly SectionId[];
export type TourStop = (typeof TOUR_STOPS)[number];

/** Sections with a lesson; each lesson opens its section and talks the student through it. */
export const LESSON_IDS = ['network', 'logic', 'algorithms', 'assembly', 'connect', 'sim', 'experiments', 'explorer', 'studio'] as const satisfies readonly SectionId[];
export type LessonId = (typeof LESSON_IDS)[number];

/** Steps per lesson (content/<lang>.ts must have exactly this many — checked by the tests). */
export const LESSON_STEPS = 4;
