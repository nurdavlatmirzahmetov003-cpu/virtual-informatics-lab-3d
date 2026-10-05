import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { buildExport, exportFileName, parseImport, PROGRESS_VERSION, type ProgressSnapshot } from '@/services/progress';
import { useProgressStore } from '@/store/progressStore';
import styles from './Progress.module.css';

function ConfirmDialog({
  open,
  title,
  children,
  confirm,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirm: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.dialog} onClose={onClose} aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      <div className={styles.dialogBody}>{children}</div>
      <div className={styles.dialogActions}>
        <button type="button" className={styles.ghost} onClick={onClose} autoFocus>
          {t('progress.data.cancel')}
        </button>
        <button type="button" className={danger ? styles.danger : styles.primary} onClick={onConfirm}>
          {confirm}
        </button>
      </div>
    </dialog>
  );
}

type Message = { tone: 'ok' | 'error'; text: string } | null;

/** Export / import as JSON and clearing — the student's control over their data. */
export function DataPanel() {
  const t = useT();
  const [message, setMessage] = useState<Message>(null);
  const [pending, setPending] = useState<ProgressSnapshot | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const hasData = useProgressStore((s) => s.attempts.length > 0 || Object.keys(s.exercises).length > 0);

  const exportJson = () => {
    const s = useProgressStore.getState();
    const data = buildExport({ attempts: s.attempts, exercises: s.exercises, achievements: s.achievements, meta: s.meta });
    const name = exportFileName();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ tone: 'ok', text: t('progress.data.exported', { name }) });
  };

  const readFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const result = parseImport(await f.text());
      if (result.ok) setPending(result.snapshot);
      else setMessage({ tone: 'error', text: t(`progress.data.errors.${result.error}`) });
    } catch {
      setMessage({ tone: 'error', text: t('progress.data.errors.read') });
    } finally {
      if (file.current) file.current.value = '';
    }
  };

  const doImport = () => {
    if (!pending) return;
    const { added } = useProgressStore.getState().importSnapshot(pending);
    setPending(null);
    setMessage({ tone: 'ok', text: added ? t('progress.data.imported', { n: added }) : t('progress.data.importedNone') });
  };

  const doReset = () => {
    useProgressStore.getState().reset();
    setConfirmReset(false);
    setMessage({ tone: 'ok', text: t('progress.data.resetDone') });
  };

  return (
    <section className={styles.panel} aria-labelledby="data-title">
      <div className={styles.panelHead}>
        <h2 id="data-title">{t('progress.data.title')}</h2>
        <span>{t('progress.data.schema', { v: PROGRESS_VERSION })}</span>
      </div>
      <p className={styles.muted}>{t('progress.data.desc')}</p>
      <div className={styles.dataActions}>
        <button type="button" className={styles.secondary} onClick={exportJson} disabled={!hasData}>
          <Download size={15} aria-hidden="true" />
          {t('progress.data.export')}
        </button>
        <button type="button" className={styles.secondary} onClick={() => file.current?.click()}>
          <Upload size={15} aria-hidden="true" />
          {t('progress.data.import')}
        </button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void readFile(e.target.files?.[0])} />
        <button type="button" className={styles.dangerGhost} onClick={() => setConfirmReset(true)} disabled={!hasData}>
          <Trash2 size={15} aria-hidden="true" />
          {t('progress.data.reset')}
        </button>
      </div>
      <p className={styles.message} data-tone={message?.tone} role="status" aria-live="polite">
        {message?.text}
      </p>

      <ConfirmDialog
        open={pending !== null}
        title={t('progress.data.importTitle')}
        confirm={t('progress.data.importConfirm')}
        onConfirm={doImport}
        onClose={() => setPending(null)}
      >
        <p>{t('progress.data.importBody', { attempts: pending?.attempts.length ?? 0, tasks: Object.keys(pending?.exercises ?? {}).length })}</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirmReset} danger title={t('progress.data.resetTitle')} confirm={t('progress.data.resetConfirm')} onConfirm={doReset} onClose={() => setConfirmReset(false)}>
        <p>{t('progress.data.resetBody')}</p>
      </ConfirmDialog>
    </section>
  );
}
