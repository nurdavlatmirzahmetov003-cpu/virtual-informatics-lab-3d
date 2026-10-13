/** Shared helpers of the admin panel. */
import { useCallback } from 'react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { ApiError } from '@/services/auth/api';

const KNOWN = new Set([
  'self', 'lastAdmin', 'badRole', 'badName', 'badSchool', 'badTeacher', 'badIp', 'ownIp', 'badHours', 'badSetting', 'badKey', 'badLang', 'badText', 'placeholders',
  'badBackup', 'memoryDb', 'notFound', 'csrf', 'forbidden', 'unauthenticated', 'offline', 'loginTaken', 'badLogin', 'password_tooShort', 'password_tooSimple', 'password_tooLong', 'too-large',
]);

/** A translated message for any admin API error. */
export function useAdminError() {
  const t = useT();
  return useCallback(
    (e: unknown) => {
      const code = (e instanceof ApiError ? e.code : 'server').replace('.', '_');
      return t(`admin.errors.${KNOWN.has(code) ? code : 'server'}` as TranslationKey);
    },
    [t],
  );
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

/** 3725 → "1 h 2 min" style parts for a duration in seconds. */
export function durationParts(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return { d, h, m };
}
