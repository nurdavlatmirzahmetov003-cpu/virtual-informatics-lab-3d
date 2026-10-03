import { create } from 'zustand';

export type AssistantMode = 'chat' | 'improve';

/** Open/closed state of the AI assistant panel, shared by every page that hosts it. */
interface AssistantState {
  open: boolean;
  mode: AssistantMode;
  /** A message to send as soon as the panel opens (improve mode). */
  pending: string | null;
  openChat: () => void;
  openImprove: (prompt: string) => void;
  close: () => void;
  consumePending: () => string | null;
}

export const useAssistantStore = create<AssistantState>()((set, get) => ({
  open: false,
  mode: 'chat',
  pending: null,
  openChat: () => set({ open: true, mode: 'chat' }),
  openImprove: (prompt) => set({ open: true, mode: 'improve', pending: prompt }),
  close: () => set({ open: false }),
  consumePending: () => {
    const p = get().pending;
    if (p) set({ pending: null });
    return p;
  },
}));
