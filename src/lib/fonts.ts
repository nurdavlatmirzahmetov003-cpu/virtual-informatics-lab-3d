/**
 * Site typefaces. Both are bundled locally (@fontsource-variable) and both cover
 * the full Kazakh Cyrillic alphabet (ә ғ қ ң ө ұ ү һ і) — checked by
 * scripts/fonts.test.mjs. CSS reads them from tokens.css; canvas textures in the
 * 3D scenes use the constants below.
 */
export const FONT_SANS = '"Onest Variable", "Segoe UI", system-ui, sans-serif';
export const FONT_DISPLAY = '"Montserrat Variable", "Onest Variable", "Segoe UI", sans-serif';

/**
 * Every subset the UI can need. `document.fonts.load()` only fetches the
 * unicode-range files its sample text touches (default sample is Latin), so a
 * canvas drawn right after it would fall back to a system font for Kazakh letters.
 */
const SAMPLE = 'Aa Бб Әә Ғғ Ққ Ңң Өө Ұұ Үү Һһ Іі 0123';

let ready: Promise<void> | null = null;

/** Resolves once the sans and display faces (all weights, all subsets) are usable. */
export function canvasFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  ready ??= Promise.all([
    document.fonts.load(`500 32px ${FONT_SANS}`, SAMPLE),
    document.fonts.load(`700 32px ${FONT_SANS}`, SAMPLE),
    document.fonts.load(`700 32px ${FONT_DISPLAY}`, SAMPLE),
  ])
    .then(() => undefined)
    .catch(() => undefined);
  return ready;
}
