/**
 * Compatibility layer for the first local assistant (Phase 6.1). The logic
 * now lives in src/services/ai; this keeps the older request shape working.
 */
import type { SetupPurpose } from '@/data/hardware/types';
import type { SetupStyle } from '@/data/studio/options';
import { defaultRequest, isValidBuild, parseRequest, suggestSetup as suggest, type AssistantRequest } from '@/services/ai';
import type { Build } from './build';

export interface SetupRequest { budget: number; purpose: SetupPurpose; style: SetupStyle; minHz?: number; monitorBrand?: string; mouseBrand?: string }
export interface SetupSuggestion { request: SetupRequest; build: Build; total: number; overBudget: number; unavailable: string[] }

const toRequest = (r: SetupRequest): AssistantRequest => {
  const out = defaultRequest(r.budget, r.purpose, r.style);
  if (r.minHz) out.monitor = { minHz: r.minHz };
  if (r.monitorBrand || r.mouseBrand) out.brands = { ...(r.monitorBrand && { monitor: r.monitorBrand }), ...(r.mouseBrand && { mouse: r.mouseBrand }) };
  return out;
};

export function parseSetupRequest(message: string, defaults: SetupRequest): SetupRequest {
  const parsed = parseRequest(message, toRequest(defaults));
  return { budget: parsed.budget, purpose: parsed.purpose, style: parsed.style, minHz: parsed.monitor?.minHz, monitorBrand: parsed.brands?.monitor, mouseBrand: parsed.brands?.mouse };
}

export function suggestSetup(request: SetupRequest): SetupSuggestion {
  const s = suggest(toRequest(request));
  return { request, build: s.build, total: s.total, overBudget: s.overBudget, unavailable: s.unavailable };
}

export const isValidSuggestion = (suggestion: Pick<SetupSuggestion, 'build'>) => isValidBuild(suggestion.build);
