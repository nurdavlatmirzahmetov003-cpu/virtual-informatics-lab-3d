/** Feedback, contact and certificates (0.36) — browser side of server/feedback.ts. */
import { call } from '@/services/auth/api';
import { useAuthStore } from '@/store/authStore';

export interface RatingSummary {
  count: number;
  average: number | null;
  /** Votes for 1…5 stars. */
  stars: number[];
}

export type ContactTopic = 'question' | 'bug' | 'idea' | 'account' | 'other';
export const CONTACT_TOPICS: readonly ContactTopic[] = ['question', 'bug', 'idea', 'account', 'other'];

export type CertificateKind = 'certificate' | 'commendation';

export interface Certificate {
  code: string;
  kind: CertificateKind;
  name: string;
  average: number;
  completed: number;
  total: number;
  issuedAt: number;
}

export interface Eligibility {
  kind: CertificateKind | null;
  completed: number;
  total: number;
  average: number;
}

const csrf = () => useAuthStore.getState().csrf ?? undefined;

export const feedbackApi = {
  summary: () => call<RatingSummary>('/api/feedback/summary'),
  rate: (input: { rating: number; liked: string; improve: string; name: string; page: string; lang: string; website: string }) =>
    call<{ ok: true; summary?: RatingSummary }>('/api/feedback', { method: 'POST', body: input, csrf: csrf() }),
  contact: (input: { name: string; contact: string; topic: ContactTopic; body: string; website: string }) => call<{ ok: true }>('/api/contact', { method: 'POST', body: input, csrf: csrf() }),
  // administrator
  list: () =>
    call<{
      summary: RatingSummary;
      items: Array<{ id: string; name: string; login: string | null; rating: number; liked: string; improve: string; page: string; lang: string; createdAt: number }>;
    }>('/api/admin/feedback'),
  remove: (id: string) => call<{ ok: true }>(`/api/admin/feedback/${encodeURIComponent(id)}`, { method: 'DELETE', csrf: csrf() }),
  inbox: () =>
    call<{ messages: Array<{ id: string; name: string; contact: string; topic: ContactTopic; body: string; status: 'new' | 'read' | 'done'; createdAt: number; login: string | null; role: string | null }> }>(
      '/api/admin/inbox',
    ),
  mark: (id: string, status: 'new' | 'read' | 'done') => call<{ ok: true }>(`/api/admin/inbox/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status }, csrf: csrf() }),
};

export const certificateApi = {
  mine: () => call<{ certificates: Certificate[]; progress: Eligibility | null }>('/api/certificates/mine'),
  issue: () => call<{ certificate: Certificate }>('/api/certificates', { method: 'POST', csrf: csrf() }),
  check: (code: string) => call<{ certificate: Certificate }>(`/api/certificates/${encodeURIComponent(code.trim())}`),
};
