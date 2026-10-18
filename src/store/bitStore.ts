/**
 * Bit the assistant: whether the panel is open, the conversation, and the
 * guided walk in progress (site tour or lesson). Small on purpose — it is in
 * the main bundle so any page can open Bit; the panel and its texts load on
 * first use. Only the voice preferences are saved.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, STORAGE_VERSIONS, safeStorage } from '@/lib/storage';
import type { LessonId } from '@/services/bit/lessons';

export type BitSource = 'faq' | 'ai' | 'local';

export interface BitMessage {
  id: number;
  role: 'user' | 'bit';
  text: string;
  source?: BitSource;
  /** Still streaming in. */
  pending?: boolean;
  error?: boolean;
}

export type BitGuide = { kind: 'tour'; index: number } | { kind: 'lesson'; lesson: LessonId; index: number };

interface BitState {
  open: boolean;
  messages: BitMessage[];
  guide: BitGuide | null;
  /** A request to run as soon as the panel is ready (openBit('…') from a page or the robot). */
  queued: string | null;
  /** Speak answers aloud. */
  voice: boolean;
  /** Listen again after every spoken answer, hands-free. */
  conversation: boolean;
  openBit: (prompt?: string) => void;
  close: () => void;
  takeQueued: () => string | null;
  push: (m: Omit<BitMessage, 'id'>) => number;
  update: (id: number, patch: Partial<BitMessage>) => void;
  setGuide: (g: BitGuide | null) => void;
  clear: () => void;
  setVoice: (on: boolean) => void;
  setConversation: (on: boolean) => void;
}

let seq = 0;
const MAX_MESSAGES = 60;

const memory = new Map<string, string>();
const storage = createJSONStorage<Pick<BitState, 'voice' | 'conversation'>>(
  () =>
    safeStorage() ?? {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    },
);

export const useBitStore = create<BitState>()(
  persist(
    (set, get) => ({
      open: false,
      messages: [],
      guide: null,
      queued: null,
      voice: true,
      conversation: false,
      openBit: (prompt) => set({ open: true, queued: prompt?.trim() || get().queued }),
      close: () => set({ open: false }),
      takeQueued: () => {
        const q = get().queued;
        if (q) set({ queued: null });
        return q;
      },
      push: (m) => {
        const id = ++seq;
        set((s) => ({ messages: [...s.messages, { ...m, id }].slice(-MAX_MESSAGES) }));
        return id;
      },
      update: (id, patch) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      setGuide: (guide) => set({ guide }),
      clear: () => set({ messages: [], guide: null }),
      setVoice: (voice) => set({ voice }),
      setConversation: (conversation) => set({ conversation }),
    }),
    {
      name: STORAGE_KEYS.bit,
      version: STORAGE_VERSIONS.bit,
      storage,
      partialize: ({ voice, conversation }) => ({ voice, conversation }),
      migrate: (persisted) => {
        const raw = (persisted ?? {}) as Partial<Pick<BitState, 'voice' | 'conversation'>>;
        return { voice: raw.voice !== false, conversation: raw.conversation === true };
      },
    },
  ),
);

/** Open Bit from anywhere (the robot in the lab, a page button), optionally with a request. */
export const openBit = (prompt?: string) => useBitStore.getState().openBit(prompt);
