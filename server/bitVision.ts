/**
 * «Identify with the camera» (0.37): a photo of a real device goes to
 * Gemini Vision, which may only answer with one of the lab's device ids
 * (or none). The photo is not stored or logged; a photo that shows a
 * person rather than a device gets no answer. Pure helpers here, the
 * request itself in server/bit.ts.
 */
import { DEVICES } from '@/data/devices/devices';

/** A downscaled JPEG from the browser is far smaller; this keeps the server safe from huge bodies. */
export const MAX_IMAGE_BYTES = 1_500_000;
export const DEVICE_IDS: readonly string[] = DEVICES.map((d) => d.id);

/** What the model is asked (the list of ids is the whole vocabulary it may use). */
export function visionPrompt(): string {
  return [
    'You identify computer hardware for a school informatics lab. Look at the photo and decide which ONE device from the list it mainly shows.',
    `Allowed ids: ${DEVICE_IDS.join(', ')}.`,
    'If the photo shows no device from the list, shows mainly a person or a face, or is unclear, answer with device null.',
    'Reply only with JSON: {"device": "<id or null>", "confidence": <0..1>}.',
  ].join('\n');
}

/** The JSON schema Gemini fills in. */
export const VISION_SCHEMA = {
  type: 'OBJECT',
  properties: { device: { type: 'STRING', nullable: true }, confidence: { type: 'NUMBER' } },
  required: ['device', 'confidence'],
};

/** A base64 JPEG / PNG / WebP data URL, size-checked; null when it is anything else. */
export function parseImage(v: unknown): { mime: string; data: string } | null {
  if (typeof v !== 'string') return null;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) return null;
  if ((m[2].length * 3) / 4 > MAX_IMAGE_BYTES) return null;
  return { mime: m[1], data: m[2] };
}

/** The model's reply → a device id we know, with its confidence; anything else → null. */
export function parseVision(text: string): { device: string | null; confidence: number } {
  try {
    const j = JSON.parse(text) as { device?: unknown; confidence?: unknown };
    const confidence = typeof j.confidence === 'number' ? Math.max(0, Math.min(1, j.confidence)) : 0;
    const device = typeof j.device === 'string' && DEVICE_IDS.includes(j.device) && confidence >= 0.35 ? j.device : null;
    return { device, confidence: device ? confidence : 0 };
  } catch {
    return { device: null, confidence: 0 };
  }
}
