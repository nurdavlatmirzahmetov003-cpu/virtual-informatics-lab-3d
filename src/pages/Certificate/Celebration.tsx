/**
 * V4 §8.3: the course is finished. Full-screen confetti and fireworks, Bit
 * pops up smiling and congratulates by voice in the interface language,
 * then the certificate comes in with a shine, with «Download PDF» and
 * «Share». With reduced motion: no particles, a simple fade.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share2, X } from 'lucide-react';
import { BitFace } from '@/components/bit/BitFace';
import { useT } from '@/hooks/useT';
import { bitVoice } from '@/services/bit/voice';
import { useSettingsStore } from '@/store/settingsStore';
import { CertificateSheet, type SheetData } from './CertificateSheet';
import styles from './Celebration.module.css';

const COLORS = ['#2fc8f2', '#5f7bff', '#a95cf5', '#ffc15c', '#ff7a6b', '#22c55e', '#f472b6'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  spin: number;
  angle: number;
  /** confetti flutters down; sparks of a firework fade */
  kind: 'confetti' | 'spark' | 'rocket';
}

/** Confetti from the top and fireworks bursting for ~6 s, then the last ones fall out of view. */
function runFireworks(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = 0;
  let h = 0;
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const parts: Particle[] = [];
  const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];
  const confetti = (n: number) => {
    for (let i = 0; i < n; i++) {
      parts.push({ x: Math.random() * w, y: -20 - Math.random() * h * 0.4, vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2.5, life: 0, max: 600, color: pick(), size: 6 + Math.random() * 6, spin: (Math.random() - 0.5) * 0.3, angle: Math.random() * Math.PI, kind: 'confetti' });
    }
  };
  const rocket = () => {
    parts.push({ x: w * (0.15 + Math.random() * 0.7), y: h + 10, vx: (Math.random() - 0.5) * 1.5, vy: -(9 + Math.random() * 4) * (h / 900), life: 0, max: 60 + Math.random() * 25, color: pick(), size: 3, spin: 0, angle: 0, kind: 'rocket' });
  };
  const burst = (x: number, y: number, color: string) => {
    const n = 60;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const v = 2 + Math.random() * 3.5;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 55 + Math.random() * 30, color: Math.random() < 0.25 ? '#fff' : color, size: 2.4, spin: 0, angle: 0, kind: 'spark' });
    }
  };

  confetti(Math.round(Math.min(220, w / 5)));
  const started = performance.now();
  let lastRocket = 0;
  let raf = 0;
  const frame = (now: number) => {
    const t = now - started;
    if (t < 6000 && now - lastRocket > 420) {
      rocket();
      lastRocket = now;
    }
    if (t < 3500 && Math.random() < 0.25) confetti(2);
    ctx.clearRect(0, 0, w, h);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++;
      if (p.kind === 'confetti') {
        p.vx += Math.sin((p.life + i) * 0.05) * 0.04;
        p.angle += p.spin;
      } else {
        p.vy += p.kind === 'rocket' ? 0.12 : 0.05;
        p.vx *= 0.985;
        p.vy *= 0.985;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === 'rocket' && (p.life >= p.max || p.vy > -1)) {
        burst(p.x, p.y, p.color);
        parts.splice(i, 1);
        continue;
      }
      if (p.life > p.max || p.y > h + 40) {
        parts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.kind === 'spark' ? Math.max(0, 1 - p.life / p.max) : 1;
      ctx.fillStyle = p.color;
      if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 + Math.abs(Math.sin(p.angle * 2)) * p.size * 0.4);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (t < 6000 || parts.length) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function Celebration({ data, onClose }: { data: SheetData; onClose: () => void }) {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const canvas = useRef<HTMLCanvasElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [calm] = useState(reducedMotion);
  const [stage, setStage] = useState<'bit' | 'sheet'>(calm ? 'sheet' : 'bit');
  const [copied, setCopied] = useState(false);
  const congrats = t('certificate.celebration.voice', { name: data.name || t('certificate.celebration.you') });

  useEffect(() => {
    if (calm || !canvas.current) return;
    return runFireworks(canvas.current);
  }, [calm]);

  useEffect(() => {
    bitVoice.setLanguage(language);
    bitVoice.say(congrats);
    const timer = calm ? 0 : window.setTimeout(() => setStage('sheet'), 2600);
    return () => {
      window.clearTimeout(timer);
      bitVoice.stop();
    };
    // once per celebration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    closeBtn.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const verifyUrl = data.code ? `${window.location.origin}${import.meta.env.BASE_URL}certificate/check/${data.code}` : `${window.location.origin}${import.meta.env.BASE_URL}certificate`;
  const share = async () => {
    const payload = { title: t('certificate.title'), text: t('certificate.shareText'), url: verifyUrl };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
      setCopied(true);
    } catch {
      /* the user closed the share sheet */
    }
  };

  return createPortal(
    <div className={styles.root} data-calm={calm || undefined} role="dialog" aria-modal="true" aria-label={t('certificate.celebration.title')}>
      {!calm && <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />}
      <button ref={closeBtn} type="button" className={styles.close} onClick={onClose} aria-label={t('certificate.celebration.close')}>
        <X size={20} aria-hidden="true" />
      </button>
      <div className={styles.bit} data-stage={stage}>
        <span className={styles.face}>
          <BitFace size={88} live mood="speaking" />
        </span>
        <p className={styles.bubble} aria-live="polite">
          <b>{t('certificate.celebration.title')}</b> {congrats}
        </p>
      </div>
      {stage === 'sheet' && (
        <div className={styles.cert}>
          <div className={styles.shine}>
            <CertificateSheet data={data} print={false} />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => window.print()} disabled={!data.name}>
              <Download size={18} aria-hidden="true" /> {t('certificate.download')}
            </button>
            <button type="button" className={styles.secondary} onClick={() => void share()}>
              <Share2 size={18} aria-hidden="true" /> {copied ? t('certificate.copied') : t('certificate.share')}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
