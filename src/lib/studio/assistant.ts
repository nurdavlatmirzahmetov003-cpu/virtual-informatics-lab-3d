import { CATALOG, CATALOG_BY_ID } from '@/data/hardware/catalog';
import type { HardwareCategory, SetupPurpose } from '@/data/hardware/types';
import { BUDGET_LIMITS, type SetupStyle } from '@/data/studio/options';
import { resolveBuild, type Build } from './build';
import { recommendBuild } from './recommend';
import { checkCompatibility } from './compatibility';

export interface SetupRequest { budget: number; purpose: SetupPurpose; style: SetupStyle; minHz?: number; monitorBrand?: string; mouseBrand?: string; }
export interface SetupSuggestion { request: SetupRequest; build: Build; total: number; overBudget: number; unavailable: string[]; }

/** Local fallback: deliberate, bounded language patterns, with no invented products or prices. */
export function parseSetupRequest(message: string, defaults: SetupRequest): SetupRequest {
  const text = message.toLocaleLowerCase().replace(/\u00a0/g,' ');
  const out = { ...defaults };
  const money = text.match(/(\d[\d\s]*(?:[.,]\d+)?)\s*(млн|миллион|million|тыс\.?|мың|k|к|₸|теңге|тенге|tenge|тг)/i);
  const bare = text.match(/\b(\d{1,2}(?:\s\d{3}){1,2}|\d{6,8})\b/);
  if (money || bare) {
    const number = Number((money?.[1] ?? bare![1]).replace(/\s/g,'').replace(',','.'));
    const unit = money?.[2] ?? '';
    const multiplier = /млн|миллион|million/.test(unit) ? 1_000_000 : /тыс|мың|k|к/.test(unit) ? 1000 : 1;
    if (Number.isFinite(number) && (money || number >= BUDGET_LIMITS.min)) out.budget = Math.min(BUDGET_LIMITS.max,Math.max(BUDGET_LIMITS.min, Math.round(number*multiplier)));
  } else if (/арзан|дешев|cheaper/.test(text)) out.budget = Math.max(BUDGET_LIMITS.min,Math.round(out.budget*.8));
  const purposes: Array<[SetupPurpose,RegExp]> = [['design3d',/дизайн|рендер|3d|3д/],['streaming',/стрим|stream/],['gaming',/ойын|игр|gaming|game/],['programming',/программ|бағдарлам|код|programming/],['study',/оқу|уч[её]б|школ|study/],['universal',/әмбебап|универсал|universal/]];
  out.purpose = purposes.find(([,pattern]) => pattern.test(text))?.[0] ?? out.purpose;
  if (/ақ\s*(?:түст|сетап|корпус)|бел(?:ый|ая|ое|ую|ого)|white/.test(text)) out.style = 'white';
  else if (/rgb\s*[-с]?сіз|без\s*rgb|no\s*rgb/.test(text)) out.style = 'noRgb';
  else if (/rgb/.test(text)) out.style = 'rgb';
  else if (/қара|ч[её]рн|black/.test(text)) out.style = 'black';
  const hz = text.match(/(\d{2,4})\s*(?:гц|hz|герц)/);
  if (hz) out.minHz = Number(hz[1]);
  if (/asus|асус/.test(text)) out.monitorBrand = 'ASUS';
  if (/logitech|логит[еэ]ч/.test(text)) out.mouseBrand = 'Logitech';
  return out;
}

/** Recommendations contain only known catalog IDs. Preferences reserve budget before other upgrades. */
export function suggestSetup(request: SetupRequest): SetupSuggestion {
  const pins: Build = {};
  const unavailable: string[] = [];
  if (request.minHz || request.monitorBrand) {
    const monitor = CATALOG.filter(p => p.category === 'monitor' && (!request.monitorBrand || p.brand === request.monitorBrand) && Number(p.specifications.find(s => s.key === 'refresh')?.value ?? 0) >= (request.minHz ?? 0)).sort((a,b) => a.priceKZT-b.priceKZT)[0];
    if (monitor) pins.monitor = monitor.id;
    else unavailable.push(`${request.monitorBrand ?? ''} ${request.minHz ?? ''} Hz`.trim());
  }
  if (request.mouseBrand) {
    const mouse = CATALOG.filter(p => p.category === 'mouse' && p.brand.toLowerCase().startsWith(request.mouseBrand!.toLowerCase())).sort((a,b) => a.priceKZT-b.priceKZT)[0];
    if (mouse) pins.mouse = mouse.id;
    else unavailable.push(request.mouseBrand);
  }
  const price = (build: Build) => Object.values(resolveBuild(build)).reduce((sum,p) => sum+(p?.priceKZT ?? 0),0);
  let available = request.budget;
  let build = { ...recommendBuild(request.purpose,available,request.style), ...pins };
  for (let i=0; i<12 && price(build)>request.budget && available>BUDGET_LIMITS.min; i++) {
    available = Math.max(BUDGET_LIMITS.min,available-(price(build)-request.budget));
    build = {...recommendBuild(request.purpose,available,request.style),...pins};
  }
  const total = price(build);
  return { request,build,total,overBudget:Math.max(0,total-request.budget),unavailable };
}

/** Both local and future server suggestions must pass the same catalog and compatibility gate. */
export function isValidSuggestion(suggestion: SetupSuggestion) {
  const idsValid = Object.entries(suggestion.build).every(([category,id]) => id === null || CATALOG_BY_ID.get(id as string)?.category === category as HardwareCategory);
  return idsValid && checkCompatibility(resolveBuild(suggestion.build)).every(issue => issue.severity !== 'error');
}
