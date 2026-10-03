import { Link } from 'react-router-dom';
import { MonitorX } from 'lucide-react';
import { useT } from '@/hooks/useT';
import styles from './WebGLFallback.module.css';

/** Shown instead of a 3D scene when WebGL is unavailable. */
export function WebGLFallback() {
  const t = useT();
  return (
    <div className={styles.root} role="alert">
      <MonitorX size={40} strokeWidth={1.4} aria-hidden="true" />
      <h2>{t('errors.webglTitle')}</h2>
      <p>{t('errors.webglBody')}</p>
      <Link to="/labs" className={styles.link}>
        {t('nav.labs')} →
      </Link>
    </div>
  );
}
