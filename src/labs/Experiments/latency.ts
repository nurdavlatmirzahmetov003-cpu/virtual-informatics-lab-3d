/**
 * Round-trip time (ping). Light in optical fibre travels at about
 * 200 000 km/s (two thirds of c); real cable routes are ~30 % longer than a
 * straight line; each router adds a little; the access technology adds its
 * own delay. A geostationary satellite sits 35 786 km up, so the signal goes
 * up and down twice per round trip.
 */
import { fmt, key, makeQuizExercise, text, type Question } from './quiz';

export const LINKS = ['fiber', 'cable', 'wifi', 'mobile', 'satellite'] as const;
export type Link = (typeof LINKS)[number];

export const FIBER_KM_PER_MS = 200;
export const ROUTE_FACTOR = 1.3;
export const HOP_MS = 0.3;
const GEO_KM = 35_786;
const LIGHT_KM_PER_MS = 300;

/** Extra round-trip delay of the last mile (ms). */
export const ACCESS_MS: Record<Link, number> = {
  fiber: 1,
  cable: 8,
  wifi: 4,
  mobile: 35,
  satellite: (4 * GEO_KM) / LIGHT_KM_PER_MS + 40, // up + down, there and back, plus processing
};

export const PLACES = [
  { id: 'city', km: 10 },
  { id: 'astana', km: 970 },
  { id: 'moscow', km: 3100 },
  { id: 'frankfurt', km: 5000 },
  { id: 'newYork', km: 10_200 },
] as const;
export type PlaceId = (typeof PLACES)[number]['id'];

export interface PingBreakdown {
  propagationMs: number;
  routersMs: number;
  accessMs: number;
  rttMs: number;
  hops: number;
}

export function ping(distanceKm: number, link: Link): PingBreakdown {
  const route = distanceKm * ROUTE_FACTOR;
  const propagationMs = (2 * route) / FIBER_KM_PER_MS;
  const hops = 3 + Math.round(distanceKm / 800);
  const routersMs = 2 * hops * HOP_MS;
  const accessMs = ACCESS_MS[link];
  return { propagationMs, routersMs, accessMs, rttMs: propagationMs + routersMs + accessMs, hops };
}

export function conclusion(distanceKm: number, link: Link) {
  const p = ping(distanceKm, link);
  const params = { rtt: fmt(p.rttMs, 0), prop: fmt(p.propagationMs, 0), access: fmt(p.accessMs, 0) };
  if (link === 'satellite') return { key: 'experiments.latency.result.satellite', params };
  return { key: p.propagationMs > p.accessMs ? 'experiments.latency.result.distance' : 'experiments.latency.result.access', params };
}

export const questions = (): Question[] => {
  const astana = ping(970, 'fiber').rttMs;
  return [
    {
      id: 'q1',
      prompt: { key: 'experiments.latency.q1.prompt' },
      options: [text('≈ 1 ms'), text(`≈ ${fmt(astana, 0)} ms`), text('≈ 150 ms'), text('≈ 600 ms')],
      correct: 1,
      why: { key: 'experiments.latency.q1.why', params: { rtt: fmt(astana, 0), prop: fmt(ping(970, 'fiber').propagationMs, 0) } },
    },
    {
      id: 'q2',
      prompt: { key: 'experiments.latency.q2.prompt' },
      options: [key('experiments.latency.q2.o1'), key('experiments.latency.q2.o2'), key('experiments.latency.q2.o3')],
      correct: 1,
      why: { key: 'experiments.latency.q2.why', params: { km: GEO_KM.toLocaleString('en-US').replace(/,/g, ' '), ms: fmt(ACCESS_MS.satellite, 0) } },
    },
    {
      id: 'q3',
      prompt: { key: 'experiments.latency.q3.prompt' },
      options: [key('experiments.latency.q3.o1'), key('experiments.latency.q3.o2'), key('experiments.latency.q3.o3')],
      correct: 0,
      why: { key: 'experiments.latency.q3.why' },
    },
  ];
};

export const exercise = () => makeQuizExercise('latency', questions());
