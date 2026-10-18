/**
 * The course brand — change the name here and it changes everywhere: the top
 * bar, the browser tab, the home page, certificates and Bit's greeting. Every
 * locale string may use `{brand}`; `translate()` fills it in automatically.
 *
 * The logo mark is `components/brand/BrandMark.tsx` (inline, follows the
 * theme) with copies in `public/brand/` (logo.svg, logo-full.svg) and
 * `public/favicon.svg`. To use your own logo, replace those SVG files and
 * the paths in BrandMark.
 */
export const BRAND = {
  name: 'BitLab',
  /** First and second half of the wordmark: "Bit" bold, "Lab" light. */
  wordmark: ['Bit', 'Lab'] as const,
  /** Who issues certificates and commendations (shown under the signature). */
  issuer: 'BitLab',
  /** Public logo files (served from public/). */
  logo: 'brand/logo.svg',
  logoFull: 'brand/logo-full.svg',
  /**
   * Certificates and commendations (pages/Certificate). The seal and the
   * signature are SAMPLE placeholders: replace public/certificate/seal.svg and
   * signature.svg with your organisation's images (PNG works too — change the
   * file names here), and put the signer's real name and position below.
   */
  certificate: {
    seal: 'certificate/seal.svg',
    signature: 'certificate/signature.svg',
    signer: 'А. Ә. Тегі',
    signerRole: { kk: 'Директор', ru: 'Директор', en: 'Director' },
  },
} as const;
