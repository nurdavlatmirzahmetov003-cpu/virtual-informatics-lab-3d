/** Hooks shared by the classroom pages. */
import { useCallback, useSyncExternalStore } from 'react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { ApiError } from '@/services/auth/api';
import { taskById } from '@/services/progress/catalog';

// ── a clock that ticks twice a minute (deadlines, "overdue") ──
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  now = Date.now();
  timer ??= setInterval(() => {
    now = Date.now();
    listeners.forEach((l) => l());
  }, 30_000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Current time, kept pure for render: it changes only on the shared tick. */
export const useNow = () => useSyncExternalStore(subscribe, () => now);

const KNOWN = new Set([
  'badName', 'badNames', 'badTitle', 'badDescription', 'badBody', 'badExercise', 'badDue', 'badPoints', 'badScore', 'badComment',
  'badCode', 'joinDisabled', 'registrationDisabled', 'rateLimited', 'notFound', 'forbidden', 'csrf', 'unauthenticated', 'loginTaken', 'offline',
]);

/** A translated message for any error from the classroom API. */
export function useErrorText() {
  const t = useT();
  return useCallback(
    (e: unknown) => {
      const code = e instanceof ApiError ? e.code : 'server';
      if (code === 'rateLimited' && e instanceof ApiError) return t('classroom.errors.rateLimited', { min: Math.max(1, Math.ceil((e.retryAfter ?? 60) / 60)) });
      return t(`classroom.errors.${KNOWN.has(code) ? code : 'server'}` as TranslationKey);
    },
    [t],
  );
}

/** The translated title of a lab task, '' for none. */
export function useExerciseTitle() {
  const t = useT();
  return useCallback(
    (id: string | null) => {
      const info = id ? taskById(id) : undefined;
      return info ? t(info.title as TranslationKey) : '';
    },
    [t],
  );
}
