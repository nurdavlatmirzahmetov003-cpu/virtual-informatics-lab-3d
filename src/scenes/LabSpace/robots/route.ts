import type { Vec2 } from '@/data/lab/zones';

/** Length of a route (m); `closed` adds the leg back to the start. */
export function routeLength(route: readonly Vec2[], closed: boolean) {
  let l = 0;
  const n = closed ? route.length : route.length - 1;
  for (let i = 0; i < n; i++) {
    const a = route[i];
    const b = route[(i + 1) % route.length];
    l += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return l;
}

/** Point `d` metres along the route and the heading there (yaw about Y; 0 = facing +Z). */
export function routeAt(route: readonly Vec2[], d: number, closed: boolean): { at: Vec2; heading: number } {
  const n = closed ? route.length : route.length - 1;
  let left = d;
  for (let i = 0; i < n; i++) {
    const a = route[i];
    const b = route[(i + 1) % route.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= len || i === n - 1) {
      const k = len > 0 ? Math.min(1, Math.max(0, left / len)) : 0;
      return { at: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], heading: Math.atan2(b[0] - a[0], b[1] - a[1]) };
    }
    left -= len;
  }
  return { at: route[0], heading: 0 };
}
