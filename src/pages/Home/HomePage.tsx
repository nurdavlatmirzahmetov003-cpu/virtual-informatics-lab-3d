import { lazy, useCallback, useRef } from 'react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { ButtonLink } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { STORY_SCREENS } from '@/scenes/DeskScene/chapters';
import { useStoryTimeline } from '@/scenes/DeskScene/useStoryTimeline';
import { StoryOverlay } from './StoryOverlay';
import styles from './HomePage.module.css';

const DeskScene = lazy(() => import('@/scenes/DeskScene/DeskScene'));

export default function HomePage() {
  const t = useT();
  useDocumentTitle();
  const story = useRef<HTMLDivElement>(null);
  const progressFill = useRef<HTMLDivElement>(null);

  const onProgress = useCallback((p: number) => {
    if (progressFill.current) progressFill.current.style.transform = `scaleX(${p})`;
  }, []);
  const { scrollToChapter } = useStoryTimeline(story, { onProgress });

  return (
    <>
      {/* tall scroll track; the stage stays pinned while the timeline scrubs */}
      <div ref={story} className={styles.story} style={{ height: `${STORY_SCREENS * 100}vh` }}>
        <div className={styles.stage}>
          <SceneCanvas initialCamera="HOME_WIDE" label={t('home.title')} touchAction="pan-y">
            <DeskScene />
          </SceneCanvas>
          <StoryOverlay onNavigate={scrollToChapter} progressRef={progressFill} />
        </div>
      </div>

      <section className={styles.outro}>
        <h2>{t('home.outroTitle')}</h2>
        <p>{t('home.outroBody')}</p>
        <div className={styles.outroActions}>
          <ButtonLink to="/labs">{t('home.outroLabs')}</ButtonLink>
          <ButtonLink to="/studio" variant="ghost">
            {t('home.outroStudio')}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
