/**
 * State of the foldable info and Bit panels (V4 §6, components/panel/Foldable.tsx):
 * remembered per panel id, small screens start folded, full-screen folds
 * everything, Alt+I toggles the page's main panel.
 */
import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { safeStorage, STORAGE_NAMESPACE } from '@/lib/storage';

const KEY = `${STORAGE_NAMESPACE}:panel-folds`;
const SMALL = '(max-width: 899px)';

function readAll(): Record<string, boolean> {
  try {
    return JSON.parse(safeStorage()?.getItem(KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

interface FoldState {
  folded: Record<string, boolean>;
  /** Panels mounted with `primary`, newest last: Alt+I acts on the last. */
  primary: string[];
  set: (id: string, folded: boolean) => void;
  foldAll: () => void;
}

export const usePanelFolds = create<FoldState>((set, get) => ({
  folded: readAll(),
  primary: [],
  set: (id, folded) => {
    const next = { ...get().folded, [id]: folded };
    set({ folded: next });
    try {
      safeStorage()?.setItem(KEY, JSON.stringify(next));
    } catch {
      /* blocked storage: the fold still works for this visit */
    }
  },
  // full-screen: everything folds (remembered, so it stays out of the way)
  foldAll: () => {
    const next = Object.fromEntries(Object.keys(get().folded).map((k) => [k, true]));
    set({ folded: next });
  },
}));

// one listener for the whole site
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.code !== 'KeyI') return;
    const { primary, folded, set } = usePanelFolds.getState();
    const id = primary.at(-1);
    if (!id) return;
    e.preventDefault();
    set(id, !folded[id]);
  });
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) usePanelFolds.getState().foldAll();
  });
}

export interface Fold {
  id: string;
  folded: boolean;
  unread: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export function useFold(id: string, { primary = false, contentKey }: { primary?: boolean; contentKey?: unknown } = {}): Fold {
  const saved = usePanelFolds((s) => s.folded[id]);
  const setFold = usePanelFolds((s) => s.set);
  // nothing remembered yet: small screens start folded, so the 3D view comes first
  const [initial] = useState(() => typeof window !== 'undefined' && window.matchMedia(SMALL).matches);
  const folded = saved ?? initial;
  // the content when the panel was folded: anything else since then is unread
  const [keyAtFold, setKeyAtFold] = useState<unknown>(contentKey);
  // however it folded (button, Alt+I, full-screen), note what was showing at that moment
  const [wasFolded, setWasFolded] = useState(folded);
  if (wasFolded !== folded) {
    setWasFolded(folded);
    if (folded) setKeyAtFold(contentKey);
  }

  useEffect(() => {
    if (!primary) return;
    usePanelFolds.setState((s) => ({ primary: [...s.primary.filter((p) => p !== id), id] }));
    return () => usePanelFolds.setState((s) => ({ primary: s.primary.filter((p) => p !== id) }));
  }, [id, primary]);

  const open = useCallback(() => setFold(id, false), [id, setFold]);
  const close = useCallback(() => setFold(id, true), [id, setFold]);
  const toggle = useCallback(() => (folded ? open() : close()), [folded, open, close]);
  return { id, folded, unread: folded && !Object.is(keyAtFold, contentKey), toggle, open, close };
}

