/**
 * `/identify` — «Identify with the camera» (0.37): the student photographs
 * a real device with the phone (or picks a photo), the server asks Gemini
 * Vision which lab device it is, and the page shows that device in 3D with
 * Bit's explanation and a link to it in the 3D lab. The photo is shrunk to
 * 768 px in the browser and is not kept anywhere.
 */
import { lazy, Suspense, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, ImagePlus, RotateCcw, Volume2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { deviceById, deviceKey } from '@/data/devices/devices';
import { bitVoice } from '@/services/bit/voice';
import styles from './Identify.module.css';

const DeviceViewer3D = lazy(() => import('@/pages/Lab/DeviceViewer3D'));
const k = (s: string) => s as TranslationKey;
const SIDE = 768;

type State = { kind: 'idle' } | { kind: 'busy'; preview: string } | { kind: 'found'; preview: string; device: string } | { kind: 'none'; preview: string } | { kind: 'error'; code: string };

/** The photo, shrunk so its longer side is 768 px, as a JPEG data URL. */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

export default function IdentifyPage() {
  const t = useT();
  const [state, setState] = useState<State>({ kind: 'idle' });
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  const send = async (file: File | undefined) => {
    if (!file) return;
    let preview: string;
    try {
      preview = await shrink(file);
    } catch {
      return setState({ kind: 'error', code: 'bad-image' });
    }
    setState({ kind: 'busy', preview });
    try {
      const res = await fetch('/api/ai/bit/identify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: preview }) });
      const body = (await res.json().catch(() => ({}))) as { device?: string | null; error?: string };
      if (!res.ok) return setState({ kind: 'error', code: body.error ?? 'upstream' });
      if (body.device && deviceById(body.device)) {
        const d = deviceById(body.device)!;
        setState({ kind: 'found', preview, device: body.device });
        bitVoice.say(`${t(k(deviceKey(d, 'name')))}. ${t(k(deviceKey(d, 'student')))}`);
      } else setState({ kind: 'none', preview });
    } catch {
      setState({ kind: 'error', code: 'offline' });
    }
  };

  const picker = (
    <div className={styles.buttons}>
      <button type="button" className={styles.primary} onClick={() => camera.current?.click()}>
        <Camera size={18} aria-hidden="true" /> {t('identify.take')}
      </button>
      <button type="button" className={styles.secondary} onClick={() => gallery.current?.click()}>
        <ImagePlus size={18} aria-hidden="true" /> {t('identify.choose')}
      </button>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void send(e.target.files?.[0])} />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => void send(e.target.files?.[0])} />
    </div>
  );
  const device = state.kind === 'found' ? deviceById(state.device)! : null;
  const errors = ['no-key', 'rate-limited', 'busy', 'offline', 'too-large', 'bad-image'];

  return (
    <PageLayout eyebrow={t('identify.eyebrow')} title={t('identify.title')} subtitle={t('identify.subtitle')}>
      <div className={styles.layout}>
        <section className={styles.panel}>
          {'preview' in state && state.preview ? <img className={styles.photo} src={state.preview} alt={t('identify.photoAlt')} /> : <p className={styles.hint}>{t('identify.hint')}</p>}
          {state.kind === 'busy' ? <p className={styles.status} aria-live="polite">{t('identify.busy')}</p> : picker}
          <p className={styles.privacy}>{t('identify.privacy')}</p>
        </section>

        <section className={styles.panel} aria-live="polite">
          {state.kind === 'found' && device && (
            <>
              <h2>{t(k(deviceKey(device, 'name')))}</h2>
              <div className={styles.model}>
                <Suspense fallback={<span className={styles.loading} />}>
                  <DeviceViewer3D id={device.id} autoRotate label={t(k(deviceKey(device, 'name')))} />
                </Suspense>
              </div>
              <p>{t(k(deviceKey(device, 'student')))}</p>
              <div className={styles.buttons}>
                <button type="button" className={styles.secondary} onClick={() => bitVoice.say(t(k(deviceKey(device, 'student'))))}>
                  <Volume2 size={16} aria-hidden="true" /> {t('identify.listen')}
                </button>
                <Link to={`/lab?device=${device.id}`} className={styles.primary}>
                  {t('identify.openLab')} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
          {state.kind === 'none' && (
            <>
              <h2>{t('identify.noneTitle')}</h2>
              <p>{t('identify.none')}</p>
              <button type="button" className={styles.secondary} onClick={() => setState({ kind: 'idle' })}>
                <RotateCcw size={16} aria-hidden="true" /> {t('identify.again')}
              </button>
            </>
          )}
          {state.kind === 'error' && (
            <p className={styles.error} role="alert">
              {t(k(`identify.errors.${errors.includes(state.code) ? state.code : 'upstream'}`))}
            </p>
          )}
          {(state.kind === 'idle' || state.kind === 'busy') && <p className={styles.hint}>{t('identify.what')}</p>}
        </section>
      </div>
    </PageLayout>
  );
}
