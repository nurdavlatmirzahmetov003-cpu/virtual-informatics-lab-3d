/**
 * Dates as dd.mm(.yyyy) [hh:mm] in every language. Browsers have no Kazakh
 * month names and print kk-KZ dates month-first ("10-05"), which reads wrong.
 */
const p = (n: number) => String(n).padStart(2, '0');

export function formatDay(ts: number, year = true) {
  const d = new Date(ts);
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}${year ? `.${d.getFullYear()}` : ''}`;
}

export function formatDateTime(ts: number) {
  const d = new Date(ts);
  return `${formatDay(ts, false)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const KK_MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];

/**
 * A formal date with the month in words (certificates): "2026 жылғы 18 қазан",
 * "18 октября 2026 г.", "18 October 2026". Kazakh is written by hand (no browser data).
 */
export function formatLongDate(ts: number, language: 'kk' | 'ru' | 'en') {
  const d = new Date(ts);
  if (language === 'kk') return `${d.getFullYear()} жылғы ${d.getDate()} ${KK_MONTHS[d.getMonth()]}`;
  return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
