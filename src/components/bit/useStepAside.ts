/**
 * V4 §11: Bit's button never sits on a control. It looks at the visible
 * buttons, links and fields in its own column and, when one is under it,
 * glides to the nearest free height (up or down) on the same side; when the
 * whole column is taken (a full-height panel of buttons), it slides along its
 * row towards the middle to the first gap. Text in
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

/**
 * The panel under a point: the topmost box painted on its own that
 * is narrower than most of the screen and tall (a side panel of controls).
 */
function panelAt(x: number, y: number, self: Element): DOMRect | null {
  for (const e of document.elementsFromPoint(x, y)) {
    if (self.contains(e) || e === document.body || e === document.documentElement) continue;
    // a colour (rgb(…) opaque, rgba(…, a) its alpha), a gradient or a frosted glass
    const st = getComputedStyle(e);
    const bg = st.backgroundColor;
    const alpha = bg.startsWith('rgba') ? Number(bg.slice(bg.lastIndexOf(',') + 1, -1)) : bg.startsWith('rgb') ? 1 : 0;
    const painted = alpha >= 0.5 || st.backgroundImage !== 'none' || (st.backdropFilter && st.backdropFilter !== 'none');
    const b = e.getBoundingClientRect();
    if (painted && b.width < innerWidth * 0.6 && b.height > 150) return b;
  }
  return null;
}

/** Elements that can be under Bit and matter: not Bit itself, not the top bar, not labels pinned in a 3D scene. */
interface Area {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function obstacles(area: Area, self: Element, selector = CONTROLS, onlyFloating = false): DOMRect[] {
  // R3F's two wrappers around the canvas; drei's labels (pinned in the scene, moving with the camera) live in the outer one
  const hosts = [...document.querySelectorAll('canvas')].map((c) => c.parentElement?.parentElement ?? c.parentElement);
  const out: DOMRect[] = [];
  for (const el of document.querySelectorAll(selector)) {
    if (self.contains(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.right < area.left || r.left > area.right || r.bottom < area.top || r.top > area.bottom) continue;
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
export function freeTop(top: number, height: number, blocks: readonly Pick<DOMRect, 'top' | 'bottom'>[], min: number, max: number, soft: readonly Pick<DOMRect, 'top' | 'bottom'>[] = []): number | null {
  const clear = (list: readonly Pick<DOMRect, 'top' | 'bottom'>[]) => (y: number) => list.every((b) => b.bottom + GAP <= y || b.top - GAP >= y + height);
  const free = clear(blocks);
  const quiet = clear(soft);
  const clamp = (y: number) => Math.min(max, Math.max(min, y));
  const tries = [top, ...[...blocks, ...soft].flatMap((b) => [b.top - GAP - height, b.bottom + GAP])].map(clamp);
  tries.sort((a, b) => Math.abs(a - top) - Math.abs(b - top));
  return tries.find((y) => free(y) && quiet(y) && Math.abs(y - top) <= softReach()) ?? tries.find(free) ?? null;
}

/**
 * The first free left edge for a box of `width`, sliding from `left` in
 * `dir` (+1 right, -1 left) past the `blocks` of its row; null past `limit`
 * (exported for tests).
 */
export function freeLeft(left: number, width: number, blocks: readonly Pick<DOMRect, 'left' | 'right'>[], dir: 1 | -1, limit: number): number | null {
  let x = left;
  for (let i = 0; i <= blocks.length; i++) {
    const hit = blocks.filter((b) => b.right + GAP > x && b.left - GAP < x + width);
    if (!hit.length) return x;
    x = dir > 0 ? Math.max(...hit.map((b) => b.right)) + GAP : Math.min(...hit.map((b) => b.left)) - GAP - width;
    if (dir > 0 ? x + width > limit : x < limit) return null;
  }
  return null;
}

export interface Aside {
  x: number;
  y: number;
}
const NONE: Aside = { x: 0, y: 0 };

/** The offset (px; down and right are positive) that moves Bit's button off any control; none while dragging. */
export function useStepAside(button: RefObject<HTMLElement | null>, active: boolean, homeTop: number, minTop: () => number): Aside {
  const [offset, setOffset] = useState<Aside>(NONE);
  const current = useRef<Aside>(NONE);
  // where Bit would be without stepping aside (the dock), read by the timer
  const home = useRef(homeTop);
  useEffect(() => {
    home.current = homeTop;
  }, [homeTop]);

  useEffect(() => {
    if (!active) {
      current.current = NONE;
      return;
    }
    let timer = 0;
    let first = true;
    const measure = () => {
      const el = button.current;
      if (!el || document.hidden) return;
      const r = el.getBoundingClientRect();
      // where the button is at home (the live rect may be mid-glide)
      const homeLeft = r.left - current.current.x;
      const top = home.current;
      const self = el.closest('[data-chrome="bit"]') ?? el;
      const column = { left: homeLeft - GAP, right: homeLeft + r.width + GAP, top: 0, bottom: innerHeight };
      const y = freeTop(top, r.height, obstacles(column, self), minTop() + 12, innerHeight - r.height - 16, obstacles(column, self, TEXT, true));
      let next: Aside = { x: 0, y: y === null ? 0 : Math.round(y - top) };
      if (y === null) {
        const dir = (self as HTMLElement).dataset.side === 'right' ? -1 : 1;
        // the whole column is taken. Sitting on a side panel of controls: the column just past its edge
        const panel = panelAt(homeLeft + r.width / 2, top + r.height / 2, self);
        const beside = panel ? (dir > 0 ? panel.right + GAP : panel.left - GAP - r.width) : null;
        const y2 = beside === null ? null : freeTop(top, r.height, obstacles({ left: beside - GAP, right: beside + r.width + GAP, top: 0, bottom: innerHeight }, self), minTop() + 12, innerHeight - r.height - 16);
        if (beside !== null && y2 !== null) next = { x: Math.round(beside - homeLeft), y: Math.round(y2 - top) };
        else {
          // else along the row, towards the middle of the screen
          const row = { left: 0, right: innerWidth, top: top - GAP, bottom: top + r.height + GAP };
          const x = freeLeft(homeLeft, r.width, obstacles(row, self), dir, innerWidth / 2);
          if (x !== null) next = { x: Math.round(x - homeLeft), y: 0 };
        }
      }
      const moved = Math.abs(next.x - current.current.x) > 1 || Math.abs(next.y - current.current.y) > 1;
      if (first || moved) {
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

  return active ? offset : NONE;
}
