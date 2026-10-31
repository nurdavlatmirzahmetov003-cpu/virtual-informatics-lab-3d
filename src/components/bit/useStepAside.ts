/**
 * V4 §11: Bit's button never sits on a control. It looks at the visible
 * buttons, links and fields in its own column and, when one is under it,
 * glides to the nearest free height (up or down) on the same side. Text in
 * a panel that floats over the page (a bottom sheet) is avoided too when a
 * free spot is near. The dock the student chose stays saved; the step aside
 * is only an offset, measured
 * again when the window, the page or its scroll changes, and once a second
 * for panels that open by themselves.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

const TEXT = 'p, h1, h2, h3, h4, li, label, dd, dt';
/** How far Bit may glide to keep off a floating panel's text: half the screen (a phone's bottom sheet is about that tall). */
const softReach = () => Math.max(320, innerHeight * 0.5);
const CONTROLS = 'button, a[href], [role="button"], [role="tab"], [role="switch"], input:not([type="hidden"]), select, textarea, summary';
/** Air between Bit and a control. */
const GAP = 8;

/** In a box laid over the page (fixed, sticky or absolute: a sheet over a 3D scene), not text the page scrolls past. */
function floating(el: Element) {
  for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) if (/^(fixed|sticky|absolute)$/.test(getComputedStyle(e).position)) return true;
  return false;
}

/** Elements that can be under Bit and matter: not Bit itself, not the top bar, not labels pinned in a 3D scene. */
function obstacles(band: { left: number; right: number }, self: Element, selector = CONTROLS, onlyFloating = false): DOMRect[] {
  const hosts = [...document.querySelectorAll('canvas')].map((c) => c.parentElement);
  const out: DOMRect[] = [];
  for (const el of document.querySelectorAll(selector)) {
    if (self.contains(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.right < band.left || r.left > band.right || r.bottom < 0 || r.top > innerHeight) continue;
    if (el.closest('[data-chrome="topbar"], [data-chrome="bit"], [hidden], [inert], [data-bit-ignore]') || hosts.some((h) => h?.contains(el))) continue;
    const visible = (el as HTMLElement).checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? (el as HTMLElement).offsetParent !== null;
    if (visible && (!onlyFloating || floating(el))) out.push(r);
  }
  return out;
}

/**
 * The free height nearest to `top` for a box of `height` in `band`, between
 * `min` and `max` (exported for tests).
 */
export function freeTop(top: number, height: number, blocks: readonly Pick<DOMRect, 'top' | 'bottom'>[], min: number, max: number, soft: readonly Pick<DOMRect, 'top' | 'bottom'>[] = []): number {
  const clear = (list: readonly Pick<DOMRect, 'top' | 'bottom'>[]) => (y: number) => list.every((b) => b.bottom + GAP <= y || b.top - GAP >= y + height);
  const free = clear(blocks);
  const quiet = clear(soft);
  const clamp = (y: number) => Math.min(max, Math.max(min, y));
  const tries = [top, ...[...blocks, ...soft].flatMap((b) => [b.top - GAP - height, b.bottom + GAP])].map(clamp);
  tries.sort((a, b) => Math.abs(a - top) - Math.abs(b - top));
  return tries.find((y) => free(y) && quiet(y) && Math.abs(y - top) <= softReach()) ?? tries.find(free) ?? top;
}

/** The offset (px, down is positive) that moves Bit's button off any control; 0 while dragging. */
export function useStepAside(button: RefObject<HTMLElement | null>, active: boolean, homeTop: number, minTop: () => number): number {
  const [offset, setOffset] = useState(0);
  const current = useRef(0);
  // where Bit would be without stepping aside (the dock), read by the timer
  const home = useRef(homeTop);
  useEffect(() => {
    home.current = homeTop;
  }, [homeTop]);

  useEffect(() => {
    if (!active) {
      current.current = 0;
      return;
    }
    let timer = 0;
    let first = true;
    const measure = () => {
      const el = button.current;
      if (!el || document.hidden) return;
      // only the column matters: the glide is vertical, so the live rect's sides are right even mid-glide
      const r = el.getBoundingClientRect();
      const band = { left: r.left - GAP, right: r.right + GAP };
      const self = el.closest('[data-chrome="bit"]') ?? el;
      const next = Math.round(freeTop(home.current, r.height, obstacles(band, self), minTop() + 12, innerHeight - r.height - 16, obstacles(band, self, TEXT, true)) - home.current);
      if (first || Math.abs(next - current.current) > 1) {
        first = false;
        current.current = next;
        setOffset(next);
      }
    };
    const soon = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 180);
    };
    const now = window.setTimeout(measure);
    const every = window.setInterval(measure, 1000);
    window.addEventListener('resize', soon);
    // any scroller: the page or a panel's list
    window.addEventListener('scroll', soon, { capture: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(now);
      window.clearInterval(every);
      window.removeEventListener('resize', soon);
      window.removeEventListener('scroll', soon, { capture: true });
    };
  }, [active, button, minTop]);

  return active ? offset : 0;
}
