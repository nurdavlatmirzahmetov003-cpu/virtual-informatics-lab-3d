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
