import type { HardwareCategory, SetupPurpose } from '@/data/hardware/types';
import type { SetupStyle } from '@/data/studio/options';
import type { Build } from '@/lib/studio/build';

export type WirelessDevice = 'mouse' | 'keyboard' | 'headset';
export type MonitorResolution = 'fhd' | 'qhd' | '4k';

/**
 * Structured setup request — what the local parser or the LLM extracts from
 * the user's message. Everything except budget/purpose/style is optional.
 */
export interface AssistantRequest {
  budget: number;
  /** Main purpose (first mentioned); `purposes` lists all of them, main first. */
  purpose: SetupPurpose;
  purposes: SetupPurpose[];
  style: SetupStyle;
  monitor?: { minHz?: number; resolution?: MonitorResolution; ultrawide?: boolean };
  /** Preferred brand per category, as the user wrote it ("Logitech"). */
  brands?: Partial<Record<HardwareCategory, string>>;
  wireless?: WirelessDevice[];
  minRamGb?: number;
  minStorageTb?: number;
  /** Optional categories asked for explicitly ("full setup", "with a chair"). */
  include?: HardwareCategory[];
  /** Optional categories the user does not want ("without speakers"). */
  exclude?: HardwareCategory[];
  /** Exact catalog ids an LLM chose; validated before use. */
  pins?: Build;
}

/** A short reason for one choice, rendered from `assistant.why.<key>` with `params`. */
export interface Explanation {
  key: string;
  params?: Record<string, string | number>;
}

export interface AssistantSuggestion {
  request: AssistantRequest;
  build: Build;
  total: number;
  overBudget: number;
  /** Requirements no catalog product satisfies (shown to the user, never invented). */
  unavailable: string[];
  explanations: Explanation[];
}

export interface BuildChange {
  category: HardwareCategory;
  from: string | null;
  to: string | null;
}

export type AssistantSource = 'llm' | 'local';

export interface AssistantReply extends AssistantSuggestion {
  source: AssistantSource;
  /** Why the server was not used (no key, offline, invalid answer…). */
  fallbackReason?: 'disabled' | 'unavailable' | 'invalid';
  /** Free-text remark from the LLM (shown as is, never trusted for products). */
  note?: string;
  /** Improve mode: what changes against the current build. */
  changes?: BuildChange[];
}
