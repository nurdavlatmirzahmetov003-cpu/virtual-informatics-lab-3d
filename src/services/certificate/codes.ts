/**
 * Certificate codes (V4 §8). Real ones are issued by the server
 * (server/feedback.ts): BL-XXXX-XXXX. Demo and sample sheets get DEMO-XXXX-XXXX,
 * which the check page and the server both refuse — a demo sheet never
 * verifies, even if someone types its code.
 */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const DEMO_CODE_PREFIX = 'DEMO-';

export const isDemoCode = (code: string) => code.trim().toUpperCase().startsWith(DEMO_CODE_PREFIX);

export function demoCode(random: () => number = Math.random) {
  const s = Array.from({ length: 8 }, () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]).join('');
  return `${DEMO_CODE_PREFIX}${s.slice(0, 4)}-${s.slice(4)}`;
}
