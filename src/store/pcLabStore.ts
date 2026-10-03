import { create } from 'zustand';
import type { HardwareCategory } from '@/data/hardware/types';
import { CATALOG_BY_ID } from '@/data/hardware/catalog';
import { resolveBuild, type Build } from '@/lib/studio/build';
import { recommendBuild } from '@/lib/studio/recommend';
import { checkCompatibility } from '@/lib/studio/compatibility';
import { canInstall, assemblyCoverage, type InstallId } from '@/lib/labs/pcAssembly';
import { assess, type Assessment } from '@/lib/labs/assessment';
import { useProgressStore } from './progressStore';

type Feedback = 'selectHint' | 'prerequisite' | 'wrongSlot' | 'installedFeedback' | 'incomplete' | 'compatibility' | 'hint';
interface PcLabState {
  build: Build; installed: InstallId[]; selected: InstallId | null; dragging: boolean;
  errors: number; hints: number; started: number; result: Assessment | null; feedback: Feedback;
  select: (id: InstallId) => void; install: (id: InstallId, hit?: boolean) => void;
  choose: (category: HardwareCategory, id: string) => void; setDragging: (dragging: boolean) => void;
  help: () => void; boot: () => void; reset: () => void;
}
function initial() {
  return { build: recommendBuild('gaming',1_200_000,'black'), installed: [] as InstallId[], selected: null,
    dragging:false, errors:0, hints:0, started:Date.now(), result:null, feedback:'selectHint' as Feedback };
}
export const usePcLabStore = create<PcLabState>()((set,get) => ({ ...initial(),
  select: id => { if (!get().result && !get().installed.includes(id)) set({selected:id,feedback:'selectHint'}); },
  setDragging: dragging => set({dragging}),
  choose: (category,id) => {
    const part = category === 'cooling' ? 'cooler' : category;
    if (get().installed.includes(part as InstallId) || get().result) return;
    const p = CATALOG_BY_ID.get(id);
    if (p?.category === category) set(s => ({build:{...s.build,[category]:id},feedback:'compatibility'}));
  },
  install: (id,hit=true) => {
    const s = get();
    if (s.result || s.installed.includes(id)) return;
    if (!hit) { set({errors:s.errors+1,feedback:'wrongSlot',dragging:false}); return; }
    if (!canInstall(id,s.installed)) { set({errors:s.errors+1,feedback:'prerequisite'}); return; }
    const category = id === 'cooler' ? 'cooling' : id === 'fans' ? 'case' : id;
    const incompatible = checkCompatibility(resolveBuild(s.build)).some(i=>i.severity==='error' && i.categories.includes(category as HardwareCategory));
    if (id !== 'cables' && incompatible) { set({errors:s.errors+1,feedback:'compatibility'}); return; }
    set({installed:[...s.installed,id],selected:null,dragging:false,feedback:'installedFeedback'});
  },
  help: () => { if (!get().result) set(s=>({hints:s.hints+1,feedback:'hint'})); },
  boot: () => {
    const s = get();
    if (s.result) return;
    if (assemblyCoverage(s.installed) < 1) { set({errors:s.errors+1,feedback:'incomplete'}); return; }
    if (checkCompatibility(resolveBuild(s.build)).some(i=>i.severity==='error')) { set({errors:s.errors+1,feedback:'compatibility'}); return; }
    const result=assess('assembly',1,(Date.now()-s.started)/1000,s.errors,s.hints);
    useProgressStore.getState().record(result);
    set({result,selected:null,feedback:'installedFeedback'});
  },
  reset: () => set(initial()),
}));
