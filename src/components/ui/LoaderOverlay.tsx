import { useProgress } from '@react-three/drei';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import styles from './LoaderOverlay.module.css';

function categoryOf(item: string): TranslationKey {
  if (/\.(glb|gltf|bin)(\?|$)/i.test(item)) return 'loader.models';
  if (/\.(hdr|exr)(\?|$)/i.test(item)) return 'loader.environment';
  if (/\.(jpe?g|png|webp|ktx2|avif)(\?|$)/i.test(item)) return 'loader.textures';
  return 'loader.other';
}

/**
 * Premium full-screen loader driven by three's global LoadingManager, so any
 * scene that loads assets through drei/three reports here automatically.
 */
export function LoaderOverlay() {
  const t = useT();
  const { active, progress, item } = useProgress();
  const pct = Math.round(progress);

  return (
    <div className={styles.root} data-visible={active} aria-hidden={!active}>
      <div className={styles.panel} role="status" aria-live="polite">
        <span className={styles.title}>{t('loader.title')}</span>
        <span className={styles.pct}>{pct}%</span>
        <div className={styles.track}>
          <div className={styles.fill} style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <span className={styles.item}>{item ? t(categoryOf(item)) : ' '}</span>
      </div>
    </div>
  );
}
