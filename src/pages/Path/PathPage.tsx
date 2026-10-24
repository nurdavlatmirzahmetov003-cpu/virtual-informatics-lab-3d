/**
 * `/path` — My learning path (0.37): the next step, the tasks to come back
 * to (spaced repetition over the student's own results) and five flash
 * cards from Bit's answers on the weakest labs. Works offline and as a
 * guest: it reads the progress kept in this browser (or synced from the
 * account) and keeps the cards' boxes here too.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Eye, Flag, RotateCcw, Volume2, X } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { STORAGE_NAMESPACE, safeStorage } from '@/lib/storage';
import { loadBitContent, type BitContent } from '@/services/bit/content';
import { bitVoice } from '@/services/bit/voice';
import type { FaqId } from '@/services/bit/faq';
import { answerCard, labScores, nextStep, reviewQueue, sessionCards, type Cards } from '@/services/progress/learningPath';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';
import styles from './Path.module.css';

const k = (s: string) => s as TranslationKey;
const CARDS_KEY = `${STORAGE_NAMESPACE}:cards`;
const DAY = 86_400_000;

function loadCards(): Cards {
  try {
    const raw = JSON.parse(safeStorage()?.getItem(CARDS_KEY) ?? '{}') as Cards;
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}
function saveCards(cards: Cards) {
  try {
    safeStorage()?.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch {
    /* private mode: the boxes last this visit only */
  }
}

function FlashCards() {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const exercises = useProgressStore((s) => s.exercises);
  const [content, setContent] = useState<BitContent | null>(null);
  const [cards, setCards] = useState<Cards>(loadCards);
  const [now] = useState(() => Date.now());
  const [deck, setDeck] = useState<FaqId[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [knew, setKnew] = useState(0);

  useEffect(() => {
    let alive = true;
    void loadBitContent(language).then((c) => alive && setContent(c));
    return () => {
      alive = false;
    };
  }, [language]);

  const scores = useMemo(() => labScores({ exercises } as Parameters<typeof labScores>[0]), [exercises]);
  const start = () => {
    setDeck(sessionCards(cards, scores, Date.now()));
    setI(0);
    setShown(false);
    setKnew(0);
  };
  const answer = (ok: boolean) => {
    if (!deck) return;
    const next = { ...cards, [deck[i]]: answerCard(cards[deck[i]], ok, Date.now()) };
    setCards(next);
    saveCards(next);
    bitVoice.stop();
    if (ok) setKnew(knew + 1);
    setShown(false);
    setI(i + 1);
  };
  const due = Object.values(cards).filter((c) => c.dueAt <= now).length;

  if (!content) return <span className={styles.loading} aria-busy="true" />;
  if (!deck)
    return (
      <div className={styles.cardIntro}>
        <p>{t('path.cards.intro')}</p>
        <p className={styles.muted}>{t('path.cards.stats', { seen: Object.keys(cards).length, due })}</p>
        <button type="button" className={styles.primary} onClick={start}>
          {t('path.cards.start')} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    );
  if (i >= deck.length)
    return (
      <div className={styles.cardIntro}>
        <p className={styles.done}>
          <Flag size={18} aria-hidden="true" /> {t('path.cards.done', { n: knew, total: deck.length })}
        </p>
        <button type="button" className={styles.secondary} onClick={start}>
          <RotateCcw size={16} aria-hidden="true" /> {t('path.cards.again')}
        </button>
      </div>
    );
  const faq = content.faq[deck[i]];
  return (
    <div className={styles.flash}>
      <p className={styles.muted}>{t('path.cards.count', { n: i + 1, total: deck.length })}</p>
      <h3 className={styles.question}>{faq.q}</h3>
      {shown ? (
        <>
          <p className={styles.answer}>{faq.a}</p>
          <div className={styles.row}>
            <button type="button" className={styles.secondary} onClick={() => bitVoice.say(faq.a)}>
              <Volume2 size={16} aria-hidden="true" /> {t('path.cards.listen')}
            </button>
          </div>
          <p className={styles.ask}>{t('path.cards.didYouKnow')}</p>
          <div className={styles.row}>
            <button type="button" className={styles.yes} onClick={() => answer(true)}>
              <Check size={16} aria-hidden="true" /> {t('path.cards.knew')}
            </button>
            <button type="button" className={styles.no} onClick={() => answer(false)}>
              <X size={16} aria-hidden="true" /> {t('path.cards.notYet')}
            </button>
          </div>
        </>
      ) : (
        <button type="button" className={styles.primary} onClick={() => setShown(true)}>
          <Eye size={16} aria-hidden="true" /> {t('path.cards.show')}
        </button>
      )}
    </div>
  );
}

export default function PathPage() {
  const t = useT();
  const exercises = useProgressStore((s) => s.exercises);
  const attempts = useProgressStore((s) => s.attempts);
  const [now] = useState(() => Date.now());
  const snapshot = { exercises, attempts } as Parameters<typeof nextStep>[0];
  const next = nextStep(snapshot);
  const { due, later } = reviewQueue(snapshot, now);
  const when = (at: number) => Math.max(1, Math.ceil((at - now) / DAY));

  return (
    <PageLayout eyebrow={t('path.eyebrow')} title={t('path.title')} subtitle={t('path.subtitle')}>
      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="path-next">
          <h2 id="path-next">{t('path.next.title')}</h2>
          {next ? (
            <>
              <p className={styles.lab}>{t(k(`labs.modules.${next.lab}.title`))}</p>
              <h3>{t(k(next.title))}</h3>
              <p className={styles.muted}>{t(k(next.summary))}</p>
              <Link to={next.path} className={styles.primary}>
                {t('path.next.go')} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <p>{t('path.next.allDone')}</p>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="path-review">
          <h2 id="path-review">{t('path.review.title')}</h2>
          <p className={styles.muted}>{t('path.review.why')}</p>
          {due.length === 0 && <p>{later.length ? t('path.review.nothingNow') : t('path.review.empty')}</p>}
          <ul className={styles.list}>
            {due.slice(0, 6).map((r) => (
              <li key={r.task.id}>
                <Link to={r.task.path}>
                  <span>
                    <b>{t(k(r.task.title))}</b>
                    <small>{r.weak ? t('path.review.weak', { n: r.best }) : t('path.review.refresh', { n: r.best })}</small>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {later.length > 0 && (
            <p className={styles.muted}>
              {t('path.review.later', { n: later.length, days: when(later[0].dueAt) })}
            </p>
          )}
        </section>

        <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="path-cards">
          <h2 id="path-cards">{t('path.cards.title')}</h2>
          <FlashCards />
        </section>
      </div>
    </PageLayout>
  );
}
