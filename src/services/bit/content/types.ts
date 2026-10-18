import type { SetupPurpose } from '@/data/hardware/types';
import type { FaqId } from '../faq';
import type { LessonId, TourStop } from '../lessons';

/**
 * Everything Bit says without the language model, in one language. Short
 * spoken sentences (they are read aloud), plain text, no markdown. `{brand}`
 * and other `{names}` are filled in by the assistant.
 */
export interface BitContent {
  faq: Record<FaqId, { q: string; a: string }>;
  tourIntro: string;
  tour: Record<TourStop, string>;
  lessons: Record<LessonId, readonly string[]>;
  say: {
    greet: string;
    unknown: string;
    error: string;
    navigate: string;
    lessonDone: string;
    tourDone: string;
    stopped: string;
    nothingToContinue: string;
    buildWorking: string;
    buildDone: string;
    buildNoGpu: string;
    buildGpuHint: string;
    buildOver: string;
    buildFail: string;
    purposes: Record<SetupPurpose, string>;
  };
  /** Questions offered as chips when the chat is empty (FAQ ids). */
  starters: readonly FaqId[];
}
