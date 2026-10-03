import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Vector3 } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { usePcStore } from '@/store/pcStore';
import { useStoryStore } from '@/store/storyStore';
import { CHAPTERS, STORY_TIMING } from './chapters';
import { PARTS, partWorldCenter } from './pc/parts';
import { cameraValues, storyRig } from './storyRig';

gsap.registerPlugin(ScrollTrigger);

function chapterValues(i: number) {
  const c = CHAPTERS[i];
  return { ...cameraValues(c.camera), fx: c.focus[0], fy: c.focus[1], fz: c.focus[2], bokeh: c.bokeh };
}

const NEUTRAL = {
  monitorYaw: 0,
  keyboardLift: 0,
  keyboardTilt: 0,
  mouseSpin: 0,
  mouseLift: 0,
  pcGlow: 0,
  glassOpen: 0,
  interior: 0,
  explode: 0,
  heroBlend: 0,
};

/** How far the camera target leans toward the highlighted part in the exploded view. */
const PART_LEAN = 0.22;

interface StoryTimelineOptions {
  /** Receives 0…1 on every timeline update (drive a progress bar without re-rendering). */
  onProgress?: (progress: number) => void;
}

/**
 * Builds the ONE scroll-scrubbed GSAP timeline for the home story. It writes
 * camera, focus and object choreography into `storyRig`; the 3D scene reads
 * it each frame. Chapter / highlighted-part changes go to the stores.
 */
export function useStoryTimeline(container: RefObject<HTMLElement | null>, { onProgress }: StoryTimelineOptions = {}) {
  const reducedMotion = useReducedMotion();
  const setChapter = useStoryStore((s) => s.setChapter);
  const setStoryPart = usePcStore((s) => s.setStoryPart);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const anchors = useRef<number[]>([]);
  const progressCb = useRef(onProgress);
  useLayoutEffect(() => {
    progressCb.current = onProgress;
  }, [onProgress]);

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      Object.assign(storyRig, chapterValues(0), NEUTRAL, { progress: 0 });
      const { firstHold, transition, hold: defaultHold, partStep } = STORY_TIMING;

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: transition },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          // user stays in control: the timeline follows the wheel, smoothed
          scrub: reducedMotion ? true : 0.9,
          invalidateOnRefresh: true,
        },
      });

      const anchorTimes = [0];
      const boundaries: number[] = [];
      let partSteps: { start: number; step: number } | null = null;
      tl.to({}, { duration: firstHold });

      for (let i = 1; i < CHAPTERS.length; i++) {
        const c = CHAPTERS[i];
        const prev = CHAPTERS[i - 1].id;
        const hold = c.hold ?? defaultHold;
        const start = tl.duration();
        boundaries.push(start + transition * 0.5);
        tl.to(storyRig, { ...chapterValues(i) }, start);

        // object choreography synced to the same timeline
        if (i === 1) tl.to(storyRig, { heroBlend: 1 }, start);
        if (c.id === 'monitor') tl.to(storyRig, { monitorYaw: -0.16 }, start);
        if (prev === 'monitor') tl.to(storyRig, { monitorYaw: 0 }, start);
        if (c.id === 'keyboard') tl.to(storyRig, { keyboardLift: 0.022, keyboardTilt: -0.06 }, start);
        if (prev === 'keyboard') tl.to(storyRig, { keyboardLift: 0, keyboardTilt: 0 }, start);
        if (c.id === 'mouse') tl.to(storyRig, { mouseLift: 0.014 }, start);
        if (prev === 'mouse') tl.to(storyRig, { mouseLift: 0 }, start);
        if (c.id === 'pc') tl.to(storyRig, { pcGlow: 1 }, start);
        if (c.id === 'inside') {
          // glass pulls out and lifts away while the camera moves in; interior lights come up
          tl.to(storyRig, { glassOpen: 1, duration: transition * 0.9, ease: 'power1.inOut' }, start + transition * 0.1);
          tl.to(storyRig, { interior: 1, duration: transition * 0.8, ease: 'sine.inOut' }, start + transition * 0.25);
        }
        if (c.id === 'exploded') tl.to(storyRig, { explode: 1, ease: 'power3.inOut' }, start);

        const holdStart = start + transition;
        if (c.id === 'mouse') {
          // 360° macro turn while the chapter is held
          tl.to(storyRig, { mouseSpin: Math.PI * 2, duration: hold, ease: 'none' }, holdStart);
        } else if (c.id === 'exploded') {
          // walk the camera focus across the parts, one step each
          const base = chapterValues(i);
          const p = new Vector3();
          PARTS.forEach((part, k) => {
            partWorldCenter(part, 1, p);
            tl.to(
              storyRig,
              {
                tx: base.tx + (p.x - base.tx) * PART_LEAN,
                ty: base.ty + (p.y - base.ty) * PART_LEAN,
                tz: base.tz + (p.z - base.tz) * PART_LEAN,
                fx: p.x,
                fy: p.y,
                fz: p.z,
                bokeh: 2.4,
                duration: partStep * 0.7,
              },
              holdStart + k * partStep,
            );
          });
          tl.to({}, { duration: hold }, holdStart);
          partSteps = { start: holdStart, step: partStep };
        } else {
          tl.to({}, { duration: hold }, holdStart);
        }
        anchorTimes.push(c.id === 'exploded' ? holdStart + partStep * 0.5 : holdStart + hold * 0.5);
      }

      tl.eventCallback('onUpdate', () => {
        const t = tl.time();
        let chapter = 0;
        while (chapter < boundaries.length && t >= boundaries[chapter]) chapter++;
        setChapter(chapter);
        if (partSteps && t >= partSteps.start - 0.15) {
          const k = Math.min(PARTS.length - 1, Math.max(0, Math.floor((t - partSteps.start + 0.15) / partSteps.step)));
          setStoryPart(PARTS[k].id);
        } else {
          setStoryPart(null);
        }
        storyRig.progress = tl.progress();
        progressCb.current?.(storyRig.progress);
      });

      anchors.current = anchorTimes;
      timeline.current = tl;
    }, el);

    return () => {
      ctx.revert();
      timeline.current = null;
      setChapter(0);
      setStoryPart(null);
    };
  }, [container, reducedMotion, setChapter, setStoryPart]);

  /** Scrolls the page so the timeline lands at time `time`. */
  const scrollToTime = useCallback(
    (time: number) => {
      const tl = timeline.current;
      const st = tl?.scrollTrigger;
      if (!tl || !st) return;
      const top = st.start + (time / tl.duration()) * (st.end - st.start);
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion],
  );

  const scrollToChapter = useCallback(
    (i: number) => scrollToTime(anchors.current[Math.max(0, Math.min(i, anchors.current.length - 1))]),
    [scrollToTime],
  );

  return { scrollToChapter };
}
