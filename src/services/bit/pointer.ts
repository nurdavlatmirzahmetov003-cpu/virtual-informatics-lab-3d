/**
 * Bit points at things in 3D (0.37): during a lesson the camera flies to
 * the object Bit is talking about and it lights up — a lab zone, a lab
 * device (its pad glows and its panel opens) or a part in Computer Anatomy.
 * The page may still be opening (the lesson navigates first), so the point
 * is applied once now and once more after the page has mounted.
 */
import { useAnatomyStore } from '@/store/anatomyStore';
import { useLabStore } from '@/store/labStore';
import type { LessonPoint } from './lessons';

function apply(p: LessonPoint) {
  if ('zone' in p) return useLabStore.getState().focusZone(p.zone);
  if ('device' in p) return useLabStore.getState().openDevice(p.device);
  const a = useAnatomyStore.getState();
  a.setCategory(p.category);
  a.select(p.anatomy);
}

let pending: number | undefined;

export function pointAt(p: LessonPoint | null) {
  if (typeof window !== 'undefined' && pending !== undefined) window.clearTimeout(pending);
  if (!p) return;
  apply(p);
  // a page that opened with the lesson resets its scene state on mount: point again once it is up
  if (typeof window !== 'undefined') pending = window.setTimeout(() => apply(p), 900);
}
