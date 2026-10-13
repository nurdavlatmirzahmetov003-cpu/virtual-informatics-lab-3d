/** Small shared pieces of the classroom pages: status chip, QR code, error text. */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { CheckCircle2, CircleDashed, Clock3, FileText, AlertTriangle, Award, X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { encodeQr, qrPath } from '@/lib/qr/qr';
import type { CellStatus } from '@/services/classroom/stats';
import styles from './Classroom.module.css';

const STATUS_ICON = { graded: Award, done: CheckCircle2, late: Clock3, answered: FileText, overdue: AlertTriangle, todo: CircleDashed } as const;

export function StatusChip({ status, compact = false }: { status: CellStatus; compact?: boolean }) {
  const t = useT();
  const Icon = STATUS_ICON[status];
  return (
    <span className={styles.chip} data-status={status} title={compact ? t(`classroom.status.${status}`) : undefined}>
      <Icon size={13} aria-hidden="true" />
      {!compact && t(`classroom.status.${status}`)}
    </span>
  );
}

/** The QR code as one crisp SVG path (scales to any print size). */
export function QrCode({ text, label, size = 220 }: { text: string; label: string; size?: number }) {
  const { d, n } = useMemo(() => {
    const m = encodeQr(text);
    return { d: qrPath(m, 4), n: m.length + 8 };
  }, [text]);
  return (
    <svg className={styles.qr} viewBox={`0 0 ${n} ${n}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

/** A simple modal: overlay, Escape and the close button dismiss it; focus moves inside. */
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  // once per opening: a parent re-render must not pull focus out of the form
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className={styles.overlay} onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} data-wide={wide} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={box}>
        <div className={styles.sheetHead}>
          <h2>{title}</h2>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t('classroom.close')}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
