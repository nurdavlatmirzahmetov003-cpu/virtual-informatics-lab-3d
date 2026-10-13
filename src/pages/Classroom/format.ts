/**
 * Dates for the classroom pages: the same dd.mm hh:mm as the results page
 * (browsers have no Kazakh month names and print "M10" for kk-KZ).
 */
import { formatDateTime, formatDay } from '../Progress/dates';

/** "20.10 23:59", with the year when it is not this year. */
export function fmtDateTime(ts: number) {
  const d = new Date(ts);
  return d.getFullYear() === new Date().getFullYear() ? formatDateTime(ts) : `${formatDay(ts)} ${formatDateTime(ts).split(' ')[1]}`;
}

/** `<input type="datetime-local">` value ↔ epoch ms, in local time. */
export function toInputValue(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export const fromInputValue = (v: string): number | null => {
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(t) ? t : null;
};

export const fmtSeconds = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} s`);

/** Saves text as a file in the browser (CSV / JSON export). */
export function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** File-name-safe class name. */
export const slug = (s: string) => s.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40) || 'class';

/** The link inside a class's QR code. */
export const joinLink = (code: string) => `${window.location.origin}/join?code=${encodeURIComponent(code)}`;
