import type { Ref } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DoorOpen, Hand, MousePointer2, Rotate3d } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { CHAPTERS } from '@/scenes/DeskScene/chapters';
import { PARTS } from '@/scenes/DeskScene/pc/parts';
import { usePcStore } from '@/store/pcStore';
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
  const exploring = usePcStore((s) => s.mode === 'explore');
  const storyPart = usePcStore((s) => s.storyPart);
  const enterExplore = usePcStore((s) => s.enterExplore);
  const enterDevice = usePcStore((s) => s.enterDevice);

  return (
    <div className={styles.root} data-hidden={exploring} aria-hidden={exploring}>
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
          <Link to="/lab" className={styles.exploreBtn} tabIndex={chapter === 0 ? 0 : -1}>
            <DoorOpen size={16} aria-hidden="true" />
            {t('home.enterLab')}
          </Link>
          <button type="button" className={styles.exploreBtn} tabIndex={chapter === 0 ? 0 : -1} onClick={() => enterDevice('setup')}><Rotate3d size={16} />{t('explore.viewSetup')}</button>
        </div>
        <div className={styles.scrollHint} aria-hidden="true">
          <MousePointer2 size={14} />
          {t('story.scrollHint')}
        </div>
      </section>

      {/* Chapters 2–5 — device panels */}
      {CHAPTERS.slice(1).map((c, i) => {
        const index = i + 1;
        if (c.kind !== 'device') return null;
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
            {['monitor', 'keyboard', 'mouse', 'pc'].includes(c.id) && <button type="button" className={styles.exploreBtn} tabIndex={active ? 0 : -1} onClick={() => enterDevice(c.id as 'monitor' | 'keyboard' | 'mouse' | 'pc')}><Rotate3d size={16} />{t('explore.enter')}</button>}
            <p className={styles.dragHint}>
              <Hand size={14} aria-hidden="true" />
              {t('story.dragHint')}
            </p>
          </article>
        );
      })}

      {/* Exploded view — one component at a time, driven by scroll */}
      {CHAPTERS.map((c, index) => {
        if (c.kind !== 'exploded') return null;
        const active = chapter === index;
        const part = storyPart ?? PARTS[0].id;
        const base = `pc.parts.${part}`;
        const def = PARTS.find((p) => p.id === part) ?? PARTS[0];
        return (
          <article key={c.id} className={styles.panel} data-side={c.panel} data-active={active} aria-hidden={!active} aria-live="polite">
            <span className={styles.eyebrow}>
              {String(index + 1).padStart(2, '0')} · {t(key(`story.chapters.${c.id}.eyebrow`))}
            </span>
            <h2 className={styles.panelTitle}>{t(key(`${base}.name`))}</h2>
            <p className={styles.body}>{t(key(`${base}.short`))}</p>
            <dl className={styles.specs}>
              {def.specs.map((s) => (
                <div key={s} className={styles.spec}>
                  <dt>{t(key(`${base}.specs.${s}.label`))}</dt>
                  <dd>{t(key(`${base}.specs.${s}.value`))}</dd>
                </div>
              ))}
            </dl>
            <ol className={styles.partList} aria-label={t('explore.partsLabel')}>
              {PARTS.map((p, k) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={styles.partChip}
                    aria-current={p.id === part ? 'true' : undefined}
                    tabIndex={active ? 0 : -1}
                    onClick={() => enterExplore(p.id)}
                    title={t(key(`pc.parts.${p.id}.name`))}
                  >
                    {k + 1}
                  </button>
                </li>
              ))}
            </ol>
            <p className={styles.caption}>{t(key(`story.chapters.${c.id}.body`))}</p>
            <button type="button" className={styles.exploreBtn} tabIndex={active ? 0 : -1} onClick={() => enterExplore(part)}>
              <Rotate3d size={16} aria-hidden="true" />
              {t('explore.enter')}
            </button>
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
