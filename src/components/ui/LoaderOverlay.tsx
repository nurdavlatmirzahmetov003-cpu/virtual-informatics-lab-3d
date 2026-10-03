import { useProgress } from '@react-three/drei';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { useSceneStatus } from '@/store/sceneStatusStore';
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
  // Stay up from the moment a scene mounts until its Suspense boundary resolves,
  // so there is never a blank canvas while assets are requested.
  const waitingForScene = useSceneStatus((s) => s.expected && !s.ready);
  const visible = active || waitingForScene;
  const pct = Math.round(progress);

  return (
    <div className={styles.root} data-visible={visible} aria-hidden={!visible}>
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
