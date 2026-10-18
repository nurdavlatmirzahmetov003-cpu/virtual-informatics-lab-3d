/**
 * Recording one spoken request for server recognition (0.37): the browser's
 * own Kazakh recognition is weak or missing, Gemini's is good. Records the
 * microphone (Opus / AAC), stops by itself after a pause, gives the loudness
 * for the "listening" animation, and sends the audio to /api/ai/bit/stt.
 */
import type { Language } from '@/lib/i18n';

export interface Recording {
  /** Stops now and transcribes what was said so far. */
  stop(): void;
  /** Throws away the recording. */
  cancel(): void;
  /** The transcript ('' when nothing was said). Rejects with an error code: 'denied', 'unsupported', 'stt-…'. */
  result: Promise<string>;
}

export const recordingSupported = () =>
  typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

function mimeType(): string {
  for (const t of ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm']) if (MediaRecorder.isTypeSupported?.(t)) return t;
  return '';
}

/** Silence detection thresholds (RMS of the waveform, 0…1). */
const SPEECH = 0.035;
const PAUSE_MS = 1300;
const NO_SPEECH_MS = 7000;
const MAX_MS = 15_000;

export function recordRequest(language: Language, onLevel?: (level: number) => void): Recording {
  let stopRec: (() => void) | null = null;
  let cancelled = false;
  const result = (async () => {
    if (!recordingSupported()) throw new Error('unsupported');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch {
      throw new Error('denied');
    }
    const type = mimeType();
    const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Float32Array(analyser.fftSize);
    const started = performance.now();
    let spokeAt = 0;
    let lastLoud = 0;
    let raf = 0;
    const ended = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
    });
    const finish = () => {
      cancelAnimationFrame(raf);
      if (rec.state !== 'inactive') rec.stop();
    };
    stopRec = finish;
    const watch = () => {
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += v * v;
      const rms = Math.sqrt(sum / data.length);
      onLevel?.(Math.min(1, rms * 8));
      const t = performance.now();
      if (rms > SPEECH) {
        lastLoud = t;
        if (!spokeAt) spokeAt = t;
      }
      // a pause after speaking, nothing at all for a while, or too long: stop
      if ((spokeAt && t - lastLoud > PAUSE_MS) || (!spokeAt && t - started > NO_SPEECH_MS) || t - started > MAX_MS) return finish();
      raf = requestAnimationFrame(watch);
    };
    rec.start(250);
    raf = requestAnimationFrame(watch);
    await ended;
    stream.getTracks().forEach((tr) => tr.stop());
    void ctx.close();
    onLevel?.(0);
    if (cancelled || !spokeAt) return '';
    const blob = new Blob(chunks, { type: (type || chunks[0]?.type || 'audio/webm').split(';')[0] });
    const res = await fetch(`/api/ai/bit/stt?lang=${language}`, { method: 'POST', headers: { 'content-type': blob.type }, body: blob }).catch(() => null);
    if (!res) throw new Error('stt-offline');
    if (!res.ok) throw new Error(`stt-${res.status}`);
    const body = (await res.json()) as { text?: string };
    return (body.text ?? '').trim();
  })();
  return {
    stop: () => stopRec?.(),
    cancel: () => {
      cancelled = true;
      stopRec?.();
    },
    result,
  };
}
