import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useStoryStore } from '@/store/storyStore';
import { CHAPTERS, STORY_TIMING } from './chapters';
import { cameraValues, storyRig } from './storyRig';

gsap.registerPlugin(ScrollTrigger);

function chapterValues(i: number) {
  const c = CHAPTERS[i];
  return { ...cameraValues(c.camera), fx: c.focus[0], fy: c.focus[1], fz: c.focus[2], bokeh: c.bokeh };
}

const NEUTRAL_OBJECTS = { monitorYaw: 0, keyboardLift: 0, keyboardTilt: 0, mouseSpin: 0, mouseLift: 0, pcGlow: 0 };

interface StoryTimelineOptions {
  /** Receives 0…1 on every timeline update (drive a progress bar without re-rendering). */
  onProgress?: (progress: number) => void;
}

/**
 * Builds the ONE scroll-scrubbed GSAP timeline for the home story. It writes
 * camera, focus and object choreography into `storyRig`; the 3D scene reads
 * it each frame. Chapter changes are published to `useStoryStore`.
 */
export function useStoryTimeline(container: RefObject<HTMLElement | null>, { onProgress }: StoryTimelineOptions = {}) {
  const reducedMotion = useReducedMotion();
  const setChapter = useStoryStore((s) => s.setChapter);
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
      Object.assign(storyRig, chapterValues(0), NEUTRAL_OBJECTS, { progress: 0 });
      const { firstHold, transition, hold } = STORY_TIMING;

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
      tl.to({}, { duration: firstHold });

      for (let i = 1; i < CHAPTERS.length; i++) {
        const start = tl.duration();
        boundaries.push(start + transition * 0.5);
        tl.to(storyRig, { ...chapterValues(i) }, start);

        // object choreography synced to the same timeline
        const id = CHAPTERS[i].id;
        const prev = CHAPTERS[i - 1].id;
        if (id === 'monitor') tl.to(storyRig, { monitorYaw: -0.16 }, start);
        if (prev === 'monitor') tl.to(storyRig, { monitorYaw: 0 }, start);
        if (id === 'keyboard') tl.to(storyRig, { keyboardLift: 0.022, keyboardTilt: -0.06 }, start);
        if (prev === 'keyboard') tl.to(storyRig, { keyboardLift: 0, keyboardTilt: 0 }, start);
        if (id === 'mouse') tl.to(storyRig, { mouseLift: 0.014 }, start);
        if (prev === 'mouse') tl.to(storyRig, { mouseLift: 0 }, start);
        if (id === 'pc') tl.to(storyRig, { pcGlow: 1 }, start);

        const holdStart = start + transition;
        // 360° macro turn of the mouse while its chapter is held
        if (id === 'mouse') tl.to(storyRig, { mouseSpin: Math.PI * 2, duration: hold, ease: 'none' }, holdStart);
        else tl.to({}, { duration: hold }, holdStart);
        anchorTimes.push(holdStart + hold * 0.5);
      }

      tl.eventCallback('onUpdate', () => {
        const t = tl.time();
        let chapter = 0;
        while (chapter < boundaries.length && t >= boundaries[chapter]) chapter++;
        setChapter(chapter);
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
    };
  }, [container, reducedMotion, setChapter]);

  /** Scrolls the page so the timeline lands on chapter `i`. */
  const scrollToChapter = useCallback(
    (i: number) => {
      const tl = timeline.current;
      const st = tl?.scrollTrigger;
      if (!tl || !st) return;
      const time = anchors.current[Math.max(0, Math.min(i, anchors.current.length - 1))];
      const top = st.start + (time / tl.duration()) * (st.end - st.start);
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion],
  );

  return { scrollToChapter };
}
