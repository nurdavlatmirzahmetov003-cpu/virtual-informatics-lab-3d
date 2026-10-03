import { CATALOG } from '@/data/hardware/catalog';
import { CATEGORIES, PURPOSES, STYLES } from '@/data/studio/options';

/**
 * Compact catalog for the LLM prompt: one line per product with the id the
 * model must answer with, so it can only choose what exists.
 */
export function catalogDigest(): string {
  return CATALOG.map((p) => {
    const specs = p.specifications
      .slice(0, 3)
      .map((s) => `${s.key}=${s.value}${s.unit ?? ''}`)
      .join(', ');
    return `${p.id} | ${p.category} | ${p.brand} ${p.model} | ${p.priceKZT} KZT | ${p.performanceTier} | ${specs}`;
  }).join('\n');
}

export const ANSWER_SCHEMA = [
  '{',
  '  "budget": number in KZT (optional),',
  `  "purposes": array of ${JSON.stringify(PURPOSES)}, main purpose first (optional),`,
  `  "style": one of ${JSON.stringify(STYLES)} (optional),`,
  '  "monitor": { "minHz"?: number, "resolution"?: "fhd" | "qhd" | "4k", "ultrawide"?: boolean },',
  `  "brands": { <category>: <brand name> } (optional; categories: ${JSON.stringify(CATEGORIES)}),`,
  '  "wireless": array of "mouse" | "keyboard" | "headset" (optional),',
  '  "minRamGb": number (optional), "minStorageTb": number (optional),',
  '  "include": categories the user explicitly wants (optional),',
  '  "exclude": categories the user does not want (optional),',
  '  "pins": { <category>: <catalog id> } (optional, ONLY ids from the catalog),',
  '  "note": short explanation in Kazakh, at most two sentences',
  '}',
].join('\n');
