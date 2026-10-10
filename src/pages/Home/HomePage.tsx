import { lazy, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { ButtonLink } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { STORY_SCREENS } from '@/scenes/DeskScene/chapters';
import { useStoryTimeline } from '@/scenes/DeskScene/useStoryTimeline';
import { usePcStore } from '@/store/pcStore';
import { ExploreOverlay } from './ExploreOverlay';
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
  const exploring = usePcStore((s) => s.mode === 'explore');

  // 360° mode owns wheel + touch: freeze page scroll so the story stays put
  useEffect(() => {
    if (!exploring) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    const y = window.scrollY;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev;
      // locking the root can reset scroll; put the story back where it was
      window.scrollTo({ top: y, behavior: 'auto' });
    };
  }, [exploring]);

  // leaving the page always returns to story mode
  useEffect(() => () => usePcStore.getState().exitExplore(), []);

  return (
    <>
      {/* tall scroll track; the stage stays pinned while the timeline scrubs */}
      <div ref={story} className={styles.story} style={{ height: `${STORY_SCREENS * 100}vh` }}>
        <div className={styles.stage}>
          <SceneCanvas initialCamera="HOME_WIDE" label={t('home.title')} touchAction={exploring ? 'none' : 'pan-y'}>
            <DeskScene />
          </SceneCanvas>
          <StoryOverlay onNavigate={scrollToChapter} progressRef={progressFill} />
          <ExploreOverlay />
        </div>
      </div>

      <section className={styles.outro}>
        <h2>{t('home.outroTitle')}</h2>
        <p>{t('home.outroBody')}</p>
        <div className={styles.outroActions}>
          <ButtonLink to="/lab">{t('home.enterLab')}</ButtonLink>
          <ButtonLink to="/labs" variant="ghost">
            {t('home.outroLabs')}
          </ButtonLink>
          <ButtonLink to="/studio" variant="ghost">
            {t('home.outroStudio')}
          </ButtonLink>
        </div>
        <Link to="/credits" className={styles.credits}>{t('credits.title')}</Link>
      </section>
    </>
  );
}
