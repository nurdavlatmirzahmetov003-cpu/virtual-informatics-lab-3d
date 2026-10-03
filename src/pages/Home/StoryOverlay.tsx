import type { Ref } from 'react';
import { ArrowRight, Hand, MousePointer2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { CHAPTERS } from '@/scenes/DeskScene/chapters';
import { useStoryStore } from '@/store/storyStore';
import styles from './StoryOverlay.module.css';

interface StoryOverlayProps {
  onNavigate: (chapter: number) => void;
  progressRef: Ref<HTMLDivElement>;
}

const key = (k: string) => k as TranslationKey;

/**
 * HTML layer over the story canvas: chapter 1 hero, one compact info panel
 * per hardware chapter, chapter navigation and a progress line. Everything
 * here is plain text, so the content stays available without 3D.
 */
export function StoryOverlay({ onNavigate, progressRef }: StoryOverlayProps) {
  const t = useT();
  const chapter = useStoryStore((s) => s.chapter);

  return (
    <div className={styles.root}>
      {/* Chapter 1 — full setup */}
      <section className={styles.hero} data-active={chapter === 0} aria-hidden={chapter !== 0}>
        <span className={styles.eyebrow}>{t('home.eyebrow')}</span>
        <h1 className={styles.title}>{t('home.title')}</h1>
        <p className={styles.subtitle}>{t('home.subtitle')}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => onNavigate(1)} tabIndex={chapter === 0 ? 0 : -1}>
            {t('home.cta')}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <ButtonLink to="/labs" variant="ghost" tabIndex={chapter === 0 ? 0 : -1}>
            {t('home.secondary')}
          </ButtonLink>
        </div>
        <div className={styles.scrollHint} aria-hidden="true">
          <MousePointer2 size={14} />
          {t('story.scrollHint')}
        </div>
      </section>

      {/* Chapters 2–5 — device panels */}
      {CHAPTERS.slice(1).map((c, i) => {
        const index = i + 1;
        const active = chapter === index;
        const base = `story.chapters.${c.id}`;
        return (
          <article
            key={c.id}
            className={styles.panel}
            data-side={c.panel}
            data-active={active}
            aria-hidden={!active}
            aria-labelledby={`chapter-${c.id}`}
          >
            <span className={styles.eyebrow}>
              {String(index + 1).padStart(2, '0')} · {t(key(`${base}.eyebrow`))}
            </span>
            <h2 id={`chapter-${c.id}`} className={styles.panelTitle}>
              {t(key(`${base}.title`))}
            </h2>
            <p className={styles.body}>{t(key(`${base}.body`))}</p>
            <dl className={styles.specs}>
              {c.specs.map((s) => (
                <div key={s} className={styles.spec}>
                  <dt>{t(key(`${base}.specs.${s}.label`))}</dt>
                  <dd>{t(key(`${base}.specs.${s}.value`))}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.caption}>{t('story.specsCaption')}</p>
            <p className={styles.fact}>{t(key(`${base}.fact`))}</p>
            <p className={styles.dragHint}>
              <Hand size={14} aria-hidden="true" />
              {t('story.dragHint')}
            </p>
          </article>
        );
      })}

      <nav className={styles.nav} aria-label={t('story.navLabel')}>
        <ol>
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={styles.navItem}
                aria-current={chapter === i ? 'step' : undefined}
                onClick={() => onNavigate(i)}
              >
                <span className={styles.navLabel}>{t(key(`story.chapters.${c.id}.nav`))}</span>
                <span className={styles.navDot} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.progress} role="presentation">
        <div ref={progressRef} className={styles.progressFill} />
      </div>
    </div>
  );
}
